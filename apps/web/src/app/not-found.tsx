import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';
import { Logo } from '@/app/_components';

export default function NotFound() {
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
        {/* Big 404 */}
        <p className="font-manrope from-primary/60 to-primary/10 mb-4 bg-linear-to-b bg-clip-text text-[clamp(7rem,20vw,14rem)] leading-none font-black text-transparent select-none">
          404
        </p>

        <h1 className="font-manrope text-text-primary mb-4 text-2xl font-bold sm:text-3xl">
          Page not found
        </h1>

        <p className="text-body text-text-secondary mb-10 max-w-md leading-relaxed">
          The page you're looking for doesn't exist or has been moved. Kindly Check the URL.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={STATIC_ROUTES.HOME}
            className="glossy-button rounded-button text-body text-text-primary shadow-glow inline-flex items-center gap-2 px-6 py-2.5 font-bold"
          >
            <Home size={16} aria-hidden="true" />
            Go home
          </Link>
        </div>
      </main>

      {/* Footer note */}
      <footer className="relative z-10 px-6 pb-8 text-center">
        <p className="text-caption text-text-disabled">
          Lost?{' '}
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
