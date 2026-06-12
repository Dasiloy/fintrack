'use client';

import { Check } from 'lucide-react';

const TRIAL_PERKS = [
  'Unlimited AI insights & chat',
  'Unlimited budgets, goals & categories',
  'Unlimited receipt uploads',
  'All-time analytics history',
  'PDF reports & CSV export',
  'Cancel anytime — no charge during the trial',
];

/**
 * Staggered slide-in list of everything PRO unlocks during the trial.
 */
export function TrialPerks() {
  return (
    <>
      <style>{`
        @keyframes _ft-perk-in {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .ft-trial-perk {
          opacity: 0;
          animation: _ft-perk-in 0.4s cubic-bezier(0.22,1,0.36,1) forwards;
        }
      `}</style>
      <ul className="gap-space-2 flex flex-col">
        {TRIAL_PERKS.map((perk, idx) => (
          <li
            key={perk}
            className="ft-trial-perk flex items-start gap-2.5"
            style={{ animationDelay: `${150 + idx * 80}ms` }}
          >
            <Check size={16} className="text-primary mt-0.5 shrink-0" aria-hidden="true" />
            <span className="text-body-sm text-text-secondary">{perk}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
