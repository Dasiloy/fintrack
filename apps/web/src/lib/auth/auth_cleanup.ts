'use client';

import {
  signOut,
  type SignOutParams,
} from 'next-auth/react';

import { clearAdvisorBrowserStorage } from '@/lib/advisor/advisor_storage';

export function clearClientStateForAuthChange(): void {
  clearAdvisorBrowserStorage();
}

export function signOutAndClearClientState(
  options?: SignOutParams<true>,
): ReturnType<typeof signOut> {
  clearClientStateForAuthChange();
  return signOut(options);
}
