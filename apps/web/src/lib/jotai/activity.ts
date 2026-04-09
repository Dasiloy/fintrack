import { atom } from 'jotai';

import type { ActivityLogs } from '@fintrack/database/types';

export interface ActivityState {
  loading: boolean;
  logs: ActivityLogs[];
}

export const activityAtom = atom<ActivityState>({
  loading: false,
  logs: [],
});
