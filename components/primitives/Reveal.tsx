"use client";

import { motion } from "framer-motion";
import { revealVariants, VIEWPORT_EARLY } from "@/lib/motion";
import type { ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "span";
};

/** One reveal rule for the whole site: rise 22px, settle, stop. */
export function Reveal({ children, delay = 0, className, as = "div" }: RevealProps) {
  const Component = motion[as];
  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_EARLY}
      variants={revealVariants}
      transition={{ delay }}
    >
      {children}
    </Component>
  );
}
