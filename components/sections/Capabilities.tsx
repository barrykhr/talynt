"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Section } from "@/components/primitives/Section";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Reveal } from "@/components/primitives/Reveal";
import { cx } from "@/lib/utils";

const AREAS = [
  {
    id: "technology",
    title: "Technology",
    note: "Roles where the hiring context is usually technical and the failure mode usually isn't.",
    items: ["Engineering", "AI", "Data", "Product"],
  },
  {
    id: "gtm",
    title: "Go-to-market",
    note: "People whose results depend heavily on the stage and the motion they're selling into.",
    items: ["Sales", "Marketing", "Customer Success"],
  },
  {
    id: "leadership",
    title: "Leadership",
    note: "Searches where the shortlist is short by definition and the reasoning matters most.",
    items: ["Executives", "Functional Leaders", "Critical Hires"],
  },
  {
    id: "operations",
    title: "Operations",
    note: "The functions that decide whether everything else in the company actually runs.",
    items: ["Finance", "People", "Operations", "Business Functions"],
  },
];

export function Capabilities() {
  const [openId, setOpenId] = useState<string | null>(AREAS[0].id);

  return (
    <Section id="capabilities" tone="ink" aria-labelledby="capabilities-heading">
      <div className="wrap">
        <SectionHeader
          index="15"
          eyebrow="Capabilities"
          headingId="capabilities-heading"
          title={
            <>
              Talent, wherever
              <br />
              <span className="italic">the business needs it.</span>
            </>
          }
        />

        <div className="mt-16">
          {AREAS.map((area, i) => {
            const isOpen = openId === area.id;
            return (
              <Reveal key={area.id} delay={i * 0.06}>
                <div className="border-t border-paper-100/10 last:border-b">
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : area.id)}
                      aria-expanded={isOpen}
                      aria-controls={`capability-${area.id}`}
                      className="group flex w-full items-center justify-between gap-8 py-7 text-left"
                    >
                      <span className="flex items-baseline gap-6">
                        <span className="mono-micro text-signal tabular-nums">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          className={cx(
                            "display text-(length:--text-h2) transition-opacity duration-500",
                            isOpen ? "opacity-100" : "opacity-45 group-hover:opacity-80",
                          )}
                        >
                          {area.title}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className={cx(
                          "shrink-0 text-2xl leading-none font-light transition-transform duration-500 ease-(--ease-out-expo)",
                          isOpen ? "rotate-45 text-signal" : "opacity-40",
                        )}
                      >
                        +
                      </span>
                    </button>
                  </h3>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`capability-${area.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="grid gap-8 pb-9 md:grid-cols-[1fr_1fr] md:pl-[4.5rem]">
                          <ul className="flex flex-wrap gap-x-8 gap-y-3">
                            {area.items.map((item) => (
                              <li key={item} className="text-[1.05rem] opacity-80">
                                {item}
                              </li>
                            ))}
                          </ul>
                          <p className="max-w-md text-[0.94rem] leading-[1.6] opacity-50">
                            {area.note}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
