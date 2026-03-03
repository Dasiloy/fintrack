import { PHILOSOPHY_CARDS } from '../_data';

/**
 * "Design Philosophy" section — three philosophy cards in a responsive grid.
 * Cards lift on hover; icon box scales to reinforce interactivity.
 */
export function DesignPhilosophy() {
  return (
    <section className="relative mx-auto mb-24 max-w-[1200px] px-4 md:px-6">
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="bg-primary/5 pointer-events-none absolute top-1/2 left-1/2 -z-10 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
      />

      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h2 className="font-manrope text-text-primary mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Design Philosophy
        </h2>
        <p className="text-body text-text-secondary leading-relaxed">
          Every decision we make is guided by three principles that shape how FinTrack looks, feels,
          and works.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {PHILOSOPHY_CARDS.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="group rounded-card bg-bg-elevated border-border-subtle hover:bg-bg-surface-hover hover:border-border-light border p-8 transition-all duration-smooth"
          >
            {/* Icon */}
            <div className="bg-primary/10 text-primary rounded-button mb-5 flex size-12 items-center justify-center group-hover:scale-110 transition-transform duration-smooth">
              <Icon size={22} aria-hidden="true" />
            </div>

            <h3 className="text-h4 font-manrope text-text-primary mb-3 font-bold">{title}</h3>
            <p className="text-body-sm text-text-secondary leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
