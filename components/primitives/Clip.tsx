"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cx } from "@/lib/utils";

type ClipProps = {
  /** Base path without extension; .webm is offered first, .mp4 as fallback. */
  src: string;
  poster: string;
  /** What the footage shows — read out in place of the video itself. */
  label: string;
  /** "contain" keeps the frame at its own scale; the plate's ink matches the
      footage's background, so the letterboxing is invisible. */
  fit?: "cover" | "contain";
  className?: string;
};

/**
 * A short, silent, looping clip.
 *
 * Plays only while it is on screen, holds a poster frame under reduced motion,
 * and never asks for sound. The footage is illustrative, so it is exposed to
 * assistive technology as a single described image rather than as media the
 * reader is expected to operate.
 */
export function Clip({ src, poster, label, fit = "cover", className }: ClipProps) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const video = ref.current;
    if (!video || reduced) return;

    // Off-screen frames are wasted battery on a page this long.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void video.play().catch(() => {
            /* autoplay can be refused; the poster stands in */
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [reduced]);

  if (reduced) {
    // A poster frame, a few KB, rendered only for readers who asked for less
    // motion — next/image would add a request and a layout wrapper for nothing.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={poster}
        alt={label}
        className={cx(
          "block h-full w-full",
          fit === "contain" ? "object-contain" : "object-cover",
          className,
        )}
      />
    );
  }

  return (
    <video
      ref={ref}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={label}
      role="img"
      className={cx(
        "block h-full w-full",
        fit === "contain" ? "object-contain" : "object-cover",
        className,
      )}
    >
      <source src={`${src}.webm`} type="video/webm" />
      <source src={`${src}.mp4`} type="video/mp4" />
    </video>
  );
}
