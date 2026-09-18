"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { cx } from "@/lib/utils";

export type SceneTone = "dawn" | "dusk" | "room" | "field";

type SceneProps = {
  /** Chapter or shot number, printed on the frame like a contact sheet. */
  index?: string;
  /** The shot this frame is briefing. Becomes the alt text when a photo lands. */
  brief: string;
  tone?: SceneTone;
  className?: string;
  /** Drop a real photograph in and the placeholder steps aside. */
  src?: string;
  /** Vertical drift as the frame passes through the viewport. */
  parallax?: boolean;
  /** Full-bleed frames carry copy in the lower left, so the brief moves away. */
  captionAlign?: "bottom-left" | "top-right";
  children?: React.ReactNode;
};

/**
 * A photographic frame.
 *
 * This direction is built around photography, and there is none in this
 * environment, so each frame renders a composed, art-directed stand-in that
 * names the shot it wants. That keeps the layout, rhythm and typography real
 * and turns the gaps into a shot list rather than grey boxes.
 */
export function Scene({
  index,
  brief,
  tone = "room",
  className,
  src,
  parallax = false,
  captionAlign = "bottom-left",
  children,
}: SceneProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <div ref={ref} className={cx("pg-scene", `pg-scene--${tone}`, className)}>
      <motion.div
        className="pg-scene-fill"
        style={parallax && !reduced ? { y, scale: 1.16 } : undefined}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={brief}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <>
            <span className="pg-scene-fill" aria-hidden="true" />
            <span className="pg-scene-grain" aria-hidden="true" />
            <span className="pg-scene-vignette" aria-hidden="true" />
          </>
        )}
      </motion.div>

      {!src && (
        <>
          {/* Registration marks — the frame reads as a plate, not a gap. */}
          <span
            aria-hidden="true"
            className="absolute top-5 left-5 h-4 w-4 border-t border-l border-white/35"
          />
          <span
            aria-hidden="true"
            className="absolute right-5 bottom-5 h-4 w-4 border-r border-b border-white/35"
          />
          <p
            className={cx(
              "pg-kicker absolute max-w-[22rem] text-[0.6rem] leading-relaxed text-white/55",
              captionAlign === "top-right"
                ? "top-24 right-6 hidden text-right sm:right-10 md:block"
                : "bottom-5 left-5",
            )}
          >
            {index && <span className="text-[color:var(--pg-signal)]">{index} · </span>}
            {brief}
          </p>
        </>
      )}

      {children}
    </div>
  );
}
