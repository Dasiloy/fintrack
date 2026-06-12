'use client';

import { useEffect } from 'react';
import { useRouter } from '@bprogress/next';
import { ONBOARDING_ROUTES } from '@fintrack/types/constants/routes.constants';

import { TRIAL_PROMPT_SEEN_KEY } from '@/constants/trial.constants';

interface TrialRedirectProps {
  /**
   * True only when this session created a brand-new account on social sign-in
   * AND the email has never used the trial (backend sets both conditions together).
   */
  isNewUser: boolean;
  /** Mirrors the backend trial guard — true if this email already claimed the trial */
  trialUsed: boolean;
}

/**
 * One-time redirect to the trial opt-in page for brand-new social-login users
 * who have never used the trial. The localStorage flag (set by the trial page
 * itself on mount) guarantees the page never reappears within the same browser.
 */
export function TrialRedirect({ isNewUser, trialUsed }: TrialRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    if (!isNewUser || trialUsed) return;
    if (localStorage.getItem(TRIAL_PROMPT_SEEN_KEY)) return;
    router.replace(ONBOARDING_ROUTES.TRIAL);
  }, [isNewUser, trialUsed, router]);

  return null;
}
