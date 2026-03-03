import Link from 'next/link';

import { StaticPageShell } from '../_components';
import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';

import { PrivacyContent } from './_components';
import { LAST_UPDATED, LAST_UPDATED_ISO } from './_data';

export const metadata = {
  title: 'Privacy Policy — FinTrack',
  description: 'Learn how FinTrack collects, uses, and protects your personal data.',
};

export default function PrivacyPage() {
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
            <li className="text-text-secondary">Privacy Policy</li>
          </ol>
        </nav>

        <p className="text-overline text-primary mb-3">Legal</p>
        <h1 className="font-manrope text-text-primary mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Privacy Policy
        </h1>
        <p className="text-body text-text-tertiary mb-6">
          Last updated: <time dateTime={LAST_UPDATED_ISO}>{LAST_UPDATED}</time>
        </p>
        <p className="text-body-lg text-text-secondary leading-relaxed">
          At FinTrack, your privacy matters. This policy explains what data we collect, why we
          collect it, and how we protect and use it.
        </p>
      </div>

      {/* Divider */}
      <div className="mx-auto mb-12 max-w-[800px] px-4 md:px-6">
        <div className="border-border-subtle border-t" />
      </div>

      <PrivacyContent />
    </StaticPageShell>
  );
}
