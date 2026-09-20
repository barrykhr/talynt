import { Reveal } from "./Reveal";

/** Shared masthead for the editorial sub-pages. */
export function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: string;
}) {
  return (
    <header className="wrap pt-40 pb-16 md:pt-52 md:pb-24">
      <Reveal className="mb-9 flex items-baseline gap-4">
        <span className="mono-micro text-signal">—</span>
        <span className="mono-micro text-fg-50">{eyebrow}</span>
      </Reveal>
      <Reveal delay={0.05}>
        <h1 className="display max-w-4xl text-(length:--text-h1) text-balance">
          {title}
        </h1>
      </Reveal>
      {lede && (
        <Reveal delay={0.12}>
          <p className="mt-8 max-w-2xl text-(length:--text-lede) leading-[1.45] text-fg-60">
            {lede}
          </p>
        </Reveal>
      )}
    </header>
  );
}
