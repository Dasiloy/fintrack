export const BULLMQ_DEFAULT_JOB_OPTIONS = {
  removeOnComplete: {
    age: 60 * 60,
    count: 1_000,
  },
  removeOnFail: {
    age: 7 * 24 * 60 * 60,
    count: 500,
  },
} as const;
