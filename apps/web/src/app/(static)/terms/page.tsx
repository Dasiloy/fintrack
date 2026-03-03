import Link from 'next/link';

import { StaticPageShell } from '../_components';
import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';

import { TermsContent } from './_components';
import { LAST_UPDATED, LAST_UPDATED_ISO } from './_data';

export const metadata = {
  title: 'Terms of Service — FinTrack',
  description:
    'Read the Terms of Service governing your access to and use of FinTrack.',
};

export default function TermsPage() {
  return (
    <StaticPageShell>
      {/* Page header */}
      <div className="mx-auto mb-12 max-w-[800px] px-4 md:px-6">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="text-caption text-text-tertiary flex items-center gap-2">
            <li>
              <Link
                href={STATIC_ROUTES.HOME}
                className="hover:text-primary duration-smooth transition-colors"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-text-secondary">Terms of Service</li>
          </ol>
        </nav>

        <p className="text-overline text-primary mb-3">Legal</p>
        <h1 className="font-manrope text-text-primary mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Terms of Service
        </h1>
        <p className="text-body text-text-tertiary mb-6">
          Last updated: <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time>
        </p>
        <p className="text-body-lg text-text-secondary leading-relaxed">
          These Terms govern your access to and use of FinTrack. Please read them carefully — they
          contain important information about your rights and obligations.
        </p>
      </div>

      {/* Divider */}
      <div className="mx-auto mb-12 max-w-[800px] px-4 md:px-6">
        <div className="border-border-subtle border-t" />
      </div>

      <TermsContent />
    </StaticPageShell>
  );
}
