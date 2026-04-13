declare module '@mono.co/connect.js' {
  export type MonoConnectEventName =
    | 'LOADED'
    | 'OPENED'
    | 'SUCCESS'
    | 'ERROR'
    | 'INSTITUTION_SELECTED'
    | 'AUTH_METHOD_SWITCHED'
    | 'EXIT'
    | 'SUBMIT_CREDENTIALS'
    | 'SUBMIT_MFA'
    | 'ACCOUNT_LINKED'
    | 'ACCOUNT_SELECTED';

  export interface MonoCustomerIdentity {
    type: string;
    number: string;
  }

  export interface MonoCustomer {
    id?: string;
    name?: string;
    email?: string;
    identity?: MonoCustomerIdentity;
  }

  export interface MonoConnectData {
    customer?: MonoCustomer;
    account?: string;
    [key: string]: unknown;
  }

  export interface MonoSelectedInstitution {
    id: string;
    auth_method?: string;
    account_number?: string;
    [key: string]: unknown;
  }

  export interface MonoSetupConfig {
    selectedInstitution?: MonoSelectedInstitution;
    check_account_match?: boolean;
    data?: MonoConnectData;
    [key: string]: unknown;
  }

  export interface MonoConnectSuccessPayload {
    code?: string;
    [key: string]: unknown;
  }

  export interface MonoConnectOptions {
    key: string;
    scope?: string;
    data?: MonoConnectData;
    reference?: string;
    onSuccess: (data: MonoConnectSuccessPayload) => void;
    onClose?: () => void;
    onLoad?: () => void;
    onEvent?: (eventName: MonoConnectEventName, data: unknown) => void;
    [key: string]: unknown;
  }

  export default class Connect {
    constructor(options: MonoConnectOptions);
    setup(config?: MonoSetupConfig): void;
    reauthorise(accountId: string): void;
    open(): void;
    close(): void;
    fetchInstitutions(): Promise<unknown>;
  }
}
