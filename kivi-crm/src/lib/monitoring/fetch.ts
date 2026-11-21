// Guarded HTTP fetch for monitoring sources (SSRF-safe, polite, bounded).
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export class SourceError extends Error {
  constructor(message: string, public readonly retryable: boolean, public readonly status?: number) {
    super(message);
  }
}

export type Fetcher = (url: string) => Promise<{ status: number; text: string; headers: Headers }>;

const USER_AGENT = "KiviTronicsCRM-Monitor/1.0 (weekly public-signal check)";
const MAX_BYTES = 2_000_000;

export function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v === "::1" || v === "::" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80")) return true;
    if (v.startsWith("::ffff:")) return isPrivateAddress(v.slice(7));
    return false;
  }
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true;
  return p[0] === 10 || p[0] === 127 || p[0] === 0 || (p[0] === 169 && p[1] === 254) || (p[0] === 172 && p[1] >= 16 && p[1] <= 31)
    || (p[0] === 192 && p[1] === 168) || (p[0] === 100 && p[1] >= 64 && p[1] <= 127) || p[0] >= 224;
}

async function assertPublicHttps(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new SourceError("Invalid source URL", false);
  }
  if (url.protocol !== "https:") throw new SourceError("Only https sources are allowed", false);
  if (url.username || url.password || (url.port && url.port !== "443")) throw new SourceError("Source URL not allowed", false);
  if (/(^|\.)linkedin\.com$/i.test(url.hostname)) throw new SourceError("LinkedIn is never fetched", false);
  const addrs = isIP(url.hostname) ? [{ address: url.hostname }] : await lookup(url.hostname, { all: true }).catch(() => {
    throw new SourceError(`Could not resolve ${url.hostname}`, true);
  });
  if (addrs.some((a) => isPrivateAddress(a.address))) throw new SourceError("Source resolves to a private network address", false);
  return url;
}

async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new SourceError("Source response too large", false);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** Production fetcher: https only, public addresses only, ≤3 redirects, 15 s timeout, 2 MB cap. */
export const safeFetch: Fetcher = async (raw) => {
  let current = raw;
  for (let hop = 0; hop < 4; hop++) {
    const url = await assertPublicHttps(current);
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
      headers: { "User-Agent": USER_AGENT, Accept: "application/json, application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9" },
      cache: "no-store",
    }).catch((e: unknown) => {
      throw new SourceError(e instanceof Error && e.name === "TimeoutError" ? "Source timed out" : "Source unreachable", true);
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      current = new URL(res.headers.get("location")!, url).toString();
      continue;
    }
    return { status: res.status, text: await readCapped(res), headers: res.headers };
  }
  throw new SourceError("Too many redirects", false);
};

/** Retries 429/5xx/network errors with backoff, honouring Retry-After (capped). */
export async function fetchWithRetry(fetcher: Fetcher, url: string, opts: { retries?: number; sleep?: (ms: number) => Promise<void> } = {}) {
  const retries = opts.retries ?? 2;
  const sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  let last: SourceError | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetcher(url);
      if (res.status === 429 || res.status >= 500) {
        const ra = Number(res.headers.get("retry-after"));
        last = new SourceError(res.status === 429 ? "HTTP 429 rate limited" : `HTTP ${res.status}`, true, res.status);
        if (attempt < retries) await sleep(Math.min(Number.isFinite(ra) && ra > 0 ? ra * 1000 : 1000 * 2 ** attempt, 10_000));
        continue;
      }
      if (res.status === 404) throw new SourceError("Source not found (HTTP 404) — check the board/feed id", false, 404);
      if (res.status >= 400) throw new SourceError(`HTTP ${res.status}`, false, res.status);
      return res.text;
    } catch (e) {
      if (!(e instanceof SourceError) || !e.retryable) throw e;
      last = e;
      if (attempt < retries) await sleep(1000 * 2 ** attempt);
    }
  }
  throw last ?? new SourceError("Source failed", true);
}
