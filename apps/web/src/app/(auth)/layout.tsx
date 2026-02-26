'use client';

import { usePathname } from 'next/navigation';

import AuthLayout from '@/app/layouts/auth_layout';

const AUTH_PAGE_META: Record<string, { title: string; description: string }> = {
  '/login': { title: 'Welcome Back', description: 'Log in with your Apple or Google account' },
};

export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const meta = AUTH_PAGE_META[pathname ?? ''] ?? { title: undefined, description: undefined };
  return (
    <AuthLayout title={meta.title} description={meta.description}>
      {children}
    </AuthLayout>
  );
}
