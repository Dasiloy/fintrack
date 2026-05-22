'use client';

import { formatDate, langToLocale } from '@fintrack/utils/format';
import { useUserPreferences } from '@/app/providers/user_preferences_provider';

export function useFormatDate() {
  const { dateFormat, language } = useUserPreferences();
  const locale = langToLocale(language);
  return (date: Date | string) => formatDate(date, dateFormat as 'DMY' | 'MDY' | 'YMD', locale);
}
