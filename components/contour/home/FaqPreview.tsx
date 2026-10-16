"use client";

import { useState } from "react";
import { FAQS } from "@/lib/contour/faq";
import { ROUTES } from "@/lib/contour/site";
import { FaqItem } from "@/components/contour/Accordion";

const FEATURED = FAQS.filter((f) => f.featured);

export function FaqPreview() {
  const [open, setOpen] = useState<string | null>(FEATURED[0]?.id ?? null);
  return (
    <div className="border-b">
      {FEATURED.map((faq) => (
        <FaqItem
          key={faq.id}
          faq={faq}
          open={open === faq.id}
          onToggle={() => setOpen(open === faq.id ? null : faq.id)}
          linkBase={ROUTES.faq}
        />
      ))}
    </div>
  );
}
