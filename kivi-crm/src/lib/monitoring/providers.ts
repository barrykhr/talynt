// Public-signal source adapters. Each returns observations (for diffing) and
// ready-made signals. Adding a source = adding an adapter; the CRM schema and
// review flow don't change. Paid providers are NOT included: none is used
// unless an adapter is added and its credentials are configured.
import { createHash } from "node:crypto";
import { fetchWithRetry, SourceError, type Fetcher } from "./fetch";

export interface Observation { provider: string; external_id: string; title: string; url: string | null; location: string | null; published_at: string | null }
export interface SignalDraft {
  signal_type: "hiring" | "announcement" | "funding" | "expansion" | "leadership" | "other";
  summary: string; source_url: string | null; source_title: string | null; provider: string;
  published_at: string | null; confidence: "high" | "medium" | "low"; fingerprint: string; details?: Record<string, unknown>;
}
export interface SourceResult { provider: string; ok: boolean; complete: boolean; error?: string; observations: Observation[]; signals: SignalDraft[] }

export interface MonitorSources { greenhouse_board?: string | null; lever_company?: string | null; rss_urls?: string[] }
export interface MonitorContext { companyDomain: string | null; since: Date; fetcher: Fetcher; sleep?: (ms: number) => Promise<void> }

const id = (s: string) => /^[a-z0-9_-]{1,80}$/i.test(s);

// Greenhouse Job Board API (public, no key): https://developers.greenhouse.io/job-board.html
export async function greenhouse(board: string, ctx: MonitorContext): Promise<SourceResult> {
  if (!id(board)) return fail("greenhouse", "Invalid Greenhouse board token");
  try {
    const text = await fetchWithRetry(ctx.fetcher, `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs`, { sleep: ctx.sleep });
    const json = JSON.parse(text) as { jobs?: { id: number; title: string; absolute_url?: string; updated_at?: string; location?: { name?: string } }[] };
    if (!Array.isArray(json.jobs)) throw new SourceError("Unexpected Greenhouse response", false);
    return {
      provider: "greenhouse", ok: true, complete: true, signals: [],
      observations: json.jobs.slice(0, 500).map((j) => ({
        provider: "greenhouse", external_id: String(j.id), title: j.title.slice(0, 300), url: j.absolute_url ?? null,
        location: j.location?.name ?? null, published_at: j.updated_at ?? null,
      })),
    };
  } catch (e) {
    return fail("greenhouse", e);
  }
}

// Lever postings API (public, no key): https://github.com/lever/postings-api
export async function lever(company: string, ctx: MonitorContext): Promise<SourceResult> {
  if (!id(company)) return fail("lever", "Invalid Lever company id");
  try {
    const text = await fetchWithRetry(ctx.fetcher, `https://api.lever.co/v0/postings/${encodeURIComponent(company)}?mode=json`, { sleep: ctx.sleep });
    const json = JSON.parse(text) as { id: string; text: string; hostedUrl?: string; createdAt?: number; categories?: { location?: string } }[];
    if (!Array.isArray(json)) throw new SourceError("Unexpected Lever response", false);
    return {
      provider: "lever", ok: true, complete: true, signals: [],
      observations: json.slice(0, 500).map((j) => ({
        provider: "lever", external_id: j.id, title: j.text.slice(0, 300), url: j.hostedUrl ?? null,
        location: j.categories?.location ?? null, published_at: j.createdAt ? new Date(j.createdAt).toISOString() : null,
      })),
    };
  } catch (e) {
    return fail("lever", e);
  }
}

// ------------------------------------------------------------------ RSS / Atom newsroom feeds
function decode(s: string) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/\s+/g, " ").trim();
}
function tag(block: string, name: string) {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : null;
}

export interface FeedItem { title: string; link: string | null; published: string | null; guid: string }

export function parseFeed(xml: string): FeedItem[] {
  const items: FeedItem[] = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ?? [];
  for (const b of blocks.slice(0, 100)) {
    const title = tag(b, "title");
    if (!title) continue;
    const atomLink = b.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] ?? null;
    const link = (tag(b, "link") || atomLink || "").trim() || null;
    const dateRaw = tag(b, "pubDate") ?? tag(b, "published") ?? tag(b, "updated") ?? tag(b, "dc:date");
    const d = dateRaw ? new Date(dateRaw) : null;
    items.push({ title: title.slice(0, 300), link: link && /^https?:\/\//.test(link) ? link : null,
      published: d && !Number.isNaN(d.getTime()) ? d.toISOString() : null, guid: tag(b, "guid") ?? tag(b, "id") ?? link ?? title });
  }
  return items;
}

export function classifyHeadline(title: string): SignalDraft["signal_type"] {
  const t = title.toLowerCase();
  if (/\b(raise[sd]?|funding|series [a-f]\b|seed round|investment from|investors?)\b/.test(t)) return "funding";
  if (/\b(appoint(s|ed)?|names? .* (ceo|cto|cfo|chro|head|vp)|joins as|new (ceo|cto|cfo)|chief)\b/.test(t)) return "leadership";
  if (/\b(new office|opens|expands?|expansion|enters|launch(es)? in|headquarters)\b/.test(t)) return "expansion";
  if (/\b(hiring|jobs|careers|recruit)\b/.test(t)) return "hiring";
  return "announcement";
}

export async function rss(feedUrl: string, ctx: MonitorContext): Promise<SourceResult> {
  try {
    const xml = await fetchWithRetry(ctx.fetcher, feedUrl, { sleep: ctx.sleep });
    if (!/<(rss|feed|rdf:RDF)[\s>]/i.test(xml)) throw new SourceError("Not an RSS or Atom feed", false);
    const host = new URL(feedUrl).hostname.replace(/^www\./, "");
    const own = Boolean(ctx.companyDomain && (host === ctx.companyDomain || host.endsWith(`.${ctx.companyDomain}`)));
    const signals = parseFeed(xml)
      .filter((i) => i.published && new Date(i.published) >= ctx.since)
      .slice(0, 10)
      .map((i) => ({
        signal_type: classifyHeadline(i.title),
        summary: i.title,
        source_url: i.link,
        source_title: host,
        provider: "rss",
        published_at: i.published,
        // Headline keyword classification is a hint, never certainty.
        confidence: own ? ("medium" as const) : ("low" as const),
        fingerprint: `rss:${createHash("sha1").update(i.guid).digest("hex")}`,
        details: { feed: feedUrl, companys_own_feed: own, classification: "keyword match on headline" },
      }));
    return { provider: "rss", ok: true, complete: false, observations: [], signals };
  } catch (e) {
    return fail("rss", e);
  }
}

function fail(provider: string, e: unknown): SourceResult {
  const message = e instanceof SourceError ? e.message : typeof e === "string" ? e : e instanceof SyntaxError ? "Source returned invalid data" : "Source failed";
  return { provider, ok: false, complete: false, error: message.slice(0, 200), observations: [], signals: [] };
}

export async function collect(sources: MonitorSources, ctx: MonitorContext): Promise<SourceResult[]> {
  const jobs: Promise<SourceResult>[] = [];
  if (sources.greenhouse_board) jobs.push(greenhouse(sources.greenhouse_board, ctx));
  if (sources.lever_company) jobs.push(lever(sources.lever_company, ctx));
  for (const u of (sources.rss_urls ?? []).slice(0, 5)) jobs.push(rss(u, ctx));
  return Promise.all(jobs);
}

/** Merges per-source results into the payloads finish_monitor_run expects. */
export function toRunPayload(results: SourceResult[]) {
  const providers: Record<string, { ok: boolean; complete: boolean; error?: string; items: number }> = {};
  for (const r of results) {
    const key = providers[r.provider] ? `${r.provider}#${Object.keys(providers).length}` : r.provider;
    providers[key] = { ok: r.ok, complete: r.complete, error: r.error, items: r.observations.length + r.signals.length };
  }
  return {
    providers,
    observations: results.flatMap((r) => r.observations),
    signals: results.flatMap((r) => r.signals),
  };
}
