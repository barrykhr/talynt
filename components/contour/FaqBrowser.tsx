"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, FAQS } from "@/lib/contour/faq";
import { ROUTES } from "@/lib/contour/site";
import { FaqItem } from "./Accordion";

/**
 * Every question, searchable, grouped, and individually linkable. A link to
 * /faq#question-id opens that answer and scrolls to it.
 */
export function FaqBrowser() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());

  // Open whatever the URL points at — on arrival and on in-page hash links.
  useEffect(() => {
    const sync = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id || !FAQS.some((f) => f.id === id)) return;
      setOpen((prev) => new Set(prev).add(id));
      window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      q
        ? FAQS.filter((f) => [f.question, ...f.answer].join(" ").toLowerCase().includes(q))
        : FAQS,
    [q],
  );

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allOpen = visible.length > 0 && visible.every((f) => open.has(f.id));

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
      <section className="lg:col-span-3" aria-label="FAQ categories and search">
        <div className="flex flex-col gap-6 lg:sticky lg:top-[calc(var(--ct-nav-h)+1.5rem)]">
          <div>
            <label htmlFor="faq-search" className="ct-meta ct-mute">
              Search the questions
            </label>
            <input
              id="faq-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try “account”, “privacy”, “score”"
              className="ct-input mt-2"
              autoComplete="off"
            />
            <p className="ct-meta ct-mute mt-2" role="status" aria-live="polite">
              {q ? `${visible.length} of ${FAQS.length} questions` : `${FAQS.length} questions`}
            </p>
          </div>
          <nav aria-label="Categories">
            <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-0">
              {CATEGORIES.map((c) => {
                const count = visible.filter((f) => f.category === c.id).length;
                return (
                  <li key={c.id}>
                    <a
                      href={`#cat-${c.id}`}
                      className="ct-tag min-h-9 lg:flex lg:min-h-10 lg:justify-between lg:rounded-none lg:border-x-0 lg:border-t-0 lg:bg-transparent lg:px-0 lg:text-[0.88rem] lg:tracking-normal lg:normal-case"
                    >
                      {c.label}
                      <span className="ct-mute tabular-nums">{count}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
          <button
            type="button"
            onClick={() => setOpen(allOpen ? new Set() : new Set(visible.map((f) => f.id)))}
            className="ct-btn ct-btn-quiet w-fit text-[0.9rem] text-[var(--ct-green)]"
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        </div>
      </section>

      <div className="lg:col-span-8 lg:col-start-5">
        {visible.length === 0 ? (
          <div className="ct-panel p-7">
            <p className="ct-display ct-s">No question matches “{query}”.</p>
            <p className="ct-body mt-3">
              Ask us directly — a person replies.{" "}
              <Link href={ROUTES.contact} className="ct-link">
                Contact
              </Link>
            </p>
          </div>
        ) : (
          CATEGORIES.map((c) => {
            const items = visible.filter((f) => f.category === c.id);
            if (!items.length) return null;
            return (
              <section key={c.id} id={`cat-${c.id}`} aria-labelledby={`cat-${c.id}-h`} className="scroll-mt-[calc(var(--ct-nav-h)+1.5rem)] pb-12">
                <h2 id={`cat-${c.id}-h`} className="ct-display ct-m pb-4">
                  {c.label}
                </h2>
                <div className="border-b">
                  {items.map((f) => (
                    <FaqItem key={f.id} faq={f} open={open.has(f.id)} onToggle={() => toggle(f.id)} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
