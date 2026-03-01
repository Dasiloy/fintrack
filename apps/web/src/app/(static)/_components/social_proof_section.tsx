/** Placeholder company logo marks for social proof. Shape varies per brand. */
const LOGOS = [
  { name: 'Acme', shapeClass: 'rounded-full' },
  { name: 'Nexus', shapeClass: 'rotate-45' },
  { name: 'Stark', shapeClass: 'rounded-sm border-2 border-current' },
  { name: 'Bolt', shapeClass: 'rounded-tr-xl rounded-bl-xl' },
] as const;

/**
 * "Trusted by industry leaders" social proof bar.
 * Greyscale by default; reveals colour on section hover.
 */
export function SocialProofSection() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 md:px-6 mb-32 pb-16 border-b border-border-subtle">
      <p className="text-center text-overline text-text-disabled mb-8">
        Trusted by industry leaders
      </p>

      <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale hover:opacity-80 hover:grayscale-0 transition-all duration-smooth">
        {LOGOS.map(({ name, shapeClass }) => (
          <div key={name} className="flex items-center gap-2.5 h-8">
            <div className={`size-5 bg-text-primary ${shapeClass}`} />
            <span className="font-manrope font-bold text-xl text-text-primary">{name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
