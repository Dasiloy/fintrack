'use client';

import Image from 'next/image';
import Cookies from 'js-cookie';
import { useState } from 'react';
import { useBoolean } from '@ui/hooks';
import {
  COOKIE_BALANCE,
  COOKIE_BALANCE_VALUE_DISABLED,
  COOKIE_BALANCE_VALUE_ENABLED,
  COOKIE_CONSENT,
  COOKIE_CONSENT_VALUE_ACCEPTED,
  COOKIE_CONSENT_VALUE_DECLINED,
  COOKIE_THEME,
  COOKIE_THEME_VALUE_DARK,
  COOKIE_THEME_VALUE_LIGHT,
  getCookieExpiry,
  type CookiKeys,
} from '@/lib/constants/cookies';
import { CookieIcon, EyeIcon, EyeOffIcon, MoonIcon, SunIcon } from 'lucide-react';
import { SettingSwitch } from '@/app/(dashboard)/settings/account/_components/setting_switch';
import { ProfileSection } from '@/app/(dashboard)/settings/account/_components/profile_section';
import { promisify } from '@fintrack/utils/promise';
import { toast } from '@ui/components';

interface PrefrencesProps {
  cookies: Map<CookiKeys, string>;
}

export function Prefrences({ cookies }: PrefrencesProps) {
  const [loading, setLoading] = useBoolean();
  const [settings, setSettings] = useState<Record<CookiKeys, string>>({
    [COOKIE_CONSENT]: cookies.get(COOKIE_CONSENT) ?? COOKIE_CONSENT_VALUE_ACCEPTED,
    [COOKIE_THEME]: cookies.get(COOKIE_THEME) ?? COOKIE_THEME_VALUE_DARK,
    [COOKIE_BALANCE]: cookies.get(COOKIE_BALANCE) ?? COOKIE_BALANCE_VALUE_ENABLED,
  });

  const consent = settings[COOKIE_CONSENT] === COOKIE_CONSENT_VALUE_ACCEPTED;

  const darkTheme = settings[COOKIE_THEME] === COOKIE_THEME_VALUE_DARK;

  const balance = settings[COOKIE_BALANCE] === COOKIE_BALANCE_VALUE_ENABLED;

  const onchangeSave = (key: CookiKeys, checked: boolean) => {
    switch (key) {
      case COOKIE_CONSENT:
        setSettings((prev) => ({
          ...prev,
          [COOKIE_CONSENT]: checked ? COOKIE_CONSENT_VALUE_ACCEPTED : COOKIE_CONSENT_VALUE_DECLINED,
        }));
        break;
      case COOKIE_THEME:
        setSettings((prev) => ({
          ...prev,
          [COOKIE_THEME]: checked ? COOKIE_THEME_VALUE_DARK : COOKIE_THEME_VALUE_LIGHT,
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
      title="Preferences"
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
          title={darkTheme ? 'Dark Theme Enabled' : 'Dark Theme Disabled'}
          description={
            darkTheme
              ? 'Dark theme is enabled to use the website'
              : 'Dark theme is disabled to use the website'
          }
          Icon={darkTheme ? <MoonIcon /> : <SunIcon />}
          checked={darkTheme}
          onCheckedChange={(checked) => onchangeSave(COOKIE_THEME, checked)}
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
      </div>
    </ProfileSection>
  );
}
