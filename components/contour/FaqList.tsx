"use client";

import { useState } from "react";
import { FAQS, type CategoryId } from "@/lib/contour/faq";
import { ROUTES } from "@/lib/contour/site";
import { FaqItem } from "@/components/contour/Accordion";

/** The questions for one audience, as an accordion. Each links to its full entry on the FAQ page. */
export function FaqList({ categories, limit }: { categories: CategoryId[]; limit?: number }) {
  const items = FAQS.filter((f) => categories.includes(f.category)).slice(0, limit);
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  return (
    <div className="border-b">
      {items.map((faq) => (
        <FaqItem key={faq.id} faq={faq} open={open === faq.id} onToggle={() => setOpen(open === faq.id ? null : faq.id)} linkBase={ROUTES.faq} />
      ))}
    </div>
  );
}
