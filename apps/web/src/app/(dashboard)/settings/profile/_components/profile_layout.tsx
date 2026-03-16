'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDaysIcon, Clock, Currency, Languages } from 'lucide-react';

import { Searchable, toast } from '@ui/components';
import { api_client } from '@/lib/trpc_app/api_client';
import { Bio } from '@/app/(dashboard)/settings/profile/_components/bio';
import { History } from '@/app/(dashboard)/settings/profile/_components/history';
import { Sectionshell } from '@/app/(dashboard)/settings/profile/_components/section_shell';

export function ProfileLayout() {
  const timezones = api_client.public.getTimezones.useQuery();
  const currencies = api_client.public.getCurrencies.useQuery();
  const locales = api_client.public.getLocales.useQuery();
  const dateFormats = api_client.public.getDateFormats.useQuery();
  const getMyProfile = api_client.user.getMe.useQuery();

  // data
  const timezonesData = useMemo(() => timezones.data?.data ?? [], [timezones.data]);
  const currenciesData = useMemo(() => currencies.data?.data ?? [], [currencies.data]);
  const localesData = useMemo(() => locales.data?.data ?? [], [locales.data]);
  const dateFormatsData = useMemo(() => dateFormats.data?.data ?? [], [dateFormats.data]);

  // states
  const [timezone, setTimezone] = useState<string | null>(null);
  const [locale, setLocale] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string | null>(null);
  const [dateFormat, setDateFormat] = useState<string | null>(null);
  const [saveTrack, setSaveTrack] = useState<Record<string, boolean>>({
    currency: false,
    locale: false,
    timezone: false,
    dateFormat: false,
  });

  // mutations
  const utils = api_client.useUtils();
  const updateMyProfile = api_client.user.updateMe.useMutation({
    onSuccess: () => {
      toast.success('Success!', {
        description: 'Your profile has been updated successfully',
      });
      utils.user.getMe.invalidate();
    },
    onError: (error) => {
      toast.error('Error occured!', {
        description: error.message,
      });
    },
    onSettled: () => {
      setSaveTrack((prev) => ({
        currency: false,
        locale: false,
        timezone: false,
        dateFormat: false,
      }));
    },
  });

  useEffect(() => {
    if (getMyProfile.data?.data) {
      setTimezone(getMyProfile.data.data.timezone);
      setLocale(getMyProfile.data.data.language);
      setCurrency(getMyProfile.data.data.currency);
      setDateFormat(getMyProfile.data.data.dateFormat);
    }
  }, [getMyProfile.data]);

  return (
    <div className="gris-cols-1 grid gap-8 px-6 pt-6 lg:px-8">
      {/** Top Sectiuon */}
      <div className="grid h-full grid-cols-1 gap-8 md:grid-cols-[0.4fr_1fr]">
        {/**Left */}
        <Bio />

        {/**Right */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Sectionshell
            disabled={updateMyProfile.isPending}
            color="green"
            title="Primary Currency"
            onSave={() => {
              setSaveTrack((prev) => ({ ...prev, currency: true }));
              updateMyProfile.mutate({
                currency: currency as any,
              });
            }}
            isSaving={updateMyProfile.isPending && !!saveTrack.currency}
            description="Define your global transaction unit"
            Icon={<Currency className="size-6 text-green-700" aria-hidden />}
          >
            <Searchable
              value={currency as any}
              onValueChange={setCurrency}
              ariaLabel="Currency"
              placeholder="Select a currency"
              noItemsFound="No currencies found"
              items={currenciesData.map((currency) => currency.currency)}
              disabled={currencies.isLoading}
            />
          </Sectionshell>
          <Sectionshell
            title="Language"
            color="blue"
            disabled={updateMyProfile.isPending}
            Icon={<Languages className="size-4 text-blue-700" aria-hidden />}
            onSave={() => {
              setSaveTrack((prev) => ({ ...prev, locale: true }));
              updateMyProfile.mutate({
                language: locale as any,
              });
            }}
            description="Interface display language"
            isSaving={updateMyProfile.isPending && !!saveTrack.locale}
          >
            <Searchable
              value={locale as any}
              onValueChange={setLocale}
              ariaLabel="Language"
              placeholder="Select a language"
              noItemsFound="No languages found"
              disabled={locales.isLoading}
              items={localesData.map((locale) => locale.language)}
            />
          </Sectionshell>
          <Sectionshell
            title="Timezone"
            color="yellow"
            disabled={updateMyProfile.isPending}
            Icon={<Clock className="size-4 text-yellow-700" aria-hidden />}
            onSave={() => {
              setSaveTrack((prev) => ({ ...prev, timezone: true }));
              updateMyProfile.mutate({
                timezone: timezone as any,
              });
            }}
            description="Set your local time for accurate logging"
            isSaving={updateMyProfile.isPending && !!saveTrack.timezone}
          >
            <Searchable
              value={timezone as any}
              onValueChange={setTimezone}
              ariaLabel="Timezone"
              placeholder="Select a timezone"
              noItemsFound="No timezones found"
              disabled={timezones.isLoading}
              items={timezonesData.map((timezone) => timezone.value)}
            />
          </Sectionshell>
          <Sectionshell
            title="Date Format"
            color="orange"
            disabled={updateMyProfile.isPending}
            Icon={<CalendarDaysIcon className="size-4 text-orange-700" aria-hidden />}
            onSave={() => {
              setSaveTrack((prev) => ({ ...prev, dateFormat: true }));
              updateMyProfile.mutate({
                dateFormat: dateFormat as any,
              });
            }}
            description="The date format you use to track your finances."
            isSaving={updateMyProfile.isPending && !!saveTrack.dateFormat}
          >
            <Searchable
              value={dateFormat as any}
              onValueChange={setDateFormat}
              ariaLabel="Date Format"
              placeholder="Select a date format"
              noItemsFound="No date formats found"
              disabled={dateFormats.isLoading}
              items={dateFormatsData}
              getValue={(dateFormat) => dateFormat.value}
              getLabel={(dateFormat) => dateFormat.label}
            />
          </Sectionshell>
        </div>
      </div>

      {/** Bottom Sectiuon */}
      <History />
    </div>
  );
}
