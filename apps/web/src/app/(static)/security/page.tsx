import Link from 'next/link';

import { StaticPageShell } from '../_components';
import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';

import { SecurityContent } from './_components';

export const metadata = {
  title: 'Security — FinTrack',
  description:
    'Learn exactly how FinTrack accesses, stores, and protects your linked bank account data.',
};

export default function SecurityPage() {
  return (
    <StaticPageShell>
      {/* Page header */}
      <div className="mx-auto mb-12 max-w-[860px] px-4 md:px-6">
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
            <li className="text-text-secondary">Security</li>
          </ol>
        </nav>

        <p className="text-overline text-primary mb-3">Trust &amp; Safety</p>
        <h1 className="font-manrope text-text-primary mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Security
        </h1>
        <p className="text-body-lg text-text-secondary leading-relaxed">
          An explanation of how FinTrack accesses, stores, and protects your bank account data.
        </p>
      </div>

      {/* Divider */}
      <div className="mx-auto mb-12 max-w-[860px] px-4 md:px-6">
        <div className="border-border-light border-t" />
      </div>

      <SecurityContent />
    </StaticPageShell>
  );
}
