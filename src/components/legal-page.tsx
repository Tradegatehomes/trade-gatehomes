import type { ReactNode } from "react";

export function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-cream/40">
      <section className="border-b border-border/70 bg-card">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{intro}</p>
          <p className="mt-4 text-xs text-muted-foreground">Last updated: 19 October 2026</p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <article className="space-y-8 rounded-3xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
          {children}
        </article>
      </div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}
