'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { useBoolean } from '@ui/hooks';
import { useEffect, useRef, useState } from 'react';
import {
  AUTH_ROUTES,
  DASHBOARD_ROUTES,
  STATIC_ROUTES,
} from '@fintrack/types/constants/routes.constants';
import type { SessionUser } from '@fintrack/types/interfaces/session_user.interface';
import React from 'react';
import { Logo } from '@/app/_components';
import { cn } from '@ui/lib/utils';

const NAV_LINKS = [
  { label: 'Pricing', href: STATIC_ROUTES.PRICING },
  { label: 'About', href: STATIC_ROUTES.ABOUT },
  { label: 'Community', href: STATIC_ROUTES.COMMUNITY },
  { label: 'Support', href: STATIC_ROUTES.SUPPORT },
] as const;

/**
 * Fixed top navigation bar with a glass pill design.
 * Desktop: inline links. Mobile: collapsible dropdown.
 */
const SCROLL_THRESHOLD = 300;

export function LandingNav({ user }: { user: SessionUser }) {
  const [open, setOpen] = useBoolean(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > SCROLL_THRESHOLD && y > lastScrollY.current) {
        setHidden(true);
      } else if (y < lastScrollY.current) {
        setHidden(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={cn(
        'fixed top-0 right-0 left-0 z-50 px-4 pt-4 md:px-6',
        'transition-[opacity,transform] duration-300 ease-in-out',
        hidden ? 'pointer-events-none -translate-y-2 opacity-0' : 'translate-y-0 opacity-100',
      )}
    >
      <div className="mx-auto max-w-[1200px]">
        {/* Pill nav */}
        <div className="glass-card flex items-center justify-between rounded-full px-5 py-3">
          {/* Logo */}
          <Logo />

          {/* Desktop links */}
          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-body text-text-secondary hover:text-text-primary duration-smooth font-medium transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 sm:flex">
              {user ? (
                <Link
                  href={DASHBOARD_ROUTES.DASHBOARD}
                  className="glossy-button text-body text-text-primary shadow-primary/25 inline-flex items-center rounded-full px-5 py-2 font-bold shadow-lg"
                >
                  Dashboard
                </Link>
              ) : (
                <React.Fragment>
                  <Link
                    href={AUTH_ROUTES.LOGIN}
                    className="text-body text-text-primary hover:text-primary duration-smooth hidden font-semibold transition-colors sm:inline-flex"
                  >
                    Login
                  </Link>
                  <Link
                    href={AUTH_ROUTES.SIGNUP}
                    className="glossy-button text-body text-text-primary shadow-primary/25 inline-flex items-center rounded-full px-5 py-2 font-bold shadow-lg"
                  >
                    Get Started
                  </Link>
                </React.Fragment>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              className="text-text-secondary hover:text-text-primary transition-colors md:hidden"
              onClick={() => setOpen.set(!open)}
              aria-label="Toggle navigation menu"
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <div className="glass-card rounded-card mt-2 flex flex-col gap-4 p-5 md:hidden">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setOpen.off()}
                className="text-body text-text-secondary hover:text-text-primary font-medium transition-colors"
              >
                {label}
              </Link>
            ))}
            {user ? (
              <div className="border-border-subtle border-t pt-4">
                <Link
                  href={DASHBOARD_ROUTES.DASHBOARD}
                  onClick={() => setOpen.off()}
                  className="text-body text-text-primary hover:text-primary font-semibold transition-colors"
                >
                  Dashboard
                </Link>
              </div>
            ) : (
              <React.Fragment>
                <div className="border-border-subtle border-t pt-4">
                  <Link
                    href={AUTH_ROUTES.LOGIN}
                    onClick={() => setOpen.off()}
                    className="text-body text-text-primary hover:text-primary font-semibold transition-colors"
                  >
                    Login
                  </Link>
                </div>
                <div className="border-border-subtle border-t pt-4">
                  <Link
                    href={AUTH_ROUTES.SIGNUP}
                    onClick={() => setOpen.off()}
                    className="glossy-button text-body text-text-primary shadow-primary/25 inline-flex items-center rounded-full px-5 py-2 font-bold shadow-lg"
                  >
                    Get Started
                  </Link>
                </div>
              </React.Fragment>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
