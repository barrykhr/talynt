import { Fragment, type CSSProperties } from "react";
import { MOTION } from "@/lib/contour/variant";

/**
 * A line of text whose words light up one by one as it scrolls into view
 * (motion.css, `.ct-w`). `from` is the index of the first word within the
 * whole line, so a line set in several pieces counts through once; the parent
 * carries the total as `--n` (see `wordCount`).
 *
 * Without the motion layer it returns the text untouched, so the default build
 * renders exactly as before.
 */
export function Words({ text, from = 0 }: { text: string; from?: number }) {
  if (!MOTION) return <>{text}</>;
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="ct-w" style={{ "--i": from + i } as CSSProperties}>
            {w}
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </>
  );
}

export const wordCount = (...parts: string[]) => parts.join(" ").split(" ").length;

/** The `--n` a parent of <Words> needs, or nothing in the default build. */
export const wordsStyle = (...parts: string[]): CSSProperties | undefined =>
  MOTION ? ({ "--n": wordCount(...parts) } as CSSProperties) : undefined;
