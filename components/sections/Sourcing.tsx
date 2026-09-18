"use client";

import { Section } from "@/components/primitives/Section";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import {
  SOURCING_STAGES,
  TalentUniverse,
  useSourcingStage,
} from "@/components/visuals/TalentUniverse";
import { cx } from "@/lib/utils";

export function Sourcing() {
  const { stage, setStage, onStageChange } = useSourcingStage();

  return (
    <Section id="sourcing" tone="ink" aria-labelledby="sourcing-heading">
      <div className="wrap">
        <SectionHeader
          index="03"
          eyebrow="Sourcing"
          headingId="sourcing-heading"
          title={
            <>
              The best candidate
              <br />
              <span className="italic">isn&rsquo;t always looking.</span>
            </>
          }
          lede="We don't wait for applications. We go looking."
        />

        <div className="mt-20 grid gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <ol className="flex flex-col">
            {SOURCING_STAGES.map((item, i) => {
              const isActive = i === stage;
              const isPast = i < stage;
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => setStage(i)}
                    aria-current={isActive ? "step" : undefined}
                    className={cx(
                      "group flex w-full items-start gap-6 border-t border-paper-100/10 py-5 text-left transition-opacity duration-500",
                      isActive ? "opacity-100" : isPast ? "opacity-45" : "opacity-30",
                      "hover:opacity-100",
                    )}
                  >
                    <span
                      className={cx(
                        "mono-micro mt-1.5 tabular-nums transition-colors duration-500",
                        isActive ? "text-signal" : "opacity-60",
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1">
                      <span className="flex items-baseline justify-between gap-4">
                        <span className="text-(length:--text-h3) font-display leading-tight">
                          {item.label}
                        </span>
                        <span className="font-mono text-[0.85rem] tabular-nums opacity-70">
                          {item.count}
                        </span>
                      </span>
                      <span
                        className={cx(
                          "mt-2 block max-w-md text-[0.9rem] leading-[1.55] opacity-60 transition-all duration-500",
                          isActive
                            ? "max-h-24 opacity-60"
                            : "max-h-0 overflow-hidden opacity-0",
                        )}
                      >
                        {item.note}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="lg:sticky lg:top-32 lg:self-start">
            <TalentUniverse stage={stage} onStageChange={onStageChange} />
            <p className="mono-micro mt-5 opacity-40">
              Illustrative. Volumes vary by role, market and mandate.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
