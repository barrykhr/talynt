import type { LegalSection } from "@/components/primitives/LegalBody";
import { LEGAL } from "@/lib/contour/content";
import { Eyebrow } from "@/components/contour/ui";

function anchor(heading: string) {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Privacy and Terms. The text comes from lib/legal.ts — the same source the
 * approved pages read — and is set in the order they set it: paragraphs, then
 * the list. On wide screens the headings double as a contents rail.
 */
export function LegalPage({
  eyebrow,
  title,
  lede,
  sections,
  updated,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  sections: LegalSection[];
  updated: string;
}) {
  return (
    <>
      <header className="ct-wrap pt-12 pb-12 md:pt-20 md:pb-16">
        <Eyebrow tone="ink">{eyebrow}</Eyebrow>
        <h1 className="ct-display ct-xl mt-7 max-w-4xl">{title}</h1>
        <p className="ct-lede mt-6 max-w-2xl">{lede}</p>
      </header>

      <div className="ct-wrap grid gap-10 pb-[var(--ct-section)] lg:grid-cols-12 lg:gap-10">
        <nav aria-label="On this page" className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-[calc(var(--ct-nav-h)+2rem)]">
            <p className="ct-meta ct-mute">
              {LEGAL.updatedLabel} {updated}
            </p>
            <ol className="mt-6 flex flex-col gap-1 border-t pt-5">
              {sections.map((section) => (
                <li key={section.heading}>
                  <a
                    href={`#${anchor(section.heading)}`}
                    className="inline-flex min-h-8 items-center text-[0.9rem] text-[var(--ct-mute)] transition-colors hover:text-[var(--ct-ink)]"
                  >
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <div className="max-w-[44rem] lg:col-span-8 lg:col-start-5">
          <p className="ct-meta ct-mute mb-10 border-b pb-5 lg:hidden">
            {LEGAL.updatedLabel} {updated}
          </p>
          {sections.map((section) => (
            <section
              key={section.heading}
              id={anchor(section.heading)}
              className="scroll-mt-[calc(var(--ct-nav-h)+1.5rem)] border-t py-10 first:border-t-0 first:pt-0"
            >
              <h2 className="ct-display ct-s">{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="ct-body mt-4">
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ul className="mt-4 flex flex-col gap-3">
                  {section.list.map((item) => (
                    <li key={item} className="flex gap-3.5">
                      <span
                        aria-hidden="true"
                        className="mt-[0.62rem] h-[0.4rem] w-[0.4rem] shrink-0 rounded-full bg-[var(--ct-green)]"
                      />
                      <span className="ct-body">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
