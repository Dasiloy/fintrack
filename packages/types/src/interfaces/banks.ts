export interface NigerianBank {
  name: string;
  slug: string;
  code: string;
  ussd: string;
  logo: string;
}

export type NigerianBankMap = Record<string, NigerianBank>;

export interface BankEncryptionFields {
  accountNumber: string;
  accountName: string;
  accountType: string;
  accountBalance: string;
}

export interface BankEncryptionFieldsWiithId extends BankEncryptionFields {
  id: string;
}
