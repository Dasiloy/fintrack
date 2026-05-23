'use client';

import { formatCurrency, langToLocale } from '@fintrack/utils/format';
import { useUserPreferences } from '@/app/providers/user_preferences_provider';

export function useFormatCurrency() {
  const { currency, language } = useUserPreferences();
  const locale = langToLocale(language);
  return (amount: number) => formatCurrency(amount, currency, locale);
}
