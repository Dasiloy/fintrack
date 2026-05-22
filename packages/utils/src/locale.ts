// ISO 3166-1 alpha-2 country code → ISO 4217 currency code
const COUNTRY_CURRENCY: Record<string, string> = {
  // Africa
  NG: 'NGN', GH: 'GHS', KE: 'KES', ZA: 'ZAR', EG: 'EGP', ET: 'ETB',
  TZ: 'TZS', UG: 'UGX', RW: 'RWF', SN: 'XOF', CI: 'XOF', CM: 'XAF',
  MA: 'MAD', TN: 'TND', DZ: 'DZD', ZW: 'ZWL', ZM: 'ZMW', MZ: 'MZN',
  AO: 'AOA', SD: 'SDG', LY: 'LYD',
  // Americas
  US: 'USD', CA: 'CAD', MX: 'MXN', BR: 'BRL', AR: 'ARS', CL: 'CLP',
  CO: 'COP', PE: 'PEN', VE: 'VES', EC: 'USD', BO: 'BOB', UY: 'UYU',
  PY: 'PYG', JM: 'JMD', TT: 'TTD', BB: 'BBD',
  // Europe
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR',
  AT: 'EUR', PT: 'EUR', IE: 'EUR', FI: 'EUR', GR: 'EUR', LU: 'EUR',
  SK: 'EUR', SI: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR', MT: 'EUR',
  CY: 'EUR', GB: 'GBP', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK',
  PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', BG: 'BGN', HR: 'EUR',
  RS: 'RSD', UA: 'UAH', TR: 'TRY', RU: 'RUB', IS: 'ISK',
  // Asia-Pacific
  JP: 'JPY', CN: 'CNY', IN: 'INR', AU: 'AUD', NZ: 'NZD', SG: 'SGD',
  HK: 'HKD', KR: 'KRW', TW: 'TWD', ID: 'IDR', MY: 'MYR', TH: 'THB',
  PH: 'PHP', VN: 'VND', PK: 'PKR', BD: 'BDT', LK: 'LKR', NP: 'NPR',
  AE: 'AED', SA: 'SAR', QA: 'QAR', KW: 'KWD', BH: 'BHD', OM: 'OMR',
  IQ: 'IQD', IR: 'IRR', IL: 'ILS', JO: 'JOD', LB: 'LBP',
};

// ISO 3166-1 alpha-2 country code → Language enum value (Prisma schema)
const COUNTRY_LANGUAGE: Record<string, string> = {
  // English-speaking
  US: 'EN_US', CA: 'EN_US', JM: 'EN_US', TT: 'EN_US', BB: 'EN_US',
  GB: 'EN_GB', AU: 'EN_GB', NZ: 'EN_GB', IE: 'EN_GB', SG: 'EN_GB',
  ZA: 'EN_GB', GH: 'EN_US', NG: 'EN_US', KE: 'EN_US', UG: 'EN_US',
  RW: 'EN_US', ZM: 'EN_US', ZW: 'EN_US', TZ: 'SW_TZ',
  // French
  FR: 'FR', BE: 'FR', CH: 'FR', LU: 'FR', SN: 'FR', CI: 'FR', CM: 'FR',
  MA: 'FR', TN: 'FR', DZ: 'FR', MG: 'FR',
  // Spanish
  ES: 'ES', MX: 'ES', AR: 'ES', CL: 'ES', CO: 'ES', PE: 'ES',
  VE: 'ES', EC: 'ES', BO: 'ES', UY: 'ES', PY: 'ES',
  // Portuguese
  PT: 'PT', BR: 'PT', AO: 'PT', MZ: 'PT',
};

export function countryToCurrency(countryCode: string | null | undefined): string | undefined {
  if (!countryCode) return undefined;
  return COUNTRY_CURRENCY[countryCode.toUpperCase()];
}

export function countryToLanguage(countryCode: string | null | undefined): string | undefined {
  if (!countryCode) return undefined;
  return COUNTRY_LANGUAGE[countryCode.toUpperCase()];
}
