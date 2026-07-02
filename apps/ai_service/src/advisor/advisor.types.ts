import {
  AdvisorWorkflowActionBatchResult,
  AdvisorWorkflowExecutableCandidate,
  AdvisorActionExecutionResult,
  AdvisorWorkflowEventType,
  AdvisorWorkflowStatus,
} from '@fintrack/types/interfaces/ai';
import type {
  TransactionSource,
  TransactionType,
} from '@fintrack/types/protos/finance/transaction';

export type AdvisorMessageContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export const MANUAL_TRANSACTION_SOURCE = 0 as TransactionSource;

export const TRANSACTION_TYPES = {
  INCOME: 0,
  EXPENSE: 1,
} as const satisfies Record<'INCOME' | 'EXPENSE', TransactionType>;

export const SYSTEM_CATEGORY_SLUG_ALIASES: Record<string, string> = {
  food: 'cat-food',
  'food-groceries': 'cat-food',
  groceries: 'cat-food',
  income: 'cat-income',
  transport: 'cat-transport',
  bills: 'cat-bills-utilities',
  utilities: 'cat-bills-utilities',
  'bills-utilities': 'cat-bills-utilities',
  shopping: 'cat-shopping',
  retail: 'cat-shopping',
  'shopping-retail': 'cat-shopping',
  healthcare: 'cat-healthcare',
  health: 'cat-healthcare',
  entertainment: 'cat-entertainment',
  education: 'cat-education',
  savings: 'cat-savings',
  misc: 'cat-misc',
  miscellaneous: 'cat-misc',
};

export type AdvisorLimitedEntity =
  | 'budget'
  | 'recurringItem'
  | 'goal'
  | 'split';

export type AdvisorLimitConfig = {
  countKey: 'budgets' | 'recurringItems' | 'goals' | 'splits';
  limitKey:
    | 'MAX_BUDGETS'
    | 'MAX_RECURRING_ITEMS'
    | 'MAX_GOALS'
    | 'MAX_ACTIVE_SPLITS';
  entityLabel: string;
  limitLabel: string;
};

export interface AdvisorWorkflowStreamEvent {
  type: AdvisorWorkflowEventType;
  status: AdvisorWorkflowStatus;
  stageIndex?: number;
  stageLabel?: string;
  message?: string;
}

export interface AdvisorDirectActionResultEvent {
  type: 'action_result';
  result: AdvisorActionExecutionResult;
}

export interface AdvisorWorkflowActionBatchResultEvent {
  type: 'workflow_action_batch_result';
  result: AdvisorWorkflowActionBatchResult;
}

export type AdvisorWorkflowActionDomain = 'budget' | 'recurring';

export type AdvisorWorkflowExecutableCandidatePayload =
  AdvisorWorkflowExecutableCandidate;

export const ADVISOR_ENTITY_LIMITS: Record<
  AdvisorLimitedEntity,
  AdvisorLimitConfig
> = {
  budget: {
    countKey: 'budgets',
    limitKey: 'MAX_BUDGETS',
    entityLabel: 'budget',
    limitLabel: 'budget',
  },
  recurringItem: {
    countKey: 'recurringItems',
    limitKey: 'MAX_RECURRING_ITEMS',
    entityLabel: 'recurring item',
    limitLabel: 'recurring item',
  },
  goal: {
    countKey: 'goals',
    limitKey: 'MAX_GOALS',
    entityLabel: 'goal',
    limitLabel: 'goal',
  },
  split: {
    countKey: 'splits',
    limitKey: 'MAX_ACTIVE_SPLITS',
    entityLabel: 'split',
    limitLabel: 'active split',
  },
};
