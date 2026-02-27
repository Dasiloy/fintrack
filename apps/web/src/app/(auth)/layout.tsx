'use client';

import { usePathname } from 'next/navigation';

import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';

import AuthLayout from '@/app/layouts/auth_layout';

const AUTH_PAGE_META: Record<string, { title: string; description: string; withFooter?: boolean }> =
  {
    [AUTH_ROUTES.LOGIN]: {
      title: 'Welcome Back',
      description: 'Log in with your Apple or Google account',
    },
    [AUTH_ROUTES.SIGNUP]: {
      title: 'Create an Account',
      description: 'Sign up with your email and password',
    },
    [AUTH_ROUTES.FORGOT_PASSWORD]: {
      title: 'Forgot Password',
      withFooter: false,
      description: 'Enter your email to receive otp code to reset your password',
    },
    [AUTH_ROUTES.RESET_PASSWORD]: {
      title: 'Reset Password',
      withFooter: false,
      description: 'Enter your new password',
    },
    [AUTH_ROUTES.VERIFY_EMAIL]: {
      title: 'Verify Email',
      withFooter: false,
      description: 'Enter the OTP code sent to your email',
    },
  };

export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const meta = AUTH_PAGE_META[pathname ?? ''] ?? {
    title: undefined,
    description: undefined,
    withFooter: true,
  };
  return (
    <AuthLayout title={meta.title} description={meta.description} withFooter={meta.withFooter}>
      {children}
    </AuthLayout>
  );
}
