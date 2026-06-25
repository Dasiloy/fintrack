'use client';

import Cookies from 'js-cookie';

import {
  ADVISOR_ACTIVE_CONVERSATION_COOKIE,
  ADVISOR_STORAGE_PREFIX,
} from './advisor_storage.constants';

export function getAdvisorStorageKeys(storage: Storage): string[] {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(ADVISOR_STORAGE_PREFIX)) keys.push(key);
  }
  return keys;
}

export function clearAdvisorBrowserStorage(): void {
  if (typeof window !== 'undefined') {
    for (const key of getAdvisorStorageKeys(window.localStorage)) {
      window.localStorage.removeItem(key);
    }
  }

  Cookies.remove(ADVISOR_ACTIVE_CONVERSATION_COOKIE, { path: '/' });
}
