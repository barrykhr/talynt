import Link from "next/link";
import { HERO } from "@/lib/contour/content";
import { ROUTES } from "@/lib/contour/site";
import { TalentMap } from "@/components/contour/graphics/TalentMap";
import { MarkOnView } from "@/components/contour/MarkOnView";

/**
 * The hero states the position, gives each audience its own door, and lets the
 * map do the explaining. The four approved pillars become the map's legend, so
 * each one points at the part of the drawing it describes.
 */

const LEGEND: Array<{ label: string; glyph: React.ReactNode }> = [
  {
    label: HERO.pillars[0],
    glyph: (
      <svg viewBox="0 0 28 14" className="h-3.5 w-7" aria-hidden="true">
        {[3, 9, 15, 21, 25].map((x, i) => (
          <circle key={x} cx={x} cy={i % 2 ? 4 : 10} r="1.8" fill="var(--ct-ink)" opacity={0.45} />
        ))}
      </svg>
    ),
  },
  {
    label: HERO.pillars[1],
    glyph: (
      <svg viewBox="0 0 28 14" className="h-3.5 w-7" aria-hidden="true">
        <path d="M2 11C10 11 16 3 26 3" fill="none" stroke="var(--ct-green)" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    label: HERO.pillars[2],
    glyph: (
      <svg viewBox="0 0 28 14" className="h-3.5 w-7" aria-hidden="true">
        {[2.5, 5, 7].map((r) => (
          <circle key={r} cx="14" cy="7" r={r} fill="none" stroke="var(--ct-ink)" strokeWidth="0.9" opacity="0.6" />
        ))}
      </svg>
    ),
  },
  {
    label: HERO.pillars[3],
    glyph: (
      <svg viewBox="0 0 28 14" className="h-3.5 w-7" aria-hidden="true">
        <circle cx="14" cy="7" r="4.2" fill="var(--ct-signal)" />
      </svg>
    ),
  },
];

export function Hero() {
  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden">
      <div className="ct-field pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <div className="ct-wrap relative grid items-center gap-y-10 pt-10 pb-12 md:pt-14 lg:min-h-[calc(100svh-var(--ct-nav-h)-5rem)] lg:grid-cols-12 lg:gap-x-10 lg:pt-8">
        <div className="lg:col-span-7">
          <p className="ct-meta flex items-center gap-3">
            <span aria-hidden="true" className="inline-block h-2 w-2 rounded-[2px] bg-[var(--ct-ink)]" />
            <span className="ct-mute">{HERO.eyebrow}</span>
          </p>

          <h1 id="hero-heading" className="ct-display ct-xl mt-7">
            {HERO.titleLead} <MarkOnView>{HERO.titleMark}</MarkOnView>
            <br className="hidden sm:block" /> {HERO.titleTail}
          </h1>

          <p className="ct-lede mt-7 max-w-[34rem]">{HERO.lede}</p>

          {/* Two doors, equal weight. Each is labelled by who it is for. */}
          <div className="mt-10 grid max-w-[36rem] gap-3 sm:grid-cols-2">
            <Door
              href={ROUTES.enquiry}
              audience="For employers"
              action={HERO.primary}
              tone="green"
              primary
            />
            <Door href={ROUTES.opportunities} audience="For candidates" action="Explore roles" tone="violet" />
          </div>

          <Link href="#how-it-works" className="ct-btn ct-btn-quiet mt-5 gap-2 text-[0.92rem] text-[var(--ct-mute)]">
            {HERO.secondary}
            <span aria-hidden="true" className="ct-btn-arrow">
              ↓
            </span>
          </Link>
        </div>

        <div className="lg:col-span-5 lg:-mr-[2vw]">
          <TalentMap className="mx-auto w-full max-w-[40rem]" />
        </div>
      </div>

      {/* The legend: the approved pillars, each pointing at its part of the map. */}
      <div className="ct-wrap relative pb-6">
        <ul className="grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-5 md:grid-cols-4">
          {LEGEND.map((item, i) => (
            <li key={item.label} className="flex items-center gap-3">
              <span className="ct-meta ct-mute tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              {item.glyph}
              <span className="text-[0.9rem] text-[var(--ct-ink-2)]">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Door({
  href,
  audience,
  action,
  tone,
  primary = false,
}: {
  href: string;
  audience: string;
  action: string;
  tone: "green" | "violet";
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "group flex min-h-[4.5rem] flex-col justify-between gap-2 rounded-[var(--ct-r-m)] bg-[var(--ct-ink)] px-4 py-3.5 text-[var(--ct-bg)] transition-colors duration-200 hover:bg-[var(--ct-green-deep)]"
          : "group ct-b2 ct-hb-ink flex min-h-[4.5rem] flex-col justify-between gap-2 rounded-[var(--ct-r-m)] border bg-[var(--ct-surface)] px-4 py-3.5 transition-colors duration-200"
      }
    >
      <span className="ct-meta flex items-center gap-2 opacity-80">
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: tone === "green" ? "var(--ct-lime)" : "var(--ct-violet)" }}
        />
        {audience}
      </span>
      <span className="flex items-center justify-between text-[1.02rem] font-medium tracking-[-0.01em]">
        {action}
        <span aria-hidden="true" className="ct-btn-arrow">
          →
        </span>
      </span>
    </Link>
  );
}
