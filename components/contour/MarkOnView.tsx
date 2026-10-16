"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/utils";

/**
 * The highlighter, drawn across the words when they come into view.
 * Without JavaScript or with reduced motion the mark is simply there.
 */
export function MarkOnView({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setOn(true);
          observer.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref} className={cx("ct-mark ct-mark-draw", className)} data-on={on ? "true" : "false"}>
      {children}
    </span>
  );
}
