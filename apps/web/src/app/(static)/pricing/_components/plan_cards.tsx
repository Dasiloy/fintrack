'use client';
import { Check, X, Sparkles } from 'lucide-react';

import { cn } from '@ui/lib/utils';
import { PRICING_PLANS } from '../_data';
import { useRouter } from '@bprogress/next';
import type { Session } from 'next-auth';
import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';
import { api_client } from '@/lib/trpc_app/api_client';
import { Button, toast } from '@ui/components';

interface PlanCardsProps {
  session: Session | null;
}

/**
 * Side-by-side plan cards (Free & Pro).
 * Animates in with a staggered slide-up via an inline keyframe style block.
 */

export function PlanCards({ session }: PlanCardsProps) {
  const router = useRouter();

  // mutation
  const subscribe = api_client.subscription.createSubscription.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        router.push(data.data!.checkoutSessionUrl!);
      }
    },
    onError: (error) => {
      console.error(error);
      toast.error('Error', {
        description: error.message,
      });
    },
  });
  return (
    <section className="mx-auto max-w-[900px] px-4 pb-16 md:px-6">
      <style>{`
        @keyframes _ft-plan-up {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ft-plan-card {
          opacity: 0;
          animation: _ft-plan-up 0.55s cubic-bezier(0.22,1,0.36,1) forwards;
        }
      `}</style>

      <div className="grid gap-6 sm:grid-cols-2">
        {PRICING_PLANS.map((plan, idx) => (
          <div
            key={plan.key}
            className={cn(
              'ft-plan-card rounded-card duration-smooth flex flex-col border p-7 transition-all',
              plan.popular
                ? 'bg-bg-elevated border-primary/40 relative overflow-hidden shadow-[0_0_40px_rgba(124,122,255,0.14)]'
                : 'bg-bg-elevated border-border-subtle',
            )}
            style={{ animationDelay: `${idx * 120}ms` }}
          >
            {/* Popular glow backdrop */}
            {plan.popular && (
              <div
                aria-hidden="true"
                className="from-primary/8 pointer-events-none absolute inset-0 bg-linear-to-br to-transparent"
              />
            )}

            <div className="relative z-10 flex flex-1 flex-col">
              {/* Badge */}
              {plan.badge && (
                <span className="bg-primary/15 text-primary mb-4 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase">
                  <Sparkles size={11} aria-hidden="true" />
                  {plan.badge}
                </span>
              )}

              {/* Plan name + price */}
              <div className="mb-2 flex items-end gap-1">
                <span className="font-manrope text-text-primary text-4xl leading-none font-bold">
                  {plan.price === 0 ? 'Free' : `$${plan.price}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-body text-text-tertiary mb-0.5">{plan.period}</span>
                )}
              </div>

              <p className="text-body-sm text-text-tertiary mb-6 leading-relaxed">{plan.tagline}</p>

              {/* Feature list */}
              <ul className="mb-8 flex flex-1 flex-col gap-2.5">
                {plan.highlights.map((feat) => (
                  <li key={feat.label} className="flex items-start gap-2.5">
                    {feat.included ? (
                      <Check
                        size={16}
                        className="text-primary mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <X
                        size={16}
                        className="text-text-disabled mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <span
                      className={cn(
                        'text-body-sm',
                        feat.included ? 'text-text-secondary' : 'text-text-disabled line-through',
                      )}
                    >
                      {feat.label}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                type="button"
                variant={plan.popular ? 'default' : 'outline'}
                disabled={subscribe.isPending}
                loading={subscribe.isPending}
                onClick={() => {
                  if (plan.price === 0 || !session || !session.user) {
                    void router.push(AUTH_ROUTES.SIGNUP);
                    return;
                  }
                  subscribe.mutate();
                }}
              >
                {plan.ctaLabel}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
