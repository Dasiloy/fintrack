'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home } from 'lucide-react';

import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';
import { Logo } from '@/app/_components';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Root error boundary — catches unhandled runtime errors in the app shell.
 * Must be a Client Component (Next.js requirement).
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to your error reporting service here if needed
    console.error('[ErrorBoundary]', error);
  }, [error]);

  return (
    <div className="bg-bg-deep text-text-primary selection:bg-primary/30 relative flex min-h-screen flex-col overflow-hidden">
      {/* Ambient blobs */}
      <div
        aria-hidden="true"
        className="bg-primary/20 animate-landing-float pointer-events-none fixed top-[-20%] left-[-10%] z-0 h-[50vw] w-[50vw] rounded-full blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="bg-primary/10 animate-landing-float-delayed pointer-events-none fixed right-[-10%] bottom-[-10%] z-0 h-[40vw] w-[40vw] rounded-full blur-[100px]"
      />

      {/* Minimal nav */}
      <header className="relative z-10 px-6 pt-6">
        <Logo />
      </header>

      {/* Content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">
        {/* Big 500 */}
        <p className="font-manrope from-primary/60 to-primary/10 mb-4 select-none bg-linear-to-b bg-clip-text text-[clamp(7rem,20vw,14rem)] font-black leading-none text-transparent">
          500
        </p>

        <h1 className="font-manrope text-text-primary mb-4 text-2xl font-bold sm:text-3xl">
          Something went wrong
        </h1>

        <p className="text-body text-text-secondary mb-3 max-w-md leading-relaxed">
          An unexpected error occurred. Our team has been notified. You can try again or return
          to the home page.
        </p>

        {/* Show digest in production, full message in dev */}
        {(error.digest ?? (process.env.NODE_ENV === 'development' && error.message)) && (
          <p className="text-caption text-text-disabled bg-bg-elevated border-border-subtle mb-8 rounded-lg border px-4 py-2 font-mono">
            {process.env.NODE_ENV === 'development' ? error.message : `Error ID: ${error.digest}`}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={reset}
            className="glossy-button rounded-button text-body text-text-primary shadow-glow inline-flex items-center gap-2 px-6 py-2.5 font-bold"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Try again
          </button>
          <Link
            href={STATIC_ROUTES.HOME}
            className="rounded-button border-border-light text-text-secondary hover:text-text-primary hover:border-primary/40 text-body inline-flex items-center gap-2 border px-6 py-2.5 font-semibold transition-colors duration-smooth"
          >
            <Home size={16} aria-hidden="true" />
            Go home
          </Link>
        </div>
      </main>

      {/* Footer note */}
      <footer className="relative z-10 px-6 pb-8 text-center">
        <p className="text-caption text-text-disabled">
          Still stuck?{' '}
          <Link
            href={STATIC_ROUTES.SUPPORT}
            className="text-primary underline underline-offset-2 transition-opacity hover:opacity-75"
          >
            Contact support
          </Link>
        </p>
      </footer>
    </div>
  );
}
