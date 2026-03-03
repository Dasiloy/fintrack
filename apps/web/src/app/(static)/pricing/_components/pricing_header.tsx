/**
 * Pricing page header — overline, gradient headline, and subtitle.
 * Purely presentational, no state or props needed.
 */
export function PricingHeader() {
  return (
    <section className="mx-auto max-w-[640px] px-4 pb-14 pt-16 text-center md:px-6 md:pt-20">
      <div className="bg-bg-elevated border-border-subtle text-overline text-primary mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1.5">
        Simple Pricing
      </div>

      <h1 className="font-manrope text-text-primary mb-5 text-4xl font-bold tracking-tight sm:text-5xl">
        One plan for starters,{' '}
        <span className="from-primary to-primary/60 bg-linear-to-r bg-clip-text text-transparent">
          one for everything
        </span>
      </h1>

      <p className="text-body-lg text-text-secondary leading-relaxed">
        Start for free with powerful budgeting tools. Upgrade to Pro when you're ready to unlock
        unlimited AI, analytics, and exports — at just $5/month.
      </p>
    </section>
  );
}
