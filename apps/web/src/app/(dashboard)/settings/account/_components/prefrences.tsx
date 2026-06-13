'use client';

import Image from 'next/image';
import Cookies from 'js-cookie';
import { useState } from 'react';
import { useTheme } from '@ui/components';
import { useBoolean } from '@ui/hooks';
import {
  COOKIE_BALANCE,
  COOKIE_BALANCE_VALUE_DISABLED,
  COOKIE_BALANCE_VALUE_ENABLED,
  COOKIE_CONSENT,
  COOKIE_CONSENT_VALUE_ACCEPTED,
  COOKIE_CONSENT_VALUE_DECLINED,
  getCookieExpiry,
  type CookiKeys,
} from '@/lib/constants/cookies';
import { CookieIcon, EyeIcon, EyeOffIcon, MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';
import { cn } from '@ui/lib/utils';
import { SettingSwitch } from '@/app/(dashboard)/settings/account/_components/setting_switch';
import { ProfileSection } from '@/app/(dashboard)/settings/account/_components/profile_section';
import { promisify } from '@fintrack/utils/promise';
import { toast } from '@ui/components';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', Icon: SunIcon },
  { value: 'system', label: 'System', Icon: MonitorIcon },
  { value: 'dark', label: 'Dark', Icon: MoonIcon },
] as const;

interface PrefrencesProps {
  cookies: Map<CookiKeys, string>;
}

export function Prefrences({ cookies }: PrefrencesProps) {
  const [loading, setLoading] = useBoolean();
  const { theme, setTheme } = useTheme();

  const [settings, setSettings] = useState<Record<CookiKeys, string>>({
    [COOKIE_CONSENT]: cookies.get(COOKIE_CONSENT) ?? COOKIE_CONSENT_VALUE_ACCEPTED,
    [COOKIE_BALANCE]: cookies.get(COOKIE_BALANCE) ?? COOKIE_BALANCE_VALUE_ENABLED,
  });

  const consent = settings[COOKIE_CONSENT] === COOKIE_CONSENT_VALUE_ACCEPTED;
  const balance = settings[COOKIE_BALANCE] === COOKIE_BALANCE_VALUE_ENABLED;

  const activeTheme = THEME_OPTIONS.find((t) => t.value === theme) ?? THEME_OPTIONS[1]!;

  const onchangeSave = (key: CookiKeys, checked: boolean) => {
    switch (key) {
      case COOKIE_CONSENT:
        setSettings((prev) => ({
          ...prev,
          [COOKIE_CONSENT]: checked ? COOKIE_CONSENT_VALUE_ACCEPTED : COOKIE_CONSENT_VALUE_DECLINED,
        }));
        break;
      case COOKIE_BALANCE:
        setSettings((prev) => ({
          ...prev,
          [COOKIE_BALANCE]: checked ? COOKIE_BALANCE_VALUE_ENABLED : COOKIE_BALANCE_VALUE_DISABLED,
        }));
        break;
      default:
        break;
    }
  };

  const handleSave = () => {
    const keys = Object.keys(settings);
    for (const key of keys) {
      const hasChanged = settings[key as CookiKeys] !== Cookies.get(key);
      if (hasChanged) {
        Cookies.set(key, settings[key as CookiKeys], {
          expires: getCookieExpiry(key as CookiKeys),
          sameSite: 'lax',
        });
      }
    }
  };

  const onSave = async () => {
    setLoading.on();
    try {
      await promisify(handleSave);
      toast.success('Preferences saved successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save preferences');
    } finally {
      setLoading.off();
    }
  };

  return (
    <ProfileSection
      title="App Prefrences"
      onSave={onSave}
      saving={loading}
      description="Manage your account preferences"
      Icon={<Image width={20} height={20} alt="Prefrences" src="/pref.svg" />}
    >
      <div className="grid grid-cols-1 gap-4">
        <SettingSwitch
          disabled={loading}
          title={consent ? 'Consnet Enabled' : 'Consnet Disabled'}
          description={
            consent
              ? 'Cookies are enabled to use the website'
              : 'Cookies are disabled to use the website'
          }
          Icon={<CookieIcon />}
          checked={consent}
          onCheckedChange={(checked) => onchangeSave(COOKIE_CONSENT, checked)}
        />
        <SettingSwitch
          disabled={loading}
          title={balance ? 'Balance Hidden' : 'Balance Visible'}
          description={
            balance
              ? 'Balance is hidden to use the website'
              : 'Balance is visible to use the website'
          }
          Icon={balance ? <EyeOffIcon /> : <EyeIcon />}
          checked={balance}
          onCheckedChange={(checked) => onchangeSave(COOKIE_BALANCE, checked)}
        />
        <div className="bg-bg-surface flex flex-col gap-4 rounded-xl p-4 md:flex-row md:items-center">
          <div className="bg-primary/20 text-primary flex size-12 shrink-0 items-center justify-center rounded-lg">
            <activeTheme.Icon className="size-5" />
          </div>
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-text-primary text-body font-medium">Appearance</p>
              <p className="text-text-tertiary text-body-sm">
                {theme === 'system'
                  ? 'Following your system preference'
                  : theme === 'dark'
                    ? 'Switch to light theme for a brighter interface'
                    : 'Switch to dark theme for a dimmer interface'}
              </p>
            </div>
            <div className="border-border-light flex shrink-0 overflow-hidden rounded-lg border">
              {THEME_OPTIONS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={cn(
                    'duration-smooth flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all',
                    theme === value
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary',
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ProfileSection>
  );
}
