"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "@/lib/utils";

/**
 * Plays the animations inside it once, when it comes into view: it sets
 * `data-play="true"`, and talyn.css starts the widget's timeline from there.
 * Every element's resting style is its end state, so before script runs — or
 * with reduced motion — the widget simply shows its result. `auto` plays on
 * load (for the first screen), without waiting for script.
 */
export function Play({ children, className, threshold = 0.3, auto = false }: { children: ReactNode; className?: string; threshold?: number; auto?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || auto) return;
    const r = el.getBoundingClientRect();
    // Already on screen: leave the end state showing rather than restart it.
    if (r.top < window.innerHeight && r.bottom > 0) return;
    el.dataset.play = "false";
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        el.dataset.play = "true";
        io.disconnect();
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, auto]);

  return (
    <div ref={ref} className={cx("tw-play", className)} data-play={auto ? "true" : undefined}>
      {children}
    </div>
  );
}
