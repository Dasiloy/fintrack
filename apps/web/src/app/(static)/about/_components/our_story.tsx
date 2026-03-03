import { TIMELINE_ENTRIES } from '../_data';

/**
 * "The Story" section — a vertical timeline showing key milestones.
 * The connector line is drawn with an absolutely-positioned pseudo element
 * using a Tailwind border. Each entry alternates icon accent colours via
 * the index to keep the visual rhythm alive without extra data.
 */
export function OurStory() {
  return (
    <section className="mx-auto mb-24 max-w-[800px] px-4 md:px-6">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h2 className="font-manrope text-text-primary mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
          The Story
        </h2>
        <p className="text-body text-text-secondary leading-relaxed">
          From a weekend side project to a product used by thousands — here's how we got here.
        </p>
      </div>

      {/* Timeline */}
      <ol className="relative space-y-0">
        {TIMELINE_ENTRIES.map(({ year, title, description, icon: Icon }, idx) => (
          <li key={year} className="relative flex gap-6 pb-10 last:pb-0">
            {/* Vertical connector — hidden on the last item */}
            {idx < TIMELINE_ENTRIES.length - 1 && (
              <div
                aria-hidden="true"
                className="border-border-subtle absolute top-12 left-6 h-[calc(100%-3rem)] w-px -translate-x-1/2 border-l border-dashed"
              />
            )}

            {/* Icon node */}
            <div className="bg-bg-elevated border-border-subtle text-primary relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full border">
              <Icon size={18} aria-hidden="true" />
            </div>

            {/* Content */}
            <div className="rounded-card bg-bg-elevated border-border-subtle hover:bg-bg-surface-hover border p-6 flex-1 transition-colors duration-smooth">
              <span className="text-overline text-primary mb-1 block">{year}</span>
              <h3 className="text-h4 font-manrope text-text-primary mb-2 font-bold">{title}</h3>
              <p className="text-body-sm text-text-secondary leading-relaxed">{description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
