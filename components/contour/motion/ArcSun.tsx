"use client";

import { useEffect, useRef } from "react";

/**
 * The sun on the "while you run the business" arc, travelling along it as the
 * section scrolls: high over the day, down through the night's search, rising
 * for the morning. Reads the section's `--p` (set by MotionDirector) and the
 * arc's own path, so it always sits on the line. Decoration only.
 */
export function ArcSun({ d, width, height }: { d: string; width: number; height: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const path = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    const line = path.current;
    const section = el?.closest<HTMLElement>("section");
    if (!el || !line || !section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const length = line.getTotalLength();
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = section.getBoundingClientRect();
      // Across the section's time on screen: from its top reaching the middle to its bottom doing so.
      const t = Math.min(1, Math.max(0, (window.innerHeight * 0.75 - r.top) / (r.height * 0.85)));
      const pt = line.getPointAtLength(0.06 * length + t * 0.88 * length);
      el.style.left = `${(pt.x / width) * 100}%`;
      el.style.top = `${(pt.y / height) * 100}%`;
      el.style.opacity = "1";
      // Night is violet in the drawing's language; day and morning are the person's colour.
      el.dataset.night = t > 0.3 && t < 0.7 ? "true" : "false";
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [width, height]);

  return (
    <>
      <svg viewBox={`0 0 ${width} ${height}`} className="hidden" aria-hidden="true">
        <path ref={path} d={d} />
      </svg>
      <span ref={ref} aria-hidden="true" className="ct-sun absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0" />
    </>
  );
}
