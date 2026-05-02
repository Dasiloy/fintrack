import { Prisma } from './generated/prisma/index.js';

export const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatar: true,
  language: true,
  currency: true,
  dateFormat: true,
  timezone: true,
  lastLoginAt: true,
  setting: {
    select: {
      budgetAlertMail: true,
      budgetAlertApp: true,
      billReminderMail: true,
      billReminderApp: true,
      weeklyReportMail: true,
      weeklyReportApp: true,
      aiInsightsMail: true,
      aiInsightsApp: true,
      goalsAlertMail: true,
      goalsAlertApp: true,
      splitsAlertMail: true,
      splitsAlertApp: true,
    },
  },
  subscription: {
    select: {
      plan: true,
      status: true,
      stripeCurrentPeriodStart: true,
      stripeCurrentPeriodEnd: true,
    },
  },
} as const satisfies Prisma.UserSelect;

export type GetMeResponse = Prisma.UserGetPayload<{ select: typeof USER_SELECT }>;
