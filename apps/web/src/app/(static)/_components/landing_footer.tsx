import Link from 'next/link';
import Image from 'next/image';
import { Twitter, Github } from 'lucide-react';

import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';
import { Logo } from '@/app/_components';

const FOOTER_COLS = [
  {
    heading: 'Product',
    links: [{ label: 'Pricing', href: STATIC_ROUTES.PRICING }],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About', href: STATIC_ROUTES.ABOUT },
      { label: 'Blog', href: STATIC_ROUTES.BLOG },
      { label: 'Terms of Service', href: STATIC_ROUTES.TERMS },
      { label: 'Privacy Policy', href: STATIC_ROUTES.PRIVACY },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Community', href: STATIC_ROUTES.COMMUNITY },
      { label: 'Support Center', href: STATIC_ROUTES.SUPPORT },
      { label: 'Contact', href: STATIC_ROUTES.CONTACT },
    ],
  },
] as const;

/** Landing page footer — brand column + three link columns + copyright bar. */
export function LandingFooter() {
  return (
    <footer className="border-border-subtle bg-bg-deep border-t pt-16 pb-8">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        {/* Columns */}
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo className="mb-space-4" />
            <p className="text-body-sm text-text-tertiary leading-relaxed">
              Empowering your financial freedom through intelligent technology.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map(({ heading, links }) => (
            <div key={heading}>
              <h4 className="text-body text-text-primary mb-4 font-bold">{heading}</h4>
              <ul className="space-y-2.5" role="list">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-body-sm text-text-secondary hover:text-primary duration-smooth transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-border-subtle flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-caption text-text-disabled">
            &copy; {new Date().getFullYear()} FinTrack Inc. All rights reserved.
          </p>

          <div className="flex gap-4">
            <Link
              href="https://x.com/oyewole1998"
              aria-label="Twitter"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-tertiary hover:text-text-primary duration-smooth transition-colors"
            >
              <Twitter size={18} aria-hidden="true" />
            </Link>
            <Link
              href="https://github.com/dasiloy"
              aria-label="GitHub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-tertiary hover:text-text-primary duration-smooth transition-colors"
            >
              <Github size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
