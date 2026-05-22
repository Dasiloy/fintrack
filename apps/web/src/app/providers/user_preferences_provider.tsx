'use client';

import { createContext, useContext } from 'react';

import { api_client } from '@/lib/trpc_app/api_client';

export interface UserPreferences {
  currency: string;
  language: string;
  timezone: string;
  dateFormat: string;
}

const DEFAULTS: UserPreferences = {
  currency: 'NGN',
  language: 'EN_US',
  timezone: 'Africa/Lagos',
  dateFormat: 'DMY',
};

const UserPreferencesContext = createContext<UserPreferences>(DEFAULTS);

export function UserPreferencesProvider({
  initialPrefs,
  children,
}: {
  initialPrefs: UserPreferences;
  children: React.ReactNode;
}) {
  // Shares the tRPC cache key with all other getMe calls in the app.
  // Falls back to server-fetched initialPrefs while the client query loads.
  // After profile page saves utils.user.getMe.invalidate(), this refetches automatically.
  const { data } = api_client.user.getMe.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const prefs: UserPreferences =
    data?.data
      ? {
          currency: data.data.currency,
          language: data.data.language,
          timezone: data.data.timezone,
          dateFormat: data.data.dateFormat,
        }
      : initialPrefs;

  return (
    <UserPreferencesContext.Provider value={prefs}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences(): UserPreferences {
  return useContext(UserPreferencesContext);
}
