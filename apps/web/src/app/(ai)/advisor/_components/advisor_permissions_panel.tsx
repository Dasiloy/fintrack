'use client';

// ── AdvisorPermissionsPanel ───────────────────────────────────────────────────
// Consent controls for the AI advisor. One row per data scope with a Switch,
// reflecting AdvisorSetting.grantedScopes (the single source of truth) via the
// advisor.getScopes / advisor.updateScopes tRPC procedures. Toggling is
// optimistic and rolls back on error.

import * as React from 'react';
import {
  ShieldCheck,
  ChevronDown,
  Receipt,
  PieChart,
  Target,
  Repeat,
  Users,
  BarChart3,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Switch, Skeleton, toast } from '@ui/components';
import { cn } from '@ui/lib/utils';
import { api_client } from '@/lib/trpc_app/api_client';
import type { AdvisorScope } from '@fintrack/types/interfaces/ai';

// Display metadata per scope. Order here is the order shown in the panel.
const SCOPE_ROWS: {
  scope: AdvisorScope;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    scope: 'ANALYTICS',
    label: 'Balance & analytics',
    description: 'Income, spending, savings rate, and net balance.',
    icon: BarChart3,
  },
  {
    scope: 'TRANSACTIONS',
    label: 'Transactions',
    description: 'Spending history and category breakdowns.',
    icon: Receipt,
  },
  {
    scope: 'BUDGETS',
    label: 'Budgets',
    description: 'Your budgets and how close you are to each limit.',
    icon: PieChart,
  },
  {
    scope: 'GOALS',
    label: 'Goals',
    description: 'Savings goals and whether you are on pace.',
    icon: Target,
  },
  {
    scope: 'RECURRING',
    label: 'Recurring bills',
    description: 'Upcoming bills and subscriptions.',
    icon: Repeat,
  },
  {
    scope: 'SPLITS',
    label: 'Shared expenses',
    description: 'Shared bills and who owes what.',
    icon: Users,
  },
];

export function AdvisorPermissionsPanel() {
  const [expanded, setExpanded] = React.useState(true);
  const utils = api_client.useUtils();

  const { data, isLoading } = api_client.advisor.getScopes.useQuery(undefined, {
    staleTime: 60_000,
  });

  const grantedScopes = React.useMemo(
    () => data?.data?.grantedScopes ?? [],
    [data],
  );
  const granted = React.useMemo(() => new Set(grantedScopes), [grantedScopes]);

  const { mutate, isPending } = api_client.advisor.updateScopes.useMutation({
    // Optimistically reflect the toggle, rolling back if the request fails.
    onMutate: async (vars) => {
      await utils.advisor.getScopes.cancel();
      const prev = utils.advisor.getScopes.getData();
      if (prev?.data && vars.grantedScopes) {
        utils.advisor.getScopes.setData(undefined, {
          ...prev,
          data: { ...prev.data, grantedScopes: vars.grantedScopes },
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.advisor.getScopes.setData(undefined, ctx.prev);
      toast.error('Could not update advisor permissions');
    },
    onSettled: () => {
      void utils.advisor.getScopes.invalidate();
    },
  });

  const toggleScope = (scope: AdvisorScope, on: boolean) => {
    const next = on
      ? Array.from(new Set([...grantedScopes, scope]))
      : grantedScopes.filter((s) => s !== scope);
    mutate({ grantedScopes: next });
  };

  return (
    <div className="border-b border-border-subtle">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-bg-surface-hover"
        aria-expanded={expanded}
      >
        <ShieldCheck className="size-3.5 shrink-0 text-text-tertiary" aria-hidden />
        <span className="flex-1 text-[12px] font-semibold text-text-primary">
          Advisor Permissions
        </span>
        <ChevronDown
          className={cn(
            'size-3.5 text-text-tertiary transition-transform duration-200',
            expanded && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {expanded && (
        <div className="flex flex-col gap-1 px-4 pb-4">
          <p className="mb-1 text-[11px] leading-relaxed text-text-tertiary">
            Choose what your advisor can look at. Turn anything off and it simply
            won&apos;t use that data.
          </p>

          {isLoading ? (
            <>
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </>
          ) : (
            SCOPE_ROWS.map(({ scope, label, description, icon: Icon }) => (
              <div
                key={scope}
                className="flex items-center gap-3 rounded-lg bg-bg-elevated px-3 py-2.5"
              >
                <Icon className="size-4 shrink-0 text-text-tertiary" aria-hidden />
                <div className="flex flex-1 flex-col">
                  <span className="text-[12px] font-medium text-text-primary">
                    {label}
                  </span>
                  <span className="text-[10px] leading-snug text-text-disabled">
                    {description}
                  </span>
                </div>
                <Switch
                  checked={granted.has(scope)}
                  disabled={isPending}
                  onCheckedChange={(on) => toggleScope(scope, on)}
                  aria-label={`Allow advisor to access ${label}`}
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
