import { describe, expect, it } from "vitest";
import { classifyHeadline, collect, greenhouse, lever, parseFeed, rss, toRunPayload, type MonitorContext } from "@/lib/monitoring/providers";
import { fetchWithRetry, isPrivateAddress, SourceError, type Fetcher } from "@/lib/monitoring/fetch";

const noSleep = async () => {};
const res = (status: number, text: string, headers: Record<string, string> = {}) => ({ status, text, headers: new Headers(headers) });
const ctx = (fetcher: Fetcher, extra: Partial<MonitorContext> = {}): MonitorContext => ({ companyDomain: "acme.com", since: new Date("2026-10-01"), fetcher, sleep: noSleep, ...extra });

describe("source adapters", () => {
  it("reads Greenhouse public job boards as complete observations", async () => {
    const seen: string[] = [];
    const r = await greenhouse("acme", ctx(async (url) => {
      seen.push(url);
      return res(200, JSON.stringify({ jobs: [{ id: 7, title: "Data Engineer", absolute_url: "https://boards.greenhouse.io/acme/jobs/7", location: { name: "Pune" } }] }));
    }));
    expect(seen[0]).toBe("https://boards-api.greenhouse.io/v1/boards/acme/jobs");
    expect(r).toMatchObject({ ok: true, complete: true });
    expect(r.observations[0]).toMatchObject({ external_id: "7", title: "Data Engineer", location: "Pune" });
  });

  it("reads Lever postings and rejects unsafe ids", async () => {
    const r = await lever("acme", ctx(async () => res(200, JSON.stringify([{ id: "abc", text: "PM", hostedUrl: "https://jobs.lever.co/acme/abc", createdAt: 1767225600000 }]))));
    expect(r.observations[0]).toMatchObject({ provider: "lever", external_id: "abc", title: "PM" });
    expect((await lever("../../etc", ctx(async () => res(200, "[]")))).ok).toBe(false);
  });

  it("turns recent newsroom items into low/medium-confidence signals with sources", async () => {
    const xml = `<rss><channel>
      <item><title>Acme raises Series B to expand</title><link>https://acme.com/news/b</link><pubDate>Mon, 02 Nov 2026 10:00:00 GMT</pubDate><guid>b</guid></item>
      <item><title><![CDATA[Acme opens new office in Pune]]></title><link>https://acme.com/news/pune</link><pubDate>Mon, 20 Oct 2026 10:00:00 GMT</pubDate></item>
      <item><title>Old news</title><link>https://acme.com/news/old</link><pubDate>Mon, 01 Jan 2024 10:00:00 GMT</pubDate></item>
    </channel></rss>`;
    const r = await rss("https://acme.com/feed.xml", ctx(async () => res(200, xml)));
    expect(r.signals).toHaveLength(2);
    expect(r.signals[0]).toMatchObject({ signal_type: "funding", source_url: "https://acme.com/news/b", confidence: "medium", provider: "rss" });
    expect(r.signals[1].signal_type).toBe("expansion");
    // Third-party feeds are lower confidence than the company's own.
    const other = await rss("https://news.example.org/feed", ctx(async () => res(200, xml)));
    expect(other.signals[0].confidence).toBe("low");
    // Stable fingerprints → re-runs don't create duplicates.
    expect(r.signals[0].fingerprint).toBe((await rss("https://acme.com/feed.xml", ctx(async () => res(200, xml)))).signals[0].fingerprint);
  });

  it("parses Atom feeds and classifies headlines conservatively", () => {
    const items = parseFeed(`<feed><entry><title>Acme appoints new CTO</title><link href="https://acme.com/cto"/><updated>2026-11-01T00:00:00Z</updated><id>x</id></entry></feed>`);
    expect(items[0]).toMatchObject({ title: "Acme appoints new CTO", link: "https://acme.com/cto" });
    expect(classifyHeadline("Acme appoints new CTO")).toBe("leadership");
    expect(classifyHeadline("Quarterly product update")).toBe("announcement");
  });

  it("reports failures per source without failing the others", async () => {
    const results = await collect({ greenhouse_board: "acme", rss_urls: ["https://acme.com/feed"] }, ctx(async (url) =>
      url.includes("greenhouse") ? res(404, "") : res(200, "<html>not a feed</html>")));
    expect(results.map((r) => [r.provider, r.ok])).toEqual([["greenhouse", false], ["rss", false]]);
    expect(results[0].error).toMatch(/404/);
    expect(results[1].error).toMatch(/Not an RSS/);
    const payload = toRunPayload(results);
    expect(payload.providers.greenhouse).toMatchObject({ ok: false });
  });
});

describe("polite, bounded fetching", () => {
  it("retries rate limits and server errors, honouring Retry-After, then succeeds", async () => {
    const waits: number[] = [];
    let n = 0;
    const text = await fetchWithRetry(async () => (++n < 3 ? res(n === 1 ? 429 : 503, "", n === 1 ? { "retry-after": "2" } : {}) : res(200, "ok")), "https://x", { sleep: async (ms) => { waits.push(ms); } });
    expect(text).toBe("ok");
    expect(waits).toEqual([2000, 2000]);
  });
  it("gives up after the retry budget with a retryable error", async () => {
    await expect(fetchWithRetry(async () => res(429, ""), "https://x", { sleep: noSleep })).rejects.toMatchObject({ retryable: true, message: expect.stringMatching(/429/) });
  });
  it("does not retry client errors", async () => {
    let n = 0;
    await expect(fetchWithRetry(async () => { n++; return res(403, ""); }, "https://x", { sleep: noSleep })).rejects.toBeInstanceOf(SourceError);
    expect(n).toBe(1);
  });
  it("blocks private and internal network addresses (SSRF)", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "192.168.0.5", "172.20.0.1", "169.254.169.254", "100.64.0.1", "::1", "fd00::1", "::ffff:10.0.0.1"]) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
    expect(isPrivateAddress("142.250.183.14")).toBe(false);
  });
});
