"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * The motion layer for the employer-only colourways (lib/contour/variant.ts,
 * MOTION). One small runtime, no markup of its own: it reads the page as
 * rendered and hands CSS three things, and motion.css does the moving.
 *
 *  1. Reveal. Text blocks, cards, figures and list items are marked
 *     `data-reveal` and get `data-in` as they come into view, so they rise in
 *     once. Anything already on screen is marked in straight away (no flash).
 *  2. Scroll progress. Every top-level section, and a few figures and lists
 *     that animate on their own, get `--p`: 0 as they come into view, 1 once
 *     they are well inside it. motion.css ties drawings, bars, highlights and
 *     word-by-word reveals to it, so they move with the scroll and stop when
 *     the reader stops. The page as a whole gets `--page-p`.
 *  3. The pointer. `--cx`/`--cy` on the page (the dot field near the cursor)
 *     and `--gx`/`--gy` on the card under it (a soft glow that follows).
 *
 * Reduced motion: nothing is hidden and nothing is driven; CSS shows every
 * end state (`--p` defaults to 1). Without script the same is true.
 */

const REVEAL = [
  "h2",
  "h3",
  ".ct-lede",
  ".ct-body",
  ".ct-small",
  "p.ct-meta",
  "p.ct-display",
  "blockquote",
  "figure",
  "form",
  "dl",
  ".ct-window",
  ".ct-panel",
  "ol > li",
  "ul > li",
].join(", ");

/** Never revealed: the first screen (it has its own entrance), the pinned story, legal text. */
const SKIP = "#ct-main > section:first-child, .ct-story, [data-no-reveal], nav";

/** Elements with their own scroll progress, beyond the top-level sections. */
const SCRUB = [
  "#ct-main > section",
  "#problem ol",
  "#philosophy figure",
  "#continues ol",
  "#evaluation ol",
  "#evaluation .border-dashed",
  "#evaluation ul",
  "#shortlist figure",
  "#decision ul",
  "#human ul",
  "#ct-main svg.ct-graphic",
].join(", ");

export function MotionDirector() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".ct-motion");
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const main = document.getElementById("ct-main");
    if (!main) return;

    /* 1. Reveal ------------------------------------------------------------ */
    // Legal text stays still and plainly readable.
    const legal = /\/(privacy|terms)(\.html)?$/.test(window.location.pathname);
    const vh = () => window.innerHeight;
    const tagged: HTMLElement[] = [];
    for (const el of legal ? [] : Array.from(main.querySelectorAll<HTMLElement>(REVEAL))) {
      if (el.closest(SKIP)) continue;
      if (el.parentElement?.closest("[data-reveal]")) continue; // the outermost block moves as one
      if (el.style.opacity || el.style.transform) continue; // already animated by its component
      const siblings = el.parentElement ? Array.from(el.parentElement.children) : [];
      el.style.setProperty("--ri", String(Math.min(siblings.indexOf(el), 8)));
      el.dataset.reveal = "";
      const r = el.getBoundingClientRect();
      if (r.top < vh() * 0.92 && r.bottom > 0) el.dataset.in = "";
      tagged.push(el);
    }
    const reveal = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.in = "";
          reveal.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    tagged.filter((el) => !("in" in el.dataset)).forEach((el) => reveal.observe(el));
    root.classList.add("ct-motion-live");

    /* 2. Scroll progress -------------------------------------------------- */
    const scrubs = Array.from(main.querySelectorAll<HTMLElement | SVGElement>(SCRUB));
    const visible = new Set<Element>();
    const watch = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target);
          else visible.delete(e.target);
        }
        schedule();
      },
      { rootMargin: "20% 0px 20% 0px" },
    );
    scrubs.forEach((el) => watch.observe(el));

    let frame = 0;
    const update = () => {
      frame = 0;
      const h = vh();
      for (const el of visible) {
        const top = el.getBoundingClientRect().top;
        // 0 when the element's top is near the bottom of the screen, 1 once it reaches the upper third.
        const p = Math.min(1, Math.max(0, (h * 0.92 - top) / (h * 0.6)));
        (el as HTMLElement).style.setProperty("--p", p.toFixed(3));
      }
      const doc = document.documentElement;
      const max = doc.scrollHeight - h;
      root.style.setProperty("--page-p", (max > 0 ? window.scrollY / max : 0).toFixed(4));
      root.style.setProperty("--sy", String(Math.round(window.scrollY)));
    };
    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }
    // Start everything not yet in view at 0, so it draws as it arrives.
    for (const el of scrubs) {
      const top = el.getBoundingClientRect().top;
      if (top > vh() * 0.92) (el as HTMLElement).style.setProperty("--p", "0");
    }
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    /* 3. The pointer ------------------------------------------------------ */
    const fine = window.matchMedia("(pointer: fine)").matches;
    let card: HTMLElement | null = null;
    const onPointer = (e: PointerEvent) => {
      root.style.setProperty("--cx", `${e.clientX}px`);
      root.style.setProperty("--cy", `${e.clientY}px`);
      const next = (e.target as Element | null)?.closest?.<HTMLElement>(".ct-window, .ct-panel") ?? null;
      if (card && card !== next) card.style.removeProperty("--gx");
      card = next;
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--gx", `${Math.round(e.clientX - r.left)}px`);
        card.style.setProperty("--gy", `${Math.round(e.clientY - r.top)}px`);
      }
    };
    if (fine) window.addEventListener("pointermove", onPointer, { passive: true });

    return () => {
      reveal.disconnect();
      watch.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (fine) window.removeEventListener("pointermove", onPointer);
      if (frame) window.cancelAnimationFrame(frame);
      root.classList.remove("ct-motion-live");
      tagged.forEach((el) => {
        delete el.dataset.reveal;
        delete el.dataset.in;
      });
    };
  }, [pathname]);

  return null;
}
