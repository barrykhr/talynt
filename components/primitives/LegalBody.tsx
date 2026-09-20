import { Reveal } from "./Reveal";

export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  list?: string[];
};

/** Legal pages get the same typography as everything else. Restraint, not noise. */
export function LegalBody({
  sections,
  updated,
}: {
  sections: LegalSection[];
  updated: string;
}) {
  return (
    <div className="wrap-narrow pb-(--spacing-section)">
      <p className="mono-micro mb-16 border-b border-paper-100/10 pb-6 text-fg-40">
        Last updated {updated}
      </p>

      <div className="flex flex-col gap-14">
        {sections.map((section, i) => (
          <Reveal key={section.heading} delay={Math.min(i * 0.04, 0.2)}>
            <section>
              <h2 className="display text-(length:--text-h3)">{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 40)}
                  className="mt-5 text-[1rem] leading-[1.7] text-fg-65"
                >
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ul className="mt-5 flex flex-col gap-3">
                  {section.list.map((item) => (
                    <li key={item} className="flex gap-3.5">
                      <span
                        aria-hidden="true"
                        className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-signal"
                      />
                      <span className="text-[1rem] leading-[1.7] text-fg-65">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
