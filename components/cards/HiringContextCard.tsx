import { cx } from "@/lib/utils";

export type ContextCardProps = {
  index: string;
  label: string;
  question: string;
  detail: string;
  className?: string;
};

/** One layer of the hiring context. The question is the product. */
export function HiringContextCard({
  index,
  label,
  question,
  detail,
  className,
}: ContextCardProps) {
  return (
    <article
      className={cx(
        "group relative flex h-full flex-col rounded-md border border-current/12 p-6 transition-colors duration-500 hover:border-signal/45",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="mono-micro opacity-45">{label}</span>
        <span className="mono-micro text-signal tabular-nums opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          {index}
        </span>
      </div>
      <p className="mt-6 text-[1.02rem] leading-[1.45]">{question}</p>
      <p className="mt-4 text-[0.86rem] leading-[1.6] opacity-55">{detail}</p>
    </article>
  );
}
