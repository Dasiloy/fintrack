import '@/styles/globals.css';

import { type Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';

import AppProviver from '@/app/providers/app_provider';
import { TRPCReactProvider as TRPCAppProvider } from '@/lib/trpc_app/client';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fintrack.app';

export const metadata: Metadata = {
  title: 'Fintrack',
  description: 'Financial and budgeting tool. Experience AI automated budgeting.',
  metadataBase: new URL(siteUrl),

  // --- Favicon & app icons
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },

  // --- Open Graph (social / link previews) ---
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Fintrack',
    title: 'Fintrack',
    description: 'Financial and budgeting tool. Experience AI automated budgeting.',
    images: [{ url: '/logo-icon-base.png', width: 1024, height: 1024, alt: 'Fintrack' }],
  },

  // --- Twitter Card ---
  twitter: {
    card: 'summary_large_image',
    title: 'Fintrack',
    description: 'Financial and budgeting tool. Experience AI automated budgeting.',
    images: ['/logo-icon-base.png'],
  },

  // --- PWA / manifest (optional) ---
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Fintrack',
  },
};

const inetr = Inter({
  subsets: ['latin'],
  variable: '--ft-font-inter',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--ft-font-manrope',
  display: 'swap',
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inetr.variable} ${manrope.variable}`}>
      <body>
        <TRPCAppProvider>
          <AppProviver>{children}</AppProviver>
        </TRPCAppProvider>
      </body>
    </html>
  );
}

/**
 * password input
 * understanding field compoennst
 * dashboard layout
 */
