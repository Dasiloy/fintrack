export interface NigerianBank {
  name: string;
  slug: string;
  code: string;
  ussd: string;
  logo: string;
}

export type NigerianBankMap = Record<string, NigerianBank>;
