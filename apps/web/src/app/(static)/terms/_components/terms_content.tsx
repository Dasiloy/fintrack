import Link from 'next/link';

import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';

import { SECTIONS } from '../_data';

/**
 * Renders the Terms of Service section list and closing footer note.
 * Data is sourced from `_data.ts`; this component handles only layout/markup.
 */
export function TermsContent() {
  return (
    <div className="mx-auto max-w-[800px] px-4 md:px-6">
      <div className="space-y-10">
        {SECTIONS.map(({ id, title, content, items }) => (
          <section key={id} id={id} className="scroll-mt-28">
            <h2 className="font-manrope text-text-primary mb-4 font-bold">{title}</h2>

            {content?.map((paragraph, i) => (
              <p key={i} className="text-body text-text-secondary mb-3 leading-relaxed">
                {paragraph}
              </p>
            ))}

            {items && (
              <ul className="mt-3 space-y-2.5" role="list">
                {items.map((item, i) => (
                  <li
                    key={i}
                    className="text-body text-text-secondary flex items-start gap-3 leading-relaxed"
                  >
                    <span
                      aria-hidden="true"
                      className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {/* Footer note */}
      <div className="glass-card rounded-card border-border-subtle mt-16 mb-8 border p-6">
        <p className="text-body-sm text-text-secondary leading-relaxed">
          By using FinTrack you confirm you have read, understood, and agree to these Terms of
          Service. For our data practices, see the{' '}
          <Link
            href={STATIC_ROUTES.PRIVACY}
            className="text-primary hover:text-primary-light underline underline-offset-2 transition-colors"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
