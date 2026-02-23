'use client';

import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  useComboboxAnchor,
} from '@fintrack/ui/components/atoms/combobox';
import { Text } from '@fintrack/ui/components/atoms/text';

// ---------------------------------------------------------------------------
// Single select — account category
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { value: 'income', label: 'Income' },
  { value: 'housing', label: 'Housing' },
  { value: 'food', label: 'Food & Drink' },
  { value: 'transport', label: 'Transport' },
  { value: 'health', label: 'Health' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'investment', label: 'Investment' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
];

function CategoryCombobox() {
  const anchor = useComboboxAnchor();
  return (
    <Combobox>
      <ComboboxInput ref={anchor} placeholder="Select category…" showClear />
      <ComboboxContent anchor={anchor}>
        <ComboboxList>
          {CATEGORIES.map((item) => (
            <ComboboxItem key={item.value} value={item.value}>
              {item.label}
            </ComboboxItem>
          ))}
          <ComboboxEmpty>No category found.</ComboboxEmpty>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

// ---------------------------------------------------------------------------
// Grouped — currency selector
// ---------------------------------------------------------------------------

const CURRENCIES = [
  { value: 'usd', label: 'USD — US Dollar', group: 'Popular' },
  { value: 'eur', label: 'EUR — Euro', group: 'Popular' },
  { value: 'gbp', label: 'GBP — British Pound', group: 'Popular' },
  { value: 'ngn', label: 'NGN — Nigerian Naira', group: 'Africa' },
  { value: 'ghc', label: 'GHC — Ghanaian Cedi', group: 'Africa' },
  { value: 'kes', label: 'KES — Kenyan Shilling', group: 'Africa' },
  { value: 'jpy', label: 'JPY — Japanese Yen', group: 'Asia' },
  { value: 'cny', label: 'CNY — Chinese Yuan', group: 'Asia' },
];

const GROUPS = [...new Set(CURRENCIES.map((c) => c.group))];

function CurrencyCombobox() {
  const anchor = useComboboxAnchor();
  return (
    <Combobox>
      <ComboboxInput ref={anchor} placeholder="Select currency…" />
      <ComboboxContent anchor={anchor}>
        <ComboboxList>
          {GROUPS.map((group, i) => (
            <ComboboxGroup key={group}>
              {i > 0 && <ComboboxSeparator />}
              <ComboboxLabel>{group}</ComboboxLabel>
              {CURRENCIES.filter((c) => c.group === group).map((item) => (
                <ComboboxItem key={item.value} value={item.value}>
                  {item.label}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          ))}
          <ComboboxEmpty>No currency found.</ComboboxEmpty>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

// ---------------------------------------------------------------------------
// Multi-select chips — tags / labels
// ---------------------------------------------------------------------------

const TAGS = [
  { value: 'rent', label: 'Rent' },
  { value: 'recurring', label: 'Recurring' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'deferred', label: 'Deferred' },
  { value: 'reviewed', label: 'Reviewed' },
];

function TagsCombobox() {
  const anchor = useComboboxAnchor();

  return (
    <Combobox multiple>
      <ComboboxChips ref={anchor}>
        {TAGS.map((tag) => (
          <ComboboxChip key={tag.value}>{tag.label}</ComboboxChip>
        ))}
        <ComboboxChipsInput placeholder="Add label…" />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxList>
          {TAGS.map((item) => (
            <ComboboxItem key={item.value} value={item.value}>
              {item.label}
            </ComboboxItem>
          ))}
          <ComboboxEmpty>No label found.</ComboboxEmpty>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export function ComboboxDemo() {
  return (
    <div className="flex max-w-sm flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Text variant="overline" color="secondary">
          Single Select
        </Text>
        <CategoryCombobox />
      </div>

      <div className="flex flex-col gap-3">
        <Text variant="overline" color="secondary">
          Grouped Options
        </Text>
        <CurrencyCombobox />
      </div>

      <div className="flex flex-col gap-3">
        <Text variant="overline" color="secondary">
          Multi-Select (Chips)
        </Text>
        <TagsCombobox />
      </div>
    </div>
  );
}
