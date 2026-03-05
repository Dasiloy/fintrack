import Link from 'next/link';

import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';

import { StaticPageShell } from '../_components';
import { ContactContent } from './_components';

export const metadata = {
  title: 'Contact Us — FinTrack',
  description: "Get in touch with the FinTrack team. We're here to help.",
};

export default function ContactPage() {
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
            <li className="text-text-secondary">Contact</li>
          </ol>
        </nav>

        <p className="text-overline text-primary mb-3">Get in touch</p>
        <h1 className="font-manrope text-text-primary mb-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Contact Us
        </h1>
        <p className="text-body-lg text-text-secondary leading-relaxed">
          Have a question or need help? Choose the option that works best for you and we&apos;ll
          get back to you as soon as possible.
        </p>
      </div>

      {/* Divider */}
      <div className="mx-auto mb-12 max-w-[800px] px-4 md:px-6">
        <div className="border-border-subtle border-t" />
      </div>

      <ContactContent />
    </StaticPageShell>
  );
}
