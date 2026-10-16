#!/usr/bin/env node
/**
 * Build a static, multi-page copy of the site (the /directions/contour design)
 * that runs from plain files: every page at the root of one folder, linked by
 * relative .html names, assets under ./assets.
 *
 * It never edits the repository. It copies it to a work folder, rearranges the
 * copy so the design is the whole site, applies a few patches that only make
 * sense for a static copy, runs `next build` with `output: "export"`, and
 * flattens the result.
 *
 * Static-copy patches, and why:
 * - Links are plain anchors to flat files (no client router, no RSC fetches).
 * - The two forms run their existing "not configured for this deployment"
 *   path: nothing is sent anywhere, and the visitor is told so and given the
 *   email address. That is exactly what the real site does with no webhook.
 * - Review-only labels ("Direction C", links to the other directions, the
 *   FAQ's "proposed for approval" note) are removed.
 *
 * Usage: node scripts/export-static-site.mjs . <work dir> <output dir>
 * The output's index.html is a hand-over page for hosts that serve one entry
 * page; every other page is a complete document.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [repo, work, dist] = process.argv.slice(2).map((p) => path.resolve(p));
if (!repo || !work || !dist) throw new Error("usage: export-static-site.mjs <repo> <work dir> <output dir>");

const sh = (cmd, opts = {}) => execSync(cmd, { stdio: "inherit", ...opts });
const read = (p) => fs.readFileSync(path.join(work, p), "utf8");
const write = (p, s) => {
  fs.mkdirSync(path.dirname(path.join(work, p)), { recursive: true });
  fs.writeFileSync(path.join(work, p), s);
};
function patch(file, from, to, { all = false } = {}) {
  const s = read(file);
  const hits = typeof from === "string" ? s.split(from).length - 1 : (s.match(from) || []).length;
  if (hits === 0) throw new Error(`patch: pattern not found in ${file}: ${from}`);
  if (!all && hits > 1) throw new Error(`patch: pattern found ${hits}× in ${file}: ${from}`);
  write(file, typeof from === "string" ? s.split(from).join(to) : s.replace(from, () => to));
}
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/* 1. A clean copy ---------------------------------------------------------- */
fs.rmSync(work, { recursive: true, force: true });
fs.mkdirSync(work, { recursive: true });
for (const entry of fs.readdirSync(repo)) {
  if ([".git", "node_modules", ".next", "out"].includes(entry)) continue;
  sh(`cp -a ${JSON.stringify(path.join(repo, entry))} ${JSON.stringify(work)}/`);
}
// Hard links: no extra disk, and Turbopack is happy with a real directory.
sh(`cp -al ${JSON.stringify(path.join(repo, "node_modules"))} ${JSON.stringify(path.join(work, "node_modules"))}`);

/* 2. The design becomes the whole site ------------------------------------- */
const app = path.join(work, "app");
for (const p of [
  "api", "page.tsx", "about", "privacy", "terms", "brand", "candidates",
  "sitemap.ts", "robots.ts", "opengraph-image.tsx", "directions/passage",
]) fs.rmSync(path.join(app, p), { recursive: true, force: true });
fs.renameSync(path.join(app, "directions/contour"), path.join(app, "(site)"));
fs.rmSync(path.join(app, "directions"), { recursive: true, force: true });
fs.rmSync(path.join(app, "(site)/not-found.tsx"), { force: true });
fs.rmSync(path.join(app, "(site)/README.md"), { force: true });
// The home page is a file like every other page: home.html.
fs.mkdirSync(path.join(app, "(site)/home"));
fs.renameSync(path.join(app, "(site)/page.tsx"), path.join(app, "(site)/home/page.tsx"));

write("next.config.ts", `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
};

export default nextConfig;
`);

// The approved chrome steps aside everywhere, not only under /directions.
write("components/chrome/SiteChrome.tsx", `import type { ReactNode } from "react";

export function SiteChrome({ children }: { children: ReactNode; footer: ReactNode }) {
  return <>{children}</>;
}
`);

/* 3. Flat, relative routes ------------------------------------------------- */
const site = "lib/contour/site.ts";
patch(site, /export const BASE = [^\n]+\n\n\/\*\*[^]*?\n}\n/, `export const BASE = "";

/** Static copy: every route is a flat file beside this one. \`to("/faq#x")\` → "faq.html#x". */
export function to(path = ""): string {
  const cut = path.search(/[?#]/);
  const route = cut === -1 ? path : path.slice(0, cut);
  const rest = cut === -1 ? "" : path.slice(cut);
  const name = route.replace(/^\\/+|\\/+$/g, "").replace(/\\//g, "-") || "home";
  return \`\${name}.html\${rest}\`;
}

/**
 * The current page as a route-like file name, identical on the server (where
 * Next knows "/opportunities/x") and in the browser (".../opportunities-x.html"),
 * so active states hydrate cleanly. Nested pages read as "parent.html/child".
 */
export function demoPath(pathname: string | null): string | null {
  if (!pathname) return pathname;
  const file = pathname.endsWith(".html")
    ? pathname.slice(pathname.lastIndexOf("/") + 1)
    : to(pathname === "/" ? "/home" : pathname);
  const name = file.slice(0, -5);
  for (const parent of ["opportunities", "candidates"]) {
    if (name.startsWith(\`\${parent}-\`)) return \`\${parent}.html/\${name.slice(parent.length + 1)}\`;
  }
  return file;
}
`);

for (const file of ["components/contour/chrome/Nav.tsx", "components/contour/chrome/WhatsAppButton.tsx"]) {
  patch(file, "const pathname = usePathname();", "const pathname = demoPath(usePathname());");
  patch(file, 'import { usePathname } from "next/navigation";', 'import { usePathname } from "next/navigation";\nimport { demoPath } from "@/lib/contour/site";');
}

// Filters stay in the URL, written straight to history (Next keeps
// useSearchParams in step with native replaceState).
patch(
  "components/contour/candidate/RoleExplorer.tsx",
  "if (next !== current) router.replace(`${pathname}${next}`, { scroll: false });",
  "if (next !== current) window.history.replaceState(window.history.state, \"\", next || window.location.pathname);",
);

// Plain anchors and images.
write("lib/demo/link.tsx", `import type { AnchorHTMLAttributes, Ref } from "react";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  prefetch?: boolean | null;
  scroll?: boolean;
  replace?: boolean;
  ref?: Ref<HTMLAnchorElement>;
};

/** A static copy has no client router: every link is a real page load. */
export default function Link({ prefetch: _prefetch, scroll: _scroll, replace: _replace, ...rest }: Props) {
  void _prefetch;
  void _scroll;
  void _replace;
  return <a {...rest} />;
}
`);
write("lib/demo/image.tsx", `import type { ImgHTMLAttributes } from "react";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  unoptimized?: boolean;
  priority?: boolean;
};

export default function Image({ unoptimized: _u, priority, ...rest }: Props) {
  void _u;
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...rest} alt={rest.alt} loading={priority ? "eager" : rest.loading} decoding="async" />;
}
`);
for (const file of walk(work).filter((f) => /\/(app|components|lib)\//.test(f) && /\.tsx?$/.test(f))) {
  let s = fs.readFileSync(file, "utf8");
  const before = s;
  s = s.replace(/from "next\/link";/g, 'from "@/lib/demo/link";').replace(/from "next\/image";/g, 'from "@/lib/demo/image";');
  if (s !== before) fs.writeFileSync(file, s);
}
patch("components/contour/chrome/Footer.tsx", 'src="/brand/', 'src="brand/');
patch("components/contour/chrome/Nav.tsx", 'src="/brand/', 'src="brand/');

/* 4. Forms: the honest unconfigured path, with nothing transmitted --------- */
write("lib/demo/fetch.ts", `/**
 * This copy has no server. The forms get exactly the answer the real API gives
 * when delivery isn't configured, so they show their existing fallback — the
 * email address — and nothing the visitor typed leaves the browser.
 */
export async function unsent(url: string): Promise<Response> {
  const error = url.includes("candidate")
    ? "Application delivery is not configured for this deployment."
    : "Enquiry delivery is not configured for this deployment.";
  return new Response(JSON.stringify({ ok: false, fallback: true, error }), {
    status: 503,
    headers: { "Content-Type": "application/json" },
  });
}
`);
for (const [file, url] of [
  ["components/contour/ContactForm.tsx", "/api/contact"],
  ["components/contour/candidate/ProfileFlow.tsx", "/api/candidate-application"],
]) {
  patch(file, `await fetch("${url}", {`, `await unsent("${url}", {`);
  const s = read(file);
  const firstImport = s.indexOf("\nimport ");
  write(file, s.slice(0, firstImport) + '\nimport { unsent } from "@/lib/demo/fetch";' + s.slice(firstImport));
}
// unsent() ignores its init argument; widen its signature so the call sites type-check.
patch("lib/demo/fetch.ts", "export async function unsent(url: string)", "export async function unsent(url: string, _init?: RequestInit)");
patch("lib/demo/fetch.ts", "): Promise<Response> {\n", "): Promise<Response> {\n  void _init;\n");

/* 5. No review labels ------------------------------------------------------ */
patch(
  "components/contour/chrome/Footer.tsx",
  /\n\s*<p className="ct-meta ct-mute flex flex-wrap items-center gap-x-4 gap-y-2">\s*<span>Direction C[^]*?<\/p>/,
  "",
);
patch("app/(site)/faq/page.tsx", /\n\s*<Illustrative className="mt-6 max-w-2xl">[^]*?<\/Illustrative>/, "");
patch("app/(site)/faq/page.tsx", "import { Eyebrow, Illustrative } from", "import { Eyebrow } from");
patch("app/(site)/layout.tsx", /absolute: "[^"]*",\n\s*template: "[^"]*",/, `absolute: "TALYNT LABS — Talent intelligence, built for hiring",
    template: "%s — TALYNT LABS",`);
patch(
  "app/(site)/layout.tsx",
  /description:\n\s*"Design direction C[^"]*",/,
  'description:\n    "TALYNT LABS combines deep talent sourcing, human conversations and intelligent technology to help companies make better hiring decisions.",',
);

// FAQ sources point at this site's own pages.
for (const [from, to] of [
  ['href: "/" }', "href: ROUTES.home }"],
  ['href: "/candidates" }', "href: ROUTES.candidates }"],
  ['href: "/candidates/roles" }', "href: ROUTES.opportunities }"],
  ['href: "/candidates/passport" }', "href: ROUTES.profile }"],
  ['href: "/candidates/saved" }', "href: ROUTES.dashboard }"],
]) patch("lib/contour/faq.ts", from, to);

/* 6. Build ----------------------------------------------------------------- */
sh("npx next build", { cwd: work, env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } });

/* 7. Flatten --------------------------------------------------------------- */
const out = path.join(work, "out");
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

const rewrite = (s) =>
  s
    // getAssetPrefix() looks for the asset folder in the script's absolute
    // path (it only feeds the dev-server socket); keep that check absolute.
    .replaceAll('indexOf("/_next/")', 'indexOf("/assets/")')
    .replaceAll("contain '/_next/'", "contain '/assets/'")
    .replaceAll("/_next/", "./assets/")
    .replaceAll('"/icon.svg', '"icon.svg');

const pages = [];
for (const file of walk(out)) {
  const rel = path.relative(out, file);
  if (!rel.endsWith(".html")) continue;
  if (rel.startsWith("_") || rel === "404.html" || rel === "index.html") continue;
  const flat = rel.replace(/\.html$/, "").split(path.sep).join("-") + ".html";
  fs.writeFileSync(path.join(dist, flat), rewrite(fs.readFileSync(file, "utf8")));
  pages.push(flat);
}

for (const file of walk(path.join(out, "_next/static"))) {
  const rel = path.relative(path.join(out, "_next"), file);
  const target = path.join(dist, "assets", rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (/\.(js|css)$/.test(file)) {
    let s = fs.readFileSync(file, "utf8");
    // Stylesheets resolve url() against themselves; everything else against the page.
    s = file.endsWith(".css") ? s.replaceAll("/_next/static/", "../") : rewrite(s);
    // A literal U+FFFD (in Next's legacy polyfill, always inside a string) as its escape.
    s = s.replaceAll("\uFFFD", "\\ufffd");
    fs.writeFileSync(target, s);
  } else fs.copyFileSync(file, target);
}

for (const asset of ["icon.svg", "brand/talynt-tagline-light.svg", "brand/talynt-primary-light.svg"]) {
  const target = path.join(dist, asset);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(out, asset), target);
}

/* 8. The entry page ------------------------------------------------------- */
// Published as the artifact's own page (the host wraps it in a document), so
// it carries no doctype or <html>. It hands straight over to home.html.
fs.writeFileSync(path.join(dist, "index.html"), `<title>TALYNT LABS — Talent intelligence, built for hiring</title>
<meta name="description" content="TALYNT LABS combines deep talent sourcing, human conversations and intelligent technology to help companies make better hiring decisions.">
<meta http-equiv="refresh" content="0; url=home.html">
<style>
  :root { --bg: #fafaf7; --ink: #202321; --mute: #5f6560; --green: #257461; }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) { --bg: #121413; --ink: #ecefea; --mute: #9aa19a; --green: #5fc2a2; }
  }
  :root[data-theme="dark"] { --bg: #121413; --ink: #ecefea; --mute: #9aa19a; --green: #5fc2a2; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.5 ui-sans-serif, system-ui, sans-serif; }
  .entry { min-height: 100vh; min-height: 100svh; display: grid; place-items: center; padding: 16px; text-align: center; }
  .entry a { color: var(--green); }
  .entry p { margin: 0; color: var(--mute); }
</style>
<main class="entry"><p>Opening <a href="home.html">TALYNT LABS</a>…</p></main>
<script>location.replace("home.html" + location.search + location.hash);</script>
`);

console.log(`\nPages (${pages.length}):\n  ${pages.sort().join("\n  ")}`);
console.log(`Files in ${dist}: ${walk(dist).length}`);
