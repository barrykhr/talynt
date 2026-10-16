"use client";

import { useCalm } from "@/lib/contour/motion";
import Link from "next/link";
import {motion, useScroll, useSpring} from "framer-motion";
import { useRef } from "react";
import { HOW_WE_WORK } from "@/lib/contour/content";
import { ROUTES } from "@/lib/contour/site";

/**
 * Two journeys, given the same weight.
 *
 * The employer side is the approved six layers. The candidate side is a
 * framework for the routes that actually exist on this site — each step links
 * to the page that does it. Neither rail claims a step is automated.
 *
 * A rail fills as you read, the way a search progresses. Scrolling stays
 * entirely the reader's; nothing is pinned or hijacked.
 */

// PROPOSED COPY — candidate steps, written against the routes that exist.
const CANDIDATE_STEPS = [
  {
    title: "Explore",
    body: "Read every open role, with the band stated up front. No account needed.",
    href: ROUTES.opportunities,
    cta: "Explore roles",
  },
  {
    title: "Understand",
    body: "Each role says why it exists, what success looks like and what is hard about it — and, if you tell us where you’re heading, where it lines up with you.",
    href: `${ROUTES.candidates}#pathways`,
    cta: "Where are you heading?",
  },
  {
    title: "Apply",
    body: "One question at a time. Nothing is sent until you have read the last step and confirmed it.",
    href: ROUTES.profile,
    cta: "Build your profile",
  },
  {
    title: "Track",
    body: "Your dashboard keeps what this device saved and sent. What happens next comes from a person, not a status page.",
    href: ROUTES.dashboard,
    cta: "Your dashboard",
  },
];

function Rail({
  children,
  tone,
  label,
}: {
  children: React.ReactNode;
  tone: "green" | "violet";
  label: string;
}) {
  const ref = useRef<HTMLOListElement | null>(null);
  const reduced = useCalm();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });

  return (
    <div className="relative">
      <div aria-hidden="true" className="absolute top-2 bottom-2 left-[0.9rem] w-px bg-[var(--ct-line-2)]">
        <motion.div
          className="h-full w-full origin-top"
          style={{
            scaleY: reduced ? 1 : fill,
            backgroundColor: tone === "green" ? "var(--ct-green)" : "var(--ct-violet)",
          }}
        />
      </div>
      <ol ref={ref} aria-label={label} className="flex flex-col gap-9">
        {children}
      </ol>
    </div>
  );
}

function Step({
  index,
  title,
  body,
  tone,
  children,
}: {
  index: number;
  title: string;
  body: string;
  tone: "green" | "violet";
  children?: React.ReactNode;
}) {
  return (
    <li className="relative grid grid-cols-[1.8rem_1fr] gap-4">
      <span
        className="relative z-10 mt-0.5 flex h-[1.8rem] w-[1.8rem] items-center justify-center rounded-full border bg-[var(--ct-bg)]"
        style={{ ["--ct-bc" as string]: tone === "green" ? "var(--ct-green)" : "var(--ct-violet)" }}
      >
        <span className={`ct-meta tabular-nums ${tone === "green" ? "ct-green" : "ct-violet"}`}>{index}</span>
      </span>
      <div>
        <h4 className="ct-display ct-s">{title}</h4>
        <p className="ct-body mt-2 max-w-md">{body}</p>
        {children}
      </div>
    </li>
  );
}

export function ProcessRail({ only }: { only?: "employers" } = {}) {
  return (
    <div className={only ? "max-w-2xl" : "grid gap-16 lg:grid-cols-2 lg:gap-20"}>
      <div>
        <h3 className="ct-meta flex items-center gap-2 pb-8">
          <span aria-hidden="true" className="h-2 w-2 rounded-[2px] bg-[var(--ct-green)]" />
          <span className="ct-ink2">For employers · six layers on every search</span>
        </h3>
        <Rail tone="green" label="How a search works">
          {HOW_WE_WORK.layers.map((layer, i) => (
            <Step key={layer.title} index={i + 1} title={layer.title} body={layer.body} tone="green" />
          ))}
        </Rail>
        <p className="ct-display ct-s mt-12 border-t pt-8">
          {HOW_WE_WORK.close} <span className="ct-italic ct-green">{HOW_WE_WORK.closeItalic}</span>
        </p>
      </div>

      {!only && (
      <div>
        <h3 className="ct-meta flex items-center gap-2 pb-8">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--ct-violet)]" />
          <span className="ct-ink2">For candidates · four steps, all of them yours</span>
        </h3>
        <Rail tone="violet" label="How applying works">
          {CANDIDATE_STEPS.map((step, i) => (
            <Step key={step.title} index={i + 1} title={step.title} body={step.body} tone="violet">
              <Link href={step.href} className="ct-link mt-3 inline-flex min-h-9 items-center text-[0.92rem]">
                {step.cta} <span aria-hidden="true">&nbsp;→</span>
              </Link>
            </Step>
          ))}
        </Rail>
      </div>
      )}
    </div>
  );
}
