"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCalm } from "@/lib/contour/motion";

/**
 * One line down the whole page, in the left margin. It draws as the reader
 * scrolls and carries a single dot — the person — from section to section, so
 * the page reads as one search rather than a stack of blocks. Each section
 * boundary is a small node that lights once the dot has passed it.
 *
 * Decoration only (aria-hidden), wide screens only, and still under reduced
 * motion (fully drawn, no dot).
 */

const WRAP = 1440; // .ct-wrap max width, px
const STEP = 24; // path sampling, px

type Shape = { d: string; width: number; height: number; nodes: Array<{ x: number; y: number }>; xAt: (y: number) => number };

function build(main: HTMLElement): Shape {
  const width = main.clientWidth;
  const height = main.scrollHeight;
  const base = (width - Math.min(width, WRAP)) / 2 + 26;
  const xAt = (y: number) => base + Math.sin(y / 260) * 9 + Math.sin(y / 97) * 2.5;
  let d = `M${xAt(0).toFixed(1)} 0`;
  for (let y = STEP; y <= height; y += STEP) d += `L${xAt(y).toFixed(1)} ${y}`;
  const nodes = Array.from(main.querySelectorAll<HTMLElement>(":scope > section")).map((s) => {
    const y = s.offsetTop + 56;
    return { x: xAt(y), y };
  });
  return { d, width, height, nodes, xAt };
}

export function ScrollThread() {
  const pathname = usePathname();
  const [shape, setShape] = useState<Shape | null>(null);
  const calm = useCalm();
  const clip = useRef<SVGRectElement | null>(null);
  const dot = useRef<SVGCircleElement | null>(null);
  const halo = useRef<SVGCircleElement | null>(null);
  const svg = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const main = document.getElementById("ct-main");
    if (!main) return;
    // A ResizeObserver reports once on observe, so this also draws the first shape.
    const rebuild = () => setShape(build(main));
    const ro = new ResizeObserver(rebuild);
    ro.observe(main);
    return () => ro.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (!shape || calm) return;
    const main = document.getElementById("ct-main");
    if (!main) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const top = main.getBoundingClientRect().top;
      const y = Math.min(shape.height, Math.max(0, window.innerHeight * 0.55 - top));
      clip.current?.setAttribute("height", String(y));
      const x = shape.xAt(y);
      for (const c of [dot.current, halo.current]) {
        c?.setAttribute("cx", x.toFixed(1));
        c?.setAttribute("cy", y.toFixed(1));
      }
      svg.current?.querySelectorAll<SVGCircleElement>("[data-node]").forEach((n) => {
        n.dataset.on = Number(n.getAttribute("cy")) <= y ? "true" : "false";
      });
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
  }, [shape, calm]);

  if (!shape) return null;
  return (
    <svg
      ref={svg}
      aria-hidden="true"
      className="ct-thread pointer-events-none absolute top-0 left-0 hidden w-full lg:block"
      style={{ height: shape.height }}
      viewBox={`0 0 ${shape.width} ${shape.height}`}
    >
      <defs>
        <clipPath id="ct-thread-drawn">
          <rect ref={clip} x="0" y="0" width="100%" height={calm ? shape.height : 0} />
        </clipPath>
      </defs>
      <path d={shape.d} fill="none" stroke="var(--ct-line-2)" strokeWidth="1" strokeDasharray="2 6" />
      <path d={shape.d} fill="none" stroke="var(--ct-lime)" strokeWidth="1.5" clipPath="url(#ct-thread-drawn)" />
      {shape.nodes.map((n, i) => (
        <circle key={i} data-node="" data-on={calm ? "true" : "false"} cx={n.x} cy={n.y} r="4" className="ct-thread-node" />
      ))}
      {!calm && (
        <>
          <circle ref={halo} r="14" className="ct-thread-halo" />
          <circle ref={dot} r="5" fill="var(--ct-lime)" />
        </>
      )}
    </svg>
  );
}
