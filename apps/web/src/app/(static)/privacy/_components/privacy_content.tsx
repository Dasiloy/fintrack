import Link from 'next/link';

import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';

import { SECTIONS } from '../_data';

/**
 * Renders the Privacy Policy section list and closing footer note.
 * Data is sourced from `_data.ts`; this component handles only layout/markup.
 */
export function PrivacyContent() {
  return (
    <div className="mx-auto max-w-[800px] px-4 md:px-6">
      <div className="space-y-10">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-28">
            <h2 className="font-manrope text-text-primary mb-4 font-bold">{section.title}</h2>

            {section.content?.map((paragraph, i) => (
              <p key={i} className="text-body text-text-secondary mb-3 leading-relaxed">
                {paragraph}
              </p>
            ))}

            {section.subsections?.map(({ heading, items }) => (
              <div key={heading} className="mb-5">
                <p className="text-body text-text-primary mb-2 font-semibold">{heading}</p>
                <ul className="space-y-2" role="list">
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
              </div>
            ))}

            {section.items && (
              <ul className="mt-3 space-y-2.5" role="list">
                {section.items.map((item, i) => (
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

            {section.footer && (
              <p className="text-body-sm text-text-tertiary mt-4 leading-relaxed italic">
                {section.footer}
              </p>
            )}

            {section.contactBlock && (
              <div className="glass-card rounded-card border-border-subtle mt-4 inline-block border p-5">
                <p className="text-body text-text-secondary">
                  Email:{' '}
                  <Link
                    target="_blank"
                    rel="noopener noreferrer"
                    href={`mailto:${section.contactBlock.email}`}
                    className="text-primary hover:text-primary-light underline underline-offset-2 transition-colors"
                  >
                    {section.contactBlock.email}
                  </Link>
                </p>
                <p className="text-body-sm text-text-tertiary mt-2">{section.contactBlock.note}</p>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* Footer note */}
      <div className="glass-card rounded-card border-border-subtle mt-16 mb-8 border p-6">
        <p className="text-body-sm text-text-secondary leading-relaxed">
          This Privacy Policy applies alongside our{' '}
          <Link
            href={STATIC_ROUTES.TERMS}
            className="text-primary hover:text-primary-light underline underline-offset-2 transition-colors"
          >
            Terms of Service
          </Link>
          . Together, these documents govern your relationship with FinTrack.
        </p>
      </div>
    </div>
  );
}
