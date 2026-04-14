'use client';

import * as React from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@ui/lib/utils/cn';
import { api_client } from '@/lib/trpc_app/api_client';
import { useBanks } from '@/hooks/use_banks';
import Image from 'next/image';

// ---------------------------------------------------------------------------
// FilterSection — labelled wrapper for a group of controls
// ---------------------------------------------------------------------------

export function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-text-disabled mb-2.5 text-[10px] font-semibold tracking-widest uppercase">
        {label}
      </p>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FilterToggleGroup — pill toggles (e.g. INCOME / EXPENSE)
// ---------------------------------------------------------------------------

export interface ToggleOption<V extends string> {
  value: V;
  label: string;
  activeClassName?: string; // override the active colour
}

interface FilterToggleGroupProps<V extends string> {
  options: ToggleOption<V>[];
  value: V[];
  onChange: (value: V[]) => void;
}

export function FilterToggleGroup<V extends string>({
  options,
  value,
  onChange,
}: FilterToggleGroupProps<V>) {
  const toggle = (v: V) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const active = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={cn(
              'flex-1 cursor-pointer rounded-md border py-2 text-[12px] font-medium transition-all duration-150',
              active
                ? (opt.activeClassName ?? 'bg-primary/10 border-primary/25 text-primary')
                : 'border-border-subtle text-text-secondary hover:border-border-light hover:text-text-primary',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FilterChipList — vertical list with active chip indicator (e.g. sources)
// ---------------------------------------------------------------------------

export interface ChipOption {
  value: string;
  label: string;
}

interface FilterChipListProps {
  options: ChipOption[];
  value: string[];
  onChange: (value: string[]) => void;
}

export function FilterChipList({ options, value, onChange }: FilterChipListProps) {
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  return (
    <div className="space-y-0.5">
      {options.map((opt) => {
        const active = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={cn(
              'flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-[12px] transition-all duration-150',
              active
                ? 'bg-primary/8 text-primary'
                : 'text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary',
            )}
          >
            <span>{opt.label}</span>
            {active && (
              <span className="bg-primary flex size-3.5 shrink-0 items-center justify-center rounded-full">
                <X className="size-2 text-white" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FilterTextInput — collapsible labelled text input
// ---------------------------------------------------------------------------

interface FilterTextInputProps {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

export function FilterTextInput({ label, value, placeholder, onChange }: FilterTextInputProps) {
  const [open, setOpen] = React.useState(!!value);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-2.5 flex w-full items-center justify-between py-0.5"
      >
        <span className="text-text-disabled text-[10px] font-semibold tracking-widest uppercase">
          {label}
        </span>
        <ChevronDown
          className={cn(
            'text-text-disabled size-3 transition-transform duration-150',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="relative mt-0.5">
          <input
            type="text"
            autoFocus
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              'border-border-subtle bg-bg-surface w-full rounded-md border',
              'text-text-primary placeholder:text-text-disabled px-3 py-2 text-[12px]',
              'focus:border-primary/40 transition-colors focus:outline-none',
            )}
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-text-disabled hover:text-text-primary absolute top-1/2 right-2.5 -translate-y-1/2 transition-colors"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FilterAccountList — linked bank account selector (single-select)
// ---------------------------------------------------------------------------

interface FilterAccountListProps {
  value: string;
  onChange: (accountId: string) => void;
  /** Only renders when the sheet is open to avoid redundant fetches */
  enabled?: boolean;
}

export function FilterAccountList({ value, onChange, enabled = true }: FilterAccountListProps) {
  const { getBank } = useBanks();
  const { data } = api_client.account.getLinkedAccounts.useQuery(undefined, { enabled });
  const accounts = data?.data ?? [];

  if (accounts.length === 0) return null;

  const toggle = (id: string) => onChange(value === id ? '' : id);

  return (
    <FilterSection label="Bank Account">
      <div className="space-y-1.5">
        {accounts.map((acc) => {
          const active = value === acc.id;
          const logo = getBank(acc.bankId)?.logo;
          return (
            <button
              key={acc.id}
              type="button"
              onClick={() => toggle(acc.id!)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all duration-150',
                active
                  ? 'border-primary/30 bg-primary/6'
                  : 'border-border-subtle hover:border-border-light hover:bg-bg-surface-hover/50',
              )}
            >
              {logo ? (
                <Image
                  src={logo}
                  alt={acc.bankName}
                  width={40}
                  height={40}
                  className="rounded-full object-contain"
                />
              ) : (
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold',
                    active
                      ? 'bg-primary/15 text-primary'
                      : 'bg-bg-surface-hover text-text-secondary',
                  )}
                >
                  {(acc.bankName ?? 'B')[0]}
                </span>
              )}

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'truncate text-[12px] font-medium',
                    active ? 'text-primary' : 'text-text-primary',
                  )}
                >
                  {acc.bankName}
                </p>
                <p className="text-text-tertiary truncate text-[11px]">
                  {acc.accountNumber} · {acc.accountType}
                </p>
              </div>
              {active && (
                <span className="bg-primary flex size-3.5 shrink-0 items-center justify-center rounded-full">
                  <X className="size-2 text-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </FilterSection>
  );
}
