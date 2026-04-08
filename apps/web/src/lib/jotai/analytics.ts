import { atom } from 'jotai';

export interface AnalyticsState {
  loading: boolean;
  filter: {
    month: number; // 0-indexed
    year: number;
  };
  data: Record<string, unknown>;
}

export const analyticsAtom = atom<AnalyticsState>({
  loading: false,
  filter: {
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  },
  data: {},
});
