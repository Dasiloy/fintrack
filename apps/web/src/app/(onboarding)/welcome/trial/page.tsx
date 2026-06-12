'use client';

import { Card, CardContent, Text } from '@ui/components';

import { Logo } from '@/app/_components';

import { TrialBadge } from './_components/trial_badge';
import { TrialPerks } from './_components/trial_perks';
import { TrialActions } from './_components/trial_actions';

export default function TrialOptInPage() {
  return (
    <div className="bg-bg-deep gap-space-6 p-space-6 md:p-space-10 flex min-h-svh flex-col items-center justify-center">
      <style>{`
        @keyframes _ft-trial-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ft-trial-card {
          opacity: 0;
          animation: _ft-trial-up 0.55s cubic-bezier(0.22,1,0.36,1) forwards;
        }
      `}</style>

      <div className="gap-space-6 flex w-full max-w-md flex-col">
        <Logo className="mx-auto" />

        <Card variant="elevated" className="ft-trial-card relative overflow-hidden">
          <div
            aria-hidden="true"
            className="from-primary/8 pointer-events-none absolute inset-0 bg-linear-to-br to-transparent"
          />
          <CardContent className="gap-space-5 relative z-10 flex flex-col">
            <TrialBadge />

            <div className="gap-space-2 flex flex-col">
              <Text as="h1" variant="h3" color="primary" className="font-bold">
                Try PRO free for 2 months
              </Text>
              <Text variant="body-sm" color="secondary" className="leading-relaxed">
                We&apos;re rolling out Fintrack PRO — early members get 2 months completely free.
                Add a card to start; you won&apos;t be charged until your trial ends.
              </Text>
            </div>

            <TrialPerks />

            <TrialActions />

            <Text variant="caption" color="tertiary" className="text-center leading-relaxed">
              Card verification uses a ₦50 charge that is refunded automatically. Cancel anytime
              from your billing settings.
            </Text>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
