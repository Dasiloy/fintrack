export interface MonoInstitution {
  name: string;
  bankCode: string;
  type: string;
}

export interface MonoAccountData {
  _id: string;
  name: string;
  accountNumber: string;
  currency: string;
  balance: number;
  type: string;
  status: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
  institution: MonoInstitution;
}

export interface MonoAccountConnectedPayload {
  event: 'mono.events.account_connected';
  data: {
    id: string;
    customer: string;
    meta: {
      data_status: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
      auth_method: string;
    };
    app: string;
    business: string;
  };
}

export interface MonoAccountUpdatedPayload {
  event: 'mono.events.account_updated';
  data: {
    account: MonoAccountData;
    meta: {
      data_status: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE';
      auth_method: string;
    };
  };
}

export type MonoWebhookPayload = MonoAccountConnectedPayload | MonoAccountUpdatedPayload;

export interface MonoAccountSybJobPayload {
  /** mono account id */
  accountId: string;

  /** local account id */
  id: string;

  /** user id */
  userId: string;

  /** when to start syncing the transaction => lastSyncDate on local account  */
  startDate: Date;
}

// ---------------------------------------------------------------------------
// Mono Transaction
// ---------------------------------------------------------------------------

export type MonoTransactionCategory =
  | 'unknown'
  | 'bank_charges'
  | 'bills_and_utilities'
  | 'entertainment'
  | 'food_and_drinks'
  | 'gambling'
  | 'groceries'
  | 'health_and_beauty'
  | 'insurance'
  | 'investment'
  | 'loan_repayment'
  | 'mortgage'
  | 'retail'
  | 'salary'
  | 'savings'
  | 'shopping'
  | 'tax'
  | 'top_up'
  | 'transfer'
  | 'transport';

export interface MonoTransaction {
  id: string;
  narration: string;
  amount: number;
  type: 'debit' | 'credit';
  balance: number;
  date: string;
  category: MonoTransactionCategory;
}

export interface MonoTransactionPage {
  status: string;
  message: string;
  timestamp: string;
  data: MonoTransaction[];
  meta: {
    total: number;
    page: number;
    previous: string | null;
    next: string | null;
  };
}
