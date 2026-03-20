
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Currencies
 * 
 */
export type Currencies = $Result.DefaultSelection<Prisma.$CurrenciesPayload>
/**
 * Model Locale
 * 
 */
export type Locale = $Result.DefaultSelection<Prisma.$LocalePayload>
/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Account
 * 
 */
export type Account = $Result.DefaultSelection<Prisma.$AccountPayload>
/**
 * Model Session
 * 
 */
export type Session = $Result.DefaultSelection<Prisma.$SessionPayload>
/**
 * Model LoginActivity
 * 
 */
export type LoginActivity = $Result.DefaultSelection<Prisma.$LoginActivityPayload>
/**
 * Model VerificationToken
 * 
 */
export type VerificationToken = $Result.DefaultSelection<Prisma.$VerificationTokenPayload>
/**
 * Model Subscription
 * 
 */
export type Subscription = $Result.DefaultSelection<Prisma.$SubscriptionPayload>
/**
 * Model UsageTracker
 * 
 */
export type UsageTracker = $Result.DefaultSelection<Prisma.$UsageTrackerPayload>
/**
 * Model BackupCodes
 * 
 */
export type BackupCodes = $Result.DefaultSelection<Prisma.$BackupCodesPayload>
/**
 * Model ActivityLogs
 * 
 */
export type ActivityLogs = $Result.DefaultSelection<Prisma.$ActivityLogsPayload>
/**
 * Model NotificationSetting
 * 
 */
export type NotificationSetting = $Result.DefaultSelection<Prisma.$NotificationSettingPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const Currency: {
  AFN: 'AFN',
  EUR: 'EUR',
  ALL: 'ALL',
  DZD: 'DZD',
  USD: 'USD',
  AOA: 'AOA',
  XCD: 'XCD',
  ARS: 'ARS',
  AMD: 'AMD',
  AWG: 'AWG',
  AUD: 'AUD',
  AZN: 'AZN',
  BSD: 'BSD',
  BHD: 'BHD',
  BDT: 'BDT',
  BBD: 'BBD',
  BYN: 'BYN',
  BZD: 'BZD',
  XOF: 'XOF',
  BMD: 'BMD',
  INR: 'INR',
  BTN: 'BTN',
  BOB: 'BOB',
  BOV: 'BOV',
  BAM: 'BAM',
  BWP: 'BWP',
  NOK: 'NOK',
  BRL: 'BRL',
  BND: 'BND',
  BGN: 'BGN',
  BIF: 'BIF',
  CVE: 'CVE',
  KHR: 'KHR',
  XAF: 'XAF',
  CAD: 'CAD',
  KYD: 'KYD',
  CLP: 'CLP',
  CLF: 'CLF',
  CNY: 'CNY',
  COP: 'COP',
  COU: 'COU',
  KMF: 'KMF',
  CDF: 'CDF',
  NZD: 'NZD',
  CRC: 'CRC',
  HRK: 'HRK',
  CUP: 'CUP',
  CUC: 'CUC',
  ANG: 'ANG',
  CZK: 'CZK',
  DKK: 'DKK',
  DJF: 'DJF',
  DOP: 'DOP',
  EGP: 'EGP',
  SVC: 'SVC',
  ERN: 'ERN',
  ETB: 'ETB',
  FKP: 'FKP',
  FJD: 'FJD',
  XPF: 'XPF',
  GMD: 'GMD',
  GEL: 'GEL',
  GHS: 'GHS',
  GIP: 'GIP',
  GTQ: 'GTQ',
  GBP: 'GBP',
  GNF: 'GNF',
  GYD: 'GYD',
  HTG: 'HTG',
  HNL: 'HNL',
  HKD: 'HKD',
  HUF: 'HUF',
  ISK: 'ISK',
  IDR: 'IDR',
  XDR: 'XDR',
  IRR: 'IRR',
  IQD: 'IQD',
  ILS: 'ILS',
  JMD: 'JMD',
  JPY: 'JPY',
  JOD: 'JOD',
  KZT: 'KZT',
  KES: 'KES',
  KPW: 'KPW',
  KRW: 'KRW',
  KWD: 'KWD',
  KGS: 'KGS',
  LAK: 'LAK',
  LBP: 'LBP',
  LSL: 'LSL',
  ZAR: 'ZAR',
  LRD: 'LRD',
  LYD: 'LYD',
  CHF: 'CHF',
  MOP: 'MOP',
  MKD: 'MKD',
  MGA: 'MGA',
  MWK: 'MWK',
  MYR: 'MYR',
  MVR: 'MVR',
  MUR: 'MUR',
  XUA: 'XUA',
  MXN: 'MXN',
  MXV: 'MXV',
  MDL: 'MDL',
  MNT: 'MNT',
  MAD: 'MAD',
  MZN: 'MZN',
  MMK: 'MMK',
  NAD: 'NAD',
  NPR: 'NPR',
  NIO: 'NIO',
  NGN: 'NGN',
  OMR: 'OMR',
  PKR: 'PKR',
  PAB: 'PAB',
  PGK: 'PGK',
  PYG: 'PYG',
  PEN: 'PEN',
  PHP: 'PHP',
  PLN: 'PLN',
  QAR: 'QAR',
  RON: 'RON',
  RUB: 'RUB',
  RWF: 'RWF',
  SHP: 'SHP',
  WST: 'WST',
  STN: 'STN',
  SAR: 'SAR',
  RSD: 'RSD',
  SCR: 'SCR',
  SLL: 'SLL',
  SGD: 'SGD',
  XSU: 'XSU',
  SBD: 'SBD',
  SOS: 'SOS',
  SSP: 'SSP',
  LKR: 'LKR',
  SDG: 'SDG',
  SRD: 'SRD',
  SZL: 'SZL',
  SEK: 'SEK',
  CHE: 'CHE',
  CHW: 'CHW',
  SYP: 'SYP',
  TWD: 'TWD',
  TJS: 'TJS',
  TZS: 'TZS',
  THB: 'THB',
  TOP: 'TOP',
  TTD: 'TTD',
  TND: 'TND',
  TRY: 'TRY',
  TMT: 'TMT',
  UGX: 'UGX',
  UAH: 'UAH',
  AED: 'AED',
  USN: 'USN',
  UYU: 'UYU',
  UYI: 'UYI',
  UYW: 'UYW',
  UZS: 'UZS',
  VUV: 'VUV',
  VES: 'VES',
  VND: 'VND',
  XBA: 'XBA',
  XBB: 'XBB',
  XBC: 'XBC',
  XBD: 'XBD',
  XTS: 'XTS',
  XXX: 'XXX',
  XAU: 'XAU',
  XPD: 'XPD',
  XPT: 'XPT',
  XAG: 'XAG',
  ZMW: 'ZMW',
  ZWL: 'ZWL'
};

export type Currency = (typeof Currency)[keyof typeof Currency]


export const Language: {
  EN: 'EN',
  FR: 'FR',
  ES: 'ES',
  PT: 'PT',
  EN_US: 'EN_US',
  EN_GB: 'EN_GB',
  HA_LATN_NG: 'HA_LATN_NG',
  YO_NG: 'YO_NG',
  IG_NG: 'IG_NG',
  SW_KE: 'SW_KE',
  SW_TZ: 'SW_TZ'
};

export type Language = (typeof Language)[keyof typeof Language]


export const DateFormat: {
  DMY: 'DMY',
  MDY: 'MDY',
  YMD: 'YMD'
};

export type DateFormat = (typeof DateFormat)[keyof typeof DateFormat]


export const AccountType: {
  OAUTH: 'OAUTH',
  OIDC: 'OIDC',
  CREDENTIALS: 'CREDENTIALS'
};

export type AccountType = (typeof AccountType)[keyof typeof AccountType]


export const AccountProvider: {
  GOOGLE: 'GOOGLE',
  GITHUB: 'GITHUB',
  APPLE: 'APPLE',
  LOCAL: 'LOCAL'
};

export type AccountProvider = (typeof AccountProvider)[keyof typeof AccountProvider]


export const LoginActivityType: {
  PASSWORD: 'PASSWORD',
  MFA: 'MFA'
};

export type LoginActivityType = (typeof LoginActivityType)[keyof typeof LoginActivityType]


export const LoginActivityStatus: {
  FALED: 'FALED',
  SUCCESS: 'SUCCESS'
};

export type LoginActivityStatus = (typeof LoginActivityStatus)[keyof typeof LoginActivityStatus]


export const VerificationIdentifier: {
  PASSWORD: 'PASSWORD',
  EMAIL: 'EMAIL',
  RESET: 'RESET',
  EMAIL_CHANGE: 'EMAIL_CHANGE'
};

export type VerificationIdentifier = (typeof VerificationIdentifier)[keyof typeof VerificationIdentifier]


export const SubscriptionPlan: {
  FREE: 'FREE',
  PRO: 'PRO'
};

export type SubscriptionPlan = (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan]


export const SubscriptionStatus: {
  ACTIVE: 'ACTIVE',
  CANCELED: 'CANCELED',
  PAST_DUE: 'PAST_DUE',
  TRIALING: 'TRIALING',
  INCOMPLETE: 'INCOMPLETE'
};

export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus]


export const UsageFeature: {
  AI_INSIGHTS_QUERIES: 'AI_INSIGHTS_QUERIES',
  AI_CHAT_MESSAGES: 'AI_CHAT_MESSAGES',
  RECEIPT_UPLOADS: 'RECEIPT_UPLOADS'
};

export type UsageFeature = (typeof UsageFeature)[keyof typeof UsageFeature]

}

export type Currency = $Enums.Currency

export const Currency: typeof $Enums.Currency

export type Language = $Enums.Language

export const Language: typeof $Enums.Language

export type DateFormat = $Enums.DateFormat

export const DateFormat: typeof $Enums.DateFormat

export type AccountType = $Enums.AccountType

export const AccountType: typeof $Enums.AccountType

export type AccountProvider = $Enums.AccountProvider

export const AccountProvider: typeof $Enums.AccountProvider

export type LoginActivityType = $Enums.LoginActivityType

export const LoginActivityType: typeof $Enums.LoginActivityType

export type LoginActivityStatus = $Enums.LoginActivityStatus

export const LoginActivityStatus: typeof $Enums.LoginActivityStatus

export type VerificationIdentifier = $Enums.VerificationIdentifier

export const VerificationIdentifier: typeof $Enums.VerificationIdentifier

export type SubscriptionPlan = $Enums.SubscriptionPlan

export const SubscriptionPlan: typeof $Enums.SubscriptionPlan

export type SubscriptionStatus = $Enums.SubscriptionStatus

export const SubscriptionStatus: typeof $Enums.SubscriptionStatus

export type UsageFeature = $Enums.UsageFeature

export const UsageFeature: typeof $Enums.UsageFeature

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Currencies
 * const currencies = await prisma.currencies.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Currencies
   * const currencies = await prisma.currencies.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.currencies`: Exposes CRUD operations for the **Currencies** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Currencies
    * const currencies = await prisma.currencies.findMany()
    * ```
    */
  get currencies(): Prisma.CurrenciesDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.locale`: Exposes CRUD operations for the **Locale** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Locales
    * const locales = await prisma.locale.findMany()
    * ```
    */
  get locale(): Prisma.LocaleDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.account`: Exposes CRUD operations for the **Account** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Accounts
    * const accounts = await prisma.account.findMany()
    * ```
    */
  get account(): Prisma.AccountDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.session`: Exposes CRUD operations for the **Session** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Sessions
    * const sessions = await prisma.session.findMany()
    * ```
    */
  get session(): Prisma.SessionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.loginActivity`: Exposes CRUD operations for the **LoginActivity** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more LoginActivities
    * const loginActivities = await prisma.loginActivity.findMany()
    * ```
    */
  get loginActivity(): Prisma.LoginActivityDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.verificationToken`: Exposes CRUD operations for the **VerificationToken** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more VerificationTokens
    * const verificationTokens = await prisma.verificationToken.findMany()
    * ```
    */
  get verificationToken(): Prisma.VerificationTokenDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.subscription`: Exposes CRUD operations for the **Subscription** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Subscriptions
    * const subscriptions = await prisma.subscription.findMany()
    * ```
    */
  get subscription(): Prisma.SubscriptionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.usageTracker`: Exposes CRUD operations for the **UsageTracker** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more UsageTrackers
    * const usageTrackers = await prisma.usageTracker.findMany()
    * ```
    */
  get usageTracker(): Prisma.UsageTrackerDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.backupCodes`: Exposes CRUD operations for the **BackupCodes** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more BackupCodes
    * const backupCodes = await prisma.backupCodes.findMany()
    * ```
    */
  get backupCodes(): Prisma.BackupCodesDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.activityLogs`: Exposes CRUD operations for the **ActivityLogs** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ActivityLogs
    * const activityLogs = await prisma.activityLogs.findMany()
    * ```
    */
  get activityLogs(): Prisma.ActivityLogsDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.notificationSetting`: Exposes CRUD operations for the **NotificationSetting** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more NotificationSettings
    * const notificationSettings = await prisma.notificationSetting.findMany()
    * ```
    */
  get notificationSetting(): Prisma.NotificationSettingDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.4.0
   * Query Engine version: ab56fe763f921d033a6c195e7ddeb3e255bdbb57
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Currencies: 'Currencies',
    Locale: 'Locale',
    User: 'User',
    Account: 'Account',
    Session: 'Session',
    LoginActivity: 'LoginActivity',
    VerificationToken: 'VerificationToken',
    Subscription: 'Subscription',
    UsageTracker: 'UsageTracker',
    BackupCodes: 'BackupCodes',
    ActivityLogs: 'ActivityLogs',
    NotificationSetting: 'NotificationSetting'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "currencies" | "locale" | "user" | "account" | "session" | "loginActivity" | "verificationToken" | "subscription" | "usageTracker" | "backupCodes" | "activityLogs" | "notificationSetting"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Currencies: {
        payload: Prisma.$CurrenciesPayload<ExtArgs>
        fields: Prisma.CurrenciesFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CurrenciesFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CurrenciesPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CurrenciesFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CurrenciesPayload>
          }
          findFirst: {
            args: Prisma.CurrenciesFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CurrenciesPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CurrenciesFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CurrenciesPayload>
          }
          findMany: {
            args: Prisma.CurrenciesFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CurrenciesPayload>[]
          }
          create: {
            args: Prisma.CurrenciesCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CurrenciesPayload>
          }
          createMany: {
            args: Prisma.CurrenciesCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CurrenciesCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CurrenciesPayload>[]
          }
          delete: {
            args: Prisma.CurrenciesDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CurrenciesPayload>
          }
          update: {
            args: Prisma.CurrenciesUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CurrenciesPayload>
          }
          deleteMany: {
            args: Prisma.CurrenciesDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CurrenciesUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CurrenciesUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CurrenciesPayload>[]
          }
          upsert: {
            args: Prisma.CurrenciesUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CurrenciesPayload>
          }
          aggregate: {
            args: Prisma.CurrenciesAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCurrencies>
          }
          groupBy: {
            args: Prisma.CurrenciesGroupByArgs<ExtArgs>
            result: $Utils.Optional<CurrenciesGroupByOutputType>[]
          }
          count: {
            args: Prisma.CurrenciesCountArgs<ExtArgs>
            result: $Utils.Optional<CurrenciesCountAggregateOutputType> | number
          }
        }
      }
      Locale: {
        payload: Prisma.$LocalePayload<ExtArgs>
        fields: Prisma.LocaleFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LocaleFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocalePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LocaleFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocalePayload>
          }
          findFirst: {
            args: Prisma.LocaleFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocalePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LocaleFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocalePayload>
          }
          findMany: {
            args: Prisma.LocaleFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocalePayload>[]
          }
          create: {
            args: Prisma.LocaleCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocalePayload>
          }
          createMany: {
            args: Prisma.LocaleCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LocaleCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocalePayload>[]
          }
          delete: {
            args: Prisma.LocaleDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocalePayload>
          }
          update: {
            args: Prisma.LocaleUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocalePayload>
          }
          deleteMany: {
            args: Prisma.LocaleDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LocaleUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.LocaleUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocalePayload>[]
          }
          upsert: {
            args: Prisma.LocaleUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LocalePayload>
          }
          aggregate: {
            args: Prisma.LocaleAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLocale>
          }
          groupBy: {
            args: Prisma.LocaleGroupByArgs<ExtArgs>
            result: $Utils.Optional<LocaleGroupByOutputType>[]
          }
          count: {
            args: Prisma.LocaleCountArgs<ExtArgs>
            result: $Utils.Optional<LocaleCountAggregateOutputType> | number
          }
        }
      }
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Account: {
        payload: Prisma.$AccountPayload<ExtArgs>
        fields: Prisma.AccountFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AccountFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AccountFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>
          }
          findFirst: {
            args: Prisma.AccountFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AccountFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>
          }
          findMany: {
            args: Prisma.AccountFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>[]
          }
          create: {
            args: Prisma.AccountCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>
          }
          createMany: {
            args: Prisma.AccountCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AccountCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>[]
          }
          delete: {
            args: Prisma.AccountDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>
          }
          update: {
            args: Prisma.AccountUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>
          }
          deleteMany: {
            args: Prisma.AccountDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AccountUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AccountUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>[]
          }
          upsert: {
            args: Prisma.AccountUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AccountPayload>
          }
          aggregate: {
            args: Prisma.AccountAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAccount>
          }
          groupBy: {
            args: Prisma.AccountGroupByArgs<ExtArgs>
            result: $Utils.Optional<AccountGroupByOutputType>[]
          }
          count: {
            args: Prisma.AccountCountArgs<ExtArgs>
            result: $Utils.Optional<AccountCountAggregateOutputType> | number
          }
        }
      }
      Session: {
        payload: Prisma.$SessionPayload<ExtArgs>
        fields: Prisma.SessionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SessionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SessionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          findFirst: {
            args: Prisma.SessionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SessionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          findMany: {
            args: Prisma.SessionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>[]
          }
          create: {
            args: Prisma.SessionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          createMany: {
            args: Prisma.SessionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SessionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>[]
          }
          delete: {
            args: Prisma.SessionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          update: {
            args: Prisma.SessionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          deleteMany: {
            args: Prisma.SessionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SessionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SessionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>[]
          }
          upsert: {
            args: Prisma.SessionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SessionPayload>
          }
          aggregate: {
            args: Prisma.SessionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSession>
          }
          groupBy: {
            args: Prisma.SessionGroupByArgs<ExtArgs>
            result: $Utils.Optional<SessionGroupByOutputType>[]
          }
          count: {
            args: Prisma.SessionCountArgs<ExtArgs>
            result: $Utils.Optional<SessionCountAggregateOutputType> | number
          }
        }
      }
      LoginActivity: {
        payload: Prisma.$LoginActivityPayload<ExtArgs>
        fields: Prisma.LoginActivityFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LoginActivityFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoginActivityPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LoginActivityFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoginActivityPayload>
          }
          findFirst: {
            args: Prisma.LoginActivityFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoginActivityPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LoginActivityFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoginActivityPayload>
          }
          findMany: {
            args: Prisma.LoginActivityFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoginActivityPayload>[]
          }
          create: {
            args: Prisma.LoginActivityCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoginActivityPayload>
          }
          createMany: {
            args: Prisma.LoginActivityCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LoginActivityCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoginActivityPayload>[]
          }
          delete: {
            args: Prisma.LoginActivityDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoginActivityPayload>
          }
          update: {
            args: Prisma.LoginActivityUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoginActivityPayload>
          }
          deleteMany: {
            args: Prisma.LoginActivityDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LoginActivityUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.LoginActivityUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoginActivityPayload>[]
          }
          upsert: {
            args: Prisma.LoginActivityUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LoginActivityPayload>
          }
          aggregate: {
            args: Prisma.LoginActivityAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLoginActivity>
          }
          groupBy: {
            args: Prisma.LoginActivityGroupByArgs<ExtArgs>
            result: $Utils.Optional<LoginActivityGroupByOutputType>[]
          }
          count: {
            args: Prisma.LoginActivityCountArgs<ExtArgs>
            result: $Utils.Optional<LoginActivityCountAggregateOutputType> | number
          }
        }
      }
      VerificationToken: {
        payload: Prisma.$VerificationTokenPayload<ExtArgs>
        fields: Prisma.VerificationTokenFieldRefs
        operations: {
          findUnique: {
            args: Prisma.VerificationTokenFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.VerificationTokenFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>
          }
          findFirst: {
            args: Prisma.VerificationTokenFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.VerificationTokenFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>
          }
          findMany: {
            args: Prisma.VerificationTokenFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>[]
          }
          create: {
            args: Prisma.VerificationTokenCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>
          }
          createMany: {
            args: Prisma.VerificationTokenCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.VerificationTokenCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>[]
          }
          delete: {
            args: Prisma.VerificationTokenDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>
          }
          update: {
            args: Prisma.VerificationTokenUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>
          }
          deleteMany: {
            args: Prisma.VerificationTokenDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.VerificationTokenUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.VerificationTokenUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>[]
          }
          upsert: {
            args: Prisma.VerificationTokenUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VerificationTokenPayload>
          }
          aggregate: {
            args: Prisma.VerificationTokenAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateVerificationToken>
          }
          groupBy: {
            args: Prisma.VerificationTokenGroupByArgs<ExtArgs>
            result: $Utils.Optional<VerificationTokenGroupByOutputType>[]
          }
          count: {
            args: Prisma.VerificationTokenCountArgs<ExtArgs>
            result: $Utils.Optional<VerificationTokenCountAggregateOutputType> | number
          }
        }
      }
      Subscription: {
        payload: Prisma.$SubscriptionPayload<ExtArgs>
        fields: Prisma.SubscriptionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SubscriptionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SubscriptionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>
          }
          findFirst: {
            args: Prisma.SubscriptionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SubscriptionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>
          }
          findMany: {
            args: Prisma.SubscriptionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>[]
          }
          create: {
            args: Prisma.SubscriptionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>
          }
          createMany: {
            args: Prisma.SubscriptionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SubscriptionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>[]
          }
          delete: {
            args: Prisma.SubscriptionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>
          }
          update: {
            args: Prisma.SubscriptionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>
          }
          deleteMany: {
            args: Prisma.SubscriptionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SubscriptionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SubscriptionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>[]
          }
          upsert: {
            args: Prisma.SubscriptionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriptionPayload>
          }
          aggregate: {
            args: Prisma.SubscriptionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSubscription>
          }
          groupBy: {
            args: Prisma.SubscriptionGroupByArgs<ExtArgs>
            result: $Utils.Optional<SubscriptionGroupByOutputType>[]
          }
          count: {
            args: Prisma.SubscriptionCountArgs<ExtArgs>
            result: $Utils.Optional<SubscriptionCountAggregateOutputType> | number
          }
        }
      }
      UsageTracker: {
        payload: Prisma.$UsageTrackerPayload<ExtArgs>
        fields: Prisma.UsageTrackerFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UsageTrackerFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UsageTrackerPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UsageTrackerFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UsageTrackerPayload>
          }
          findFirst: {
            args: Prisma.UsageTrackerFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UsageTrackerPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UsageTrackerFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UsageTrackerPayload>
          }
          findMany: {
            args: Prisma.UsageTrackerFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UsageTrackerPayload>[]
          }
          create: {
            args: Prisma.UsageTrackerCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UsageTrackerPayload>
          }
          createMany: {
            args: Prisma.UsageTrackerCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UsageTrackerCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UsageTrackerPayload>[]
          }
          delete: {
            args: Prisma.UsageTrackerDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UsageTrackerPayload>
          }
          update: {
            args: Prisma.UsageTrackerUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UsageTrackerPayload>
          }
          deleteMany: {
            args: Prisma.UsageTrackerDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UsageTrackerUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UsageTrackerUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UsageTrackerPayload>[]
          }
          upsert: {
            args: Prisma.UsageTrackerUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UsageTrackerPayload>
          }
          aggregate: {
            args: Prisma.UsageTrackerAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUsageTracker>
          }
          groupBy: {
            args: Prisma.UsageTrackerGroupByArgs<ExtArgs>
            result: $Utils.Optional<UsageTrackerGroupByOutputType>[]
          }
          count: {
            args: Prisma.UsageTrackerCountArgs<ExtArgs>
            result: $Utils.Optional<UsageTrackerCountAggregateOutputType> | number
          }
        }
      }
      BackupCodes: {
        payload: Prisma.$BackupCodesPayload<ExtArgs>
        fields: Prisma.BackupCodesFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BackupCodesFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackupCodesPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BackupCodesFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackupCodesPayload>
          }
          findFirst: {
            args: Prisma.BackupCodesFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackupCodesPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BackupCodesFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackupCodesPayload>
          }
          findMany: {
            args: Prisma.BackupCodesFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackupCodesPayload>[]
          }
          create: {
            args: Prisma.BackupCodesCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackupCodesPayload>
          }
          createMany: {
            args: Prisma.BackupCodesCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BackupCodesCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackupCodesPayload>[]
          }
          delete: {
            args: Prisma.BackupCodesDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackupCodesPayload>
          }
          update: {
            args: Prisma.BackupCodesUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackupCodesPayload>
          }
          deleteMany: {
            args: Prisma.BackupCodesDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BackupCodesUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.BackupCodesUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackupCodesPayload>[]
          }
          upsert: {
            args: Prisma.BackupCodesUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackupCodesPayload>
          }
          aggregate: {
            args: Prisma.BackupCodesAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBackupCodes>
          }
          groupBy: {
            args: Prisma.BackupCodesGroupByArgs<ExtArgs>
            result: $Utils.Optional<BackupCodesGroupByOutputType>[]
          }
          count: {
            args: Prisma.BackupCodesCountArgs<ExtArgs>
            result: $Utils.Optional<BackupCodesCountAggregateOutputType> | number
          }
        }
      }
      ActivityLogs: {
        payload: Prisma.$ActivityLogsPayload<ExtArgs>
        fields: Prisma.ActivityLogsFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ActivityLogsFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityLogsPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ActivityLogsFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityLogsPayload>
          }
          findFirst: {
            args: Prisma.ActivityLogsFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityLogsPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ActivityLogsFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityLogsPayload>
          }
          findMany: {
            args: Prisma.ActivityLogsFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityLogsPayload>[]
          }
          create: {
            args: Prisma.ActivityLogsCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityLogsPayload>
          }
          createMany: {
            args: Prisma.ActivityLogsCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ActivityLogsCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityLogsPayload>[]
          }
          delete: {
            args: Prisma.ActivityLogsDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityLogsPayload>
          }
          update: {
            args: Prisma.ActivityLogsUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityLogsPayload>
          }
          deleteMany: {
            args: Prisma.ActivityLogsDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ActivityLogsUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ActivityLogsUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityLogsPayload>[]
          }
          upsert: {
            args: Prisma.ActivityLogsUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityLogsPayload>
          }
          aggregate: {
            args: Prisma.ActivityLogsAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateActivityLogs>
          }
          groupBy: {
            args: Prisma.ActivityLogsGroupByArgs<ExtArgs>
            result: $Utils.Optional<ActivityLogsGroupByOutputType>[]
          }
          count: {
            args: Prisma.ActivityLogsCountArgs<ExtArgs>
            result: $Utils.Optional<ActivityLogsCountAggregateOutputType> | number
          }
        }
      }
      NotificationSetting: {
        payload: Prisma.$NotificationSettingPayload<ExtArgs>
        fields: Prisma.NotificationSettingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.NotificationSettingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationSettingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.NotificationSettingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationSettingPayload>
          }
          findFirst: {
            args: Prisma.NotificationSettingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationSettingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.NotificationSettingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationSettingPayload>
          }
          findMany: {
            args: Prisma.NotificationSettingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationSettingPayload>[]
          }
          create: {
            args: Prisma.NotificationSettingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationSettingPayload>
          }
          createMany: {
            args: Prisma.NotificationSettingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.NotificationSettingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationSettingPayload>[]
          }
          delete: {
            args: Prisma.NotificationSettingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationSettingPayload>
          }
          update: {
            args: Prisma.NotificationSettingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationSettingPayload>
          }
          deleteMany: {
            args: Prisma.NotificationSettingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.NotificationSettingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.NotificationSettingUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationSettingPayload>[]
          }
          upsert: {
            args: Prisma.NotificationSettingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationSettingPayload>
          }
          aggregate: {
            args: Prisma.NotificationSettingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateNotificationSetting>
          }
          groupBy: {
            args: Prisma.NotificationSettingGroupByArgs<ExtArgs>
            result: $Utils.Optional<NotificationSettingGroupByOutputType>[]
          }
          count: {
            args: Prisma.NotificationSettingCountArgs<ExtArgs>
            result: $Utils.Optional<NotificationSettingCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    currencies?: CurrenciesOmit
    locale?: LocaleOmit
    user?: UserOmit
    account?: AccountOmit
    session?: SessionOmit
    loginActivity?: LoginActivityOmit
    verificationToken?: VerificationTokenOmit
    subscription?: SubscriptionOmit
    usageTracker?: UsageTrackerOmit
    backupCodes?: BackupCodesOmit
    activityLogs?: ActivityLogsOmit
    notificationSetting?: NotificationSettingOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    accounts: number
    sessions: number
    usageTrackers: number
    backupCodes: number
    loginActivity: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    accounts?: boolean | UserCountOutputTypeCountAccountsArgs
    sessions?: boolean | UserCountOutputTypeCountSessionsArgs
    usageTrackers?: boolean | UserCountOutputTypeCountUsageTrackersArgs
    backupCodes?: boolean | UserCountOutputTypeCountBackupCodesArgs
    loginActivity?: boolean | UserCountOutputTypeCountLoginActivityArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountAccountsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AccountWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountSessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SessionWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountUsageTrackersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UsageTrackerWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountBackupCodesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BackupCodesWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountLoginActivityArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LoginActivityWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Currencies
   */

  export type AggregateCurrencies = {
    _count: CurrenciesCountAggregateOutputType | null
    _min: CurrenciesMinAggregateOutputType | null
    _max: CurrenciesMaxAggregateOutputType | null
  }

  export type CurrenciesMinAggregateOutputType = {
    id: string | null
    currency: $Enums.Currency | null
    label: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CurrenciesMaxAggregateOutputType = {
    id: string | null
    currency: $Enums.Currency | null
    label: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CurrenciesCountAggregateOutputType = {
    id: number
    currency: number
    label: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CurrenciesMinAggregateInputType = {
    id?: true
    currency?: true
    label?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CurrenciesMaxAggregateInputType = {
    id?: true
    currency?: true
    label?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CurrenciesCountAggregateInputType = {
    id?: true
    currency?: true
    label?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CurrenciesAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Currencies to aggregate.
     */
    where?: CurrenciesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Currencies to fetch.
     */
    orderBy?: CurrenciesOrderByWithRelationInput | CurrenciesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CurrenciesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Currencies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Currencies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Currencies
    **/
    _count?: true | CurrenciesCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CurrenciesMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CurrenciesMaxAggregateInputType
  }

  export type GetCurrenciesAggregateType<T extends CurrenciesAggregateArgs> = {
        [P in keyof T & keyof AggregateCurrencies]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCurrencies[P]>
      : GetScalarType<T[P], AggregateCurrencies[P]>
  }




  export type CurrenciesGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CurrenciesWhereInput
    orderBy?: CurrenciesOrderByWithAggregationInput | CurrenciesOrderByWithAggregationInput[]
    by: CurrenciesScalarFieldEnum[] | CurrenciesScalarFieldEnum
    having?: CurrenciesScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CurrenciesCountAggregateInputType | true
    _min?: CurrenciesMinAggregateInputType
    _max?: CurrenciesMaxAggregateInputType
  }

  export type CurrenciesGroupByOutputType = {
    id: string
    currency: $Enums.Currency
    label: string
    createdAt: Date
    updatedAt: Date
    _count: CurrenciesCountAggregateOutputType | null
    _min: CurrenciesMinAggregateOutputType | null
    _max: CurrenciesMaxAggregateOutputType | null
  }

  type GetCurrenciesGroupByPayload<T extends CurrenciesGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CurrenciesGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CurrenciesGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CurrenciesGroupByOutputType[P]>
            : GetScalarType<T[P], CurrenciesGroupByOutputType[P]>
        }
      >
    >


  export type CurrenciesSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    currency?: boolean
    label?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["currencies"]>

  export type CurrenciesSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    currency?: boolean
    label?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["currencies"]>

  export type CurrenciesSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    currency?: boolean
    label?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["currencies"]>

  export type CurrenciesSelectScalar = {
    id?: boolean
    currency?: boolean
    label?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CurrenciesOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "currency" | "label" | "createdAt" | "updatedAt", ExtArgs["result"]["currencies"]>

  export type $CurrenciesPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Currencies"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      currency: $Enums.Currency
      label: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["currencies"]>
    composites: {}
  }

  type CurrenciesGetPayload<S extends boolean | null | undefined | CurrenciesDefaultArgs> = $Result.GetResult<Prisma.$CurrenciesPayload, S>

  type CurrenciesCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CurrenciesFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CurrenciesCountAggregateInputType | true
    }

  export interface CurrenciesDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Currencies'], meta: { name: 'Currencies' } }
    /**
     * Find zero or one Currencies that matches the filter.
     * @param {CurrenciesFindUniqueArgs} args - Arguments to find a Currencies
     * @example
     * // Get one Currencies
     * const currencies = await prisma.currencies.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CurrenciesFindUniqueArgs>(args: SelectSubset<T, CurrenciesFindUniqueArgs<ExtArgs>>): Prisma__CurrenciesClient<$Result.GetResult<Prisma.$CurrenciesPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Currencies that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CurrenciesFindUniqueOrThrowArgs} args - Arguments to find a Currencies
     * @example
     * // Get one Currencies
     * const currencies = await prisma.currencies.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CurrenciesFindUniqueOrThrowArgs>(args: SelectSubset<T, CurrenciesFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CurrenciesClient<$Result.GetResult<Prisma.$CurrenciesPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Currencies that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CurrenciesFindFirstArgs} args - Arguments to find a Currencies
     * @example
     * // Get one Currencies
     * const currencies = await prisma.currencies.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CurrenciesFindFirstArgs>(args?: SelectSubset<T, CurrenciesFindFirstArgs<ExtArgs>>): Prisma__CurrenciesClient<$Result.GetResult<Prisma.$CurrenciesPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Currencies that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CurrenciesFindFirstOrThrowArgs} args - Arguments to find a Currencies
     * @example
     * // Get one Currencies
     * const currencies = await prisma.currencies.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CurrenciesFindFirstOrThrowArgs>(args?: SelectSubset<T, CurrenciesFindFirstOrThrowArgs<ExtArgs>>): Prisma__CurrenciesClient<$Result.GetResult<Prisma.$CurrenciesPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Currencies that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CurrenciesFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Currencies
     * const currencies = await prisma.currencies.findMany()
     * 
     * // Get first 10 Currencies
     * const currencies = await prisma.currencies.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const currenciesWithIdOnly = await prisma.currencies.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CurrenciesFindManyArgs>(args?: SelectSubset<T, CurrenciesFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CurrenciesPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Currencies.
     * @param {CurrenciesCreateArgs} args - Arguments to create a Currencies.
     * @example
     * // Create one Currencies
     * const Currencies = await prisma.currencies.create({
     *   data: {
     *     // ... data to create a Currencies
     *   }
     * })
     * 
     */
    create<T extends CurrenciesCreateArgs>(args: SelectSubset<T, CurrenciesCreateArgs<ExtArgs>>): Prisma__CurrenciesClient<$Result.GetResult<Prisma.$CurrenciesPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Currencies.
     * @param {CurrenciesCreateManyArgs} args - Arguments to create many Currencies.
     * @example
     * // Create many Currencies
     * const currencies = await prisma.currencies.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CurrenciesCreateManyArgs>(args?: SelectSubset<T, CurrenciesCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Currencies and returns the data saved in the database.
     * @param {CurrenciesCreateManyAndReturnArgs} args - Arguments to create many Currencies.
     * @example
     * // Create many Currencies
     * const currencies = await prisma.currencies.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Currencies and only return the `id`
     * const currenciesWithIdOnly = await prisma.currencies.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CurrenciesCreateManyAndReturnArgs>(args?: SelectSubset<T, CurrenciesCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CurrenciesPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Currencies.
     * @param {CurrenciesDeleteArgs} args - Arguments to delete one Currencies.
     * @example
     * // Delete one Currencies
     * const Currencies = await prisma.currencies.delete({
     *   where: {
     *     // ... filter to delete one Currencies
     *   }
     * })
     * 
     */
    delete<T extends CurrenciesDeleteArgs>(args: SelectSubset<T, CurrenciesDeleteArgs<ExtArgs>>): Prisma__CurrenciesClient<$Result.GetResult<Prisma.$CurrenciesPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Currencies.
     * @param {CurrenciesUpdateArgs} args - Arguments to update one Currencies.
     * @example
     * // Update one Currencies
     * const currencies = await prisma.currencies.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CurrenciesUpdateArgs>(args: SelectSubset<T, CurrenciesUpdateArgs<ExtArgs>>): Prisma__CurrenciesClient<$Result.GetResult<Prisma.$CurrenciesPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Currencies.
     * @param {CurrenciesDeleteManyArgs} args - Arguments to filter Currencies to delete.
     * @example
     * // Delete a few Currencies
     * const { count } = await prisma.currencies.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CurrenciesDeleteManyArgs>(args?: SelectSubset<T, CurrenciesDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Currencies.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CurrenciesUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Currencies
     * const currencies = await prisma.currencies.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CurrenciesUpdateManyArgs>(args: SelectSubset<T, CurrenciesUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Currencies and returns the data updated in the database.
     * @param {CurrenciesUpdateManyAndReturnArgs} args - Arguments to update many Currencies.
     * @example
     * // Update many Currencies
     * const currencies = await prisma.currencies.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Currencies and only return the `id`
     * const currenciesWithIdOnly = await prisma.currencies.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CurrenciesUpdateManyAndReturnArgs>(args: SelectSubset<T, CurrenciesUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CurrenciesPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Currencies.
     * @param {CurrenciesUpsertArgs} args - Arguments to update or create a Currencies.
     * @example
     * // Update or create a Currencies
     * const currencies = await prisma.currencies.upsert({
     *   create: {
     *     // ... data to create a Currencies
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Currencies we want to update
     *   }
     * })
     */
    upsert<T extends CurrenciesUpsertArgs>(args: SelectSubset<T, CurrenciesUpsertArgs<ExtArgs>>): Prisma__CurrenciesClient<$Result.GetResult<Prisma.$CurrenciesPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Currencies.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CurrenciesCountArgs} args - Arguments to filter Currencies to count.
     * @example
     * // Count the number of Currencies
     * const count = await prisma.currencies.count({
     *   where: {
     *     // ... the filter for the Currencies we want to count
     *   }
     * })
    **/
    count<T extends CurrenciesCountArgs>(
      args?: Subset<T, CurrenciesCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CurrenciesCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Currencies.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CurrenciesAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CurrenciesAggregateArgs>(args: Subset<T, CurrenciesAggregateArgs>): Prisma.PrismaPromise<GetCurrenciesAggregateType<T>>

    /**
     * Group by Currencies.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CurrenciesGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CurrenciesGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CurrenciesGroupByArgs['orderBy'] }
        : { orderBy?: CurrenciesGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CurrenciesGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCurrenciesGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Currencies model
   */
  readonly fields: CurrenciesFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Currencies.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CurrenciesClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Currencies model
   */
  interface CurrenciesFieldRefs {
    readonly id: FieldRef<"Currencies", 'String'>
    readonly currency: FieldRef<"Currencies", 'Currency'>
    readonly label: FieldRef<"Currencies", 'String'>
    readonly createdAt: FieldRef<"Currencies", 'DateTime'>
    readonly updatedAt: FieldRef<"Currencies", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Currencies findUnique
   */
  export type CurrenciesFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Currencies
     */
    select?: CurrenciesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Currencies
     */
    omit?: CurrenciesOmit<ExtArgs> | null
    /**
     * Filter, which Currencies to fetch.
     */
    where: CurrenciesWhereUniqueInput
  }

  /**
   * Currencies findUniqueOrThrow
   */
  export type CurrenciesFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Currencies
     */
    select?: CurrenciesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Currencies
     */
    omit?: CurrenciesOmit<ExtArgs> | null
    /**
     * Filter, which Currencies to fetch.
     */
    where: CurrenciesWhereUniqueInput
  }

  /**
   * Currencies findFirst
   */
  export type CurrenciesFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Currencies
     */
    select?: CurrenciesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Currencies
     */
    omit?: CurrenciesOmit<ExtArgs> | null
    /**
     * Filter, which Currencies to fetch.
     */
    where?: CurrenciesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Currencies to fetch.
     */
    orderBy?: CurrenciesOrderByWithRelationInput | CurrenciesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Currencies.
     */
    cursor?: CurrenciesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Currencies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Currencies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Currencies.
     */
    distinct?: CurrenciesScalarFieldEnum | CurrenciesScalarFieldEnum[]
  }

  /**
   * Currencies findFirstOrThrow
   */
  export type CurrenciesFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Currencies
     */
    select?: CurrenciesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Currencies
     */
    omit?: CurrenciesOmit<ExtArgs> | null
    /**
     * Filter, which Currencies to fetch.
     */
    where?: CurrenciesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Currencies to fetch.
     */
    orderBy?: CurrenciesOrderByWithRelationInput | CurrenciesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Currencies.
     */
    cursor?: CurrenciesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Currencies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Currencies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Currencies.
     */
    distinct?: CurrenciesScalarFieldEnum | CurrenciesScalarFieldEnum[]
  }

  /**
   * Currencies findMany
   */
  export type CurrenciesFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Currencies
     */
    select?: CurrenciesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Currencies
     */
    omit?: CurrenciesOmit<ExtArgs> | null
    /**
     * Filter, which Currencies to fetch.
     */
    where?: CurrenciesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Currencies to fetch.
     */
    orderBy?: CurrenciesOrderByWithRelationInput | CurrenciesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Currencies.
     */
    cursor?: CurrenciesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Currencies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Currencies.
     */
    skip?: number
    distinct?: CurrenciesScalarFieldEnum | CurrenciesScalarFieldEnum[]
  }

  /**
   * Currencies create
   */
  export type CurrenciesCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Currencies
     */
    select?: CurrenciesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Currencies
     */
    omit?: CurrenciesOmit<ExtArgs> | null
    /**
     * The data needed to create a Currencies.
     */
    data: XOR<CurrenciesCreateInput, CurrenciesUncheckedCreateInput>
  }

  /**
   * Currencies createMany
   */
  export type CurrenciesCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Currencies.
     */
    data: CurrenciesCreateManyInput | CurrenciesCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Currencies createManyAndReturn
   */
  export type CurrenciesCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Currencies
     */
    select?: CurrenciesSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Currencies
     */
    omit?: CurrenciesOmit<ExtArgs> | null
    /**
     * The data used to create many Currencies.
     */
    data: CurrenciesCreateManyInput | CurrenciesCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Currencies update
   */
  export type CurrenciesUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Currencies
     */
    select?: CurrenciesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Currencies
     */
    omit?: CurrenciesOmit<ExtArgs> | null
    /**
     * The data needed to update a Currencies.
     */
    data: XOR<CurrenciesUpdateInput, CurrenciesUncheckedUpdateInput>
    /**
     * Choose, which Currencies to update.
     */
    where: CurrenciesWhereUniqueInput
  }

  /**
   * Currencies updateMany
   */
  export type CurrenciesUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Currencies.
     */
    data: XOR<CurrenciesUpdateManyMutationInput, CurrenciesUncheckedUpdateManyInput>
    /**
     * Filter which Currencies to update
     */
    where?: CurrenciesWhereInput
    /**
     * Limit how many Currencies to update.
     */
    limit?: number
  }

  /**
   * Currencies updateManyAndReturn
   */
  export type CurrenciesUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Currencies
     */
    select?: CurrenciesSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Currencies
     */
    omit?: CurrenciesOmit<ExtArgs> | null
    /**
     * The data used to update Currencies.
     */
    data: XOR<CurrenciesUpdateManyMutationInput, CurrenciesUncheckedUpdateManyInput>
    /**
     * Filter which Currencies to update
     */
    where?: CurrenciesWhereInput
    /**
     * Limit how many Currencies to update.
     */
    limit?: number
  }

  /**
   * Currencies upsert
   */
  export type CurrenciesUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Currencies
     */
    select?: CurrenciesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Currencies
     */
    omit?: CurrenciesOmit<ExtArgs> | null
    /**
     * The filter to search for the Currencies to update in case it exists.
     */
    where: CurrenciesWhereUniqueInput
    /**
     * In case the Currencies found by the `where` argument doesn't exist, create a new Currencies with this data.
     */
    create: XOR<CurrenciesCreateInput, CurrenciesUncheckedCreateInput>
    /**
     * In case the Currencies was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CurrenciesUpdateInput, CurrenciesUncheckedUpdateInput>
  }

  /**
   * Currencies delete
   */
  export type CurrenciesDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Currencies
     */
    select?: CurrenciesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Currencies
     */
    omit?: CurrenciesOmit<ExtArgs> | null
    /**
     * Filter which Currencies to delete.
     */
    where: CurrenciesWhereUniqueInput
  }

  /**
   * Currencies deleteMany
   */
  export type CurrenciesDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Currencies to delete
     */
    where?: CurrenciesWhereInput
    /**
     * Limit how many Currencies to delete.
     */
    limit?: number
  }

  /**
   * Currencies without action
   */
  export type CurrenciesDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Currencies
     */
    select?: CurrenciesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Currencies
     */
    omit?: CurrenciesOmit<ExtArgs> | null
  }


  /**
   * Model Locale
   */

  export type AggregateLocale = {
    _count: LocaleCountAggregateOutputType | null
    _min: LocaleMinAggregateOutputType | null
    _max: LocaleMaxAggregateOutputType | null
  }

  export type LocaleMinAggregateOutputType = {
    id: string | null
    language: $Enums.Language | null
    label: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LocaleMaxAggregateOutputType = {
    id: string | null
    language: $Enums.Language | null
    label: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type LocaleCountAggregateOutputType = {
    id: number
    language: number
    label: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type LocaleMinAggregateInputType = {
    id?: true
    language?: true
    label?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LocaleMaxAggregateInputType = {
    id?: true
    language?: true
    label?: true
    createdAt?: true
    updatedAt?: true
  }

  export type LocaleCountAggregateInputType = {
    id?: true
    language?: true
    label?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type LocaleAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Locale to aggregate.
     */
    where?: LocaleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locales to fetch.
     */
    orderBy?: LocaleOrderByWithRelationInput | LocaleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LocaleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locales from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locales.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Locales
    **/
    _count?: true | LocaleCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LocaleMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LocaleMaxAggregateInputType
  }

  export type GetLocaleAggregateType<T extends LocaleAggregateArgs> = {
        [P in keyof T & keyof AggregateLocale]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLocale[P]>
      : GetScalarType<T[P], AggregateLocale[P]>
  }




  export type LocaleGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LocaleWhereInput
    orderBy?: LocaleOrderByWithAggregationInput | LocaleOrderByWithAggregationInput[]
    by: LocaleScalarFieldEnum[] | LocaleScalarFieldEnum
    having?: LocaleScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LocaleCountAggregateInputType | true
    _min?: LocaleMinAggregateInputType
    _max?: LocaleMaxAggregateInputType
  }

  export type LocaleGroupByOutputType = {
    id: string
    language: $Enums.Language
    label: string
    createdAt: Date
    updatedAt: Date
    _count: LocaleCountAggregateOutputType | null
    _min: LocaleMinAggregateOutputType | null
    _max: LocaleMaxAggregateOutputType | null
  }

  type GetLocaleGroupByPayload<T extends LocaleGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LocaleGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LocaleGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LocaleGroupByOutputType[P]>
            : GetScalarType<T[P], LocaleGroupByOutputType[P]>
        }
      >
    >


  export type LocaleSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    language?: boolean
    label?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["locale"]>

  export type LocaleSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    language?: boolean
    label?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["locale"]>

  export type LocaleSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    language?: boolean
    label?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["locale"]>

  export type LocaleSelectScalar = {
    id?: boolean
    language?: boolean
    label?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type LocaleOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "language" | "label" | "createdAt" | "updatedAt", ExtArgs["result"]["locale"]>

  export type $LocalePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Locale"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      language: $Enums.Language
      label: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["locale"]>
    composites: {}
  }

  type LocaleGetPayload<S extends boolean | null | undefined | LocaleDefaultArgs> = $Result.GetResult<Prisma.$LocalePayload, S>

  type LocaleCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<LocaleFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LocaleCountAggregateInputType | true
    }

  export interface LocaleDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Locale'], meta: { name: 'Locale' } }
    /**
     * Find zero or one Locale that matches the filter.
     * @param {LocaleFindUniqueArgs} args - Arguments to find a Locale
     * @example
     * // Get one Locale
     * const locale = await prisma.locale.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LocaleFindUniqueArgs>(args: SelectSubset<T, LocaleFindUniqueArgs<ExtArgs>>): Prisma__LocaleClient<$Result.GetResult<Prisma.$LocalePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Locale that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LocaleFindUniqueOrThrowArgs} args - Arguments to find a Locale
     * @example
     * // Get one Locale
     * const locale = await prisma.locale.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LocaleFindUniqueOrThrowArgs>(args: SelectSubset<T, LocaleFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LocaleClient<$Result.GetResult<Prisma.$LocalePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Locale that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocaleFindFirstArgs} args - Arguments to find a Locale
     * @example
     * // Get one Locale
     * const locale = await prisma.locale.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LocaleFindFirstArgs>(args?: SelectSubset<T, LocaleFindFirstArgs<ExtArgs>>): Prisma__LocaleClient<$Result.GetResult<Prisma.$LocalePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Locale that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocaleFindFirstOrThrowArgs} args - Arguments to find a Locale
     * @example
     * // Get one Locale
     * const locale = await prisma.locale.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LocaleFindFirstOrThrowArgs>(args?: SelectSubset<T, LocaleFindFirstOrThrowArgs<ExtArgs>>): Prisma__LocaleClient<$Result.GetResult<Prisma.$LocalePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Locales that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocaleFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Locales
     * const locales = await prisma.locale.findMany()
     * 
     * // Get first 10 Locales
     * const locales = await prisma.locale.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const localeWithIdOnly = await prisma.locale.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LocaleFindManyArgs>(args?: SelectSubset<T, LocaleFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LocalePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Locale.
     * @param {LocaleCreateArgs} args - Arguments to create a Locale.
     * @example
     * // Create one Locale
     * const Locale = await prisma.locale.create({
     *   data: {
     *     // ... data to create a Locale
     *   }
     * })
     * 
     */
    create<T extends LocaleCreateArgs>(args: SelectSubset<T, LocaleCreateArgs<ExtArgs>>): Prisma__LocaleClient<$Result.GetResult<Prisma.$LocalePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Locales.
     * @param {LocaleCreateManyArgs} args - Arguments to create many Locales.
     * @example
     * // Create many Locales
     * const locale = await prisma.locale.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LocaleCreateManyArgs>(args?: SelectSubset<T, LocaleCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Locales and returns the data saved in the database.
     * @param {LocaleCreateManyAndReturnArgs} args - Arguments to create many Locales.
     * @example
     * // Create many Locales
     * const locale = await prisma.locale.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Locales and only return the `id`
     * const localeWithIdOnly = await prisma.locale.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LocaleCreateManyAndReturnArgs>(args?: SelectSubset<T, LocaleCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LocalePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Locale.
     * @param {LocaleDeleteArgs} args - Arguments to delete one Locale.
     * @example
     * // Delete one Locale
     * const Locale = await prisma.locale.delete({
     *   where: {
     *     // ... filter to delete one Locale
     *   }
     * })
     * 
     */
    delete<T extends LocaleDeleteArgs>(args: SelectSubset<T, LocaleDeleteArgs<ExtArgs>>): Prisma__LocaleClient<$Result.GetResult<Prisma.$LocalePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Locale.
     * @param {LocaleUpdateArgs} args - Arguments to update one Locale.
     * @example
     * // Update one Locale
     * const locale = await prisma.locale.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LocaleUpdateArgs>(args: SelectSubset<T, LocaleUpdateArgs<ExtArgs>>): Prisma__LocaleClient<$Result.GetResult<Prisma.$LocalePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Locales.
     * @param {LocaleDeleteManyArgs} args - Arguments to filter Locales to delete.
     * @example
     * // Delete a few Locales
     * const { count } = await prisma.locale.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LocaleDeleteManyArgs>(args?: SelectSubset<T, LocaleDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Locales.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocaleUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Locales
     * const locale = await prisma.locale.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LocaleUpdateManyArgs>(args: SelectSubset<T, LocaleUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Locales and returns the data updated in the database.
     * @param {LocaleUpdateManyAndReturnArgs} args - Arguments to update many Locales.
     * @example
     * // Update many Locales
     * const locale = await prisma.locale.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Locales and only return the `id`
     * const localeWithIdOnly = await prisma.locale.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends LocaleUpdateManyAndReturnArgs>(args: SelectSubset<T, LocaleUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LocalePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Locale.
     * @param {LocaleUpsertArgs} args - Arguments to update or create a Locale.
     * @example
     * // Update or create a Locale
     * const locale = await prisma.locale.upsert({
     *   create: {
     *     // ... data to create a Locale
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Locale we want to update
     *   }
     * })
     */
    upsert<T extends LocaleUpsertArgs>(args: SelectSubset<T, LocaleUpsertArgs<ExtArgs>>): Prisma__LocaleClient<$Result.GetResult<Prisma.$LocalePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Locales.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocaleCountArgs} args - Arguments to filter Locales to count.
     * @example
     * // Count the number of Locales
     * const count = await prisma.locale.count({
     *   where: {
     *     // ... the filter for the Locales we want to count
     *   }
     * })
    **/
    count<T extends LocaleCountArgs>(
      args?: Subset<T, LocaleCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LocaleCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Locale.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocaleAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LocaleAggregateArgs>(args: Subset<T, LocaleAggregateArgs>): Prisma.PrismaPromise<GetLocaleAggregateType<T>>

    /**
     * Group by Locale.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LocaleGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LocaleGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LocaleGroupByArgs['orderBy'] }
        : { orderBy?: LocaleGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LocaleGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLocaleGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Locale model
   */
  readonly fields: LocaleFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Locale.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LocaleClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Locale model
   */
  interface LocaleFieldRefs {
    readonly id: FieldRef<"Locale", 'String'>
    readonly language: FieldRef<"Locale", 'Language'>
    readonly label: FieldRef<"Locale", 'String'>
    readonly createdAt: FieldRef<"Locale", 'DateTime'>
    readonly updatedAt: FieldRef<"Locale", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Locale findUnique
   */
  export type LocaleFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Locale
     */
    select?: LocaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Locale
     */
    omit?: LocaleOmit<ExtArgs> | null
    /**
     * Filter, which Locale to fetch.
     */
    where: LocaleWhereUniqueInput
  }

  /**
   * Locale findUniqueOrThrow
   */
  export type LocaleFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Locale
     */
    select?: LocaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Locale
     */
    omit?: LocaleOmit<ExtArgs> | null
    /**
     * Filter, which Locale to fetch.
     */
    where: LocaleWhereUniqueInput
  }

  /**
   * Locale findFirst
   */
  export type LocaleFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Locale
     */
    select?: LocaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Locale
     */
    omit?: LocaleOmit<ExtArgs> | null
    /**
     * Filter, which Locale to fetch.
     */
    where?: LocaleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locales to fetch.
     */
    orderBy?: LocaleOrderByWithRelationInput | LocaleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Locales.
     */
    cursor?: LocaleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locales from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locales.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Locales.
     */
    distinct?: LocaleScalarFieldEnum | LocaleScalarFieldEnum[]
  }

  /**
   * Locale findFirstOrThrow
   */
  export type LocaleFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Locale
     */
    select?: LocaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Locale
     */
    omit?: LocaleOmit<ExtArgs> | null
    /**
     * Filter, which Locale to fetch.
     */
    where?: LocaleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locales to fetch.
     */
    orderBy?: LocaleOrderByWithRelationInput | LocaleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Locales.
     */
    cursor?: LocaleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locales from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locales.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Locales.
     */
    distinct?: LocaleScalarFieldEnum | LocaleScalarFieldEnum[]
  }

  /**
   * Locale findMany
   */
  export type LocaleFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Locale
     */
    select?: LocaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Locale
     */
    omit?: LocaleOmit<ExtArgs> | null
    /**
     * Filter, which Locales to fetch.
     */
    where?: LocaleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Locales to fetch.
     */
    orderBy?: LocaleOrderByWithRelationInput | LocaleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Locales.
     */
    cursor?: LocaleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Locales from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Locales.
     */
    skip?: number
    distinct?: LocaleScalarFieldEnum | LocaleScalarFieldEnum[]
  }

  /**
   * Locale create
   */
  export type LocaleCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Locale
     */
    select?: LocaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Locale
     */
    omit?: LocaleOmit<ExtArgs> | null
    /**
     * The data needed to create a Locale.
     */
    data: XOR<LocaleCreateInput, LocaleUncheckedCreateInput>
  }

  /**
   * Locale createMany
   */
  export type LocaleCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Locales.
     */
    data: LocaleCreateManyInput | LocaleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Locale createManyAndReturn
   */
  export type LocaleCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Locale
     */
    select?: LocaleSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Locale
     */
    omit?: LocaleOmit<ExtArgs> | null
    /**
     * The data used to create many Locales.
     */
    data: LocaleCreateManyInput | LocaleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Locale update
   */
  export type LocaleUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Locale
     */
    select?: LocaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Locale
     */
    omit?: LocaleOmit<ExtArgs> | null
    /**
     * The data needed to update a Locale.
     */
    data: XOR<LocaleUpdateInput, LocaleUncheckedUpdateInput>
    /**
     * Choose, which Locale to update.
     */
    where: LocaleWhereUniqueInput
  }

  /**
   * Locale updateMany
   */
  export type LocaleUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Locales.
     */
    data: XOR<LocaleUpdateManyMutationInput, LocaleUncheckedUpdateManyInput>
    /**
     * Filter which Locales to update
     */
    where?: LocaleWhereInput
    /**
     * Limit how many Locales to update.
     */
    limit?: number
  }

  /**
   * Locale updateManyAndReturn
   */
  export type LocaleUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Locale
     */
    select?: LocaleSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Locale
     */
    omit?: LocaleOmit<ExtArgs> | null
    /**
     * The data used to update Locales.
     */
    data: XOR<LocaleUpdateManyMutationInput, LocaleUncheckedUpdateManyInput>
    /**
     * Filter which Locales to update
     */
    where?: LocaleWhereInput
    /**
     * Limit how many Locales to update.
     */
    limit?: number
  }

  /**
   * Locale upsert
   */
  export type LocaleUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Locale
     */
    select?: LocaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Locale
     */
    omit?: LocaleOmit<ExtArgs> | null
    /**
     * The filter to search for the Locale to update in case it exists.
     */
    where: LocaleWhereUniqueInput
    /**
     * In case the Locale found by the `where` argument doesn't exist, create a new Locale with this data.
     */
    create: XOR<LocaleCreateInput, LocaleUncheckedCreateInput>
    /**
     * In case the Locale was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LocaleUpdateInput, LocaleUncheckedUpdateInput>
  }

  /**
   * Locale delete
   */
  export type LocaleDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Locale
     */
    select?: LocaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Locale
     */
    omit?: LocaleOmit<ExtArgs> | null
    /**
     * Filter which Locale to delete.
     */
    where: LocaleWhereUniqueInput
  }

  /**
   * Locale deleteMany
   */
  export type LocaleDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Locales to delete
     */
    where?: LocaleWhereInput
    /**
     * Limit how many Locales to delete.
     */
    limit?: number
  }

  /**
   * Locale without action
   */
  export type LocaleDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Locale
     */
    select?: LocaleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Locale
     */
    omit?: LocaleOmit<ExtArgs> | null
  }


  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    loginAttempts: number | null
    twoFactorAttempts: number | null
  }

  export type UserSumAggregateOutputType = {
    loginAttempts: number | null
    twoFactorAttempts: number | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    email: string | null
    password: string | null
    loginAttempts: number | null
    emailVerified: boolean | null
    emailVerifiedAt: Date | null
    firstName: string | null
    lastName: string | null
    avatar: string | null
    lastLoginAt: Date | null
    twoFactorAttempts: number | null
    twoFactorEnabled: boolean | null
    twoFactorSecret: string | null
    twoFactorLastUsedAt: Date | null
    currency: $Enums.Currency | null
    language: $Enums.Language | null
    timezone: string | null
    dateFormat: $Enums.DateFormat | null
    scheduledDeletionAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    email: string | null
    password: string | null
    loginAttempts: number | null
    emailVerified: boolean | null
    emailVerifiedAt: Date | null
    firstName: string | null
    lastName: string | null
    avatar: string | null
    lastLoginAt: Date | null
    twoFactorAttempts: number | null
    twoFactorEnabled: boolean | null
    twoFactorSecret: string | null
    twoFactorLastUsedAt: Date | null
    currency: $Enums.Currency | null
    language: $Enums.Language | null
    timezone: string | null
    dateFormat: $Enums.DateFormat | null
    scheduledDeletionAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    password: number
    loginAttempts: number
    emailVerified: number
    emailVerifiedAt: number
    firstName: number
    lastName: number
    avatar: number
    lastLoginAt: number
    twoFactorAttempts: number
    twoFactorEnabled: number
    twoFactorSecret: number
    twoFactorLastUsedAt: number
    currency: number
    language: number
    timezone: number
    dateFormat: number
    scheduledDeletionAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    loginAttempts?: true
    twoFactorAttempts?: true
  }

  export type UserSumAggregateInputType = {
    loginAttempts?: true
    twoFactorAttempts?: true
  }

  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    password?: true
    loginAttempts?: true
    emailVerified?: true
    emailVerifiedAt?: true
    firstName?: true
    lastName?: true
    avatar?: true
    lastLoginAt?: true
    twoFactorAttempts?: true
    twoFactorEnabled?: true
    twoFactorSecret?: true
    twoFactorLastUsedAt?: true
    currency?: true
    language?: true
    timezone?: true
    dateFormat?: true
    scheduledDeletionAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    password?: true
    loginAttempts?: true
    emailVerified?: true
    emailVerifiedAt?: true
    firstName?: true
    lastName?: true
    avatar?: true
    lastLoginAt?: true
    twoFactorAttempts?: true
    twoFactorEnabled?: true
    twoFactorSecret?: true
    twoFactorLastUsedAt?: true
    currency?: true
    language?: true
    timezone?: true
    dateFormat?: true
    scheduledDeletionAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    password?: true
    loginAttempts?: true
    emailVerified?: true
    emailVerifiedAt?: true
    firstName?: true
    lastName?: true
    avatar?: true
    lastLoginAt?: true
    twoFactorAttempts?: true
    twoFactorEnabled?: true
    twoFactorSecret?: true
    twoFactorLastUsedAt?: true
    currency?: true
    language?: true
    timezone?: true
    dateFormat?: true
    scheduledDeletionAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    email: string
    password: string | null
    loginAttempts: number
    emailVerified: boolean
    emailVerifiedAt: Date | null
    firstName: string
    lastName: string
    avatar: string | null
    lastLoginAt: Date | null
    twoFactorAttempts: number
    twoFactorEnabled: boolean
    twoFactorSecret: string | null
    twoFactorLastUsedAt: Date | null
    currency: $Enums.Currency
    language: $Enums.Language
    timezone: string
    dateFormat: $Enums.DateFormat
    scheduledDeletionAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    password?: boolean
    loginAttempts?: boolean
    emailVerified?: boolean
    emailVerifiedAt?: boolean
    firstName?: boolean
    lastName?: boolean
    avatar?: boolean
    lastLoginAt?: boolean
    twoFactorAttempts?: boolean
    twoFactorEnabled?: boolean
    twoFactorSecret?: boolean
    twoFactorLastUsedAt?: boolean
    currency?: boolean
    language?: boolean
    timezone?: boolean
    dateFormat?: boolean
    scheduledDeletionAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    accounts?: boolean | User$accountsArgs<ExtArgs>
    sessions?: boolean | User$sessionsArgs<ExtArgs>
    subscription?: boolean | User$subscriptionArgs<ExtArgs>
    usageTrackers?: boolean | User$usageTrackersArgs<ExtArgs>
    backupCodes?: boolean | User$backupCodesArgs<ExtArgs>
    loginActivity?: boolean | User$loginActivityArgs<ExtArgs>
    setting?: boolean | User$settingArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    password?: boolean
    loginAttempts?: boolean
    emailVerified?: boolean
    emailVerifiedAt?: boolean
    firstName?: boolean
    lastName?: boolean
    avatar?: boolean
    lastLoginAt?: boolean
    twoFactorAttempts?: boolean
    twoFactorEnabled?: boolean
    twoFactorSecret?: boolean
    twoFactorLastUsedAt?: boolean
    currency?: boolean
    language?: boolean
    timezone?: boolean
    dateFormat?: boolean
    scheduledDeletionAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    password?: boolean
    loginAttempts?: boolean
    emailVerified?: boolean
    emailVerifiedAt?: boolean
    firstName?: boolean
    lastName?: boolean
    avatar?: boolean
    lastLoginAt?: boolean
    twoFactorAttempts?: boolean
    twoFactorEnabled?: boolean
    twoFactorSecret?: boolean
    twoFactorLastUsedAt?: boolean
    currency?: boolean
    language?: boolean
    timezone?: boolean
    dateFormat?: boolean
    scheduledDeletionAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    password?: boolean
    loginAttempts?: boolean
    emailVerified?: boolean
    emailVerifiedAt?: boolean
    firstName?: boolean
    lastName?: boolean
    avatar?: boolean
    lastLoginAt?: boolean
    twoFactorAttempts?: boolean
    twoFactorEnabled?: boolean
    twoFactorSecret?: boolean
    twoFactorLastUsedAt?: boolean
    currency?: boolean
    language?: boolean
    timezone?: boolean
    dateFormat?: boolean
    scheduledDeletionAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "email" | "password" | "loginAttempts" | "emailVerified" | "emailVerifiedAt" | "firstName" | "lastName" | "avatar" | "lastLoginAt" | "twoFactorAttempts" | "twoFactorEnabled" | "twoFactorSecret" | "twoFactorLastUsedAt" | "currency" | "language" | "timezone" | "dateFormat" | "scheduledDeletionAt" | "createdAt" | "updatedAt", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    accounts?: boolean | User$accountsArgs<ExtArgs>
    sessions?: boolean | User$sessionsArgs<ExtArgs>
    subscription?: boolean | User$subscriptionArgs<ExtArgs>
    usageTrackers?: boolean | User$usageTrackersArgs<ExtArgs>
    backupCodes?: boolean | User$backupCodesArgs<ExtArgs>
    loginActivity?: boolean | User$loginActivityArgs<ExtArgs>
    setting?: boolean | User$settingArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      accounts: Prisma.$AccountPayload<ExtArgs>[]
      sessions: Prisma.$SessionPayload<ExtArgs>[]
      subscription: Prisma.$SubscriptionPayload<ExtArgs> | null
      usageTrackers: Prisma.$UsageTrackerPayload<ExtArgs>[]
      backupCodes: Prisma.$BackupCodesPayload<ExtArgs>[]
      loginActivity: Prisma.$LoginActivityPayload<ExtArgs>[]
      setting: Prisma.$NotificationSettingPayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string
      password: string | null
      loginAttempts: number
      emailVerified: boolean
      emailVerifiedAt: Date | null
      firstName: string
      lastName: string
      avatar: string | null
      lastLoginAt: Date | null
      twoFactorAttempts: number
      twoFactorEnabled: boolean
      twoFactorSecret: string | null
      twoFactorLastUsedAt: Date | null
      currency: $Enums.Currency
      language: $Enums.Language
      timezone: string
      dateFormat: $Enums.DateFormat
      scheduledDeletionAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    accounts<T extends User$accountsArgs<ExtArgs> = {}>(args?: Subset<T, User$accountsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    sessions<T extends User$sessionsArgs<ExtArgs> = {}>(args?: Subset<T, User$sessionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    subscription<T extends User$subscriptionArgs<ExtArgs> = {}>(args?: Subset<T, User$subscriptionArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    usageTrackers<T extends User$usageTrackersArgs<ExtArgs> = {}>(args?: Subset<T, User$usageTrackersArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UsageTrackerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    backupCodes<T extends User$backupCodesArgs<ExtArgs> = {}>(args?: Subset<T, User$backupCodesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BackupCodesPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    loginActivity<T extends User$loginActivityArgs<ExtArgs> = {}>(args?: Subset<T, User$loginActivityArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LoginActivityPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    setting<T extends User$settingArgs<ExtArgs> = {}>(args?: Subset<T, User$settingArgs<ExtArgs>>): Prisma__NotificationSettingClient<$Result.GetResult<Prisma.$NotificationSettingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly password: FieldRef<"User", 'String'>
    readonly loginAttempts: FieldRef<"User", 'Int'>
    readonly emailVerified: FieldRef<"User", 'Boolean'>
    readonly emailVerifiedAt: FieldRef<"User", 'DateTime'>
    readonly firstName: FieldRef<"User", 'String'>
    readonly lastName: FieldRef<"User", 'String'>
    readonly avatar: FieldRef<"User", 'String'>
    readonly lastLoginAt: FieldRef<"User", 'DateTime'>
    readonly twoFactorAttempts: FieldRef<"User", 'Int'>
    readonly twoFactorEnabled: FieldRef<"User", 'Boolean'>
    readonly twoFactorSecret: FieldRef<"User", 'String'>
    readonly twoFactorLastUsedAt: FieldRef<"User", 'DateTime'>
    readonly currency: FieldRef<"User", 'Currency'>
    readonly language: FieldRef<"User", 'Language'>
    readonly timezone: FieldRef<"User", 'String'>
    readonly dateFormat: FieldRef<"User", 'DateFormat'>
    readonly scheduledDeletionAt: FieldRef<"User", 'DateTime'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
    readonly updatedAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.accounts
   */
  export type User$accountsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    where?: AccountWhereInput
    orderBy?: AccountOrderByWithRelationInput | AccountOrderByWithRelationInput[]
    cursor?: AccountWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AccountScalarFieldEnum | AccountScalarFieldEnum[]
  }

  /**
   * User.sessions
   */
  export type User$sessionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    where?: SessionWhereInput
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    cursor?: SessionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * User.subscription
   */
  export type User$subscriptionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    where?: SubscriptionWhereInput
  }

  /**
   * User.usageTrackers
   */
  export type User$usageTrackersArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageTracker
     */
    select?: UsageTrackerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UsageTracker
     */
    omit?: UsageTrackerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UsageTrackerInclude<ExtArgs> | null
    where?: UsageTrackerWhereInput
    orderBy?: UsageTrackerOrderByWithRelationInput | UsageTrackerOrderByWithRelationInput[]
    cursor?: UsageTrackerWhereUniqueInput
    take?: number
    skip?: number
    distinct?: UsageTrackerScalarFieldEnum | UsageTrackerScalarFieldEnum[]
  }

  /**
   * User.backupCodes
   */
  export type User$backupCodesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupCodes
     */
    select?: BackupCodesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackupCodes
     */
    omit?: BackupCodesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackupCodesInclude<ExtArgs> | null
    where?: BackupCodesWhereInput
    orderBy?: BackupCodesOrderByWithRelationInput | BackupCodesOrderByWithRelationInput[]
    cursor?: BackupCodesWhereUniqueInput
    take?: number
    skip?: number
    distinct?: BackupCodesScalarFieldEnum | BackupCodesScalarFieldEnum[]
  }

  /**
   * User.loginActivity
   */
  export type User$loginActivityArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginActivity
     */
    select?: LoginActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoginActivity
     */
    omit?: LoginActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoginActivityInclude<ExtArgs> | null
    where?: LoginActivityWhereInput
    orderBy?: LoginActivityOrderByWithRelationInput | LoginActivityOrderByWithRelationInput[]
    cursor?: LoginActivityWhereUniqueInput
    take?: number
    skip?: number
    distinct?: LoginActivityScalarFieldEnum | LoginActivityScalarFieldEnum[]
  }

  /**
   * User.setting
   */
  export type User$settingArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationSetting
     */
    select?: NotificationSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationSetting
     */
    omit?: NotificationSettingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationSettingInclude<ExtArgs> | null
    where?: NotificationSettingWhereInput
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Account
   */

  export type AggregateAccount = {
    _count: AccountCountAggregateOutputType | null
    _avg: AccountAvgAggregateOutputType | null
    _sum: AccountSumAggregateOutputType | null
    _min: AccountMinAggregateOutputType | null
    _max: AccountMaxAggregateOutputType | null
  }

  export type AccountAvgAggregateOutputType = {
    expiresAt: number | null
  }

  export type AccountSumAggregateOutputType = {
    expiresAt: number | null
  }

  export type AccountMinAggregateOutputType = {
    id: string | null
    userId: string | null
    type: $Enums.AccountType | null
    provider: $Enums.AccountProvider | null
    providerAccountId: string | null
    refreshToken: string | null
    accessToken: string | null
    expiresAt: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AccountMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    type: $Enums.AccountType | null
    provider: $Enums.AccountProvider | null
    providerAccountId: string | null
    refreshToken: string | null
    accessToken: string | null
    expiresAt: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type AccountCountAggregateOutputType = {
    id: number
    userId: number
    type: number
    provider: number
    providerAccountId: number
    refreshToken: number
    accessToken: number
    expiresAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type AccountAvgAggregateInputType = {
    expiresAt?: true
  }

  export type AccountSumAggregateInputType = {
    expiresAt?: true
  }

  export type AccountMinAggregateInputType = {
    id?: true
    userId?: true
    type?: true
    provider?: true
    providerAccountId?: true
    refreshToken?: true
    accessToken?: true
    expiresAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AccountMaxAggregateInputType = {
    id?: true
    userId?: true
    type?: true
    provider?: true
    providerAccountId?: true
    refreshToken?: true
    accessToken?: true
    expiresAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type AccountCountAggregateInputType = {
    id?: true
    userId?: true
    type?: true
    provider?: true
    providerAccountId?: true
    refreshToken?: true
    accessToken?: true
    expiresAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type AccountAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Account to aggregate.
     */
    where?: AccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Accounts to fetch.
     */
    orderBy?: AccountOrderByWithRelationInput | AccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Accounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Accounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Accounts
    **/
    _count?: true | AccountCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AccountAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AccountSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AccountMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AccountMaxAggregateInputType
  }

  export type GetAccountAggregateType<T extends AccountAggregateArgs> = {
        [P in keyof T & keyof AggregateAccount]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAccount[P]>
      : GetScalarType<T[P], AggregateAccount[P]>
  }




  export type AccountGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AccountWhereInput
    orderBy?: AccountOrderByWithAggregationInput | AccountOrderByWithAggregationInput[]
    by: AccountScalarFieldEnum[] | AccountScalarFieldEnum
    having?: AccountScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AccountCountAggregateInputType | true
    _avg?: AccountAvgAggregateInputType
    _sum?: AccountSumAggregateInputType
    _min?: AccountMinAggregateInputType
    _max?: AccountMaxAggregateInputType
  }

  export type AccountGroupByOutputType = {
    id: string
    userId: string
    type: $Enums.AccountType
    provider: $Enums.AccountProvider
    providerAccountId: string
    refreshToken: string | null
    accessToken: string | null
    expiresAt: number | null
    createdAt: Date
    updatedAt: Date
    _count: AccountCountAggregateOutputType | null
    _avg: AccountAvgAggregateOutputType | null
    _sum: AccountSumAggregateOutputType | null
    _min: AccountMinAggregateOutputType | null
    _max: AccountMaxAggregateOutputType | null
  }

  type GetAccountGroupByPayload<T extends AccountGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AccountGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AccountGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AccountGroupByOutputType[P]>
            : GetScalarType<T[P], AccountGroupByOutputType[P]>
        }
      >
    >


  export type AccountSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    type?: boolean
    provider?: boolean
    providerAccountId?: boolean
    refreshToken?: boolean
    accessToken?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["account"]>

  export type AccountSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    type?: boolean
    provider?: boolean
    providerAccountId?: boolean
    refreshToken?: boolean
    accessToken?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["account"]>

  export type AccountSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    type?: boolean
    provider?: boolean
    providerAccountId?: boolean
    refreshToken?: boolean
    accessToken?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["account"]>

  export type AccountSelectScalar = {
    id?: boolean
    userId?: boolean
    type?: boolean
    provider?: boolean
    providerAccountId?: boolean
    refreshToken?: boolean
    accessToken?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type AccountOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "type" | "provider" | "providerAccountId" | "refreshToken" | "accessToken" | "expiresAt" | "createdAt" | "updatedAt", ExtArgs["result"]["account"]>
  export type AccountInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type AccountIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type AccountIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $AccountPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Account"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      type: $Enums.AccountType
      provider: $Enums.AccountProvider
      providerAccountId: string
      refreshToken: string | null
      accessToken: string | null
      expiresAt: number | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["account"]>
    composites: {}
  }

  type AccountGetPayload<S extends boolean | null | undefined | AccountDefaultArgs> = $Result.GetResult<Prisma.$AccountPayload, S>

  type AccountCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AccountFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AccountCountAggregateInputType | true
    }

  export interface AccountDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Account'], meta: { name: 'Account' } }
    /**
     * Find zero or one Account that matches the filter.
     * @param {AccountFindUniqueArgs} args - Arguments to find a Account
     * @example
     * // Get one Account
     * const account = await prisma.account.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AccountFindUniqueArgs>(args: SelectSubset<T, AccountFindUniqueArgs<ExtArgs>>): Prisma__AccountClient<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Account that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AccountFindUniqueOrThrowArgs} args - Arguments to find a Account
     * @example
     * // Get one Account
     * const account = await prisma.account.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AccountFindUniqueOrThrowArgs>(args: SelectSubset<T, AccountFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AccountClient<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Account that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountFindFirstArgs} args - Arguments to find a Account
     * @example
     * // Get one Account
     * const account = await prisma.account.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AccountFindFirstArgs>(args?: SelectSubset<T, AccountFindFirstArgs<ExtArgs>>): Prisma__AccountClient<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Account that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountFindFirstOrThrowArgs} args - Arguments to find a Account
     * @example
     * // Get one Account
     * const account = await prisma.account.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AccountFindFirstOrThrowArgs>(args?: SelectSubset<T, AccountFindFirstOrThrowArgs<ExtArgs>>): Prisma__AccountClient<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Accounts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Accounts
     * const accounts = await prisma.account.findMany()
     * 
     * // Get first 10 Accounts
     * const accounts = await prisma.account.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const accountWithIdOnly = await prisma.account.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AccountFindManyArgs>(args?: SelectSubset<T, AccountFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Account.
     * @param {AccountCreateArgs} args - Arguments to create a Account.
     * @example
     * // Create one Account
     * const Account = await prisma.account.create({
     *   data: {
     *     // ... data to create a Account
     *   }
     * })
     * 
     */
    create<T extends AccountCreateArgs>(args: SelectSubset<T, AccountCreateArgs<ExtArgs>>): Prisma__AccountClient<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Accounts.
     * @param {AccountCreateManyArgs} args - Arguments to create many Accounts.
     * @example
     * // Create many Accounts
     * const account = await prisma.account.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AccountCreateManyArgs>(args?: SelectSubset<T, AccountCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Accounts and returns the data saved in the database.
     * @param {AccountCreateManyAndReturnArgs} args - Arguments to create many Accounts.
     * @example
     * // Create many Accounts
     * const account = await prisma.account.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Accounts and only return the `id`
     * const accountWithIdOnly = await prisma.account.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AccountCreateManyAndReturnArgs>(args?: SelectSubset<T, AccountCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Account.
     * @param {AccountDeleteArgs} args - Arguments to delete one Account.
     * @example
     * // Delete one Account
     * const Account = await prisma.account.delete({
     *   where: {
     *     // ... filter to delete one Account
     *   }
     * })
     * 
     */
    delete<T extends AccountDeleteArgs>(args: SelectSubset<T, AccountDeleteArgs<ExtArgs>>): Prisma__AccountClient<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Account.
     * @param {AccountUpdateArgs} args - Arguments to update one Account.
     * @example
     * // Update one Account
     * const account = await prisma.account.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AccountUpdateArgs>(args: SelectSubset<T, AccountUpdateArgs<ExtArgs>>): Prisma__AccountClient<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Accounts.
     * @param {AccountDeleteManyArgs} args - Arguments to filter Accounts to delete.
     * @example
     * // Delete a few Accounts
     * const { count } = await prisma.account.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AccountDeleteManyArgs>(args?: SelectSubset<T, AccountDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Accounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Accounts
     * const account = await prisma.account.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AccountUpdateManyArgs>(args: SelectSubset<T, AccountUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Accounts and returns the data updated in the database.
     * @param {AccountUpdateManyAndReturnArgs} args - Arguments to update many Accounts.
     * @example
     * // Update many Accounts
     * const account = await prisma.account.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Accounts and only return the `id`
     * const accountWithIdOnly = await prisma.account.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AccountUpdateManyAndReturnArgs>(args: SelectSubset<T, AccountUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Account.
     * @param {AccountUpsertArgs} args - Arguments to update or create a Account.
     * @example
     * // Update or create a Account
     * const account = await prisma.account.upsert({
     *   create: {
     *     // ... data to create a Account
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Account we want to update
     *   }
     * })
     */
    upsert<T extends AccountUpsertArgs>(args: SelectSubset<T, AccountUpsertArgs<ExtArgs>>): Prisma__AccountClient<$Result.GetResult<Prisma.$AccountPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Accounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountCountArgs} args - Arguments to filter Accounts to count.
     * @example
     * // Count the number of Accounts
     * const count = await prisma.account.count({
     *   where: {
     *     // ... the filter for the Accounts we want to count
     *   }
     * })
    **/
    count<T extends AccountCountArgs>(
      args?: Subset<T, AccountCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AccountCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Account.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AccountAggregateArgs>(args: Subset<T, AccountAggregateArgs>): Prisma.PrismaPromise<GetAccountAggregateType<T>>

    /**
     * Group by Account.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AccountGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AccountGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AccountGroupByArgs['orderBy'] }
        : { orderBy?: AccountGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AccountGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAccountGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Account model
   */
  readonly fields: AccountFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Account.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AccountClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Account model
   */
  interface AccountFieldRefs {
    readonly id: FieldRef<"Account", 'String'>
    readonly userId: FieldRef<"Account", 'String'>
    readonly type: FieldRef<"Account", 'AccountType'>
    readonly provider: FieldRef<"Account", 'AccountProvider'>
    readonly providerAccountId: FieldRef<"Account", 'String'>
    readonly refreshToken: FieldRef<"Account", 'String'>
    readonly accessToken: FieldRef<"Account", 'String'>
    readonly expiresAt: FieldRef<"Account", 'Int'>
    readonly createdAt: FieldRef<"Account", 'DateTime'>
    readonly updatedAt: FieldRef<"Account", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Account findUnique
   */
  export type AccountFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * Filter, which Account to fetch.
     */
    where: AccountWhereUniqueInput
  }

  /**
   * Account findUniqueOrThrow
   */
  export type AccountFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * Filter, which Account to fetch.
     */
    where: AccountWhereUniqueInput
  }

  /**
   * Account findFirst
   */
  export type AccountFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * Filter, which Account to fetch.
     */
    where?: AccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Accounts to fetch.
     */
    orderBy?: AccountOrderByWithRelationInput | AccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Accounts.
     */
    cursor?: AccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Accounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Accounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Accounts.
     */
    distinct?: AccountScalarFieldEnum | AccountScalarFieldEnum[]
  }

  /**
   * Account findFirstOrThrow
   */
  export type AccountFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * Filter, which Account to fetch.
     */
    where?: AccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Accounts to fetch.
     */
    orderBy?: AccountOrderByWithRelationInput | AccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Accounts.
     */
    cursor?: AccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Accounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Accounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Accounts.
     */
    distinct?: AccountScalarFieldEnum | AccountScalarFieldEnum[]
  }

  /**
   * Account findMany
   */
  export type AccountFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * Filter, which Accounts to fetch.
     */
    where?: AccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Accounts to fetch.
     */
    orderBy?: AccountOrderByWithRelationInput | AccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Accounts.
     */
    cursor?: AccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Accounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Accounts.
     */
    skip?: number
    distinct?: AccountScalarFieldEnum | AccountScalarFieldEnum[]
  }

  /**
   * Account create
   */
  export type AccountCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * The data needed to create a Account.
     */
    data: XOR<AccountCreateInput, AccountUncheckedCreateInput>
  }

  /**
   * Account createMany
   */
  export type AccountCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Accounts.
     */
    data: AccountCreateManyInput | AccountCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Account createManyAndReturn
   */
  export type AccountCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * The data used to create many Accounts.
     */
    data: AccountCreateManyInput | AccountCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Account update
   */
  export type AccountUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * The data needed to update a Account.
     */
    data: XOR<AccountUpdateInput, AccountUncheckedUpdateInput>
    /**
     * Choose, which Account to update.
     */
    where: AccountWhereUniqueInput
  }

  /**
   * Account updateMany
   */
  export type AccountUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Accounts.
     */
    data: XOR<AccountUpdateManyMutationInput, AccountUncheckedUpdateManyInput>
    /**
     * Filter which Accounts to update
     */
    where?: AccountWhereInput
    /**
     * Limit how many Accounts to update.
     */
    limit?: number
  }

  /**
   * Account updateManyAndReturn
   */
  export type AccountUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * The data used to update Accounts.
     */
    data: XOR<AccountUpdateManyMutationInput, AccountUncheckedUpdateManyInput>
    /**
     * Filter which Accounts to update
     */
    where?: AccountWhereInput
    /**
     * Limit how many Accounts to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Account upsert
   */
  export type AccountUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * The filter to search for the Account to update in case it exists.
     */
    where: AccountWhereUniqueInput
    /**
     * In case the Account found by the `where` argument doesn't exist, create a new Account with this data.
     */
    create: XOR<AccountCreateInput, AccountUncheckedCreateInput>
    /**
     * In case the Account was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AccountUpdateInput, AccountUncheckedUpdateInput>
  }

  /**
   * Account delete
   */
  export type AccountDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
    /**
     * Filter which Account to delete.
     */
    where: AccountWhereUniqueInput
  }

  /**
   * Account deleteMany
   */
  export type AccountDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Accounts to delete
     */
    where?: AccountWhereInput
    /**
     * Limit how many Accounts to delete.
     */
    limit?: number
  }

  /**
   * Account without action
   */
  export type AccountDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Account
     */
    select?: AccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Account
     */
    omit?: AccountOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AccountInclude<ExtArgs> | null
  }


  /**
   * Model Session
   */

  export type AggregateSession = {
    _count: SessionCountAggregateOutputType | null
    _min: SessionMinAggregateOutputType | null
    _max: SessionMaxAggregateOutputType | null
  }

  export type SessionMinAggregateOutputType = {
    id: string | null
    sessionToken: string | null
    userId: string | null
    expires: Date | null
    deviceId: string | null
    userAgent: string | null
    ipAddress: string | null
    location: string | null
    lastUsedAt: Date | null
    createdAt: Date | null
  }

  export type SessionMaxAggregateOutputType = {
    id: string | null
    sessionToken: string | null
    userId: string | null
    expires: Date | null
    deviceId: string | null
    userAgent: string | null
    ipAddress: string | null
    location: string | null
    lastUsedAt: Date | null
    createdAt: Date | null
  }

  export type SessionCountAggregateOutputType = {
    id: number
    sessionToken: number
    userId: number
    expires: number
    deviceId: number
    userAgent: number
    ipAddress: number
    location: number
    lastUsedAt: number
    createdAt: number
    _all: number
  }


  export type SessionMinAggregateInputType = {
    id?: true
    sessionToken?: true
    userId?: true
    expires?: true
    deviceId?: true
    userAgent?: true
    ipAddress?: true
    location?: true
    lastUsedAt?: true
    createdAt?: true
  }

  export type SessionMaxAggregateInputType = {
    id?: true
    sessionToken?: true
    userId?: true
    expires?: true
    deviceId?: true
    userAgent?: true
    ipAddress?: true
    location?: true
    lastUsedAt?: true
    createdAt?: true
  }

  export type SessionCountAggregateInputType = {
    id?: true
    sessionToken?: true
    userId?: true
    expires?: true
    deviceId?: true
    userAgent?: true
    ipAddress?: true
    location?: true
    lastUsedAt?: true
    createdAt?: true
    _all?: true
  }

  export type SessionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Session to aggregate.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Sessions
    **/
    _count?: true | SessionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SessionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SessionMaxAggregateInputType
  }

  export type GetSessionAggregateType<T extends SessionAggregateArgs> = {
        [P in keyof T & keyof AggregateSession]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSession[P]>
      : GetScalarType<T[P], AggregateSession[P]>
  }




  export type SessionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SessionWhereInput
    orderBy?: SessionOrderByWithAggregationInput | SessionOrderByWithAggregationInput[]
    by: SessionScalarFieldEnum[] | SessionScalarFieldEnum
    having?: SessionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SessionCountAggregateInputType | true
    _min?: SessionMinAggregateInputType
    _max?: SessionMaxAggregateInputType
  }

  export type SessionGroupByOutputType = {
    id: string
    sessionToken: string
    userId: string
    expires: Date
    deviceId: string
    userAgent: string | null
    ipAddress: string | null
    location: string | null
    lastUsedAt: Date
    createdAt: Date
    _count: SessionCountAggregateOutputType | null
    _min: SessionMinAggregateOutputType | null
    _max: SessionMaxAggregateOutputType | null
  }

  type GetSessionGroupByPayload<T extends SessionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SessionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SessionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SessionGroupByOutputType[P]>
            : GetScalarType<T[P], SessionGroupByOutputType[P]>
        }
      >
    >


  export type SessionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sessionToken?: boolean
    userId?: boolean
    expires?: boolean
    deviceId?: boolean
    userAgent?: boolean
    ipAddress?: boolean
    location?: boolean
    lastUsedAt?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["session"]>

  export type SessionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sessionToken?: boolean
    userId?: boolean
    expires?: boolean
    deviceId?: boolean
    userAgent?: boolean
    ipAddress?: boolean
    location?: boolean
    lastUsedAt?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["session"]>

  export type SessionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    sessionToken?: boolean
    userId?: boolean
    expires?: boolean
    deviceId?: boolean
    userAgent?: boolean
    ipAddress?: boolean
    location?: boolean
    lastUsedAt?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["session"]>

  export type SessionSelectScalar = {
    id?: boolean
    sessionToken?: boolean
    userId?: boolean
    expires?: boolean
    deviceId?: boolean
    userAgent?: boolean
    ipAddress?: boolean
    location?: boolean
    lastUsedAt?: boolean
    createdAt?: boolean
  }

  export type SessionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "sessionToken" | "userId" | "expires" | "deviceId" | "userAgent" | "ipAddress" | "location" | "lastUsedAt" | "createdAt", ExtArgs["result"]["session"]>
  export type SessionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SessionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SessionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $SessionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Session"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      sessionToken: string
      userId: string
      expires: Date
      deviceId: string
      userAgent: string | null
      ipAddress: string | null
      location: string | null
      lastUsedAt: Date
      createdAt: Date
    }, ExtArgs["result"]["session"]>
    composites: {}
  }

  type SessionGetPayload<S extends boolean | null | undefined | SessionDefaultArgs> = $Result.GetResult<Prisma.$SessionPayload, S>

  type SessionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SessionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SessionCountAggregateInputType | true
    }

  export interface SessionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Session'], meta: { name: 'Session' } }
    /**
     * Find zero or one Session that matches the filter.
     * @param {SessionFindUniqueArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SessionFindUniqueArgs>(args: SelectSubset<T, SessionFindUniqueArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Session that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SessionFindUniqueOrThrowArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SessionFindUniqueOrThrowArgs>(args: SelectSubset<T, SessionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Session that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionFindFirstArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SessionFindFirstArgs>(args?: SelectSubset<T, SessionFindFirstArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Session that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionFindFirstOrThrowArgs} args - Arguments to find a Session
     * @example
     * // Get one Session
     * const session = await prisma.session.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SessionFindFirstOrThrowArgs>(args?: SelectSubset<T, SessionFindFirstOrThrowArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Sessions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Sessions
     * const sessions = await prisma.session.findMany()
     * 
     * // Get first 10 Sessions
     * const sessions = await prisma.session.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const sessionWithIdOnly = await prisma.session.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SessionFindManyArgs>(args?: SelectSubset<T, SessionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Session.
     * @param {SessionCreateArgs} args - Arguments to create a Session.
     * @example
     * // Create one Session
     * const Session = await prisma.session.create({
     *   data: {
     *     // ... data to create a Session
     *   }
     * })
     * 
     */
    create<T extends SessionCreateArgs>(args: SelectSubset<T, SessionCreateArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Sessions.
     * @param {SessionCreateManyArgs} args - Arguments to create many Sessions.
     * @example
     * // Create many Sessions
     * const session = await prisma.session.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SessionCreateManyArgs>(args?: SelectSubset<T, SessionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Sessions and returns the data saved in the database.
     * @param {SessionCreateManyAndReturnArgs} args - Arguments to create many Sessions.
     * @example
     * // Create many Sessions
     * const session = await prisma.session.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Sessions and only return the `id`
     * const sessionWithIdOnly = await prisma.session.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SessionCreateManyAndReturnArgs>(args?: SelectSubset<T, SessionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Session.
     * @param {SessionDeleteArgs} args - Arguments to delete one Session.
     * @example
     * // Delete one Session
     * const Session = await prisma.session.delete({
     *   where: {
     *     // ... filter to delete one Session
     *   }
     * })
     * 
     */
    delete<T extends SessionDeleteArgs>(args: SelectSubset<T, SessionDeleteArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Session.
     * @param {SessionUpdateArgs} args - Arguments to update one Session.
     * @example
     * // Update one Session
     * const session = await prisma.session.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SessionUpdateArgs>(args: SelectSubset<T, SessionUpdateArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Sessions.
     * @param {SessionDeleteManyArgs} args - Arguments to filter Sessions to delete.
     * @example
     * // Delete a few Sessions
     * const { count } = await prisma.session.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SessionDeleteManyArgs>(args?: SelectSubset<T, SessionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Sessions
     * const session = await prisma.session.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SessionUpdateManyArgs>(args: SelectSubset<T, SessionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Sessions and returns the data updated in the database.
     * @param {SessionUpdateManyAndReturnArgs} args - Arguments to update many Sessions.
     * @example
     * // Update many Sessions
     * const session = await prisma.session.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Sessions and only return the `id`
     * const sessionWithIdOnly = await prisma.session.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SessionUpdateManyAndReturnArgs>(args: SelectSubset<T, SessionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Session.
     * @param {SessionUpsertArgs} args - Arguments to update or create a Session.
     * @example
     * // Update or create a Session
     * const session = await prisma.session.upsert({
     *   create: {
     *     // ... data to create a Session
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Session we want to update
     *   }
     * })
     */
    upsert<T extends SessionUpsertArgs>(args: SelectSubset<T, SessionUpsertArgs<ExtArgs>>): Prisma__SessionClient<$Result.GetResult<Prisma.$SessionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Sessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionCountArgs} args - Arguments to filter Sessions to count.
     * @example
     * // Count the number of Sessions
     * const count = await prisma.session.count({
     *   where: {
     *     // ... the filter for the Sessions we want to count
     *   }
     * })
    **/
    count<T extends SessionCountArgs>(
      args?: Subset<T, SessionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SessionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Session.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SessionAggregateArgs>(args: Subset<T, SessionAggregateArgs>): Prisma.PrismaPromise<GetSessionAggregateType<T>>

    /**
     * Group by Session.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SessionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SessionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SessionGroupByArgs['orderBy'] }
        : { orderBy?: SessionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SessionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSessionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Session model
   */
  readonly fields: SessionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Session.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SessionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Session model
   */
  interface SessionFieldRefs {
    readonly id: FieldRef<"Session", 'String'>
    readonly sessionToken: FieldRef<"Session", 'String'>
    readonly userId: FieldRef<"Session", 'String'>
    readonly expires: FieldRef<"Session", 'DateTime'>
    readonly deviceId: FieldRef<"Session", 'String'>
    readonly userAgent: FieldRef<"Session", 'String'>
    readonly ipAddress: FieldRef<"Session", 'String'>
    readonly location: FieldRef<"Session", 'String'>
    readonly lastUsedAt: FieldRef<"Session", 'DateTime'>
    readonly createdAt: FieldRef<"Session", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Session findUnique
   */
  export type SessionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session findUniqueOrThrow
   */
  export type SessionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session findFirst
   */
  export type SessionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Sessions.
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Sessions.
     */
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * Session findFirstOrThrow
   */
  export type SessionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Session to fetch.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Sessions.
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Sessions.
     */
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * Session findMany
   */
  export type SessionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter, which Sessions to fetch.
     */
    where?: SessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Sessions to fetch.
     */
    orderBy?: SessionOrderByWithRelationInput | SessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Sessions.
     */
    cursor?: SessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Sessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Sessions.
     */
    skip?: number
    distinct?: SessionScalarFieldEnum | SessionScalarFieldEnum[]
  }

  /**
   * Session create
   */
  export type SessionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * The data needed to create a Session.
     */
    data: XOR<SessionCreateInput, SessionUncheckedCreateInput>
  }

  /**
   * Session createMany
   */
  export type SessionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Sessions.
     */
    data: SessionCreateManyInput | SessionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Session createManyAndReturn
   */
  export type SessionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * The data used to create many Sessions.
     */
    data: SessionCreateManyInput | SessionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Session update
   */
  export type SessionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * The data needed to update a Session.
     */
    data: XOR<SessionUpdateInput, SessionUncheckedUpdateInput>
    /**
     * Choose, which Session to update.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session updateMany
   */
  export type SessionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Sessions.
     */
    data: XOR<SessionUpdateManyMutationInput, SessionUncheckedUpdateManyInput>
    /**
     * Filter which Sessions to update
     */
    where?: SessionWhereInput
    /**
     * Limit how many Sessions to update.
     */
    limit?: number
  }

  /**
   * Session updateManyAndReturn
   */
  export type SessionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * The data used to update Sessions.
     */
    data: XOR<SessionUpdateManyMutationInput, SessionUncheckedUpdateManyInput>
    /**
     * Filter which Sessions to update
     */
    where?: SessionWhereInput
    /**
     * Limit how many Sessions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Session upsert
   */
  export type SessionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * The filter to search for the Session to update in case it exists.
     */
    where: SessionWhereUniqueInput
    /**
     * In case the Session found by the `where` argument doesn't exist, create a new Session with this data.
     */
    create: XOR<SessionCreateInput, SessionUncheckedCreateInput>
    /**
     * In case the Session was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SessionUpdateInput, SessionUncheckedUpdateInput>
  }

  /**
   * Session delete
   */
  export type SessionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
    /**
     * Filter which Session to delete.
     */
    where: SessionWhereUniqueInput
  }

  /**
   * Session deleteMany
   */
  export type SessionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Sessions to delete
     */
    where?: SessionWhereInput
    /**
     * Limit how many Sessions to delete.
     */
    limit?: number
  }

  /**
   * Session without action
   */
  export type SessionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Session
     */
    select?: SessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Session
     */
    omit?: SessionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SessionInclude<ExtArgs> | null
  }


  /**
   * Model LoginActivity
   */

  export type AggregateLoginActivity = {
    _count: LoginActivityCountAggregateOutputType | null
    _min: LoginActivityMinAggregateOutputType | null
    _max: LoginActivityMaxAggregateOutputType | null
  }

  export type LoginActivityMinAggregateOutputType = {
    id: string | null
    type: $Enums.LoginActivityType | null
    status: $Enums.LoginActivityStatus | null
    deviceId: string | null
    userAgent: string | null
    ipAddress: string | null
    location: string | null
    userId: string | null
    createdAt: Date | null
  }

  export type LoginActivityMaxAggregateOutputType = {
    id: string | null
    type: $Enums.LoginActivityType | null
    status: $Enums.LoginActivityStatus | null
    deviceId: string | null
    userAgent: string | null
    ipAddress: string | null
    location: string | null
    userId: string | null
    createdAt: Date | null
  }

  export type LoginActivityCountAggregateOutputType = {
    id: number
    type: number
    status: number
    deviceId: number
    userAgent: number
    ipAddress: number
    location: number
    userId: number
    createdAt: number
    _all: number
  }


  export type LoginActivityMinAggregateInputType = {
    id?: true
    type?: true
    status?: true
    deviceId?: true
    userAgent?: true
    ipAddress?: true
    location?: true
    userId?: true
    createdAt?: true
  }

  export type LoginActivityMaxAggregateInputType = {
    id?: true
    type?: true
    status?: true
    deviceId?: true
    userAgent?: true
    ipAddress?: true
    location?: true
    userId?: true
    createdAt?: true
  }

  export type LoginActivityCountAggregateInputType = {
    id?: true
    type?: true
    status?: true
    deviceId?: true
    userAgent?: true
    ipAddress?: true
    location?: true
    userId?: true
    createdAt?: true
    _all?: true
  }

  export type LoginActivityAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LoginActivity to aggregate.
     */
    where?: LoginActivityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LoginActivities to fetch.
     */
    orderBy?: LoginActivityOrderByWithRelationInput | LoginActivityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LoginActivityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LoginActivities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LoginActivities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned LoginActivities
    **/
    _count?: true | LoginActivityCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LoginActivityMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LoginActivityMaxAggregateInputType
  }

  export type GetLoginActivityAggregateType<T extends LoginActivityAggregateArgs> = {
        [P in keyof T & keyof AggregateLoginActivity]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLoginActivity[P]>
      : GetScalarType<T[P], AggregateLoginActivity[P]>
  }




  export type LoginActivityGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LoginActivityWhereInput
    orderBy?: LoginActivityOrderByWithAggregationInput | LoginActivityOrderByWithAggregationInput[]
    by: LoginActivityScalarFieldEnum[] | LoginActivityScalarFieldEnum
    having?: LoginActivityScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LoginActivityCountAggregateInputType | true
    _min?: LoginActivityMinAggregateInputType
    _max?: LoginActivityMaxAggregateInputType
  }

  export type LoginActivityGroupByOutputType = {
    id: string
    type: $Enums.LoginActivityType
    status: $Enums.LoginActivityStatus
    deviceId: string
    userAgent: string | null
    ipAddress: string | null
    location: string | null
    userId: string
    createdAt: Date
    _count: LoginActivityCountAggregateOutputType | null
    _min: LoginActivityMinAggregateOutputType | null
    _max: LoginActivityMaxAggregateOutputType | null
  }

  type GetLoginActivityGroupByPayload<T extends LoginActivityGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LoginActivityGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LoginActivityGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LoginActivityGroupByOutputType[P]>
            : GetScalarType<T[P], LoginActivityGroupByOutputType[P]>
        }
      >
    >


  export type LoginActivitySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    status?: boolean
    deviceId?: boolean
    userAgent?: boolean
    ipAddress?: boolean
    location?: boolean
    userId?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["loginActivity"]>

  export type LoginActivitySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    status?: boolean
    deviceId?: boolean
    userAgent?: boolean
    ipAddress?: boolean
    location?: boolean
    userId?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["loginActivity"]>

  export type LoginActivitySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    status?: boolean
    deviceId?: boolean
    userAgent?: boolean
    ipAddress?: boolean
    location?: boolean
    userId?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["loginActivity"]>

  export type LoginActivitySelectScalar = {
    id?: boolean
    type?: boolean
    status?: boolean
    deviceId?: boolean
    userAgent?: boolean
    ipAddress?: boolean
    location?: boolean
    userId?: boolean
    createdAt?: boolean
  }

  export type LoginActivityOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "type" | "status" | "deviceId" | "userAgent" | "ipAddress" | "location" | "userId" | "createdAt", ExtArgs["result"]["loginActivity"]>
  export type LoginActivityInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type LoginActivityIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type LoginActivityIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $LoginActivityPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "LoginActivity"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      type: $Enums.LoginActivityType
      status: $Enums.LoginActivityStatus
      deviceId: string
      userAgent: string | null
      ipAddress: string | null
      location: string | null
      userId: string
      createdAt: Date
    }, ExtArgs["result"]["loginActivity"]>
    composites: {}
  }

  type LoginActivityGetPayload<S extends boolean | null | undefined | LoginActivityDefaultArgs> = $Result.GetResult<Prisma.$LoginActivityPayload, S>

  type LoginActivityCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<LoginActivityFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LoginActivityCountAggregateInputType | true
    }

  export interface LoginActivityDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['LoginActivity'], meta: { name: 'LoginActivity' } }
    /**
     * Find zero or one LoginActivity that matches the filter.
     * @param {LoginActivityFindUniqueArgs} args - Arguments to find a LoginActivity
     * @example
     * // Get one LoginActivity
     * const loginActivity = await prisma.loginActivity.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LoginActivityFindUniqueArgs>(args: SelectSubset<T, LoginActivityFindUniqueArgs<ExtArgs>>): Prisma__LoginActivityClient<$Result.GetResult<Prisma.$LoginActivityPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one LoginActivity that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LoginActivityFindUniqueOrThrowArgs} args - Arguments to find a LoginActivity
     * @example
     * // Get one LoginActivity
     * const loginActivity = await prisma.loginActivity.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LoginActivityFindUniqueOrThrowArgs>(args: SelectSubset<T, LoginActivityFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LoginActivityClient<$Result.GetResult<Prisma.$LoginActivityPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first LoginActivity that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoginActivityFindFirstArgs} args - Arguments to find a LoginActivity
     * @example
     * // Get one LoginActivity
     * const loginActivity = await prisma.loginActivity.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LoginActivityFindFirstArgs>(args?: SelectSubset<T, LoginActivityFindFirstArgs<ExtArgs>>): Prisma__LoginActivityClient<$Result.GetResult<Prisma.$LoginActivityPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first LoginActivity that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoginActivityFindFirstOrThrowArgs} args - Arguments to find a LoginActivity
     * @example
     * // Get one LoginActivity
     * const loginActivity = await prisma.loginActivity.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LoginActivityFindFirstOrThrowArgs>(args?: SelectSubset<T, LoginActivityFindFirstOrThrowArgs<ExtArgs>>): Prisma__LoginActivityClient<$Result.GetResult<Prisma.$LoginActivityPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more LoginActivities that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoginActivityFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all LoginActivities
     * const loginActivities = await prisma.loginActivity.findMany()
     * 
     * // Get first 10 LoginActivities
     * const loginActivities = await prisma.loginActivity.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const loginActivityWithIdOnly = await prisma.loginActivity.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LoginActivityFindManyArgs>(args?: SelectSubset<T, LoginActivityFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LoginActivityPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a LoginActivity.
     * @param {LoginActivityCreateArgs} args - Arguments to create a LoginActivity.
     * @example
     * // Create one LoginActivity
     * const LoginActivity = await prisma.loginActivity.create({
     *   data: {
     *     // ... data to create a LoginActivity
     *   }
     * })
     * 
     */
    create<T extends LoginActivityCreateArgs>(args: SelectSubset<T, LoginActivityCreateArgs<ExtArgs>>): Prisma__LoginActivityClient<$Result.GetResult<Prisma.$LoginActivityPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many LoginActivities.
     * @param {LoginActivityCreateManyArgs} args - Arguments to create many LoginActivities.
     * @example
     * // Create many LoginActivities
     * const loginActivity = await prisma.loginActivity.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LoginActivityCreateManyArgs>(args?: SelectSubset<T, LoginActivityCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many LoginActivities and returns the data saved in the database.
     * @param {LoginActivityCreateManyAndReturnArgs} args - Arguments to create many LoginActivities.
     * @example
     * // Create many LoginActivities
     * const loginActivity = await prisma.loginActivity.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many LoginActivities and only return the `id`
     * const loginActivityWithIdOnly = await prisma.loginActivity.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LoginActivityCreateManyAndReturnArgs>(args?: SelectSubset<T, LoginActivityCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LoginActivityPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a LoginActivity.
     * @param {LoginActivityDeleteArgs} args - Arguments to delete one LoginActivity.
     * @example
     * // Delete one LoginActivity
     * const LoginActivity = await prisma.loginActivity.delete({
     *   where: {
     *     // ... filter to delete one LoginActivity
     *   }
     * })
     * 
     */
    delete<T extends LoginActivityDeleteArgs>(args: SelectSubset<T, LoginActivityDeleteArgs<ExtArgs>>): Prisma__LoginActivityClient<$Result.GetResult<Prisma.$LoginActivityPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one LoginActivity.
     * @param {LoginActivityUpdateArgs} args - Arguments to update one LoginActivity.
     * @example
     * // Update one LoginActivity
     * const loginActivity = await prisma.loginActivity.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LoginActivityUpdateArgs>(args: SelectSubset<T, LoginActivityUpdateArgs<ExtArgs>>): Prisma__LoginActivityClient<$Result.GetResult<Prisma.$LoginActivityPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more LoginActivities.
     * @param {LoginActivityDeleteManyArgs} args - Arguments to filter LoginActivities to delete.
     * @example
     * // Delete a few LoginActivities
     * const { count } = await prisma.loginActivity.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LoginActivityDeleteManyArgs>(args?: SelectSubset<T, LoginActivityDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LoginActivities.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoginActivityUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many LoginActivities
     * const loginActivity = await prisma.loginActivity.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LoginActivityUpdateManyArgs>(args: SelectSubset<T, LoginActivityUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more LoginActivities and returns the data updated in the database.
     * @param {LoginActivityUpdateManyAndReturnArgs} args - Arguments to update many LoginActivities.
     * @example
     * // Update many LoginActivities
     * const loginActivity = await prisma.loginActivity.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more LoginActivities and only return the `id`
     * const loginActivityWithIdOnly = await prisma.loginActivity.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends LoginActivityUpdateManyAndReturnArgs>(args: SelectSubset<T, LoginActivityUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LoginActivityPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one LoginActivity.
     * @param {LoginActivityUpsertArgs} args - Arguments to update or create a LoginActivity.
     * @example
     * // Update or create a LoginActivity
     * const loginActivity = await prisma.loginActivity.upsert({
     *   create: {
     *     // ... data to create a LoginActivity
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the LoginActivity we want to update
     *   }
     * })
     */
    upsert<T extends LoginActivityUpsertArgs>(args: SelectSubset<T, LoginActivityUpsertArgs<ExtArgs>>): Prisma__LoginActivityClient<$Result.GetResult<Prisma.$LoginActivityPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of LoginActivities.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoginActivityCountArgs} args - Arguments to filter LoginActivities to count.
     * @example
     * // Count the number of LoginActivities
     * const count = await prisma.loginActivity.count({
     *   where: {
     *     // ... the filter for the LoginActivities we want to count
     *   }
     * })
    **/
    count<T extends LoginActivityCountArgs>(
      args?: Subset<T, LoginActivityCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LoginActivityCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a LoginActivity.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoginActivityAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LoginActivityAggregateArgs>(args: Subset<T, LoginActivityAggregateArgs>): Prisma.PrismaPromise<GetLoginActivityAggregateType<T>>

    /**
     * Group by LoginActivity.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LoginActivityGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LoginActivityGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LoginActivityGroupByArgs['orderBy'] }
        : { orderBy?: LoginActivityGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LoginActivityGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLoginActivityGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the LoginActivity model
   */
  readonly fields: LoginActivityFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for LoginActivity.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LoginActivityClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the LoginActivity model
   */
  interface LoginActivityFieldRefs {
    readonly id: FieldRef<"LoginActivity", 'String'>
    readonly type: FieldRef<"LoginActivity", 'LoginActivityType'>
    readonly status: FieldRef<"LoginActivity", 'LoginActivityStatus'>
    readonly deviceId: FieldRef<"LoginActivity", 'String'>
    readonly userAgent: FieldRef<"LoginActivity", 'String'>
    readonly ipAddress: FieldRef<"LoginActivity", 'String'>
    readonly location: FieldRef<"LoginActivity", 'String'>
    readonly userId: FieldRef<"LoginActivity", 'String'>
    readonly createdAt: FieldRef<"LoginActivity", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * LoginActivity findUnique
   */
  export type LoginActivityFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginActivity
     */
    select?: LoginActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoginActivity
     */
    omit?: LoginActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoginActivityInclude<ExtArgs> | null
    /**
     * Filter, which LoginActivity to fetch.
     */
    where: LoginActivityWhereUniqueInput
  }

  /**
   * LoginActivity findUniqueOrThrow
   */
  export type LoginActivityFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginActivity
     */
    select?: LoginActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoginActivity
     */
    omit?: LoginActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoginActivityInclude<ExtArgs> | null
    /**
     * Filter, which LoginActivity to fetch.
     */
    where: LoginActivityWhereUniqueInput
  }

  /**
   * LoginActivity findFirst
   */
  export type LoginActivityFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginActivity
     */
    select?: LoginActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoginActivity
     */
    omit?: LoginActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoginActivityInclude<ExtArgs> | null
    /**
     * Filter, which LoginActivity to fetch.
     */
    where?: LoginActivityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LoginActivities to fetch.
     */
    orderBy?: LoginActivityOrderByWithRelationInput | LoginActivityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LoginActivities.
     */
    cursor?: LoginActivityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LoginActivities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LoginActivities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LoginActivities.
     */
    distinct?: LoginActivityScalarFieldEnum | LoginActivityScalarFieldEnum[]
  }

  /**
   * LoginActivity findFirstOrThrow
   */
  export type LoginActivityFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginActivity
     */
    select?: LoginActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoginActivity
     */
    omit?: LoginActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoginActivityInclude<ExtArgs> | null
    /**
     * Filter, which LoginActivity to fetch.
     */
    where?: LoginActivityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LoginActivities to fetch.
     */
    orderBy?: LoginActivityOrderByWithRelationInput | LoginActivityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for LoginActivities.
     */
    cursor?: LoginActivityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LoginActivities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LoginActivities.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of LoginActivities.
     */
    distinct?: LoginActivityScalarFieldEnum | LoginActivityScalarFieldEnum[]
  }

  /**
   * LoginActivity findMany
   */
  export type LoginActivityFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginActivity
     */
    select?: LoginActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoginActivity
     */
    omit?: LoginActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoginActivityInclude<ExtArgs> | null
    /**
     * Filter, which LoginActivities to fetch.
     */
    where?: LoginActivityWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of LoginActivities to fetch.
     */
    orderBy?: LoginActivityOrderByWithRelationInput | LoginActivityOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing LoginActivities.
     */
    cursor?: LoginActivityWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` LoginActivities from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` LoginActivities.
     */
    skip?: number
    distinct?: LoginActivityScalarFieldEnum | LoginActivityScalarFieldEnum[]
  }

  /**
   * LoginActivity create
   */
  export type LoginActivityCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginActivity
     */
    select?: LoginActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoginActivity
     */
    omit?: LoginActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoginActivityInclude<ExtArgs> | null
    /**
     * The data needed to create a LoginActivity.
     */
    data: XOR<LoginActivityCreateInput, LoginActivityUncheckedCreateInput>
  }

  /**
   * LoginActivity createMany
   */
  export type LoginActivityCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many LoginActivities.
     */
    data: LoginActivityCreateManyInput | LoginActivityCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * LoginActivity createManyAndReturn
   */
  export type LoginActivityCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginActivity
     */
    select?: LoginActivitySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the LoginActivity
     */
    omit?: LoginActivityOmit<ExtArgs> | null
    /**
     * The data used to create many LoginActivities.
     */
    data: LoginActivityCreateManyInput | LoginActivityCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoginActivityIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * LoginActivity update
   */
  export type LoginActivityUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginActivity
     */
    select?: LoginActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoginActivity
     */
    omit?: LoginActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoginActivityInclude<ExtArgs> | null
    /**
     * The data needed to update a LoginActivity.
     */
    data: XOR<LoginActivityUpdateInput, LoginActivityUncheckedUpdateInput>
    /**
     * Choose, which LoginActivity to update.
     */
    where: LoginActivityWhereUniqueInput
  }

  /**
   * LoginActivity updateMany
   */
  export type LoginActivityUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update LoginActivities.
     */
    data: XOR<LoginActivityUpdateManyMutationInput, LoginActivityUncheckedUpdateManyInput>
    /**
     * Filter which LoginActivities to update
     */
    where?: LoginActivityWhereInput
    /**
     * Limit how many LoginActivities to update.
     */
    limit?: number
  }

  /**
   * LoginActivity updateManyAndReturn
   */
  export type LoginActivityUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginActivity
     */
    select?: LoginActivitySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the LoginActivity
     */
    omit?: LoginActivityOmit<ExtArgs> | null
    /**
     * The data used to update LoginActivities.
     */
    data: XOR<LoginActivityUpdateManyMutationInput, LoginActivityUncheckedUpdateManyInput>
    /**
     * Filter which LoginActivities to update
     */
    where?: LoginActivityWhereInput
    /**
     * Limit how many LoginActivities to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoginActivityIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * LoginActivity upsert
   */
  export type LoginActivityUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginActivity
     */
    select?: LoginActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoginActivity
     */
    omit?: LoginActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoginActivityInclude<ExtArgs> | null
    /**
     * The filter to search for the LoginActivity to update in case it exists.
     */
    where: LoginActivityWhereUniqueInput
    /**
     * In case the LoginActivity found by the `where` argument doesn't exist, create a new LoginActivity with this data.
     */
    create: XOR<LoginActivityCreateInput, LoginActivityUncheckedCreateInput>
    /**
     * In case the LoginActivity was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LoginActivityUpdateInput, LoginActivityUncheckedUpdateInput>
  }

  /**
   * LoginActivity delete
   */
  export type LoginActivityDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginActivity
     */
    select?: LoginActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoginActivity
     */
    omit?: LoginActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoginActivityInclude<ExtArgs> | null
    /**
     * Filter which LoginActivity to delete.
     */
    where: LoginActivityWhereUniqueInput
  }

  /**
   * LoginActivity deleteMany
   */
  export type LoginActivityDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which LoginActivities to delete
     */
    where?: LoginActivityWhereInput
    /**
     * Limit how many LoginActivities to delete.
     */
    limit?: number
  }

  /**
   * LoginActivity without action
   */
  export type LoginActivityDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the LoginActivity
     */
    select?: LoginActivitySelect<ExtArgs> | null
    /**
     * Omit specific fields from the LoginActivity
     */
    omit?: LoginActivityOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LoginActivityInclude<ExtArgs> | null
  }


  /**
   * Model VerificationToken
   */

  export type AggregateVerificationToken = {
    _count: VerificationTokenCountAggregateOutputType | null
    _min: VerificationTokenMinAggregateOutputType | null
    _max: VerificationTokenMaxAggregateOutputType | null
  }

  export type VerificationTokenMinAggregateOutputType = {
    id: string | null
    identifier: $Enums.VerificationIdentifier | null
    email: string | null
    token: string | null
    newEmail: string | null
    expires: Date | null
    createdAt: Date | null
  }

  export type VerificationTokenMaxAggregateOutputType = {
    id: string | null
    identifier: $Enums.VerificationIdentifier | null
    email: string | null
    token: string | null
    newEmail: string | null
    expires: Date | null
    createdAt: Date | null
  }

  export type VerificationTokenCountAggregateOutputType = {
    id: number
    identifier: number
    email: number
    token: number
    newEmail: number
    expires: number
    createdAt: number
    _all: number
  }


  export type VerificationTokenMinAggregateInputType = {
    id?: true
    identifier?: true
    email?: true
    token?: true
    newEmail?: true
    expires?: true
    createdAt?: true
  }

  export type VerificationTokenMaxAggregateInputType = {
    id?: true
    identifier?: true
    email?: true
    token?: true
    newEmail?: true
    expires?: true
    createdAt?: true
  }

  export type VerificationTokenCountAggregateInputType = {
    id?: true
    identifier?: true
    email?: true
    token?: true
    newEmail?: true
    expires?: true
    createdAt?: true
    _all?: true
  }

  export type VerificationTokenAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VerificationToken to aggregate.
     */
    where?: VerificationTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationTokens to fetch.
     */
    orderBy?: VerificationTokenOrderByWithRelationInput | VerificationTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: VerificationTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned VerificationTokens
    **/
    _count?: true | VerificationTokenCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: VerificationTokenMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: VerificationTokenMaxAggregateInputType
  }

  export type GetVerificationTokenAggregateType<T extends VerificationTokenAggregateArgs> = {
        [P in keyof T & keyof AggregateVerificationToken]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateVerificationToken[P]>
      : GetScalarType<T[P], AggregateVerificationToken[P]>
  }




  export type VerificationTokenGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VerificationTokenWhereInput
    orderBy?: VerificationTokenOrderByWithAggregationInput | VerificationTokenOrderByWithAggregationInput[]
    by: VerificationTokenScalarFieldEnum[] | VerificationTokenScalarFieldEnum
    having?: VerificationTokenScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: VerificationTokenCountAggregateInputType | true
    _min?: VerificationTokenMinAggregateInputType
    _max?: VerificationTokenMaxAggregateInputType
  }

  export type VerificationTokenGroupByOutputType = {
    id: string
    identifier: $Enums.VerificationIdentifier
    email: string
    token: string
    newEmail: string | null
    expires: Date
    createdAt: Date
    _count: VerificationTokenCountAggregateOutputType | null
    _min: VerificationTokenMinAggregateOutputType | null
    _max: VerificationTokenMaxAggregateOutputType | null
  }

  type GetVerificationTokenGroupByPayload<T extends VerificationTokenGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<VerificationTokenGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof VerificationTokenGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], VerificationTokenGroupByOutputType[P]>
            : GetScalarType<T[P], VerificationTokenGroupByOutputType[P]>
        }
      >
    >


  export type VerificationTokenSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    identifier?: boolean
    email?: boolean
    token?: boolean
    newEmail?: boolean
    expires?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["verificationToken"]>

  export type VerificationTokenSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    identifier?: boolean
    email?: boolean
    token?: boolean
    newEmail?: boolean
    expires?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["verificationToken"]>

  export type VerificationTokenSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    identifier?: boolean
    email?: boolean
    token?: boolean
    newEmail?: boolean
    expires?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["verificationToken"]>

  export type VerificationTokenSelectScalar = {
    id?: boolean
    identifier?: boolean
    email?: boolean
    token?: boolean
    newEmail?: boolean
    expires?: boolean
    createdAt?: boolean
  }

  export type VerificationTokenOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "identifier" | "email" | "token" | "newEmail" | "expires" | "createdAt", ExtArgs["result"]["verificationToken"]>

  export type $VerificationTokenPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "VerificationToken"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      identifier: $Enums.VerificationIdentifier
      email: string
      token: string
      newEmail: string | null
      expires: Date
      createdAt: Date
    }, ExtArgs["result"]["verificationToken"]>
    composites: {}
  }

  type VerificationTokenGetPayload<S extends boolean | null | undefined | VerificationTokenDefaultArgs> = $Result.GetResult<Prisma.$VerificationTokenPayload, S>

  type VerificationTokenCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<VerificationTokenFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: VerificationTokenCountAggregateInputType | true
    }

  export interface VerificationTokenDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['VerificationToken'], meta: { name: 'VerificationToken' } }
    /**
     * Find zero or one VerificationToken that matches the filter.
     * @param {VerificationTokenFindUniqueArgs} args - Arguments to find a VerificationToken
     * @example
     * // Get one VerificationToken
     * const verificationToken = await prisma.verificationToken.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends VerificationTokenFindUniqueArgs>(args: SelectSubset<T, VerificationTokenFindUniqueArgs<ExtArgs>>): Prisma__VerificationTokenClient<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one VerificationToken that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {VerificationTokenFindUniqueOrThrowArgs} args - Arguments to find a VerificationToken
     * @example
     * // Get one VerificationToken
     * const verificationToken = await prisma.verificationToken.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends VerificationTokenFindUniqueOrThrowArgs>(args: SelectSubset<T, VerificationTokenFindUniqueOrThrowArgs<ExtArgs>>): Prisma__VerificationTokenClient<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first VerificationToken that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationTokenFindFirstArgs} args - Arguments to find a VerificationToken
     * @example
     * // Get one VerificationToken
     * const verificationToken = await prisma.verificationToken.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends VerificationTokenFindFirstArgs>(args?: SelectSubset<T, VerificationTokenFindFirstArgs<ExtArgs>>): Prisma__VerificationTokenClient<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first VerificationToken that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationTokenFindFirstOrThrowArgs} args - Arguments to find a VerificationToken
     * @example
     * // Get one VerificationToken
     * const verificationToken = await prisma.verificationToken.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends VerificationTokenFindFirstOrThrowArgs>(args?: SelectSubset<T, VerificationTokenFindFirstOrThrowArgs<ExtArgs>>): Prisma__VerificationTokenClient<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more VerificationTokens that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationTokenFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all VerificationTokens
     * const verificationTokens = await prisma.verificationToken.findMany()
     * 
     * // Get first 10 VerificationTokens
     * const verificationTokens = await prisma.verificationToken.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const verificationTokenWithIdOnly = await prisma.verificationToken.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends VerificationTokenFindManyArgs>(args?: SelectSubset<T, VerificationTokenFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a VerificationToken.
     * @param {VerificationTokenCreateArgs} args - Arguments to create a VerificationToken.
     * @example
     * // Create one VerificationToken
     * const VerificationToken = await prisma.verificationToken.create({
     *   data: {
     *     // ... data to create a VerificationToken
     *   }
     * })
     * 
     */
    create<T extends VerificationTokenCreateArgs>(args: SelectSubset<T, VerificationTokenCreateArgs<ExtArgs>>): Prisma__VerificationTokenClient<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many VerificationTokens.
     * @param {VerificationTokenCreateManyArgs} args - Arguments to create many VerificationTokens.
     * @example
     * // Create many VerificationTokens
     * const verificationToken = await prisma.verificationToken.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends VerificationTokenCreateManyArgs>(args?: SelectSubset<T, VerificationTokenCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many VerificationTokens and returns the data saved in the database.
     * @param {VerificationTokenCreateManyAndReturnArgs} args - Arguments to create many VerificationTokens.
     * @example
     * // Create many VerificationTokens
     * const verificationToken = await prisma.verificationToken.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many VerificationTokens and only return the `id`
     * const verificationTokenWithIdOnly = await prisma.verificationToken.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends VerificationTokenCreateManyAndReturnArgs>(args?: SelectSubset<T, VerificationTokenCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a VerificationToken.
     * @param {VerificationTokenDeleteArgs} args - Arguments to delete one VerificationToken.
     * @example
     * // Delete one VerificationToken
     * const VerificationToken = await prisma.verificationToken.delete({
     *   where: {
     *     // ... filter to delete one VerificationToken
     *   }
     * })
     * 
     */
    delete<T extends VerificationTokenDeleteArgs>(args: SelectSubset<T, VerificationTokenDeleteArgs<ExtArgs>>): Prisma__VerificationTokenClient<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one VerificationToken.
     * @param {VerificationTokenUpdateArgs} args - Arguments to update one VerificationToken.
     * @example
     * // Update one VerificationToken
     * const verificationToken = await prisma.verificationToken.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends VerificationTokenUpdateArgs>(args: SelectSubset<T, VerificationTokenUpdateArgs<ExtArgs>>): Prisma__VerificationTokenClient<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more VerificationTokens.
     * @param {VerificationTokenDeleteManyArgs} args - Arguments to filter VerificationTokens to delete.
     * @example
     * // Delete a few VerificationTokens
     * const { count } = await prisma.verificationToken.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends VerificationTokenDeleteManyArgs>(args?: SelectSubset<T, VerificationTokenDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VerificationTokens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationTokenUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many VerificationTokens
     * const verificationToken = await prisma.verificationToken.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends VerificationTokenUpdateManyArgs>(args: SelectSubset<T, VerificationTokenUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VerificationTokens and returns the data updated in the database.
     * @param {VerificationTokenUpdateManyAndReturnArgs} args - Arguments to update many VerificationTokens.
     * @example
     * // Update many VerificationTokens
     * const verificationToken = await prisma.verificationToken.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more VerificationTokens and only return the `id`
     * const verificationTokenWithIdOnly = await prisma.verificationToken.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends VerificationTokenUpdateManyAndReturnArgs>(args: SelectSubset<T, VerificationTokenUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one VerificationToken.
     * @param {VerificationTokenUpsertArgs} args - Arguments to update or create a VerificationToken.
     * @example
     * // Update or create a VerificationToken
     * const verificationToken = await prisma.verificationToken.upsert({
     *   create: {
     *     // ... data to create a VerificationToken
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the VerificationToken we want to update
     *   }
     * })
     */
    upsert<T extends VerificationTokenUpsertArgs>(args: SelectSubset<T, VerificationTokenUpsertArgs<ExtArgs>>): Prisma__VerificationTokenClient<$Result.GetResult<Prisma.$VerificationTokenPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of VerificationTokens.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationTokenCountArgs} args - Arguments to filter VerificationTokens to count.
     * @example
     * // Count the number of VerificationTokens
     * const count = await prisma.verificationToken.count({
     *   where: {
     *     // ... the filter for the VerificationTokens we want to count
     *   }
     * })
    **/
    count<T extends VerificationTokenCountArgs>(
      args?: Subset<T, VerificationTokenCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], VerificationTokenCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a VerificationToken.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationTokenAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends VerificationTokenAggregateArgs>(args: Subset<T, VerificationTokenAggregateArgs>): Prisma.PrismaPromise<GetVerificationTokenAggregateType<T>>

    /**
     * Group by VerificationToken.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VerificationTokenGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends VerificationTokenGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: VerificationTokenGroupByArgs['orderBy'] }
        : { orderBy?: VerificationTokenGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, VerificationTokenGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetVerificationTokenGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the VerificationToken model
   */
  readonly fields: VerificationTokenFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for VerificationToken.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__VerificationTokenClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the VerificationToken model
   */
  interface VerificationTokenFieldRefs {
    readonly id: FieldRef<"VerificationToken", 'String'>
    readonly identifier: FieldRef<"VerificationToken", 'VerificationIdentifier'>
    readonly email: FieldRef<"VerificationToken", 'String'>
    readonly token: FieldRef<"VerificationToken", 'String'>
    readonly newEmail: FieldRef<"VerificationToken", 'String'>
    readonly expires: FieldRef<"VerificationToken", 'DateTime'>
    readonly createdAt: FieldRef<"VerificationToken", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * VerificationToken findUnique
   */
  export type VerificationTokenFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * Filter, which VerificationToken to fetch.
     */
    where: VerificationTokenWhereUniqueInput
  }

  /**
   * VerificationToken findUniqueOrThrow
   */
  export type VerificationTokenFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * Filter, which VerificationToken to fetch.
     */
    where: VerificationTokenWhereUniqueInput
  }

  /**
   * VerificationToken findFirst
   */
  export type VerificationTokenFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * Filter, which VerificationToken to fetch.
     */
    where?: VerificationTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationTokens to fetch.
     */
    orderBy?: VerificationTokenOrderByWithRelationInput | VerificationTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VerificationTokens.
     */
    cursor?: VerificationTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VerificationTokens.
     */
    distinct?: VerificationTokenScalarFieldEnum | VerificationTokenScalarFieldEnum[]
  }

  /**
   * VerificationToken findFirstOrThrow
   */
  export type VerificationTokenFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * Filter, which VerificationToken to fetch.
     */
    where?: VerificationTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationTokens to fetch.
     */
    orderBy?: VerificationTokenOrderByWithRelationInput | VerificationTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VerificationTokens.
     */
    cursor?: VerificationTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationTokens.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VerificationTokens.
     */
    distinct?: VerificationTokenScalarFieldEnum | VerificationTokenScalarFieldEnum[]
  }

  /**
   * VerificationToken findMany
   */
  export type VerificationTokenFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * Filter, which VerificationTokens to fetch.
     */
    where?: VerificationTokenWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VerificationTokens to fetch.
     */
    orderBy?: VerificationTokenOrderByWithRelationInput | VerificationTokenOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing VerificationTokens.
     */
    cursor?: VerificationTokenWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VerificationTokens from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VerificationTokens.
     */
    skip?: number
    distinct?: VerificationTokenScalarFieldEnum | VerificationTokenScalarFieldEnum[]
  }

  /**
   * VerificationToken create
   */
  export type VerificationTokenCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * The data needed to create a VerificationToken.
     */
    data: XOR<VerificationTokenCreateInput, VerificationTokenUncheckedCreateInput>
  }

  /**
   * VerificationToken createMany
   */
  export type VerificationTokenCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many VerificationTokens.
     */
    data: VerificationTokenCreateManyInput | VerificationTokenCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * VerificationToken createManyAndReturn
   */
  export type VerificationTokenCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * The data used to create many VerificationTokens.
     */
    data: VerificationTokenCreateManyInput | VerificationTokenCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * VerificationToken update
   */
  export type VerificationTokenUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * The data needed to update a VerificationToken.
     */
    data: XOR<VerificationTokenUpdateInput, VerificationTokenUncheckedUpdateInput>
    /**
     * Choose, which VerificationToken to update.
     */
    where: VerificationTokenWhereUniqueInput
  }

  /**
   * VerificationToken updateMany
   */
  export type VerificationTokenUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update VerificationTokens.
     */
    data: XOR<VerificationTokenUpdateManyMutationInput, VerificationTokenUncheckedUpdateManyInput>
    /**
     * Filter which VerificationTokens to update
     */
    where?: VerificationTokenWhereInput
    /**
     * Limit how many VerificationTokens to update.
     */
    limit?: number
  }

  /**
   * VerificationToken updateManyAndReturn
   */
  export type VerificationTokenUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * The data used to update VerificationTokens.
     */
    data: XOR<VerificationTokenUpdateManyMutationInput, VerificationTokenUncheckedUpdateManyInput>
    /**
     * Filter which VerificationTokens to update
     */
    where?: VerificationTokenWhereInput
    /**
     * Limit how many VerificationTokens to update.
     */
    limit?: number
  }

  /**
   * VerificationToken upsert
   */
  export type VerificationTokenUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * The filter to search for the VerificationToken to update in case it exists.
     */
    where: VerificationTokenWhereUniqueInput
    /**
     * In case the VerificationToken found by the `where` argument doesn't exist, create a new VerificationToken with this data.
     */
    create: XOR<VerificationTokenCreateInput, VerificationTokenUncheckedCreateInput>
    /**
     * In case the VerificationToken was found with the provided `where` argument, update it with this data.
     */
    update: XOR<VerificationTokenUpdateInput, VerificationTokenUncheckedUpdateInput>
  }

  /**
   * VerificationToken delete
   */
  export type VerificationTokenDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
    /**
     * Filter which VerificationToken to delete.
     */
    where: VerificationTokenWhereUniqueInput
  }

  /**
   * VerificationToken deleteMany
   */
  export type VerificationTokenDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VerificationTokens to delete
     */
    where?: VerificationTokenWhereInput
    /**
     * Limit how many VerificationTokens to delete.
     */
    limit?: number
  }

  /**
   * VerificationToken without action
   */
  export type VerificationTokenDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VerificationToken
     */
    select?: VerificationTokenSelect<ExtArgs> | null
    /**
     * Omit specific fields from the VerificationToken
     */
    omit?: VerificationTokenOmit<ExtArgs> | null
  }


  /**
   * Model Subscription
   */

  export type AggregateSubscription = {
    _count: SubscriptionCountAggregateOutputType | null
    _min: SubscriptionMinAggregateOutputType | null
    _max: SubscriptionMaxAggregateOutputType | null
  }

  export type SubscriptionMinAggregateOutputType = {
    id: string | null
    userId: string | null
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
    stripePriceId: string | null
    stripeCurrentPeriodStart: Date | null
    stripeCurrentPeriodEnd: Date | null
    stripeCancelAtPeriodEnd: boolean | null
    status: $Enums.SubscriptionStatus | null
    plan: $Enums.SubscriptionPlan | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SubscriptionMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
    stripePriceId: string | null
    stripeCurrentPeriodStart: Date | null
    stripeCurrentPeriodEnd: Date | null
    stripeCancelAtPeriodEnd: boolean | null
    status: $Enums.SubscriptionStatus | null
    plan: $Enums.SubscriptionPlan | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SubscriptionCountAggregateOutputType = {
    id: number
    userId: number
    stripeCustomerId: number
    stripeSubscriptionId: number
    stripePriceId: number
    stripeCurrentPeriodStart: number
    stripeCurrentPeriodEnd: number
    stripeCancelAtPeriodEnd: number
    status: number
    plan: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SubscriptionMinAggregateInputType = {
    id?: true
    userId?: true
    stripeCustomerId?: true
    stripeSubscriptionId?: true
    stripePriceId?: true
    stripeCurrentPeriodStart?: true
    stripeCurrentPeriodEnd?: true
    stripeCancelAtPeriodEnd?: true
    status?: true
    plan?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SubscriptionMaxAggregateInputType = {
    id?: true
    userId?: true
    stripeCustomerId?: true
    stripeSubscriptionId?: true
    stripePriceId?: true
    stripeCurrentPeriodStart?: true
    stripeCurrentPeriodEnd?: true
    stripeCancelAtPeriodEnd?: true
    status?: true
    plan?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SubscriptionCountAggregateInputType = {
    id?: true
    userId?: true
    stripeCustomerId?: true
    stripeSubscriptionId?: true
    stripePriceId?: true
    stripeCurrentPeriodStart?: true
    stripeCurrentPeriodEnd?: true
    stripeCancelAtPeriodEnd?: true
    status?: true
    plan?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SubscriptionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Subscription to aggregate.
     */
    where?: SubscriptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subscriptions to fetch.
     */
    orderBy?: SubscriptionOrderByWithRelationInput | SubscriptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SubscriptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subscriptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subscriptions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Subscriptions
    **/
    _count?: true | SubscriptionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SubscriptionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SubscriptionMaxAggregateInputType
  }

  export type GetSubscriptionAggregateType<T extends SubscriptionAggregateArgs> = {
        [P in keyof T & keyof AggregateSubscription]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSubscription[P]>
      : GetScalarType<T[P], AggregateSubscription[P]>
  }




  export type SubscriptionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SubscriptionWhereInput
    orderBy?: SubscriptionOrderByWithAggregationInput | SubscriptionOrderByWithAggregationInput[]
    by: SubscriptionScalarFieldEnum[] | SubscriptionScalarFieldEnum
    having?: SubscriptionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SubscriptionCountAggregateInputType | true
    _min?: SubscriptionMinAggregateInputType
    _max?: SubscriptionMaxAggregateInputType
  }

  export type SubscriptionGroupByOutputType = {
    id: string
    userId: string
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
    stripePriceId: string | null
    stripeCurrentPeriodStart: Date | null
    stripeCurrentPeriodEnd: Date | null
    stripeCancelAtPeriodEnd: boolean
    status: $Enums.SubscriptionStatus
    plan: $Enums.SubscriptionPlan
    createdAt: Date
    updatedAt: Date
    _count: SubscriptionCountAggregateOutputType | null
    _min: SubscriptionMinAggregateOutputType | null
    _max: SubscriptionMaxAggregateOutputType | null
  }

  type GetSubscriptionGroupByPayload<T extends SubscriptionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SubscriptionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SubscriptionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SubscriptionGroupByOutputType[P]>
            : GetScalarType<T[P], SubscriptionGroupByOutputType[P]>
        }
      >
    >


  export type SubscriptionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    stripeCustomerId?: boolean
    stripeSubscriptionId?: boolean
    stripePriceId?: boolean
    stripeCurrentPeriodStart?: boolean
    stripeCurrentPeriodEnd?: boolean
    stripeCancelAtPeriodEnd?: boolean
    status?: boolean
    plan?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["subscription"]>

  export type SubscriptionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    stripeCustomerId?: boolean
    stripeSubscriptionId?: boolean
    stripePriceId?: boolean
    stripeCurrentPeriodStart?: boolean
    stripeCurrentPeriodEnd?: boolean
    stripeCancelAtPeriodEnd?: boolean
    status?: boolean
    plan?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["subscription"]>

  export type SubscriptionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    stripeCustomerId?: boolean
    stripeSubscriptionId?: boolean
    stripePriceId?: boolean
    stripeCurrentPeriodStart?: boolean
    stripeCurrentPeriodEnd?: boolean
    stripeCancelAtPeriodEnd?: boolean
    status?: boolean
    plan?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["subscription"]>

  export type SubscriptionSelectScalar = {
    id?: boolean
    userId?: boolean
    stripeCustomerId?: boolean
    stripeSubscriptionId?: boolean
    stripePriceId?: boolean
    stripeCurrentPeriodStart?: boolean
    stripeCurrentPeriodEnd?: boolean
    stripeCancelAtPeriodEnd?: boolean
    status?: boolean
    plan?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SubscriptionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "stripeCustomerId" | "stripeSubscriptionId" | "stripePriceId" | "stripeCurrentPeriodStart" | "stripeCurrentPeriodEnd" | "stripeCancelAtPeriodEnd" | "status" | "plan" | "createdAt" | "updatedAt", ExtArgs["result"]["subscription"]>
  export type SubscriptionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SubscriptionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type SubscriptionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $SubscriptionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Subscription"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      stripeCustomerId: string | null
      stripeSubscriptionId: string | null
      stripePriceId: string | null
      stripeCurrentPeriodStart: Date | null
      stripeCurrentPeriodEnd: Date | null
      stripeCancelAtPeriodEnd: boolean
      status: $Enums.SubscriptionStatus
      plan: $Enums.SubscriptionPlan
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["subscription"]>
    composites: {}
  }

  type SubscriptionGetPayload<S extends boolean | null | undefined | SubscriptionDefaultArgs> = $Result.GetResult<Prisma.$SubscriptionPayload, S>

  type SubscriptionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SubscriptionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SubscriptionCountAggregateInputType | true
    }

  export interface SubscriptionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Subscription'], meta: { name: 'Subscription' } }
    /**
     * Find zero or one Subscription that matches the filter.
     * @param {SubscriptionFindUniqueArgs} args - Arguments to find a Subscription
     * @example
     * // Get one Subscription
     * const subscription = await prisma.subscription.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SubscriptionFindUniqueArgs>(args: SelectSubset<T, SubscriptionFindUniqueArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Subscription that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SubscriptionFindUniqueOrThrowArgs} args - Arguments to find a Subscription
     * @example
     * // Get one Subscription
     * const subscription = await prisma.subscription.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SubscriptionFindUniqueOrThrowArgs>(args: SelectSubset<T, SubscriptionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Subscription that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionFindFirstArgs} args - Arguments to find a Subscription
     * @example
     * // Get one Subscription
     * const subscription = await prisma.subscription.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SubscriptionFindFirstArgs>(args?: SelectSubset<T, SubscriptionFindFirstArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Subscription that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionFindFirstOrThrowArgs} args - Arguments to find a Subscription
     * @example
     * // Get one Subscription
     * const subscription = await prisma.subscription.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SubscriptionFindFirstOrThrowArgs>(args?: SelectSubset<T, SubscriptionFindFirstOrThrowArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Subscriptions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Subscriptions
     * const subscriptions = await prisma.subscription.findMany()
     * 
     * // Get first 10 Subscriptions
     * const subscriptions = await prisma.subscription.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const subscriptionWithIdOnly = await prisma.subscription.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SubscriptionFindManyArgs>(args?: SelectSubset<T, SubscriptionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Subscription.
     * @param {SubscriptionCreateArgs} args - Arguments to create a Subscription.
     * @example
     * // Create one Subscription
     * const Subscription = await prisma.subscription.create({
     *   data: {
     *     // ... data to create a Subscription
     *   }
     * })
     * 
     */
    create<T extends SubscriptionCreateArgs>(args: SelectSubset<T, SubscriptionCreateArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Subscriptions.
     * @param {SubscriptionCreateManyArgs} args - Arguments to create many Subscriptions.
     * @example
     * // Create many Subscriptions
     * const subscription = await prisma.subscription.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SubscriptionCreateManyArgs>(args?: SelectSubset<T, SubscriptionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Subscriptions and returns the data saved in the database.
     * @param {SubscriptionCreateManyAndReturnArgs} args - Arguments to create many Subscriptions.
     * @example
     * // Create many Subscriptions
     * const subscription = await prisma.subscription.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Subscriptions and only return the `id`
     * const subscriptionWithIdOnly = await prisma.subscription.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SubscriptionCreateManyAndReturnArgs>(args?: SelectSubset<T, SubscriptionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Subscription.
     * @param {SubscriptionDeleteArgs} args - Arguments to delete one Subscription.
     * @example
     * // Delete one Subscription
     * const Subscription = await prisma.subscription.delete({
     *   where: {
     *     // ... filter to delete one Subscription
     *   }
     * })
     * 
     */
    delete<T extends SubscriptionDeleteArgs>(args: SelectSubset<T, SubscriptionDeleteArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Subscription.
     * @param {SubscriptionUpdateArgs} args - Arguments to update one Subscription.
     * @example
     * // Update one Subscription
     * const subscription = await prisma.subscription.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SubscriptionUpdateArgs>(args: SelectSubset<T, SubscriptionUpdateArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Subscriptions.
     * @param {SubscriptionDeleteManyArgs} args - Arguments to filter Subscriptions to delete.
     * @example
     * // Delete a few Subscriptions
     * const { count } = await prisma.subscription.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SubscriptionDeleteManyArgs>(args?: SelectSubset<T, SubscriptionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Subscriptions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Subscriptions
     * const subscription = await prisma.subscription.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SubscriptionUpdateManyArgs>(args: SelectSubset<T, SubscriptionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Subscriptions and returns the data updated in the database.
     * @param {SubscriptionUpdateManyAndReturnArgs} args - Arguments to update many Subscriptions.
     * @example
     * // Update many Subscriptions
     * const subscription = await prisma.subscription.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Subscriptions and only return the `id`
     * const subscriptionWithIdOnly = await prisma.subscription.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SubscriptionUpdateManyAndReturnArgs>(args: SelectSubset<T, SubscriptionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Subscription.
     * @param {SubscriptionUpsertArgs} args - Arguments to update or create a Subscription.
     * @example
     * // Update or create a Subscription
     * const subscription = await prisma.subscription.upsert({
     *   create: {
     *     // ... data to create a Subscription
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Subscription we want to update
     *   }
     * })
     */
    upsert<T extends SubscriptionUpsertArgs>(args: SelectSubset<T, SubscriptionUpsertArgs<ExtArgs>>): Prisma__SubscriptionClient<$Result.GetResult<Prisma.$SubscriptionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Subscriptions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionCountArgs} args - Arguments to filter Subscriptions to count.
     * @example
     * // Count the number of Subscriptions
     * const count = await prisma.subscription.count({
     *   where: {
     *     // ... the filter for the Subscriptions we want to count
     *   }
     * })
    **/
    count<T extends SubscriptionCountArgs>(
      args?: Subset<T, SubscriptionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SubscriptionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Subscription.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SubscriptionAggregateArgs>(args: Subset<T, SubscriptionAggregateArgs>): Prisma.PrismaPromise<GetSubscriptionAggregateType<T>>

    /**
     * Group by Subscription.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriptionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SubscriptionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SubscriptionGroupByArgs['orderBy'] }
        : { orderBy?: SubscriptionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SubscriptionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSubscriptionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Subscription model
   */
  readonly fields: SubscriptionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Subscription.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SubscriptionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Subscription model
   */
  interface SubscriptionFieldRefs {
    readonly id: FieldRef<"Subscription", 'String'>
    readonly userId: FieldRef<"Subscription", 'String'>
    readonly stripeCustomerId: FieldRef<"Subscription", 'String'>
    readonly stripeSubscriptionId: FieldRef<"Subscription", 'String'>
    readonly stripePriceId: FieldRef<"Subscription", 'String'>
    readonly stripeCurrentPeriodStart: FieldRef<"Subscription", 'DateTime'>
    readonly stripeCurrentPeriodEnd: FieldRef<"Subscription", 'DateTime'>
    readonly stripeCancelAtPeriodEnd: FieldRef<"Subscription", 'Boolean'>
    readonly status: FieldRef<"Subscription", 'SubscriptionStatus'>
    readonly plan: FieldRef<"Subscription", 'SubscriptionPlan'>
    readonly createdAt: FieldRef<"Subscription", 'DateTime'>
    readonly updatedAt: FieldRef<"Subscription", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Subscription findUnique
   */
  export type SubscriptionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * Filter, which Subscription to fetch.
     */
    where: SubscriptionWhereUniqueInput
  }

  /**
   * Subscription findUniqueOrThrow
   */
  export type SubscriptionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * Filter, which Subscription to fetch.
     */
    where: SubscriptionWhereUniqueInput
  }

  /**
   * Subscription findFirst
   */
  export type SubscriptionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * Filter, which Subscription to fetch.
     */
    where?: SubscriptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subscriptions to fetch.
     */
    orderBy?: SubscriptionOrderByWithRelationInput | SubscriptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Subscriptions.
     */
    cursor?: SubscriptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subscriptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subscriptions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Subscriptions.
     */
    distinct?: SubscriptionScalarFieldEnum | SubscriptionScalarFieldEnum[]
  }

  /**
   * Subscription findFirstOrThrow
   */
  export type SubscriptionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * Filter, which Subscription to fetch.
     */
    where?: SubscriptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subscriptions to fetch.
     */
    orderBy?: SubscriptionOrderByWithRelationInput | SubscriptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Subscriptions.
     */
    cursor?: SubscriptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subscriptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subscriptions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Subscriptions.
     */
    distinct?: SubscriptionScalarFieldEnum | SubscriptionScalarFieldEnum[]
  }

  /**
   * Subscription findMany
   */
  export type SubscriptionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * Filter, which Subscriptions to fetch.
     */
    where?: SubscriptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subscriptions to fetch.
     */
    orderBy?: SubscriptionOrderByWithRelationInput | SubscriptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Subscriptions.
     */
    cursor?: SubscriptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subscriptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subscriptions.
     */
    skip?: number
    distinct?: SubscriptionScalarFieldEnum | SubscriptionScalarFieldEnum[]
  }

  /**
   * Subscription create
   */
  export type SubscriptionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * The data needed to create a Subscription.
     */
    data: XOR<SubscriptionCreateInput, SubscriptionUncheckedCreateInput>
  }

  /**
   * Subscription createMany
   */
  export type SubscriptionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Subscriptions.
     */
    data: SubscriptionCreateManyInput | SubscriptionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Subscription createManyAndReturn
   */
  export type SubscriptionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * The data used to create many Subscriptions.
     */
    data: SubscriptionCreateManyInput | SubscriptionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Subscription update
   */
  export type SubscriptionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * The data needed to update a Subscription.
     */
    data: XOR<SubscriptionUpdateInput, SubscriptionUncheckedUpdateInput>
    /**
     * Choose, which Subscription to update.
     */
    where: SubscriptionWhereUniqueInput
  }

  /**
   * Subscription updateMany
   */
  export type SubscriptionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Subscriptions.
     */
    data: XOR<SubscriptionUpdateManyMutationInput, SubscriptionUncheckedUpdateManyInput>
    /**
     * Filter which Subscriptions to update
     */
    where?: SubscriptionWhereInput
    /**
     * Limit how many Subscriptions to update.
     */
    limit?: number
  }

  /**
   * Subscription updateManyAndReturn
   */
  export type SubscriptionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * The data used to update Subscriptions.
     */
    data: XOR<SubscriptionUpdateManyMutationInput, SubscriptionUncheckedUpdateManyInput>
    /**
     * Filter which Subscriptions to update
     */
    where?: SubscriptionWhereInput
    /**
     * Limit how many Subscriptions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Subscription upsert
   */
  export type SubscriptionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * The filter to search for the Subscription to update in case it exists.
     */
    where: SubscriptionWhereUniqueInput
    /**
     * In case the Subscription found by the `where` argument doesn't exist, create a new Subscription with this data.
     */
    create: XOR<SubscriptionCreateInput, SubscriptionUncheckedCreateInput>
    /**
     * In case the Subscription was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SubscriptionUpdateInput, SubscriptionUncheckedUpdateInput>
  }

  /**
   * Subscription delete
   */
  export type SubscriptionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
    /**
     * Filter which Subscription to delete.
     */
    where: SubscriptionWhereUniqueInput
  }

  /**
   * Subscription deleteMany
   */
  export type SubscriptionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Subscriptions to delete
     */
    where?: SubscriptionWhereInput
    /**
     * Limit how many Subscriptions to delete.
     */
    limit?: number
  }

  /**
   * Subscription without action
   */
  export type SubscriptionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscription
     */
    select?: SubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscription
     */
    omit?: SubscriptionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SubscriptionInclude<ExtArgs> | null
  }


  /**
   * Model UsageTracker
   */

  export type AggregateUsageTracker = {
    _count: UsageTrackerCountAggregateOutputType | null
    _avg: UsageTrackerAvgAggregateOutputType | null
    _sum: UsageTrackerSumAggregateOutputType | null
    _min: UsageTrackerMinAggregateOutputType | null
    _max: UsageTrackerMaxAggregateOutputType | null
  }

  export type UsageTrackerAvgAggregateOutputType = {
    count: number | null
  }

  export type UsageTrackerSumAggregateOutputType = {
    count: number | null
  }

  export type UsageTrackerMinAggregateOutputType = {
    id: string | null
    userId: string | null
    feature: $Enums.UsageFeature | null
    count: number | null
    periodStart: Date | null
    periodEnd: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UsageTrackerMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    feature: $Enums.UsageFeature | null
    count: number | null
    periodStart: Date | null
    periodEnd: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type UsageTrackerCountAggregateOutputType = {
    id: number
    userId: number
    feature: number
    count: number
    periodStart: number
    periodEnd: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type UsageTrackerAvgAggregateInputType = {
    count?: true
  }

  export type UsageTrackerSumAggregateInputType = {
    count?: true
  }

  export type UsageTrackerMinAggregateInputType = {
    id?: true
    userId?: true
    feature?: true
    count?: true
    periodStart?: true
    periodEnd?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UsageTrackerMaxAggregateInputType = {
    id?: true
    userId?: true
    feature?: true
    count?: true
    periodStart?: true
    periodEnd?: true
    createdAt?: true
    updatedAt?: true
  }

  export type UsageTrackerCountAggregateInputType = {
    id?: true
    userId?: true
    feature?: true
    count?: true
    periodStart?: true
    periodEnd?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type UsageTrackerAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UsageTracker to aggregate.
     */
    where?: UsageTrackerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UsageTrackers to fetch.
     */
    orderBy?: UsageTrackerOrderByWithRelationInput | UsageTrackerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UsageTrackerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UsageTrackers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UsageTrackers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned UsageTrackers
    **/
    _count?: true | UsageTrackerCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UsageTrackerAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UsageTrackerSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UsageTrackerMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UsageTrackerMaxAggregateInputType
  }

  export type GetUsageTrackerAggregateType<T extends UsageTrackerAggregateArgs> = {
        [P in keyof T & keyof AggregateUsageTracker]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUsageTracker[P]>
      : GetScalarType<T[P], AggregateUsageTracker[P]>
  }




  export type UsageTrackerGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UsageTrackerWhereInput
    orderBy?: UsageTrackerOrderByWithAggregationInput | UsageTrackerOrderByWithAggregationInput[]
    by: UsageTrackerScalarFieldEnum[] | UsageTrackerScalarFieldEnum
    having?: UsageTrackerScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UsageTrackerCountAggregateInputType | true
    _avg?: UsageTrackerAvgAggregateInputType
    _sum?: UsageTrackerSumAggregateInputType
    _min?: UsageTrackerMinAggregateInputType
    _max?: UsageTrackerMaxAggregateInputType
  }

  export type UsageTrackerGroupByOutputType = {
    id: string
    userId: string
    feature: $Enums.UsageFeature
    count: number
    periodStart: Date
    periodEnd: Date
    createdAt: Date
    updatedAt: Date
    _count: UsageTrackerCountAggregateOutputType | null
    _avg: UsageTrackerAvgAggregateOutputType | null
    _sum: UsageTrackerSumAggregateOutputType | null
    _min: UsageTrackerMinAggregateOutputType | null
    _max: UsageTrackerMaxAggregateOutputType | null
  }

  type GetUsageTrackerGroupByPayload<T extends UsageTrackerGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UsageTrackerGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UsageTrackerGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UsageTrackerGroupByOutputType[P]>
            : GetScalarType<T[P], UsageTrackerGroupByOutputType[P]>
        }
      >
    >


  export type UsageTrackerSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    feature?: boolean
    count?: boolean
    periodStart?: boolean
    periodEnd?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["usageTracker"]>

  export type UsageTrackerSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    feature?: boolean
    count?: boolean
    periodStart?: boolean
    periodEnd?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["usageTracker"]>

  export type UsageTrackerSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    feature?: boolean
    count?: boolean
    periodStart?: boolean
    periodEnd?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["usageTracker"]>

  export type UsageTrackerSelectScalar = {
    id?: boolean
    userId?: boolean
    feature?: boolean
    count?: boolean
    periodStart?: boolean
    periodEnd?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type UsageTrackerOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "feature" | "count" | "periodStart" | "periodEnd" | "createdAt" | "updatedAt", ExtArgs["result"]["usageTracker"]>
  export type UsageTrackerInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type UsageTrackerIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type UsageTrackerIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $UsageTrackerPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "UsageTracker"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      feature: $Enums.UsageFeature
      count: number
      periodStart: Date
      periodEnd: Date
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["usageTracker"]>
    composites: {}
  }

  type UsageTrackerGetPayload<S extends boolean | null | undefined | UsageTrackerDefaultArgs> = $Result.GetResult<Prisma.$UsageTrackerPayload, S>

  type UsageTrackerCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UsageTrackerFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UsageTrackerCountAggregateInputType | true
    }

  export interface UsageTrackerDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['UsageTracker'], meta: { name: 'UsageTracker' } }
    /**
     * Find zero or one UsageTracker that matches the filter.
     * @param {UsageTrackerFindUniqueArgs} args - Arguments to find a UsageTracker
     * @example
     * // Get one UsageTracker
     * const usageTracker = await prisma.usageTracker.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UsageTrackerFindUniqueArgs>(args: SelectSubset<T, UsageTrackerFindUniqueArgs<ExtArgs>>): Prisma__UsageTrackerClient<$Result.GetResult<Prisma.$UsageTrackerPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one UsageTracker that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UsageTrackerFindUniqueOrThrowArgs} args - Arguments to find a UsageTracker
     * @example
     * // Get one UsageTracker
     * const usageTracker = await prisma.usageTracker.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UsageTrackerFindUniqueOrThrowArgs>(args: SelectSubset<T, UsageTrackerFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UsageTrackerClient<$Result.GetResult<Prisma.$UsageTrackerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first UsageTracker that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UsageTrackerFindFirstArgs} args - Arguments to find a UsageTracker
     * @example
     * // Get one UsageTracker
     * const usageTracker = await prisma.usageTracker.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UsageTrackerFindFirstArgs>(args?: SelectSubset<T, UsageTrackerFindFirstArgs<ExtArgs>>): Prisma__UsageTrackerClient<$Result.GetResult<Prisma.$UsageTrackerPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first UsageTracker that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UsageTrackerFindFirstOrThrowArgs} args - Arguments to find a UsageTracker
     * @example
     * // Get one UsageTracker
     * const usageTracker = await prisma.usageTracker.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UsageTrackerFindFirstOrThrowArgs>(args?: SelectSubset<T, UsageTrackerFindFirstOrThrowArgs<ExtArgs>>): Prisma__UsageTrackerClient<$Result.GetResult<Prisma.$UsageTrackerPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more UsageTrackers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UsageTrackerFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all UsageTrackers
     * const usageTrackers = await prisma.usageTracker.findMany()
     * 
     * // Get first 10 UsageTrackers
     * const usageTrackers = await prisma.usageTracker.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const usageTrackerWithIdOnly = await prisma.usageTracker.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UsageTrackerFindManyArgs>(args?: SelectSubset<T, UsageTrackerFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UsageTrackerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a UsageTracker.
     * @param {UsageTrackerCreateArgs} args - Arguments to create a UsageTracker.
     * @example
     * // Create one UsageTracker
     * const UsageTracker = await prisma.usageTracker.create({
     *   data: {
     *     // ... data to create a UsageTracker
     *   }
     * })
     * 
     */
    create<T extends UsageTrackerCreateArgs>(args: SelectSubset<T, UsageTrackerCreateArgs<ExtArgs>>): Prisma__UsageTrackerClient<$Result.GetResult<Prisma.$UsageTrackerPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many UsageTrackers.
     * @param {UsageTrackerCreateManyArgs} args - Arguments to create many UsageTrackers.
     * @example
     * // Create many UsageTrackers
     * const usageTracker = await prisma.usageTracker.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UsageTrackerCreateManyArgs>(args?: SelectSubset<T, UsageTrackerCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many UsageTrackers and returns the data saved in the database.
     * @param {UsageTrackerCreateManyAndReturnArgs} args - Arguments to create many UsageTrackers.
     * @example
     * // Create many UsageTrackers
     * const usageTracker = await prisma.usageTracker.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many UsageTrackers and only return the `id`
     * const usageTrackerWithIdOnly = await prisma.usageTracker.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UsageTrackerCreateManyAndReturnArgs>(args?: SelectSubset<T, UsageTrackerCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UsageTrackerPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a UsageTracker.
     * @param {UsageTrackerDeleteArgs} args - Arguments to delete one UsageTracker.
     * @example
     * // Delete one UsageTracker
     * const UsageTracker = await prisma.usageTracker.delete({
     *   where: {
     *     // ... filter to delete one UsageTracker
     *   }
     * })
     * 
     */
    delete<T extends UsageTrackerDeleteArgs>(args: SelectSubset<T, UsageTrackerDeleteArgs<ExtArgs>>): Prisma__UsageTrackerClient<$Result.GetResult<Prisma.$UsageTrackerPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one UsageTracker.
     * @param {UsageTrackerUpdateArgs} args - Arguments to update one UsageTracker.
     * @example
     * // Update one UsageTracker
     * const usageTracker = await prisma.usageTracker.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UsageTrackerUpdateArgs>(args: SelectSubset<T, UsageTrackerUpdateArgs<ExtArgs>>): Prisma__UsageTrackerClient<$Result.GetResult<Prisma.$UsageTrackerPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more UsageTrackers.
     * @param {UsageTrackerDeleteManyArgs} args - Arguments to filter UsageTrackers to delete.
     * @example
     * // Delete a few UsageTrackers
     * const { count } = await prisma.usageTracker.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UsageTrackerDeleteManyArgs>(args?: SelectSubset<T, UsageTrackerDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more UsageTrackers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UsageTrackerUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many UsageTrackers
     * const usageTracker = await prisma.usageTracker.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UsageTrackerUpdateManyArgs>(args: SelectSubset<T, UsageTrackerUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more UsageTrackers and returns the data updated in the database.
     * @param {UsageTrackerUpdateManyAndReturnArgs} args - Arguments to update many UsageTrackers.
     * @example
     * // Update many UsageTrackers
     * const usageTracker = await prisma.usageTracker.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more UsageTrackers and only return the `id`
     * const usageTrackerWithIdOnly = await prisma.usageTracker.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UsageTrackerUpdateManyAndReturnArgs>(args: SelectSubset<T, UsageTrackerUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UsageTrackerPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one UsageTracker.
     * @param {UsageTrackerUpsertArgs} args - Arguments to update or create a UsageTracker.
     * @example
     * // Update or create a UsageTracker
     * const usageTracker = await prisma.usageTracker.upsert({
     *   create: {
     *     // ... data to create a UsageTracker
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the UsageTracker we want to update
     *   }
     * })
     */
    upsert<T extends UsageTrackerUpsertArgs>(args: SelectSubset<T, UsageTrackerUpsertArgs<ExtArgs>>): Prisma__UsageTrackerClient<$Result.GetResult<Prisma.$UsageTrackerPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of UsageTrackers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UsageTrackerCountArgs} args - Arguments to filter UsageTrackers to count.
     * @example
     * // Count the number of UsageTrackers
     * const count = await prisma.usageTracker.count({
     *   where: {
     *     // ... the filter for the UsageTrackers we want to count
     *   }
     * })
    **/
    count<T extends UsageTrackerCountArgs>(
      args?: Subset<T, UsageTrackerCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UsageTrackerCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a UsageTracker.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UsageTrackerAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UsageTrackerAggregateArgs>(args: Subset<T, UsageTrackerAggregateArgs>): Prisma.PrismaPromise<GetUsageTrackerAggregateType<T>>

    /**
     * Group by UsageTracker.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UsageTrackerGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UsageTrackerGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UsageTrackerGroupByArgs['orderBy'] }
        : { orderBy?: UsageTrackerGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UsageTrackerGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUsageTrackerGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the UsageTracker model
   */
  readonly fields: UsageTrackerFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for UsageTracker.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UsageTrackerClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the UsageTracker model
   */
  interface UsageTrackerFieldRefs {
    readonly id: FieldRef<"UsageTracker", 'String'>
    readonly userId: FieldRef<"UsageTracker", 'String'>
    readonly feature: FieldRef<"UsageTracker", 'UsageFeature'>
    readonly count: FieldRef<"UsageTracker", 'Int'>
    readonly periodStart: FieldRef<"UsageTracker", 'DateTime'>
    readonly periodEnd: FieldRef<"UsageTracker", 'DateTime'>
    readonly createdAt: FieldRef<"UsageTracker", 'DateTime'>
    readonly updatedAt: FieldRef<"UsageTracker", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * UsageTracker findUnique
   */
  export type UsageTrackerFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageTracker
     */
    select?: UsageTrackerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UsageTracker
     */
    omit?: UsageTrackerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UsageTrackerInclude<ExtArgs> | null
    /**
     * Filter, which UsageTracker to fetch.
     */
    where: UsageTrackerWhereUniqueInput
  }

  /**
   * UsageTracker findUniqueOrThrow
   */
  export type UsageTrackerFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageTracker
     */
    select?: UsageTrackerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UsageTracker
     */
    omit?: UsageTrackerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UsageTrackerInclude<ExtArgs> | null
    /**
     * Filter, which UsageTracker to fetch.
     */
    where: UsageTrackerWhereUniqueInput
  }

  /**
   * UsageTracker findFirst
   */
  export type UsageTrackerFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageTracker
     */
    select?: UsageTrackerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UsageTracker
     */
    omit?: UsageTrackerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UsageTrackerInclude<ExtArgs> | null
    /**
     * Filter, which UsageTracker to fetch.
     */
    where?: UsageTrackerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UsageTrackers to fetch.
     */
    orderBy?: UsageTrackerOrderByWithRelationInput | UsageTrackerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UsageTrackers.
     */
    cursor?: UsageTrackerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UsageTrackers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UsageTrackers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UsageTrackers.
     */
    distinct?: UsageTrackerScalarFieldEnum | UsageTrackerScalarFieldEnum[]
  }

  /**
   * UsageTracker findFirstOrThrow
   */
  export type UsageTrackerFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageTracker
     */
    select?: UsageTrackerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UsageTracker
     */
    omit?: UsageTrackerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UsageTrackerInclude<ExtArgs> | null
    /**
     * Filter, which UsageTracker to fetch.
     */
    where?: UsageTrackerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UsageTrackers to fetch.
     */
    orderBy?: UsageTrackerOrderByWithRelationInput | UsageTrackerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for UsageTrackers.
     */
    cursor?: UsageTrackerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UsageTrackers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UsageTrackers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of UsageTrackers.
     */
    distinct?: UsageTrackerScalarFieldEnum | UsageTrackerScalarFieldEnum[]
  }

  /**
   * UsageTracker findMany
   */
  export type UsageTrackerFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageTracker
     */
    select?: UsageTrackerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UsageTracker
     */
    omit?: UsageTrackerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UsageTrackerInclude<ExtArgs> | null
    /**
     * Filter, which UsageTrackers to fetch.
     */
    where?: UsageTrackerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of UsageTrackers to fetch.
     */
    orderBy?: UsageTrackerOrderByWithRelationInput | UsageTrackerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing UsageTrackers.
     */
    cursor?: UsageTrackerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` UsageTrackers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` UsageTrackers.
     */
    skip?: number
    distinct?: UsageTrackerScalarFieldEnum | UsageTrackerScalarFieldEnum[]
  }

  /**
   * UsageTracker create
   */
  export type UsageTrackerCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageTracker
     */
    select?: UsageTrackerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UsageTracker
     */
    omit?: UsageTrackerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UsageTrackerInclude<ExtArgs> | null
    /**
     * The data needed to create a UsageTracker.
     */
    data: XOR<UsageTrackerCreateInput, UsageTrackerUncheckedCreateInput>
  }

  /**
   * UsageTracker createMany
   */
  export type UsageTrackerCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many UsageTrackers.
     */
    data: UsageTrackerCreateManyInput | UsageTrackerCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * UsageTracker createManyAndReturn
   */
  export type UsageTrackerCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageTracker
     */
    select?: UsageTrackerSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the UsageTracker
     */
    omit?: UsageTrackerOmit<ExtArgs> | null
    /**
     * The data used to create many UsageTrackers.
     */
    data: UsageTrackerCreateManyInput | UsageTrackerCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UsageTrackerIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * UsageTracker update
   */
  export type UsageTrackerUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageTracker
     */
    select?: UsageTrackerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UsageTracker
     */
    omit?: UsageTrackerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UsageTrackerInclude<ExtArgs> | null
    /**
     * The data needed to update a UsageTracker.
     */
    data: XOR<UsageTrackerUpdateInput, UsageTrackerUncheckedUpdateInput>
    /**
     * Choose, which UsageTracker to update.
     */
    where: UsageTrackerWhereUniqueInput
  }

  /**
   * UsageTracker updateMany
   */
  export type UsageTrackerUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update UsageTrackers.
     */
    data: XOR<UsageTrackerUpdateManyMutationInput, UsageTrackerUncheckedUpdateManyInput>
    /**
     * Filter which UsageTrackers to update
     */
    where?: UsageTrackerWhereInput
    /**
     * Limit how many UsageTrackers to update.
     */
    limit?: number
  }

  /**
   * UsageTracker updateManyAndReturn
   */
  export type UsageTrackerUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageTracker
     */
    select?: UsageTrackerSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the UsageTracker
     */
    omit?: UsageTrackerOmit<ExtArgs> | null
    /**
     * The data used to update UsageTrackers.
     */
    data: XOR<UsageTrackerUpdateManyMutationInput, UsageTrackerUncheckedUpdateManyInput>
    /**
     * Filter which UsageTrackers to update
     */
    where?: UsageTrackerWhereInput
    /**
     * Limit how many UsageTrackers to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UsageTrackerIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * UsageTracker upsert
   */
  export type UsageTrackerUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageTracker
     */
    select?: UsageTrackerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UsageTracker
     */
    omit?: UsageTrackerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UsageTrackerInclude<ExtArgs> | null
    /**
     * The filter to search for the UsageTracker to update in case it exists.
     */
    where: UsageTrackerWhereUniqueInput
    /**
     * In case the UsageTracker found by the `where` argument doesn't exist, create a new UsageTracker with this data.
     */
    create: XOR<UsageTrackerCreateInput, UsageTrackerUncheckedCreateInput>
    /**
     * In case the UsageTracker was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UsageTrackerUpdateInput, UsageTrackerUncheckedUpdateInput>
  }

  /**
   * UsageTracker delete
   */
  export type UsageTrackerDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageTracker
     */
    select?: UsageTrackerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UsageTracker
     */
    omit?: UsageTrackerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UsageTrackerInclude<ExtArgs> | null
    /**
     * Filter which UsageTracker to delete.
     */
    where: UsageTrackerWhereUniqueInput
  }

  /**
   * UsageTracker deleteMany
   */
  export type UsageTrackerDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which UsageTrackers to delete
     */
    where?: UsageTrackerWhereInput
    /**
     * Limit how many UsageTrackers to delete.
     */
    limit?: number
  }

  /**
   * UsageTracker without action
   */
  export type UsageTrackerDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UsageTracker
     */
    select?: UsageTrackerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the UsageTracker
     */
    omit?: UsageTrackerOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UsageTrackerInclude<ExtArgs> | null
  }


  /**
   * Model BackupCodes
   */

  export type AggregateBackupCodes = {
    _count: BackupCodesCountAggregateOutputType | null
    _min: BackupCodesMinAggregateOutputType | null
    _max: BackupCodesMaxAggregateOutputType | null
  }

  export type BackupCodesMinAggregateOutputType = {
    id: string | null
    usedAt: Date | null
    code: string | null
    userId: string | null
    createdAt: Date | null
  }

  export type BackupCodesMaxAggregateOutputType = {
    id: string | null
    usedAt: Date | null
    code: string | null
    userId: string | null
    createdAt: Date | null
  }

  export type BackupCodesCountAggregateOutputType = {
    id: number
    usedAt: number
    code: number
    userId: number
    createdAt: number
    _all: number
  }


  export type BackupCodesMinAggregateInputType = {
    id?: true
    usedAt?: true
    code?: true
    userId?: true
    createdAt?: true
  }

  export type BackupCodesMaxAggregateInputType = {
    id?: true
    usedAt?: true
    code?: true
    userId?: true
    createdAt?: true
  }

  export type BackupCodesCountAggregateInputType = {
    id?: true
    usedAt?: true
    code?: true
    userId?: true
    createdAt?: true
    _all?: true
  }

  export type BackupCodesAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BackupCodes to aggregate.
     */
    where?: BackupCodesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BackupCodes to fetch.
     */
    orderBy?: BackupCodesOrderByWithRelationInput | BackupCodesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BackupCodesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BackupCodes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BackupCodes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned BackupCodes
    **/
    _count?: true | BackupCodesCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BackupCodesMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BackupCodesMaxAggregateInputType
  }

  export type GetBackupCodesAggregateType<T extends BackupCodesAggregateArgs> = {
        [P in keyof T & keyof AggregateBackupCodes]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBackupCodes[P]>
      : GetScalarType<T[P], AggregateBackupCodes[P]>
  }




  export type BackupCodesGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BackupCodesWhereInput
    orderBy?: BackupCodesOrderByWithAggregationInput | BackupCodesOrderByWithAggregationInput[]
    by: BackupCodesScalarFieldEnum[] | BackupCodesScalarFieldEnum
    having?: BackupCodesScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BackupCodesCountAggregateInputType | true
    _min?: BackupCodesMinAggregateInputType
    _max?: BackupCodesMaxAggregateInputType
  }

  export type BackupCodesGroupByOutputType = {
    id: string
    usedAt: Date | null
    code: string
    userId: string
    createdAt: Date
    _count: BackupCodesCountAggregateOutputType | null
    _min: BackupCodesMinAggregateOutputType | null
    _max: BackupCodesMaxAggregateOutputType | null
  }

  type GetBackupCodesGroupByPayload<T extends BackupCodesGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BackupCodesGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BackupCodesGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BackupCodesGroupByOutputType[P]>
            : GetScalarType<T[P], BackupCodesGroupByOutputType[P]>
        }
      >
    >


  export type BackupCodesSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    usedAt?: boolean
    code?: boolean
    userId?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["backupCodes"]>

  export type BackupCodesSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    usedAt?: boolean
    code?: boolean
    userId?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["backupCodes"]>

  export type BackupCodesSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    usedAt?: boolean
    code?: boolean
    userId?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["backupCodes"]>

  export type BackupCodesSelectScalar = {
    id?: boolean
    usedAt?: boolean
    code?: boolean
    userId?: boolean
    createdAt?: boolean
  }

  export type BackupCodesOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "usedAt" | "code" | "userId" | "createdAt", ExtArgs["result"]["backupCodes"]>
  export type BackupCodesInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type BackupCodesIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type BackupCodesIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $BackupCodesPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "BackupCodes"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      usedAt: Date | null
      code: string
      userId: string
      createdAt: Date
    }, ExtArgs["result"]["backupCodes"]>
    composites: {}
  }

  type BackupCodesGetPayload<S extends boolean | null | undefined | BackupCodesDefaultArgs> = $Result.GetResult<Prisma.$BackupCodesPayload, S>

  type BackupCodesCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BackupCodesFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BackupCodesCountAggregateInputType | true
    }

  export interface BackupCodesDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['BackupCodes'], meta: { name: 'BackupCodes' } }
    /**
     * Find zero or one BackupCodes that matches the filter.
     * @param {BackupCodesFindUniqueArgs} args - Arguments to find a BackupCodes
     * @example
     * // Get one BackupCodes
     * const backupCodes = await prisma.backupCodes.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BackupCodesFindUniqueArgs>(args: SelectSubset<T, BackupCodesFindUniqueArgs<ExtArgs>>): Prisma__BackupCodesClient<$Result.GetResult<Prisma.$BackupCodesPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one BackupCodes that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {BackupCodesFindUniqueOrThrowArgs} args - Arguments to find a BackupCodes
     * @example
     * // Get one BackupCodes
     * const backupCodes = await prisma.backupCodes.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BackupCodesFindUniqueOrThrowArgs>(args: SelectSubset<T, BackupCodesFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BackupCodesClient<$Result.GetResult<Prisma.$BackupCodesPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first BackupCodes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BackupCodesFindFirstArgs} args - Arguments to find a BackupCodes
     * @example
     * // Get one BackupCodes
     * const backupCodes = await prisma.backupCodes.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BackupCodesFindFirstArgs>(args?: SelectSubset<T, BackupCodesFindFirstArgs<ExtArgs>>): Prisma__BackupCodesClient<$Result.GetResult<Prisma.$BackupCodesPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first BackupCodes that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BackupCodesFindFirstOrThrowArgs} args - Arguments to find a BackupCodes
     * @example
     * // Get one BackupCodes
     * const backupCodes = await prisma.backupCodes.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BackupCodesFindFirstOrThrowArgs>(args?: SelectSubset<T, BackupCodesFindFirstOrThrowArgs<ExtArgs>>): Prisma__BackupCodesClient<$Result.GetResult<Prisma.$BackupCodesPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more BackupCodes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BackupCodesFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all BackupCodes
     * const backupCodes = await prisma.backupCodes.findMany()
     * 
     * // Get first 10 BackupCodes
     * const backupCodes = await prisma.backupCodes.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const backupCodesWithIdOnly = await prisma.backupCodes.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BackupCodesFindManyArgs>(args?: SelectSubset<T, BackupCodesFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BackupCodesPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a BackupCodes.
     * @param {BackupCodesCreateArgs} args - Arguments to create a BackupCodes.
     * @example
     * // Create one BackupCodes
     * const BackupCodes = await prisma.backupCodes.create({
     *   data: {
     *     // ... data to create a BackupCodes
     *   }
     * })
     * 
     */
    create<T extends BackupCodesCreateArgs>(args: SelectSubset<T, BackupCodesCreateArgs<ExtArgs>>): Prisma__BackupCodesClient<$Result.GetResult<Prisma.$BackupCodesPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many BackupCodes.
     * @param {BackupCodesCreateManyArgs} args - Arguments to create many BackupCodes.
     * @example
     * // Create many BackupCodes
     * const backupCodes = await prisma.backupCodes.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BackupCodesCreateManyArgs>(args?: SelectSubset<T, BackupCodesCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many BackupCodes and returns the data saved in the database.
     * @param {BackupCodesCreateManyAndReturnArgs} args - Arguments to create many BackupCodes.
     * @example
     * // Create many BackupCodes
     * const backupCodes = await prisma.backupCodes.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many BackupCodes and only return the `id`
     * const backupCodesWithIdOnly = await prisma.backupCodes.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BackupCodesCreateManyAndReturnArgs>(args?: SelectSubset<T, BackupCodesCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BackupCodesPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a BackupCodes.
     * @param {BackupCodesDeleteArgs} args - Arguments to delete one BackupCodes.
     * @example
     * // Delete one BackupCodes
     * const BackupCodes = await prisma.backupCodes.delete({
     *   where: {
     *     // ... filter to delete one BackupCodes
     *   }
     * })
     * 
     */
    delete<T extends BackupCodesDeleteArgs>(args: SelectSubset<T, BackupCodesDeleteArgs<ExtArgs>>): Prisma__BackupCodesClient<$Result.GetResult<Prisma.$BackupCodesPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one BackupCodes.
     * @param {BackupCodesUpdateArgs} args - Arguments to update one BackupCodes.
     * @example
     * // Update one BackupCodes
     * const backupCodes = await prisma.backupCodes.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BackupCodesUpdateArgs>(args: SelectSubset<T, BackupCodesUpdateArgs<ExtArgs>>): Prisma__BackupCodesClient<$Result.GetResult<Prisma.$BackupCodesPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more BackupCodes.
     * @param {BackupCodesDeleteManyArgs} args - Arguments to filter BackupCodes to delete.
     * @example
     * // Delete a few BackupCodes
     * const { count } = await prisma.backupCodes.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BackupCodesDeleteManyArgs>(args?: SelectSubset<T, BackupCodesDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more BackupCodes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BackupCodesUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many BackupCodes
     * const backupCodes = await prisma.backupCodes.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BackupCodesUpdateManyArgs>(args: SelectSubset<T, BackupCodesUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more BackupCodes and returns the data updated in the database.
     * @param {BackupCodesUpdateManyAndReturnArgs} args - Arguments to update many BackupCodes.
     * @example
     * // Update many BackupCodes
     * const backupCodes = await prisma.backupCodes.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more BackupCodes and only return the `id`
     * const backupCodesWithIdOnly = await prisma.backupCodes.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends BackupCodesUpdateManyAndReturnArgs>(args: SelectSubset<T, BackupCodesUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BackupCodesPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one BackupCodes.
     * @param {BackupCodesUpsertArgs} args - Arguments to update or create a BackupCodes.
     * @example
     * // Update or create a BackupCodes
     * const backupCodes = await prisma.backupCodes.upsert({
     *   create: {
     *     // ... data to create a BackupCodes
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the BackupCodes we want to update
     *   }
     * })
     */
    upsert<T extends BackupCodesUpsertArgs>(args: SelectSubset<T, BackupCodesUpsertArgs<ExtArgs>>): Prisma__BackupCodesClient<$Result.GetResult<Prisma.$BackupCodesPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of BackupCodes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BackupCodesCountArgs} args - Arguments to filter BackupCodes to count.
     * @example
     * // Count the number of BackupCodes
     * const count = await prisma.backupCodes.count({
     *   where: {
     *     // ... the filter for the BackupCodes we want to count
     *   }
     * })
    **/
    count<T extends BackupCodesCountArgs>(
      args?: Subset<T, BackupCodesCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BackupCodesCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a BackupCodes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BackupCodesAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BackupCodesAggregateArgs>(args: Subset<T, BackupCodesAggregateArgs>): Prisma.PrismaPromise<GetBackupCodesAggregateType<T>>

    /**
     * Group by BackupCodes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BackupCodesGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BackupCodesGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BackupCodesGroupByArgs['orderBy'] }
        : { orderBy?: BackupCodesGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BackupCodesGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBackupCodesGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the BackupCodes model
   */
  readonly fields: BackupCodesFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for BackupCodes.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BackupCodesClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the BackupCodes model
   */
  interface BackupCodesFieldRefs {
    readonly id: FieldRef<"BackupCodes", 'String'>
    readonly usedAt: FieldRef<"BackupCodes", 'DateTime'>
    readonly code: FieldRef<"BackupCodes", 'String'>
    readonly userId: FieldRef<"BackupCodes", 'String'>
    readonly createdAt: FieldRef<"BackupCodes", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * BackupCodes findUnique
   */
  export type BackupCodesFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupCodes
     */
    select?: BackupCodesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackupCodes
     */
    omit?: BackupCodesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackupCodesInclude<ExtArgs> | null
    /**
     * Filter, which BackupCodes to fetch.
     */
    where: BackupCodesWhereUniqueInput
  }

  /**
   * BackupCodes findUniqueOrThrow
   */
  export type BackupCodesFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupCodes
     */
    select?: BackupCodesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackupCodes
     */
    omit?: BackupCodesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackupCodesInclude<ExtArgs> | null
    /**
     * Filter, which BackupCodes to fetch.
     */
    where: BackupCodesWhereUniqueInput
  }

  /**
   * BackupCodes findFirst
   */
  export type BackupCodesFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupCodes
     */
    select?: BackupCodesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackupCodes
     */
    omit?: BackupCodesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackupCodesInclude<ExtArgs> | null
    /**
     * Filter, which BackupCodes to fetch.
     */
    where?: BackupCodesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BackupCodes to fetch.
     */
    orderBy?: BackupCodesOrderByWithRelationInput | BackupCodesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BackupCodes.
     */
    cursor?: BackupCodesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BackupCodes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BackupCodes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BackupCodes.
     */
    distinct?: BackupCodesScalarFieldEnum | BackupCodesScalarFieldEnum[]
  }

  /**
   * BackupCodes findFirstOrThrow
   */
  export type BackupCodesFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupCodes
     */
    select?: BackupCodesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackupCodes
     */
    omit?: BackupCodesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackupCodesInclude<ExtArgs> | null
    /**
     * Filter, which BackupCodes to fetch.
     */
    where?: BackupCodesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BackupCodes to fetch.
     */
    orderBy?: BackupCodesOrderByWithRelationInput | BackupCodesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BackupCodes.
     */
    cursor?: BackupCodesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BackupCodes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BackupCodes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BackupCodes.
     */
    distinct?: BackupCodesScalarFieldEnum | BackupCodesScalarFieldEnum[]
  }

  /**
   * BackupCodes findMany
   */
  export type BackupCodesFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupCodes
     */
    select?: BackupCodesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackupCodes
     */
    omit?: BackupCodesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackupCodesInclude<ExtArgs> | null
    /**
     * Filter, which BackupCodes to fetch.
     */
    where?: BackupCodesWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BackupCodes to fetch.
     */
    orderBy?: BackupCodesOrderByWithRelationInput | BackupCodesOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing BackupCodes.
     */
    cursor?: BackupCodesWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BackupCodes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BackupCodes.
     */
    skip?: number
    distinct?: BackupCodesScalarFieldEnum | BackupCodesScalarFieldEnum[]
  }

  /**
   * BackupCodes create
   */
  export type BackupCodesCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupCodes
     */
    select?: BackupCodesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackupCodes
     */
    omit?: BackupCodesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackupCodesInclude<ExtArgs> | null
    /**
     * The data needed to create a BackupCodes.
     */
    data: XOR<BackupCodesCreateInput, BackupCodesUncheckedCreateInput>
  }

  /**
   * BackupCodes createMany
   */
  export type BackupCodesCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many BackupCodes.
     */
    data: BackupCodesCreateManyInput | BackupCodesCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * BackupCodes createManyAndReturn
   */
  export type BackupCodesCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupCodes
     */
    select?: BackupCodesSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the BackupCodes
     */
    omit?: BackupCodesOmit<ExtArgs> | null
    /**
     * The data used to create many BackupCodes.
     */
    data: BackupCodesCreateManyInput | BackupCodesCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackupCodesIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * BackupCodes update
   */
  export type BackupCodesUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupCodes
     */
    select?: BackupCodesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackupCodes
     */
    omit?: BackupCodesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackupCodesInclude<ExtArgs> | null
    /**
     * The data needed to update a BackupCodes.
     */
    data: XOR<BackupCodesUpdateInput, BackupCodesUncheckedUpdateInput>
    /**
     * Choose, which BackupCodes to update.
     */
    where: BackupCodesWhereUniqueInput
  }

  /**
   * BackupCodes updateMany
   */
  export type BackupCodesUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update BackupCodes.
     */
    data: XOR<BackupCodesUpdateManyMutationInput, BackupCodesUncheckedUpdateManyInput>
    /**
     * Filter which BackupCodes to update
     */
    where?: BackupCodesWhereInput
    /**
     * Limit how many BackupCodes to update.
     */
    limit?: number
  }

  /**
   * BackupCodes updateManyAndReturn
   */
  export type BackupCodesUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupCodes
     */
    select?: BackupCodesSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the BackupCodes
     */
    omit?: BackupCodesOmit<ExtArgs> | null
    /**
     * The data used to update BackupCodes.
     */
    data: XOR<BackupCodesUpdateManyMutationInput, BackupCodesUncheckedUpdateManyInput>
    /**
     * Filter which BackupCodes to update
     */
    where?: BackupCodesWhereInput
    /**
     * Limit how many BackupCodes to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackupCodesIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * BackupCodes upsert
   */
  export type BackupCodesUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupCodes
     */
    select?: BackupCodesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackupCodes
     */
    omit?: BackupCodesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackupCodesInclude<ExtArgs> | null
    /**
     * The filter to search for the BackupCodes to update in case it exists.
     */
    where: BackupCodesWhereUniqueInput
    /**
     * In case the BackupCodes found by the `where` argument doesn't exist, create a new BackupCodes with this data.
     */
    create: XOR<BackupCodesCreateInput, BackupCodesUncheckedCreateInput>
    /**
     * In case the BackupCodes was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BackupCodesUpdateInput, BackupCodesUncheckedUpdateInput>
  }

  /**
   * BackupCodes delete
   */
  export type BackupCodesDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupCodes
     */
    select?: BackupCodesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackupCodes
     */
    omit?: BackupCodesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackupCodesInclude<ExtArgs> | null
    /**
     * Filter which BackupCodes to delete.
     */
    where: BackupCodesWhereUniqueInput
  }

  /**
   * BackupCodes deleteMany
   */
  export type BackupCodesDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BackupCodes to delete
     */
    where?: BackupCodesWhereInput
    /**
     * Limit how many BackupCodes to delete.
     */
    limit?: number
  }

  /**
   * BackupCodes without action
   */
  export type BackupCodesDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupCodes
     */
    select?: BackupCodesSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackupCodes
     */
    omit?: BackupCodesOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BackupCodesInclude<ExtArgs> | null
  }


  /**
   * Model ActivityLogs
   */

  export type AggregateActivityLogs = {
    _count: ActivityLogsCountAggregateOutputType | null
    _min: ActivityLogsMinAggregateOutputType | null
    _max: ActivityLogsMaxAggregateOutputType | null
  }

  export type ActivityLogsMinAggregateOutputType = {
    id: string | null
  }

  export type ActivityLogsMaxAggregateOutputType = {
    id: string | null
  }

  export type ActivityLogsCountAggregateOutputType = {
    id: number
    _all: number
  }


  export type ActivityLogsMinAggregateInputType = {
    id?: true
  }

  export type ActivityLogsMaxAggregateInputType = {
    id?: true
  }

  export type ActivityLogsCountAggregateInputType = {
    id?: true
    _all?: true
  }

  export type ActivityLogsAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ActivityLogs to aggregate.
     */
    where?: ActivityLogsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ActivityLogs to fetch.
     */
    orderBy?: ActivityLogsOrderByWithRelationInput | ActivityLogsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ActivityLogsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ActivityLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ActivityLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ActivityLogs
    **/
    _count?: true | ActivityLogsCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ActivityLogsMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ActivityLogsMaxAggregateInputType
  }

  export type GetActivityLogsAggregateType<T extends ActivityLogsAggregateArgs> = {
        [P in keyof T & keyof AggregateActivityLogs]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateActivityLogs[P]>
      : GetScalarType<T[P], AggregateActivityLogs[P]>
  }




  export type ActivityLogsGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ActivityLogsWhereInput
    orderBy?: ActivityLogsOrderByWithAggregationInput | ActivityLogsOrderByWithAggregationInput[]
    by: ActivityLogsScalarFieldEnum[] | ActivityLogsScalarFieldEnum
    having?: ActivityLogsScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ActivityLogsCountAggregateInputType | true
    _min?: ActivityLogsMinAggregateInputType
    _max?: ActivityLogsMaxAggregateInputType
  }

  export type ActivityLogsGroupByOutputType = {
    id: string
    _count: ActivityLogsCountAggregateOutputType | null
    _min: ActivityLogsMinAggregateOutputType | null
    _max: ActivityLogsMaxAggregateOutputType | null
  }

  type GetActivityLogsGroupByPayload<T extends ActivityLogsGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ActivityLogsGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ActivityLogsGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ActivityLogsGroupByOutputType[P]>
            : GetScalarType<T[P], ActivityLogsGroupByOutputType[P]>
        }
      >
    >


  export type ActivityLogsSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
  }, ExtArgs["result"]["activityLogs"]>

  export type ActivityLogsSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
  }, ExtArgs["result"]["activityLogs"]>

  export type ActivityLogsSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
  }, ExtArgs["result"]["activityLogs"]>

  export type ActivityLogsSelectScalar = {
    id?: boolean
  }

  export type ActivityLogsOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id", ExtArgs["result"]["activityLogs"]>

  export type $ActivityLogsPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ActivityLogs"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
    }, ExtArgs["result"]["activityLogs"]>
    composites: {}
  }

  type ActivityLogsGetPayload<S extends boolean | null | undefined | ActivityLogsDefaultArgs> = $Result.GetResult<Prisma.$ActivityLogsPayload, S>

  type ActivityLogsCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ActivityLogsFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ActivityLogsCountAggregateInputType | true
    }

  export interface ActivityLogsDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ActivityLogs'], meta: { name: 'ActivityLogs' } }
    /**
     * Find zero or one ActivityLogs that matches the filter.
     * @param {ActivityLogsFindUniqueArgs} args - Arguments to find a ActivityLogs
     * @example
     * // Get one ActivityLogs
     * const activityLogs = await prisma.activityLogs.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ActivityLogsFindUniqueArgs>(args: SelectSubset<T, ActivityLogsFindUniqueArgs<ExtArgs>>): Prisma__ActivityLogsClient<$Result.GetResult<Prisma.$ActivityLogsPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ActivityLogs that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ActivityLogsFindUniqueOrThrowArgs} args - Arguments to find a ActivityLogs
     * @example
     * // Get one ActivityLogs
     * const activityLogs = await prisma.activityLogs.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ActivityLogsFindUniqueOrThrowArgs>(args: SelectSubset<T, ActivityLogsFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ActivityLogsClient<$Result.GetResult<Prisma.$ActivityLogsPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ActivityLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityLogsFindFirstArgs} args - Arguments to find a ActivityLogs
     * @example
     * // Get one ActivityLogs
     * const activityLogs = await prisma.activityLogs.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ActivityLogsFindFirstArgs>(args?: SelectSubset<T, ActivityLogsFindFirstArgs<ExtArgs>>): Prisma__ActivityLogsClient<$Result.GetResult<Prisma.$ActivityLogsPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ActivityLogs that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityLogsFindFirstOrThrowArgs} args - Arguments to find a ActivityLogs
     * @example
     * // Get one ActivityLogs
     * const activityLogs = await prisma.activityLogs.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ActivityLogsFindFirstOrThrowArgs>(args?: SelectSubset<T, ActivityLogsFindFirstOrThrowArgs<ExtArgs>>): Prisma__ActivityLogsClient<$Result.GetResult<Prisma.$ActivityLogsPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ActivityLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityLogsFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ActivityLogs
     * const activityLogs = await prisma.activityLogs.findMany()
     * 
     * // Get first 10 ActivityLogs
     * const activityLogs = await prisma.activityLogs.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const activityLogsWithIdOnly = await prisma.activityLogs.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ActivityLogsFindManyArgs>(args?: SelectSubset<T, ActivityLogsFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ActivityLogsPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ActivityLogs.
     * @param {ActivityLogsCreateArgs} args - Arguments to create a ActivityLogs.
     * @example
     * // Create one ActivityLogs
     * const ActivityLogs = await prisma.activityLogs.create({
     *   data: {
     *     // ... data to create a ActivityLogs
     *   }
     * })
     * 
     */
    create<T extends ActivityLogsCreateArgs>(args: SelectSubset<T, ActivityLogsCreateArgs<ExtArgs>>): Prisma__ActivityLogsClient<$Result.GetResult<Prisma.$ActivityLogsPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ActivityLogs.
     * @param {ActivityLogsCreateManyArgs} args - Arguments to create many ActivityLogs.
     * @example
     * // Create many ActivityLogs
     * const activityLogs = await prisma.activityLogs.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ActivityLogsCreateManyArgs>(args?: SelectSubset<T, ActivityLogsCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ActivityLogs and returns the data saved in the database.
     * @param {ActivityLogsCreateManyAndReturnArgs} args - Arguments to create many ActivityLogs.
     * @example
     * // Create many ActivityLogs
     * const activityLogs = await prisma.activityLogs.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ActivityLogs and only return the `id`
     * const activityLogsWithIdOnly = await prisma.activityLogs.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ActivityLogsCreateManyAndReturnArgs>(args?: SelectSubset<T, ActivityLogsCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ActivityLogsPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ActivityLogs.
     * @param {ActivityLogsDeleteArgs} args - Arguments to delete one ActivityLogs.
     * @example
     * // Delete one ActivityLogs
     * const ActivityLogs = await prisma.activityLogs.delete({
     *   where: {
     *     // ... filter to delete one ActivityLogs
     *   }
     * })
     * 
     */
    delete<T extends ActivityLogsDeleteArgs>(args: SelectSubset<T, ActivityLogsDeleteArgs<ExtArgs>>): Prisma__ActivityLogsClient<$Result.GetResult<Prisma.$ActivityLogsPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ActivityLogs.
     * @param {ActivityLogsUpdateArgs} args - Arguments to update one ActivityLogs.
     * @example
     * // Update one ActivityLogs
     * const activityLogs = await prisma.activityLogs.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ActivityLogsUpdateArgs>(args: SelectSubset<T, ActivityLogsUpdateArgs<ExtArgs>>): Prisma__ActivityLogsClient<$Result.GetResult<Prisma.$ActivityLogsPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ActivityLogs.
     * @param {ActivityLogsDeleteManyArgs} args - Arguments to filter ActivityLogs to delete.
     * @example
     * // Delete a few ActivityLogs
     * const { count } = await prisma.activityLogs.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ActivityLogsDeleteManyArgs>(args?: SelectSubset<T, ActivityLogsDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ActivityLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityLogsUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ActivityLogs
     * const activityLogs = await prisma.activityLogs.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ActivityLogsUpdateManyArgs>(args: SelectSubset<T, ActivityLogsUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ActivityLogs and returns the data updated in the database.
     * @param {ActivityLogsUpdateManyAndReturnArgs} args - Arguments to update many ActivityLogs.
     * @example
     * // Update many ActivityLogs
     * const activityLogs = await prisma.activityLogs.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ActivityLogs and only return the `id`
     * const activityLogsWithIdOnly = await prisma.activityLogs.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ActivityLogsUpdateManyAndReturnArgs>(args: SelectSubset<T, ActivityLogsUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ActivityLogsPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ActivityLogs.
     * @param {ActivityLogsUpsertArgs} args - Arguments to update or create a ActivityLogs.
     * @example
     * // Update or create a ActivityLogs
     * const activityLogs = await prisma.activityLogs.upsert({
     *   create: {
     *     // ... data to create a ActivityLogs
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ActivityLogs we want to update
     *   }
     * })
     */
    upsert<T extends ActivityLogsUpsertArgs>(args: SelectSubset<T, ActivityLogsUpsertArgs<ExtArgs>>): Prisma__ActivityLogsClient<$Result.GetResult<Prisma.$ActivityLogsPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ActivityLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityLogsCountArgs} args - Arguments to filter ActivityLogs to count.
     * @example
     * // Count the number of ActivityLogs
     * const count = await prisma.activityLogs.count({
     *   where: {
     *     // ... the filter for the ActivityLogs we want to count
     *   }
     * })
    **/
    count<T extends ActivityLogsCountArgs>(
      args?: Subset<T, ActivityLogsCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ActivityLogsCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ActivityLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityLogsAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ActivityLogsAggregateArgs>(args: Subset<T, ActivityLogsAggregateArgs>): Prisma.PrismaPromise<GetActivityLogsAggregateType<T>>

    /**
     * Group by ActivityLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityLogsGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ActivityLogsGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ActivityLogsGroupByArgs['orderBy'] }
        : { orderBy?: ActivityLogsGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ActivityLogsGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetActivityLogsGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ActivityLogs model
   */
  readonly fields: ActivityLogsFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ActivityLogs.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ActivityLogsClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ActivityLogs model
   */
  interface ActivityLogsFieldRefs {
    readonly id: FieldRef<"ActivityLogs", 'String'>
  }
    

  // Custom InputTypes
  /**
   * ActivityLogs findUnique
   */
  export type ActivityLogsFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityLogs
     */
    select?: ActivityLogsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ActivityLogs
     */
    omit?: ActivityLogsOmit<ExtArgs> | null
    /**
     * Filter, which ActivityLogs to fetch.
     */
    where: ActivityLogsWhereUniqueInput
  }

  /**
   * ActivityLogs findUniqueOrThrow
   */
  export type ActivityLogsFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityLogs
     */
    select?: ActivityLogsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ActivityLogs
     */
    omit?: ActivityLogsOmit<ExtArgs> | null
    /**
     * Filter, which ActivityLogs to fetch.
     */
    where: ActivityLogsWhereUniqueInput
  }

  /**
   * ActivityLogs findFirst
   */
  export type ActivityLogsFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityLogs
     */
    select?: ActivityLogsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ActivityLogs
     */
    omit?: ActivityLogsOmit<ExtArgs> | null
    /**
     * Filter, which ActivityLogs to fetch.
     */
    where?: ActivityLogsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ActivityLogs to fetch.
     */
    orderBy?: ActivityLogsOrderByWithRelationInput | ActivityLogsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ActivityLogs.
     */
    cursor?: ActivityLogsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ActivityLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ActivityLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ActivityLogs.
     */
    distinct?: ActivityLogsScalarFieldEnum | ActivityLogsScalarFieldEnum[]
  }

  /**
   * ActivityLogs findFirstOrThrow
   */
  export type ActivityLogsFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityLogs
     */
    select?: ActivityLogsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ActivityLogs
     */
    omit?: ActivityLogsOmit<ExtArgs> | null
    /**
     * Filter, which ActivityLogs to fetch.
     */
    where?: ActivityLogsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ActivityLogs to fetch.
     */
    orderBy?: ActivityLogsOrderByWithRelationInput | ActivityLogsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ActivityLogs.
     */
    cursor?: ActivityLogsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ActivityLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ActivityLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ActivityLogs.
     */
    distinct?: ActivityLogsScalarFieldEnum | ActivityLogsScalarFieldEnum[]
  }

  /**
   * ActivityLogs findMany
   */
  export type ActivityLogsFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityLogs
     */
    select?: ActivityLogsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ActivityLogs
     */
    omit?: ActivityLogsOmit<ExtArgs> | null
    /**
     * Filter, which ActivityLogs to fetch.
     */
    where?: ActivityLogsWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ActivityLogs to fetch.
     */
    orderBy?: ActivityLogsOrderByWithRelationInput | ActivityLogsOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ActivityLogs.
     */
    cursor?: ActivityLogsWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ActivityLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ActivityLogs.
     */
    skip?: number
    distinct?: ActivityLogsScalarFieldEnum | ActivityLogsScalarFieldEnum[]
  }

  /**
   * ActivityLogs create
   */
  export type ActivityLogsCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityLogs
     */
    select?: ActivityLogsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ActivityLogs
     */
    omit?: ActivityLogsOmit<ExtArgs> | null
    /**
     * The data needed to create a ActivityLogs.
     */
    data?: XOR<ActivityLogsCreateInput, ActivityLogsUncheckedCreateInput>
  }

  /**
   * ActivityLogs createMany
   */
  export type ActivityLogsCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ActivityLogs.
     */
    data: ActivityLogsCreateManyInput | ActivityLogsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ActivityLogs createManyAndReturn
   */
  export type ActivityLogsCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityLogs
     */
    select?: ActivityLogsSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ActivityLogs
     */
    omit?: ActivityLogsOmit<ExtArgs> | null
    /**
     * The data used to create many ActivityLogs.
     */
    data: ActivityLogsCreateManyInput | ActivityLogsCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ActivityLogs update
   */
  export type ActivityLogsUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityLogs
     */
    select?: ActivityLogsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ActivityLogs
     */
    omit?: ActivityLogsOmit<ExtArgs> | null
    /**
     * The data needed to update a ActivityLogs.
     */
    data: XOR<ActivityLogsUpdateInput, ActivityLogsUncheckedUpdateInput>
    /**
     * Choose, which ActivityLogs to update.
     */
    where: ActivityLogsWhereUniqueInput
  }

  /**
   * ActivityLogs updateMany
   */
  export type ActivityLogsUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ActivityLogs.
     */
    data: XOR<ActivityLogsUpdateManyMutationInput, ActivityLogsUncheckedUpdateManyInput>
    /**
     * Filter which ActivityLogs to update
     */
    where?: ActivityLogsWhereInput
    /**
     * Limit how many ActivityLogs to update.
     */
    limit?: number
  }

  /**
   * ActivityLogs updateManyAndReturn
   */
  export type ActivityLogsUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityLogs
     */
    select?: ActivityLogsSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ActivityLogs
     */
    omit?: ActivityLogsOmit<ExtArgs> | null
    /**
     * The data used to update ActivityLogs.
     */
    data: XOR<ActivityLogsUpdateManyMutationInput, ActivityLogsUncheckedUpdateManyInput>
    /**
     * Filter which ActivityLogs to update
     */
    where?: ActivityLogsWhereInput
    /**
     * Limit how many ActivityLogs to update.
     */
    limit?: number
  }

  /**
   * ActivityLogs upsert
   */
  export type ActivityLogsUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityLogs
     */
    select?: ActivityLogsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ActivityLogs
     */
    omit?: ActivityLogsOmit<ExtArgs> | null
    /**
     * The filter to search for the ActivityLogs to update in case it exists.
     */
    where: ActivityLogsWhereUniqueInput
    /**
     * In case the ActivityLogs found by the `where` argument doesn't exist, create a new ActivityLogs with this data.
     */
    create: XOR<ActivityLogsCreateInput, ActivityLogsUncheckedCreateInput>
    /**
     * In case the ActivityLogs was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ActivityLogsUpdateInput, ActivityLogsUncheckedUpdateInput>
  }

  /**
   * ActivityLogs delete
   */
  export type ActivityLogsDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityLogs
     */
    select?: ActivityLogsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ActivityLogs
     */
    omit?: ActivityLogsOmit<ExtArgs> | null
    /**
     * Filter which ActivityLogs to delete.
     */
    where: ActivityLogsWhereUniqueInput
  }

  /**
   * ActivityLogs deleteMany
   */
  export type ActivityLogsDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ActivityLogs to delete
     */
    where?: ActivityLogsWhereInput
    /**
     * Limit how many ActivityLogs to delete.
     */
    limit?: number
  }

  /**
   * ActivityLogs without action
   */
  export type ActivityLogsDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityLogs
     */
    select?: ActivityLogsSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ActivityLogs
     */
    omit?: ActivityLogsOmit<ExtArgs> | null
  }


  /**
   * Model NotificationSetting
   */

  export type AggregateNotificationSetting = {
    _count: NotificationSettingCountAggregateOutputType | null
    _min: NotificationSettingMinAggregateOutputType | null
    _max: NotificationSettingMaxAggregateOutputType | null
  }

  export type NotificationSettingMinAggregateOutputType = {
    id: string | null
    budgetAlertMail: boolean | null
    budgetAlertApp: boolean | null
    billReminderMail: boolean | null
    billReminderApp: boolean | null
    weeklyReportMail: boolean | null
    weeklyReportApp: boolean | null
    aiInsightsMail: boolean | null
    aiInsightsApp: boolean | null
    goalsAlertMail: boolean | null
    goalsAlertApp: boolean | null
    splitsAlertMail: boolean | null
    splitsAlertApp: boolean | null
    newsLetterAlert: boolean | null
    communityAlert: boolean | null
    userId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type NotificationSettingMaxAggregateOutputType = {
    id: string | null
    budgetAlertMail: boolean | null
    budgetAlertApp: boolean | null
    billReminderMail: boolean | null
    billReminderApp: boolean | null
    weeklyReportMail: boolean | null
    weeklyReportApp: boolean | null
    aiInsightsMail: boolean | null
    aiInsightsApp: boolean | null
    goalsAlertMail: boolean | null
    goalsAlertApp: boolean | null
    splitsAlertMail: boolean | null
    splitsAlertApp: boolean | null
    newsLetterAlert: boolean | null
    communityAlert: boolean | null
    userId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type NotificationSettingCountAggregateOutputType = {
    id: number
    budgetAlertMail: number
    budgetAlertApp: number
    billReminderMail: number
    billReminderApp: number
    weeklyReportMail: number
    weeklyReportApp: number
    aiInsightsMail: number
    aiInsightsApp: number
    goalsAlertMail: number
    goalsAlertApp: number
    splitsAlertMail: number
    splitsAlertApp: number
    newsLetterAlert: number
    communityAlert: number
    userId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type NotificationSettingMinAggregateInputType = {
    id?: true
    budgetAlertMail?: true
    budgetAlertApp?: true
    billReminderMail?: true
    billReminderApp?: true
    weeklyReportMail?: true
    weeklyReportApp?: true
    aiInsightsMail?: true
    aiInsightsApp?: true
    goalsAlertMail?: true
    goalsAlertApp?: true
    splitsAlertMail?: true
    splitsAlertApp?: true
    newsLetterAlert?: true
    communityAlert?: true
    userId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type NotificationSettingMaxAggregateInputType = {
    id?: true
    budgetAlertMail?: true
    budgetAlertApp?: true
    billReminderMail?: true
    billReminderApp?: true
    weeklyReportMail?: true
    weeklyReportApp?: true
    aiInsightsMail?: true
    aiInsightsApp?: true
    goalsAlertMail?: true
    goalsAlertApp?: true
    splitsAlertMail?: true
    splitsAlertApp?: true
    newsLetterAlert?: true
    communityAlert?: true
    userId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type NotificationSettingCountAggregateInputType = {
    id?: true
    budgetAlertMail?: true
    budgetAlertApp?: true
    billReminderMail?: true
    billReminderApp?: true
    weeklyReportMail?: true
    weeklyReportApp?: true
    aiInsightsMail?: true
    aiInsightsApp?: true
    goalsAlertMail?: true
    goalsAlertApp?: true
    splitsAlertMail?: true
    splitsAlertApp?: true
    newsLetterAlert?: true
    communityAlert?: true
    userId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type NotificationSettingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which NotificationSetting to aggregate.
     */
    where?: NotificationSettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NotificationSettings to fetch.
     */
    orderBy?: NotificationSettingOrderByWithRelationInput | NotificationSettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: NotificationSettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NotificationSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NotificationSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned NotificationSettings
    **/
    _count?: true | NotificationSettingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: NotificationSettingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: NotificationSettingMaxAggregateInputType
  }

  export type GetNotificationSettingAggregateType<T extends NotificationSettingAggregateArgs> = {
        [P in keyof T & keyof AggregateNotificationSetting]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateNotificationSetting[P]>
      : GetScalarType<T[P], AggregateNotificationSetting[P]>
  }




  export type NotificationSettingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NotificationSettingWhereInput
    orderBy?: NotificationSettingOrderByWithAggregationInput | NotificationSettingOrderByWithAggregationInput[]
    by: NotificationSettingScalarFieldEnum[] | NotificationSettingScalarFieldEnum
    having?: NotificationSettingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: NotificationSettingCountAggregateInputType | true
    _min?: NotificationSettingMinAggregateInputType
    _max?: NotificationSettingMaxAggregateInputType
  }

  export type NotificationSettingGroupByOutputType = {
    id: string
    budgetAlertMail: boolean
    budgetAlertApp: boolean
    billReminderMail: boolean
    billReminderApp: boolean
    weeklyReportMail: boolean
    weeklyReportApp: boolean
    aiInsightsMail: boolean
    aiInsightsApp: boolean
    goalsAlertMail: boolean
    goalsAlertApp: boolean
    splitsAlertMail: boolean
    splitsAlertApp: boolean
    newsLetterAlert: boolean
    communityAlert: boolean
    userId: string
    createdAt: Date
    updatedAt: Date
    _count: NotificationSettingCountAggregateOutputType | null
    _min: NotificationSettingMinAggregateOutputType | null
    _max: NotificationSettingMaxAggregateOutputType | null
  }

  type GetNotificationSettingGroupByPayload<T extends NotificationSettingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<NotificationSettingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof NotificationSettingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], NotificationSettingGroupByOutputType[P]>
            : GetScalarType<T[P], NotificationSettingGroupByOutputType[P]>
        }
      >
    >


  export type NotificationSettingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    budgetAlertMail?: boolean
    budgetAlertApp?: boolean
    billReminderMail?: boolean
    billReminderApp?: boolean
    weeklyReportMail?: boolean
    weeklyReportApp?: boolean
    aiInsightsMail?: boolean
    aiInsightsApp?: boolean
    goalsAlertMail?: boolean
    goalsAlertApp?: boolean
    splitsAlertMail?: boolean
    splitsAlertApp?: boolean
    newsLetterAlert?: boolean
    communityAlert?: boolean
    userId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["notificationSetting"]>

  export type NotificationSettingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    budgetAlertMail?: boolean
    budgetAlertApp?: boolean
    billReminderMail?: boolean
    billReminderApp?: boolean
    weeklyReportMail?: boolean
    weeklyReportApp?: boolean
    aiInsightsMail?: boolean
    aiInsightsApp?: boolean
    goalsAlertMail?: boolean
    goalsAlertApp?: boolean
    splitsAlertMail?: boolean
    splitsAlertApp?: boolean
    newsLetterAlert?: boolean
    communityAlert?: boolean
    userId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["notificationSetting"]>

  export type NotificationSettingSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    budgetAlertMail?: boolean
    budgetAlertApp?: boolean
    billReminderMail?: boolean
    billReminderApp?: boolean
    weeklyReportMail?: boolean
    weeklyReportApp?: boolean
    aiInsightsMail?: boolean
    aiInsightsApp?: boolean
    goalsAlertMail?: boolean
    goalsAlertApp?: boolean
    splitsAlertMail?: boolean
    splitsAlertApp?: boolean
    newsLetterAlert?: boolean
    communityAlert?: boolean
    userId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["notificationSetting"]>

  export type NotificationSettingSelectScalar = {
    id?: boolean
    budgetAlertMail?: boolean
    budgetAlertApp?: boolean
    billReminderMail?: boolean
    billReminderApp?: boolean
    weeklyReportMail?: boolean
    weeklyReportApp?: boolean
    aiInsightsMail?: boolean
    aiInsightsApp?: boolean
    goalsAlertMail?: boolean
    goalsAlertApp?: boolean
    splitsAlertMail?: boolean
    splitsAlertApp?: boolean
    newsLetterAlert?: boolean
    communityAlert?: boolean
    userId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type NotificationSettingOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "budgetAlertMail" | "budgetAlertApp" | "billReminderMail" | "billReminderApp" | "weeklyReportMail" | "weeklyReportApp" | "aiInsightsMail" | "aiInsightsApp" | "goalsAlertMail" | "goalsAlertApp" | "splitsAlertMail" | "splitsAlertApp" | "newsLetterAlert" | "communityAlert" | "userId" | "createdAt" | "updatedAt", ExtArgs["result"]["notificationSetting"]>
  export type NotificationSettingInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type NotificationSettingIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type NotificationSettingIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $NotificationSettingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "NotificationSetting"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      budgetAlertMail: boolean
      budgetAlertApp: boolean
      billReminderMail: boolean
      billReminderApp: boolean
      weeklyReportMail: boolean
      weeklyReportApp: boolean
      aiInsightsMail: boolean
      aiInsightsApp: boolean
      goalsAlertMail: boolean
      goalsAlertApp: boolean
      splitsAlertMail: boolean
      splitsAlertApp: boolean
      newsLetterAlert: boolean
      communityAlert: boolean
      userId: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["notificationSetting"]>
    composites: {}
  }

  type NotificationSettingGetPayload<S extends boolean | null | undefined | NotificationSettingDefaultArgs> = $Result.GetResult<Prisma.$NotificationSettingPayload, S>

  type NotificationSettingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<NotificationSettingFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: NotificationSettingCountAggregateInputType | true
    }

  export interface NotificationSettingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['NotificationSetting'], meta: { name: 'NotificationSetting' } }
    /**
     * Find zero or one NotificationSetting that matches the filter.
     * @param {NotificationSettingFindUniqueArgs} args - Arguments to find a NotificationSetting
     * @example
     * // Get one NotificationSetting
     * const notificationSetting = await prisma.notificationSetting.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends NotificationSettingFindUniqueArgs>(args: SelectSubset<T, NotificationSettingFindUniqueArgs<ExtArgs>>): Prisma__NotificationSettingClient<$Result.GetResult<Prisma.$NotificationSettingPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one NotificationSetting that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {NotificationSettingFindUniqueOrThrowArgs} args - Arguments to find a NotificationSetting
     * @example
     * // Get one NotificationSetting
     * const notificationSetting = await prisma.notificationSetting.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends NotificationSettingFindUniqueOrThrowArgs>(args: SelectSubset<T, NotificationSettingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__NotificationSettingClient<$Result.GetResult<Prisma.$NotificationSettingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first NotificationSetting that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationSettingFindFirstArgs} args - Arguments to find a NotificationSetting
     * @example
     * // Get one NotificationSetting
     * const notificationSetting = await prisma.notificationSetting.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends NotificationSettingFindFirstArgs>(args?: SelectSubset<T, NotificationSettingFindFirstArgs<ExtArgs>>): Prisma__NotificationSettingClient<$Result.GetResult<Prisma.$NotificationSettingPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first NotificationSetting that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationSettingFindFirstOrThrowArgs} args - Arguments to find a NotificationSetting
     * @example
     * // Get one NotificationSetting
     * const notificationSetting = await prisma.notificationSetting.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends NotificationSettingFindFirstOrThrowArgs>(args?: SelectSubset<T, NotificationSettingFindFirstOrThrowArgs<ExtArgs>>): Prisma__NotificationSettingClient<$Result.GetResult<Prisma.$NotificationSettingPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more NotificationSettings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationSettingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all NotificationSettings
     * const notificationSettings = await prisma.notificationSetting.findMany()
     * 
     * // Get first 10 NotificationSettings
     * const notificationSettings = await prisma.notificationSetting.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const notificationSettingWithIdOnly = await prisma.notificationSetting.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends NotificationSettingFindManyArgs>(args?: SelectSubset<T, NotificationSettingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationSettingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a NotificationSetting.
     * @param {NotificationSettingCreateArgs} args - Arguments to create a NotificationSetting.
     * @example
     * // Create one NotificationSetting
     * const NotificationSetting = await prisma.notificationSetting.create({
     *   data: {
     *     // ... data to create a NotificationSetting
     *   }
     * })
     * 
     */
    create<T extends NotificationSettingCreateArgs>(args: SelectSubset<T, NotificationSettingCreateArgs<ExtArgs>>): Prisma__NotificationSettingClient<$Result.GetResult<Prisma.$NotificationSettingPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many NotificationSettings.
     * @param {NotificationSettingCreateManyArgs} args - Arguments to create many NotificationSettings.
     * @example
     * // Create many NotificationSettings
     * const notificationSetting = await prisma.notificationSetting.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends NotificationSettingCreateManyArgs>(args?: SelectSubset<T, NotificationSettingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many NotificationSettings and returns the data saved in the database.
     * @param {NotificationSettingCreateManyAndReturnArgs} args - Arguments to create many NotificationSettings.
     * @example
     * // Create many NotificationSettings
     * const notificationSetting = await prisma.notificationSetting.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many NotificationSettings and only return the `id`
     * const notificationSettingWithIdOnly = await prisma.notificationSetting.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends NotificationSettingCreateManyAndReturnArgs>(args?: SelectSubset<T, NotificationSettingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationSettingPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a NotificationSetting.
     * @param {NotificationSettingDeleteArgs} args - Arguments to delete one NotificationSetting.
     * @example
     * // Delete one NotificationSetting
     * const NotificationSetting = await prisma.notificationSetting.delete({
     *   where: {
     *     // ... filter to delete one NotificationSetting
     *   }
     * })
     * 
     */
    delete<T extends NotificationSettingDeleteArgs>(args: SelectSubset<T, NotificationSettingDeleteArgs<ExtArgs>>): Prisma__NotificationSettingClient<$Result.GetResult<Prisma.$NotificationSettingPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one NotificationSetting.
     * @param {NotificationSettingUpdateArgs} args - Arguments to update one NotificationSetting.
     * @example
     * // Update one NotificationSetting
     * const notificationSetting = await prisma.notificationSetting.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends NotificationSettingUpdateArgs>(args: SelectSubset<T, NotificationSettingUpdateArgs<ExtArgs>>): Prisma__NotificationSettingClient<$Result.GetResult<Prisma.$NotificationSettingPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more NotificationSettings.
     * @param {NotificationSettingDeleteManyArgs} args - Arguments to filter NotificationSettings to delete.
     * @example
     * // Delete a few NotificationSettings
     * const { count } = await prisma.notificationSetting.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends NotificationSettingDeleteManyArgs>(args?: SelectSubset<T, NotificationSettingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more NotificationSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationSettingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many NotificationSettings
     * const notificationSetting = await prisma.notificationSetting.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends NotificationSettingUpdateManyArgs>(args: SelectSubset<T, NotificationSettingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more NotificationSettings and returns the data updated in the database.
     * @param {NotificationSettingUpdateManyAndReturnArgs} args - Arguments to update many NotificationSettings.
     * @example
     * // Update many NotificationSettings
     * const notificationSetting = await prisma.notificationSetting.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more NotificationSettings and only return the `id`
     * const notificationSettingWithIdOnly = await prisma.notificationSetting.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends NotificationSettingUpdateManyAndReturnArgs>(args: SelectSubset<T, NotificationSettingUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationSettingPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one NotificationSetting.
     * @param {NotificationSettingUpsertArgs} args - Arguments to update or create a NotificationSetting.
     * @example
     * // Update or create a NotificationSetting
     * const notificationSetting = await prisma.notificationSetting.upsert({
     *   create: {
     *     // ... data to create a NotificationSetting
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the NotificationSetting we want to update
     *   }
     * })
     */
    upsert<T extends NotificationSettingUpsertArgs>(args: SelectSubset<T, NotificationSettingUpsertArgs<ExtArgs>>): Prisma__NotificationSettingClient<$Result.GetResult<Prisma.$NotificationSettingPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of NotificationSettings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationSettingCountArgs} args - Arguments to filter NotificationSettings to count.
     * @example
     * // Count the number of NotificationSettings
     * const count = await prisma.notificationSetting.count({
     *   where: {
     *     // ... the filter for the NotificationSettings we want to count
     *   }
     * })
    **/
    count<T extends NotificationSettingCountArgs>(
      args?: Subset<T, NotificationSettingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], NotificationSettingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a NotificationSetting.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationSettingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends NotificationSettingAggregateArgs>(args: Subset<T, NotificationSettingAggregateArgs>): Prisma.PrismaPromise<GetNotificationSettingAggregateType<T>>

    /**
     * Group by NotificationSetting.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationSettingGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends NotificationSettingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: NotificationSettingGroupByArgs['orderBy'] }
        : { orderBy?: NotificationSettingGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, NotificationSettingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNotificationSettingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the NotificationSetting model
   */
  readonly fields: NotificationSettingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for NotificationSetting.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__NotificationSettingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the NotificationSetting model
   */
  interface NotificationSettingFieldRefs {
    readonly id: FieldRef<"NotificationSetting", 'String'>
    readonly budgetAlertMail: FieldRef<"NotificationSetting", 'Boolean'>
    readonly budgetAlertApp: FieldRef<"NotificationSetting", 'Boolean'>
    readonly billReminderMail: FieldRef<"NotificationSetting", 'Boolean'>
    readonly billReminderApp: FieldRef<"NotificationSetting", 'Boolean'>
    readonly weeklyReportMail: FieldRef<"NotificationSetting", 'Boolean'>
    readonly weeklyReportApp: FieldRef<"NotificationSetting", 'Boolean'>
    readonly aiInsightsMail: FieldRef<"NotificationSetting", 'Boolean'>
    readonly aiInsightsApp: FieldRef<"NotificationSetting", 'Boolean'>
    readonly goalsAlertMail: FieldRef<"NotificationSetting", 'Boolean'>
    readonly goalsAlertApp: FieldRef<"NotificationSetting", 'Boolean'>
    readonly splitsAlertMail: FieldRef<"NotificationSetting", 'Boolean'>
    readonly splitsAlertApp: FieldRef<"NotificationSetting", 'Boolean'>
    readonly newsLetterAlert: FieldRef<"NotificationSetting", 'Boolean'>
    readonly communityAlert: FieldRef<"NotificationSetting", 'Boolean'>
    readonly userId: FieldRef<"NotificationSetting", 'String'>
    readonly createdAt: FieldRef<"NotificationSetting", 'DateTime'>
    readonly updatedAt: FieldRef<"NotificationSetting", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * NotificationSetting findUnique
   */
  export type NotificationSettingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationSetting
     */
    select?: NotificationSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationSetting
     */
    omit?: NotificationSettingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationSettingInclude<ExtArgs> | null
    /**
     * Filter, which NotificationSetting to fetch.
     */
    where: NotificationSettingWhereUniqueInput
  }

  /**
   * NotificationSetting findUniqueOrThrow
   */
  export type NotificationSettingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationSetting
     */
    select?: NotificationSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationSetting
     */
    omit?: NotificationSettingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationSettingInclude<ExtArgs> | null
    /**
     * Filter, which NotificationSetting to fetch.
     */
    where: NotificationSettingWhereUniqueInput
  }

  /**
   * NotificationSetting findFirst
   */
  export type NotificationSettingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationSetting
     */
    select?: NotificationSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationSetting
     */
    omit?: NotificationSettingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationSettingInclude<ExtArgs> | null
    /**
     * Filter, which NotificationSetting to fetch.
     */
    where?: NotificationSettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NotificationSettings to fetch.
     */
    orderBy?: NotificationSettingOrderByWithRelationInput | NotificationSettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for NotificationSettings.
     */
    cursor?: NotificationSettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NotificationSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NotificationSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of NotificationSettings.
     */
    distinct?: NotificationSettingScalarFieldEnum | NotificationSettingScalarFieldEnum[]
  }

  /**
   * NotificationSetting findFirstOrThrow
   */
  export type NotificationSettingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationSetting
     */
    select?: NotificationSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationSetting
     */
    omit?: NotificationSettingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationSettingInclude<ExtArgs> | null
    /**
     * Filter, which NotificationSetting to fetch.
     */
    where?: NotificationSettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NotificationSettings to fetch.
     */
    orderBy?: NotificationSettingOrderByWithRelationInput | NotificationSettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for NotificationSettings.
     */
    cursor?: NotificationSettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NotificationSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NotificationSettings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of NotificationSettings.
     */
    distinct?: NotificationSettingScalarFieldEnum | NotificationSettingScalarFieldEnum[]
  }

  /**
   * NotificationSetting findMany
   */
  export type NotificationSettingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationSetting
     */
    select?: NotificationSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationSetting
     */
    omit?: NotificationSettingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationSettingInclude<ExtArgs> | null
    /**
     * Filter, which NotificationSettings to fetch.
     */
    where?: NotificationSettingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of NotificationSettings to fetch.
     */
    orderBy?: NotificationSettingOrderByWithRelationInput | NotificationSettingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing NotificationSettings.
     */
    cursor?: NotificationSettingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` NotificationSettings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` NotificationSettings.
     */
    skip?: number
    distinct?: NotificationSettingScalarFieldEnum | NotificationSettingScalarFieldEnum[]
  }

  /**
   * NotificationSetting create
   */
  export type NotificationSettingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationSetting
     */
    select?: NotificationSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationSetting
     */
    omit?: NotificationSettingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationSettingInclude<ExtArgs> | null
    /**
     * The data needed to create a NotificationSetting.
     */
    data: XOR<NotificationSettingCreateInput, NotificationSettingUncheckedCreateInput>
  }

  /**
   * NotificationSetting createMany
   */
  export type NotificationSettingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many NotificationSettings.
     */
    data: NotificationSettingCreateManyInput | NotificationSettingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * NotificationSetting createManyAndReturn
   */
  export type NotificationSettingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationSetting
     */
    select?: NotificationSettingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationSetting
     */
    omit?: NotificationSettingOmit<ExtArgs> | null
    /**
     * The data used to create many NotificationSettings.
     */
    data: NotificationSettingCreateManyInput | NotificationSettingCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationSettingIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * NotificationSetting update
   */
  export type NotificationSettingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationSetting
     */
    select?: NotificationSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationSetting
     */
    omit?: NotificationSettingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationSettingInclude<ExtArgs> | null
    /**
     * The data needed to update a NotificationSetting.
     */
    data: XOR<NotificationSettingUpdateInput, NotificationSettingUncheckedUpdateInput>
    /**
     * Choose, which NotificationSetting to update.
     */
    where: NotificationSettingWhereUniqueInput
  }

  /**
   * NotificationSetting updateMany
   */
  export type NotificationSettingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update NotificationSettings.
     */
    data: XOR<NotificationSettingUpdateManyMutationInput, NotificationSettingUncheckedUpdateManyInput>
    /**
     * Filter which NotificationSettings to update
     */
    where?: NotificationSettingWhereInput
    /**
     * Limit how many NotificationSettings to update.
     */
    limit?: number
  }

  /**
   * NotificationSetting updateManyAndReturn
   */
  export type NotificationSettingUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationSetting
     */
    select?: NotificationSettingSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationSetting
     */
    omit?: NotificationSettingOmit<ExtArgs> | null
    /**
     * The data used to update NotificationSettings.
     */
    data: XOR<NotificationSettingUpdateManyMutationInput, NotificationSettingUncheckedUpdateManyInput>
    /**
     * Filter which NotificationSettings to update
     */
    where?: NotificationSettingWhereInput
    /**
     * Limit how many NotificationSettings to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationSettingIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * NotificationSetting upsert
   */
  export type NotificationSettingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationSetting
     */
    select?: NotificationSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationSetting
     */
    omit?: NotificationSettingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationSettingInclude<ExtArgs> | null
    /**
     * The filter to search for the NotificationSetting to update in case it exists.
     */
    where: NotificationSettingWhereUniqueInput
    /**
     * In case the NotificationSetting found by the `where` argument doesn't exist, create a new NotificationSetting with this data.
     */
    create: XOR<NotificationSettingCreateInput, NotificationSettingUncheckedCreateInput>
    /**
     * In case the NotificationSetting was found with the provided `where` argument, update it with this data.
     */
    update: XOR<NotificationSettingUpdateInput, NotificationSettingUncheckedUpdateInput>
  }

  /**
   * NotificationSetting delete
   */
  export type NotificationSettingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationSetting
     */
    select?: NotificationSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationSetting
     */
    omit?: NotificationSettingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationSettingInclude<ExtArgs> | null
    /**
     * Filter which NotificationSetting to delete.
     */
    where: NotificationSettingWhereUniqueInput
  }

  /**
   * NotificationSetting deleteMany
   */
  export type NotificationSettingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which NotificationSettings to delete
     */
    where?: NotificationSettingWhereInput
    /**
     * Limit how many NotificationSettings to delete.
     */
    limit?: number
  }

  /**
   * NotificationSetting without action
   */
  export type NotificationSettingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationSetting
     */
    select?: NotificationSettingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationSetting
     */
    omit?: NotificationSettingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationSettingInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const CurrenciesScalarFieldEnum: {
    id: 'id',
    currency: 'currency',
    label: 'label',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CurrenciesScalarFieldEnum = (typeof CurrenciesScalarFieldEnum)[keyof typeof CurrenciesScalarFieldEnum]


  export const LocaleScalarFieldEnum: {
    id: 'id',
    language: 'language',
    label: 'label',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type LocaleScalarFieldEnum = (typeof LocaleScalarFieldEnum)[keyof typeof LocaleScalarFieldEnum]


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    password: 'password',
    loginAttempts: 'loginAttempts',
    emailVerified: 'emailVerified',
    emailVerifiedAt: 'emailVerifiedAt',
    firstName: 'firstName',
    lastName: 'lastName',
    avatar: 'avatar',
    lastLoginAt: 'lastLoginAt',
    twoFactorAttempts: 'twoFactorAttempts',
    twoFactorEnabled: 'twoFactorEnabled',
    twoFactorSecret: 'twoFactorSecret',
    twoFactorLastUsedAt: 'twoFactorLastUsedAt',
    currency: 'currency',
    language: 'language',
    timezone: 'timezone',
    dateFormat: 'dateFormat',
    scheduledDeletionAt: 'scheduledDeletionAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const AccountScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    type: 'type',
    provider: 'provider',
    providerAccountId: 'providerAccountId',
    refreshToken: 'refreshToken',
    accessToken: 'accessToken',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type AccountScalarFieldEnum = (typeof AccountScalarFieldEnum)[keyof typeof AccountScalarFieldEnum]


  export const SessionScalarFieldEnum: {
    id: 'id',
    sessionToken: 'sessionToken',
    userId: 'userId',
    expires: 'expires',
    deviceId: 'deviceId',
    userAgent: 'userAgent',
    ipAddress: 'ipAddress',
    location: 'location',
    lastUsedAt: 'lastUsedAt',
    createdAt: 'createdAt'
  };

  export type SessionScalarFieldEnum = (typeof SessionScalarFieldEnum)[keyof typeof SessionScalarFieldEnum]


  export const LoginActivityScalarFieldEnum: {
    id: 'id',
    type: 'type',
    status: 'status',
    deviceId: 'deviceId',
    userAgent: 'userAgent',
    ipAddress: 'ipAddress',
    location: 'location',
    userId: 'userId',
    createdAt: 'createdAt'
  };

  export type LoginActivityScalarFieldEnum = (typeof LoginActivityScalarFieldEnum)[keyof typeof LoginActivityScalarFieldEnum]


  export const VerificationTokenScalarFieldEnum: {
    id: 'id',
    identifier: 'identifier',
    email: 'email',
    token: 'token',
    newEmail: 'newEmail',
    expires: 'expires',
    createdAt: 'createdAt'
  };

  export type VerificationTokenScalarFieldEnum = (typeof VerificationTokenScalarFieldEnum)[keyof typeof VerificationTokenScalarFieldEnum]


  export const SubscriptionScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    stripeCustomerId: 'stripeCustomerId',
    stripeSubscriptionId: 'stripeSubscriptionId',
    stripePriceId: 'stripePriceId',
    stripeCurrentPeriodStart: 'stripeCurrentPeriodStart',
    stripeCurrentPeriodEnd: 'stripeCurrentPeriodEnd',
    stripeCancelAtPeriodEnd: 'stripeCancelAtPeriodEnd',
    status: 'status',
    plan: 'plan',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SubscriptionScalarFieldEnum = (typeof SubscriptionScalarFieldEnum)[keyof typeof SubscriptionScalarFieldEnum]


  export const UsageTrackerScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    feature: 'feature',
    count: 'count',
    periodStart: 'periodStart',
    periodEnd: 'periodEnd',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type UsageTrackerScalarFieldEnum = (typeof UsageTrackerScalarFieldEnum)[keyof typeof UsageTrackerScalarFieldEnum]


  export const BackupCodesScalarFieldEnum: {
    id: 'id',
    usedAt: 'usedAt',
    code: 'code',
    userId: 'userId',
    createdAt: 'createdAt'
  };

  export type BackupCodesScalarFieldEnum = (typeof BackupCodesScalarFieldEnum)[keyof typeof BackupCodesScalarFieldEnum]


  export const ActivityLogsScalarFieldEnum: {
    id: 'id'
  };

  export type ActivityLogsScalarFieldEnum = (typeof ActivityLogsScalarFieldEnum)[keyof typeof ActivityLogsScalarFieldEnum]


  export const NotificationSettingScalarFieldEnum: {
    id: 'id',
    budgetAlertMail: 'budgetAlertMail',
    budgetAlertApp: 'budgetAlertApp',
    billReminderMail: 'billReminderMail',
    billReminderApp: 'billReminderApp',
    weeklyReportMail: 'weeklyReportMail',
    weeklyReportApp: 'weeklyReportApp',
    aiInsightsMail: 'aiInsightsMail',
    aiInsightsApp: 'aiInsightsApp',
    goalsAlertMail: 'goalsAlertMail',
    goalsAlertApp: 'goalsAlertApp',
    splitsAlertMail: 'splitsAlertMail',
    splitsAlertApp: 'splitsAlertApp',
    newsLetterAlert: 'newsLetterAlert',
    communityAlert: 'communityAlert',
    userId: 'userId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type NotificationSettingScalarFieldEnum = (typeof NotificationSettingScalarFieldEnum)[keyof typeof NotificationSettingScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Currency'
   */
  export type EnumCurrencyFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Currency'>
    


  /**
   * Reference to a field of type 'Currency[]'
   */
  export type ListEnumCurrencyFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Currency[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Language'
   */
  export type EnumLanguageFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Language'>
    


  /**
   * Reference to a field of type 'Language[]'
   */
  export type ListEnumLanguageFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Language[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateFormat'
   */
  export type EnumDateFormatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateFormat'>
    


  /**
   * Reference to a field of type 'DateFormat[]'
   */
  export type ListEnumDateFormatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateFormat[]'>
    


  /**
   * Reference to a field of type 'AccountType'
   */
  export type EnumAccountTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AccountType'>
    


  /**
   * Reference to a field of type 'AccountType[]'
   */
  export type ListEnumAccountTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AccountType[]'>
    


  /**
   * Reference to a field of type 'AccountProvider'
   */
  export type EnumAccountProviderFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AccountProvider'>
    


  /**
   * Reference to a field of type 'AccountProvider[]'
   */
  export type ListEnumAccountProviderFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AccountProvider[]'>
    


  /**
   * Reference to a field of type 'LoginActivityType'
   */
  export type EnumLoginActivityTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'LoginActivityType'>
    


  /**
   * Reference to a field of type 'LoginActivityType[]'
   */
  export type ListEnumLoginActivityTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'LoginActivityType[]'>
    


  /**
   * Reference to a field of type 'LoginActivityStatus'
   */
  export type EnumLoginActivityStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'LoginActivityStatus'>
    


  /**
   * Reference to a field of type 'LoginActivityStatus[]'
   */
  export type ListEnumLoginActivityStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'LoginActivityStatus[]'>
    


  /**
   * Reference to a field of type 'VerificationIdentifier'
   */
  export type EnumVerificationIdentifierFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'VerificationIdentifier'>
    


  /**
   * Reference to a field of type 'VerificationIdentifier[]'
   */
  export type ListEnumVerificationIdentifierFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'VerificationIdentifier[]'>
    


  /**
   * Reference to a field of type 'SubscriptionStatus'
   */
  export type EnumSubscriptionStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SubscriptionStatus'>
    


  /**
   * Reference to a field of type 'SubscriptionStatus[]'
   */
  export type ListEnumSubscriptionStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SubscriptionStatus[]'>
    


  /**
   * Reference to a field of type 'SubscriptionPlan'
   */
  export type EnumSubscriptionPlanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SubscriptionPlan'>
    


  /**
   * Reference to a field of type 'SubscriptionPlan[]'
   */
  export type ListEnumSubscriptionPlanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SubscriptionPlan[]'>
    


  /**
   * Reference to a field of type 'UsageFeature'
   */
  export type EnumUsageFeatureFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UsageFeature'>
    


  /**
   * Reference to a field of type 'UsageFeature[]'
   */
  export type ListEnumUsageFeatureFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UsageFeature[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type CurrenciesWhereInput = {
    AND?: CurrenciesWhereInput | CurrenciesWhereInput[]
    OR?: CurrenciesWhereInput[]
    NOT?: CurrenciesWhereInput | CurrenciesWhereInput[]
    id?: StringFilter<"Currencies"> | string
    currency?: EnumCurrencyFilter<"Currencies"> | $Enums.Currency
    label?: StringFilter<"Currencies"> | string
    createdAt?: DateTimeFilter<"Currencies"> | Date | string
    updatedAt?: DateTimeFilter<"Currencies"> | Date | string
  }

  export type CurrenciesOrderByWithRelationInput = {
    id?: SortOrder
    currency?: SortOrder
    label?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CurrenciesWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CurrenciesWhereInput | CurrenciesWhereInput[]
    OR?: CurrenciesWhereInput[]
    NOT?: CurrenciesWhereInput | CurrenciesWhereInput[]
    currency?: EnumCurrencyFilter<"Currencies"> | $Enums.Currency
    label?: StringFilter<"Currencies"> | string
    createdAt?: DateTimeFilter<"Currencies"> | Date | string
    updatedAt?: DateTimeFilter<"Currencies"> | Date | string
  }, "id">

  export type CurrenciesOrderByWithAggregationInput = {
    id?: SortOrder
    currency?: SortOrder
    label?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CurrenciesCountOrderByAggregateInput
    _max?: CurrenciesMaxOrderByAggregateInput
    _min?: CurrenciesMinOrderByAggregateInput
  }

  export type CurrenciesScalarWhereWithAggregatesInput = {
    AND?: CurrenciesScalarWhereWithAggregatesInput | CurrenciesScalarWhereWithAggregatesInput[]
    OR?: CurrenciesScalarWhereWithAggregatesInput[]
    NOT?: CurrenciesScalarWhereWithAggregatesInput | CurrenciesScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Currencies"> | string
    currency?: EnumCurrencyWithAggregatesFilter<"Currencies"> | $Enums.Currency
    label?: StringWithAggregatesFilter<"Currencies"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Currencies"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Currencies"> | Date | string
  }

  export type LocaleWhereInput = {
    AND?: LocaleWhereInput | LocaleWhereInput[]
    OR?: LocaleWhereInput[]
    NOT?: LocaleWhereInput | LocaleWhereInput[]
    id?: StringFilter<"Locale"> | string
    language?: EnumLanguageFilter<"Locale"> | $Enums.Language
    label?: StringFilter<"Locale"> | string
    createdAt?: DateTimeFilter<"Locale"> | Date | string
    updatedAt?: DateTimeFilter<"Locale"> | Date | string
  }

  export type LocaleOrderByWithRelationInput = {
    id?: SortOrder
    language?: SortOrder
    label?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LocaleWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: LocaleWhereInput | LocaleWhereInput[]
    OR?: LocaleWhereInput[]
    NOT?: LocaleWhereInput | LocaleWhereInput[]
    language?: EnumLanguageFilter<"Locale"> | $Enums.Language
    label?: StringFilter<"Locale"> | string
    createdAt?: DateTimeFilter<"Locale"> | Date | string
    updatedAt?: DateTimeFilter<"Locale"> | Date | string
  }, "id">

  export type LocaleOrderByWithAggregationInput = {
    id?: SortOrder
    language?: SortOrder
    label?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: LocaleCountOrderByAggregateInput
    _max?: LocaleMaxOrderByAggregateInput
    _min?: LocaleMinOrderByAggregateInput
  }

  export type LocaleScalarWhereWithAggregatesInput = {
    AND?: LocaleScalarWhereWithAggregatesInput | LocaleScalarWhereWithAggregatesInput[]
    OR?: LocaleScalarWhereWithAggregatesInput[]
    NOT?: LocaleScalarWhereWithAggregatesInput | LocaleScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Locale"> | string
    language?: EnumLanguageWithAggregatesFilter<"Locale"> | $Enums.Language
    label?: StringWithAggregatesFilter<"Locale"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Locale"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Locale"> | Date | string
  }

  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    password?: StringNullableFilter<"User"> | string | null
    loginAttempts?: IntFilter<"User"> | number
    emailVerified?: BoolFilter<"User"> | boolean
    emailVerifiedAt?: DateTimeNullableFilter<"User"> | Date | string | null
    firstName?: StringFilter<"User"> | string
    lastName?: StringFilter<"User"> | string
    avatar?: StringNullableFilter<"User"> | string | null
    lastLoginAt?: DateTimeNullableFilter<"User"> | Date | string | null
    twoFactorAttempts?: IntFilter<"User"> | number
    twoFactorEnabled?: BoolFilter<"User"> | boolean
    twoFactorSecret?: StringNullableFilter<"User"> | string | null
    twoFactorLastUsedAt?: DateTimeNullableFilter<"User"> | Date | string | null
    currency?: EnumCurrencyFilter<"User"> | $Enums.Currency
    language?: EnumLanguageFilter<"User"> | $Enums.Language
    timezone?: StringFilter<"User"> | string
    dateFormat?: EnumDateFormatFilter<"User"> | $Enums.DateFormat
    scheduledDeletionAt?: DateTimeNullableFilter<"User"> | Date | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    accounts?: AccountListRelationFilter
    sessions?: SessionListRelationFilter
    subscription?: XOR<SubscriptionNullableScalarRelationFilter, SubscriptionWhereInput> | null
    usageTrackers?: UsageTrackerListRelationFilter
    backupCodes?: BackupCodesListRelationFilter
    loginActivity?: LoginActivityListRelationFilter
    setting?: XOR<NotificationSettingNullableScalarRelationFilter, NotificationSettingWhereInput> | null
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrderInput | SortOrder
    loginAttempts?: SortOrder
    emailVerified?: SortOrder
    emailVerifiedAt?: SortOrderInput | SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    avatar?: SortOrderInput | SortOrder
    lastLoginAt?: SortOrderInput | SortOrder
    twoFactorAttempts?: SortOrder
    twoFactorEnabled?: SortOrder
    twoFactorSecret?: SortOrderInput | SortOrder
    twoFactorLastUsedAt?: SortOrderInput | SortOrder
    currency?: SortOrder
    language?: SortOrder
    timezone?: SortOrder
    dateFormat?: SortOrder
    scheduledDeletionAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    accounts?: AccountOrderByRelationAggregateInput
    sessions?: SessionOrderByRelationAggregateInput
    subscription?: SubscriptionOrderByWithRelationInput
    usageTrackers?: UsageTrackerOrderByRelationAggregateInput
    backupCodes?: BackupCodesOrderByRelationAggregateInput
    loginActivity?: LoginActivityOrderByRelationAggregateInput
    setting?: NotificationSettingOrderByWithRelationInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    password?: StringNullableFilter<"User"> | string | null
    loginAttempts?: IntFilter<"User"> | number
    emailVerified?: BoolFilter<"User"> | boolean
    emailVerifiedAt?: DateTimeNullableFilter<"User"> | Date | string | null
    firstName?: StringFilter<"User"> | string
    lastName?: StringFilter<"User"> | string
    avatar?: StringNullableFilter<"User"> | string | null
    lastLoginAt?: DateTimeNullableFilter<"User"> | Date | string | null
    twoFactorAttempts?: IntFilter<"User"> | number
    twoFactorEnabled?: BoolFilter<"User"> | boolean
    twoFactorSecret?: StringNullableFilter<"User"> | string | null
    twoFactorLastUsedAt?: DateTimeNullableFilter<"User"> | Date | string | null
    currency?: EnumCurrencyFilter<"User"> | $Enums.Currency
    language?: EnumLanguageFilter<"User"> | $Enums.Language
    timezone?: StringFilter<"User"> | string
    dateFormat?: EnumDateFormatFilter<"User"> | $Enums.DateFormat
    scheduledDeletionAt?: DateTimeNullableFilter<"User"> | Date | string | null
    createdAt?: DateTimeFilter<"User"> | Date | string
    updatedAt?: DateTimeFilter<"User"> | Date | string
    accounts?: AccountListRelationFilter
    sessions?: SessionListRelationFilter
    subscription?: XOR<SubscriptionNullableScalarRelationFilter, SubscriptionWhereInput> | null
    usageTrackers?: UsageTrackerListRelationFilter
    backupCodes?: BackupCodesListRelationFilter
    loginActivity?: LoginActivityListRelationFilter
    setting?: XOR<NotificationSettingNullableScalarRelationFilter, NotificationSettingWhereInput> | null
  }, "id" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrderInput | SortOrder
    loginAttempts?: SortOrder
    emailVerified?: SortOrder
    emailVerifiedAt?: SortOrderInput | SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    avatar?: SortOrderInput | SortOrder
    lastLoginAt?: SortOrderInput | SortOrder
    twoFactorAttempts?: SortOrder
    twoFactorEnabled?: SortOrder
    twoFactorSecret?: SortOrderInput | SortOrder
    twoFactorLastUsedAt?: SortOrderInput | SortOrder
    currency?: SortOrder
    language?: SortOrder
    timezone?: SortOrder
    dateFormat?: SortOrder
    scheduledDeletionAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    password?: StringNullableWithAggregatesFilter<"User"> | string | null
    loginAttempts?: IntWithAggregatesFilter<"User"> | number
    emailVerified?: BoolWithAggregatesFilter<"User"> | boolean
    emailVerifiedAt?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    firstName?: StringWithAggregatesFilter<"User"> | string
    lastName?: StringWithAggregatesFilter<"User"> | string
    avatar?: StringNullableWithAggregatesFilter<"User"> | string | null
    lastLoginAt?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    twoFactorAttempts?: IntWithAggregatesFilter<"User"> | number
    twoFactorEnabled?: BoolWithAggregatesFilter<"User"> | boolean
    twoFactorSecret?: StringNullableWithAggregatesFilter<"User"> | string | null
    twoFactorLastUsedAt?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    currency?: EnumCurrencyWithAggregatesFilter<"User"> | $Enums.Currency
    language?: EnumLanguageWithAggregatesFilter<"User"> | $Enums.Language
    timezone?: StringWithAggregatesFilter<"User"> | string
    dateFormat?: EnumDateFormatWithAggregatesFilter<"User"> | $Enums.DateFormat
    scheduledDeletionAt?: DateTimeNullableWithAggregatesFilter<"User"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type AccountWhereInput = {
    AND?: AccountWhereInput | AccountWhereInput[]
    OR?: AccountWhereInput[]
    NOT?: AccountWhereInput | AccountWhereInput[]
    id?: StringFilter<"Account"> | string
    userId?: StringFilter<"Account"> | string
    type?: EnumAccountTypeFilter<"Account"> | $Enums.AccountType
    provider?: EnumAccountProviderFilter<"Account"> | $Enums.AccountProvider
    providerAccountId?: StringFilter<"Account"> | string
    refreshToken?: StringNullableFilter<"Account"> | string | null
    accessToken?: StringNullableFilter<"Account"> | string | null
    expiresAt?: IntNullableFilter<"Account"> | number | null
    createdAt?: DateTimeFilter<"Account"> | Date | string
    updatedAt?: DateTimeFilter<"Account"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type AccountOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    provider?: SortOrder
    providerAccountId?: SortOrder
    refreshToken?: SortOrderInput | SortOrder
    accessToken?: SortOrderInput | SortOrder
    expiresAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type AccountWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    provider_providerAccountId?: AccountProviderProviderAccountIdCompoundUniqueInput
    AND?: AccountWhereInput | AccountWhereInput[]
    OR?: AccountWhereInput[]
    NOT?: AccountWhereInput | AccountWhereInput[]
    userId?: StringFilter<"Account"> | string
    type?: EnumAccountTypeFilter<"Account"> | $Enums.AccountType
    provider?: EnumAccountProviderFilter<"Account"> | $Enums.AccountProvider
    providerAccountId?: StringFilter<"Account"> | string
    refreshToken?: StringNullableFilter<"Account"> | string | null
    accessToken?: StringNullableFilter<"Account"> | string | null
    expiresAt?: IntNullableFilter<"Account"> | number | null
    createdAt?: DateTimeFilter<"Account"> | Date | string
    updatedAt?: DateTimeFilter<"Account"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "provider_providerAccountId">

  export type AccountOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    provider?: SortOrder
    providerAccountId?: SortOrder
    refreshToken?: SortOrderInput | SortOrder
    accessToken?: SortOrderInput | SortOrder
    expiresAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: AccountCountOrderByAggregateInput
    _avg?: AccountAvgOrderByAggregateInput
    _max?: AccountMaxOrderByAggregateInput
    _min?: AccountMinOrderByAggregateInput
    _sum?: AccountSumOrderByAggregateInput
  }

  export type AccountScalarWhereWithAggregatesInput = {
    AND?: AccountScalarWhereWithAggregatesInput | AccountScalarWhereWithAggregatesInput[]
    OR?: AccountScalarWhereWithAggregatesInput[]
    NOT?: AccountScalarWhereWithAggregatesInput | AccountScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Account"> | string
    userId?: StringWithAggregatesFilter<"Account"> | string
    type?: EnumAccountTypeWithAggregatesFilter<"Account"> | $Enums.AccountType
    provider?: EnumAccountProviderWithAggregatesFilter<"Account"> | $Enums.AccountProvider
    providerAccountId?: StringWithAggregatesFilter<"Account"> | string
    refreshToken?: StringNullableWithAggregatesFilter<"Account"> | string | null
    accessToken?: StringNullableWithAggregatesFilter<"Account"> | string | null
    expiresAt?: IntNullableWithAggregatesFilter<"Account"> | number | null
    createdAt?: DateTimeWithAggregatesFilter<"Account"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Account"> | Date | string
  }

  export type SessionWhereInput = {
    AND?: SessionWhereInput | SessionWhereInput[]
    OR?: SessionWhereInput[]
    NOT?: SessionWhereInput | SessionWhereInput[]
    id?: StringFilter<"Session"> | string
    sessionToken?: StringFilter<"Session"> | string
    userId?: StringFilter<"Session"> | string
    expires?: DateTimeFilter<"Session"> | Date | string
    deviceId?: StringFilter<"Session"> | string
    userAgent?: StringNullableFilter<"Session"> | string | null
    ipAddress?: StringNullableFilter<"Session"> | string | null
    location?: StringNullableFilter<"Session"> | string | null
    lastUsedAt?: DateTimeFilter<"Session"> | Date | string
    createdAt?: DateTimeFilter<"Session"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type SessionOrderByWithRelationInput = {
    id?: SortOrder
    sessionToken?: SortOrder
    userId?: SortOrder
    expires?: SortOrder
    deviceId?: SortOrder
    userAgent?: SortOrderInput | SortOrder
    ipAddress?: SortOrderInput | SortOrder
    location?: SortOrderInput | SortOrder
    lastUsedAt?: SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type SessionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    sessionToken?: string
    userId_deviceId?: SessionUserIdDeviceIdCompoundUniqueInput
    AND?: SessionWhereInput | SessionWhereInput[]
    OR?: SessionWhereInput[]
    NOT?: SessionWhereInput | SessionWhereInput[]
    userId?: StringFilter<"Session"> | string
    expires?: DateTimeFilter<"Session"> | Date | string
    deviceId?: StringFilter<"Session"> | string
    userAgent?: StringNullableFilter<"Session"> | string | null
    ipAddress?: StringNullableFilter<"Session"> | string | null
    location?: StringNullableFilter<"Session"> | string | null
    lastUsedAt?: DateTimeFilter<"Session"> | Date | string
    createdAt?: DateTimeFilter<"Session"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "sessionToken" | "userId_deviceId">

  export type SessionOrderByWithAggregationInput = {
    id?: SortOrder
    sessionToken?: SortOrder
    userId?: SortOrder
    expires?: SortOrder
    deviceId?: SortOrder
    userAgent?: SortOrderInput | SortOrder
    ipAddress?: SortOrderInput | SortOrder
    location?: SortOrderInput | SortOrder
    lastUsedAt?: SortOrder
    createdAt?: SortOrder
    _count?: SessionCountOrderByAggregateInput
    _max?: SessionMaxOrderByAggregateInput
    _min?: SessionMinOrderByAggregateInput
  }

  export type SessionScalarWhereWithAggregatesInput = {
    AND?: SessionScalarWhereWithAggregatesInput | SessionScalarWhereWithAggregatesInput[]
    OR?: SessionScalarWhereWithAggregatesInput[]
    NOT?: SessionScalarWhereWithAggregatesInput | SessionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Session"> | string
    sessionToken?: StringWithAggregatesFilter<"Session"> | string
    userId?: StringWithAggregatesFilter<"Session"> | string
    expires?: DateTimeWithAggregatesFilter<"Session"> | Date | string
    deviceId?: StringWithAggregatesFilter<"Session"> | string
    userAgent?: StringNullableWithAggregatesFilter<"Session"> | string | null
    ipAddress?: StringNullableWithAggregatesFilter<"Session"> | string | null
    location?: StringNullableWithAggregatesFilter<"Session"> | string | null
    lastUsedAt?: DateTimeWithAggregatesFilter<"Session"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"Session"> | Date | string
  }

  export type LoginActivityWhereInput = {
    AND?: LoginActivityWhereInput | LoginActivityWhereInput[]
    OR?: LoginActivityWhereInput[]
    NOT?: LoginActivityWhereInput | LoginActivityWhereInput[]
    id?: StringFilter<"LoginActivity"> | string
    type?: EnumLoginActivityTypeFilter<"LoginActivity"> | $Enums.LoginActivityType
    status?: EnumLoginActivityStatusFilter<"LoginActivity"> | $Enums.LoginActivityStatus
    deviceId?: StringFilter<"LoginActivity"> | string
    userAgent?: StringNullableFilter<"LoginActivity"> | string | null
    ipAddress?: StringNullableFilter<"LoginActivity"> | string | null
    location?: StringNullableFilter<"LoginActivity"> | string | null
    userId?: StringFilter<"LoginActivity"> | string
    createdAt?: DateTimeFilter<"LoginActivity"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type LoginActivityOrderByWithRelationInput = {
    id?: SortOrder
    type?: SortOrder
    status?: SortOrder
    deviceId?: SortOrder
    userAgent?: SortOrderInput | SortOrder
    ipAddress?: SortOrderInput | SortOrder
    location?: SortOrderInput | SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type LoginActivityWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: LoginActivityWhereInput | LoginActivityWhereInput[]
    OR?: LoginActivityWhereInput[]
    NOT?: LoginActivityWhereInput | LoginActivityWhereInput[]
    type?: EnumLoginActivityTypeFilter<"LoginActivity"> | $Enums.LoginActivityType
    status?: EnumLoginActivityStatusFilter<"LoginActivity"> | $Enums.LoginActivityStatus
    deviceId?: StringFilter<"LoginActivity"> | string
    userAgent?: StringNullableFilter<"LoginActivity"> | string | null
    ipAddress?: StringNullableFilter<"LoginActivity"> | string | null
    location?: StringNullableFilter<"LoginActivity"> | string | null
    userId?: StringFilter<"LoginActivity"> | string
    createdAt?: DateTimeFilter<"LoginActivity"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type LoginActivityOrderByWithAggregationInput = {
    id?: SortOrder
    type?: SortOrder
    status?: SortOrder
    deviceId?: SortOrder
    userAgent?: SortOrderInput | SortOrder
    ipAddress?: SortOrderInput | SortOrder
    location?: SortOrderInput | SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    _count?: LoginActivityCountOrderByAggregateInput
    _max?: LoginActivityMaxOrderByAggregateInput
    _min?: LoginActivityMinOrderByAggregateInput
  }

  export type LoginActivityScalarWhereWithAggregatesInput = {
    AND?: LoginActivityScalarWhereWithAggregatesInput | LoginActivityScalarWhereWithAggregatesInput[]
    OR?: LoginActivityScalarWhereWithAggregatesInput[]
    NOT?: LoginActivityScalarWhereWithAggregatesInput | LoginActivityScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"LoginActivity"> | string
    type?: EnumLoginActivityTypeWithAggregatesFilter<"LoginActivity"> | $Enums.LoginActivityType
    status?: EnumLoginActivityStatusWithAggregatesFilter<"LoginActivity"> | $Enums.LoginActivityStatus
    deviceId?: StringWithAggregatesFilter<"LoginActivity"> | string
    userAgent?: StringNullableWithAggregatesFilter<"LoginActivity"> | string | null
    ipAddress?: StringNullableWithAggregatesFilter<"LoginActivity"> | string | null
    location?: StringNullableWithAggregatesFilter<"LoginActivity"> | string | null
    userId?: StringWithAggregatesFilter<"LoginActivity"> | string
    createdAt?: DateTimeWithAggregatesFilter<"LoginActivity"> | Date | string
  }

  export type VerificationTokenWhereInput = {
    AND?: VerificationTokenWhereInput | VerificationTokenWhereInput[]
    OR?: VerificationTokenWhereInput[]
    NOT?: VerificationTokenWhereInput | VerificationTokenWhereInput[]
    id?: StringFilter<"VerificationToken"> | string
    identifier?: EnumVerificationIdentifierFilter<"VerificationToken"> | $Enums.VerificationIdentifier
    email?: StringFilter<"VerificationToken"> | string
    token?: StringFilter<"VerificationToken"> | string
    newEmail?: StringNullableFilter<"VerificationToken"> | string | null
    expires?: DateTimeFilter<"VerificationToken"> | Date | string
    createdAt?: DateTimeFilter<"VerificationToken"> | Date | string
  }

  export type VerificationTokenOrderByWithRelationInput = {
    id?: SortOrder
    identifier?: SortOrder
    email?: SortOrder
    token?: SortOrder
    newEmail?: SortOrderInput | SortOrder
    expires?: SortOrder
    createdAt?: SortOrder
  }

  export type VerificationTokenWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email_token_identifier?: VerificationTokenEmailTokenIdentifierCompoundUniqueInput
    AND?: VerificationTokenWhereInput | VerificationTokenWhereInput[]
    OR?: VerificationTokenWhereInput[]
    NOT?: VerificationTokenWhereInput | VerificationTokenWhereInput[]
    identifier?: EnumVerificationIdentifierFilter<"VerificationToken"> | $Enums.VerificationIdentifier
    email?: StringFilter<"VerificationToken"> | string
    token?: StringFilter<"VerificationToken"> | string
    newEmail?: StringNullableFilter<"VerificationToken"> | string | null
    expires?: DateTimeFilter<"VerificationToken"> | Date | string
    createdAt?: DateTimeFilter<"VerificationToken"> | Date | string
  }, "id" | "email_token_identifier">

  export type VerificationTokenOrderByWithAggregationInput = {
    id?: SortOrder
    identifier?: SortOrder
    email?: SortOrder
    token?: SortOrder
    newEmail?: SortOrderInput | SortOrder
    expires?: SortOrder
    createdAt?: SortOrder
    _count?: VerificationTokenCountOrderByAggregateInput
    _max?: VerificationTokenMaxOrderByAggregateInput
    _min?: VerificationTokenMinOrderByAggregateInput
  }

  export type VerificationTokenScalarWhereWithAggregatesInput = {
    AND?: VerificationTokenScalarWhereWithAggregatesInput | VerificationTokenScalarWhereWithAggregatesInput[]
    OR?: VerificationTokenScalarWhereWithAggregatesInput[]
    NOT?: VerificationTokenScalarWhereWithAggregatesInput | VerificationTokenScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"VerificationToken"> | string
    identifier?: EnumVerificationIdentifierWithAggregatesFilter<"VerificationToken"> | $Enums.VerificationIdentifier
    email?: StringWithAggregatesFilter<"VerificationToken"> | string
    token?: StringWithAggregatesFilter<"VerificationToken"> | string
    newEmail?: StringNullableWithAggregatesFilter<"VerificationToken"> | string | null
    expires?: DateTimeWithAggregatesFilter<"VerificationToken"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"VerificationToken"> | Date | string
  }

  export type SubscriptionWhereInput = {
    AND?: SubscriptionWhereInput | SubscriptionWhereInput[]
    OR?: SubscriptionWhereInput[]
    NOT?: SubscriptionWhereInput | SubscriptionWhereInput[]
    id?: StringFilter<"Subscription"> | string
    userId?: StringFilter<"Subscription"> | string
    stripeCustomerId?: StringNullableFilter<"Subscription"> | string | null
    stripeSubscriptionId?: StringNullableFilter<"Subscription"> | string | null
    stripePriceId?: StringNullableFilter<"Subscription"> | string | null
    stripeCurrentPeriodStart?: DateTimeNullableFilter<"Subscription"> | Date | string | null
    stripeCurrentPeriodEnd?: DateTimeNullableFilter<"Subscription"> | Date | string | null
    stripeCancelAtPeriodEnd?: BoolFilter<"Subscription"> | boolean
    status?: EnumSubscriptionStatusFilter<"Subscription"> | $Enums.SubscriptionStatus
    plan?: EnumSubscriptionPlanFilter<"Subscription"> | $Enums.SubscriptionPlan
    createdAt?: DateTimeFilter<"Subscription"> | Date | string
    updatedAt?: DateTimeFilter<"Subscription"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type SubscriptionOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    stripeCustomerId?: SortOrderInput | SortOrder
    stripeSubscriptionId?: SortOrderInput | SortOrder
    stripePriceId?: SortOrderInput | SortOrder
    stripeCurrentPeriodStart?: SortOrderInput | SortOrder
    stripeCurrentPeriodEnd?: SortOrderInput | SortOrder
    stripeCancelAtPeriodEnd?: SortOrder
    status?: SortOrder
    plan?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type SubscriptionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId?: string
    stripeCustomerId?: string
    stripeSubscriptionId?: string
    AND?: SubscriptionWhereInput | SubscriptionWhereInput[]
    OR?: SubscriptionWhereInput[]
    NOT?: SubscriptionWhereInput | SubscriptionWhereInput[]
    stripePriceId?: StringNullableFilter<"Subscription"> | string | null
    stripeCurrentPeriodStart?: DateTimeNullableFilter<"Subscription"> | Date | string | null
    stripeCurrentPeriodEnd?: DateTimeNullableFilter<"Subscription"> | Date | string | null
    stripeCancelAtPeriodEnd?: BoolFilter<"Subscription"> | boolean
    status?: EnumSubscriptionStatusFilter<"Subscription"> | $Enums.SubscriptionStatus
    plan?: EnumSubscriptionPlanFilter<"Subscription"> | $Enums.SubscriptionPlan
    createdAt?: DateTimeFilter<"Subscription"> | Date | string
    updatedAt?: DateTimeFilter<"Subscription"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "userId" | "stripeCustomerId" | "stripeSubscriptionId">

  export type SubscriptionOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    stripeCustomerId?: SortOrderInput | SortOrder
    stripeSubscriptionId?: SortOrderInput | SortOrder
    stripePriceId?: SortOrderInput | SortOrder
    stripeCurrentPeriodStart?: SortOrderInput | SortOrder
    stripeCurrentPeriodEnd?: SortOrderInput | SortOrder
    stripeCancelAtPeriodEnd?: SortOrder
    status?: SortOrder
    plan?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SubscriptionCountOrderByAggregateInput
    _max?: SubscriptionMaxOrderByAggregateInput
    _min?: SubscriptionMinOrderByAggregateInput
  }

  export type SubscriptionScalarWhereWithAggregatesInput = {
    AND?: SubscriptionScalarWhereWithAggregatesInput | SubscriptionScalarWhereWithAggregatesInput[]
    OR?: SubscriptionScalarWhereWithAggregatesInput[]
    NOT?: SubscriptionScalarWhereWithAggregatesInput | SubscriptionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Subscription"> | string
    userId?: StringWithAggregatesFilter<"Subscription"> | string
    stripeCustomerId?: StringNullableWithAggregatesFilter<"Subscription"> | string | null
    stripeSubscriptionId?: StringNullableWithAggregatesFilter<"Subscription"> | string | null
    stripePriceId?: StringNullableWithAggregatesFilter<"Subscription"> | string | null
    stripeCurrentPeriodStart?: DateTimeNullableWithAggregatesFilter<"Subscription"> | Date | string | null
    stripeCurrentPeriodEnd?: DateTimeNullableWithAggregatesFilter<"Subscription"> | Date | string | null
    stripeCancelAtPeriodEnd?: BoolWithAggregatesFilter<"Subscription"> | boolean
    status?: EnumSubscriptionStatusWithAggregatesFilter<"Subscription"> | $Enums.SubscriptionStatus
    plan?: EnumSubscriptionPlanWithAggregatesFilter<"Subscription"> | $Enums.SubscriptionPlan
    createdAt?: DateTimeWithAggregatesFilter<"Subscription"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Subscription"> | Date | string
  }

  export type UsageTrackerWhereInput = {
    AND?: UsageTrackerWhereInput | UsageTrackerWhereInput[]
    OR?: UsageTrackerWhereInput[]
    NOT?: UsageTrackerWhereInput | UsageTrackerWhereInput[]
    id?: StringFilter<"UsageTracker"> | string
    userId?: StringFilter<"UsageTracker"> | string
    feature?: EnumUsageFeatureFilter<"UsageTracker"> | $Enums.UsageFeature
    count?: IntFilter<"UsageTracker"> | number
    periodStart?: DateTimeFilter<"UsageTracker"> | Date | string
    periodEnd?: DateTimeFilter<"UsageTracker"> | Date | string
    createdAt?: DateTimeFilter<"UsageTracker"> | Date | string
    updatedAt?: DateTimeFilter<"UsageTracker"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type UsageTrackerOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    feature?: SortOrder
    count?: SortOrder
    periodStart?: SortOrder
    periodEnd?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type UsageTrackerWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId_feature_periodStart?: UsageTrackerUserIdFeaturePeriodStartCompoundUniqueInput
    AND?: UsageTrackerWhereInput | UsageTrackerWhereInput[]
    OR?: UsageTrackerWhereInput[]
    NOT?: UsageTrackerWhereInput | UsageTrackerWhereInput[]
    userId?: StringFilter<"UsageTracker"> | string
    feature?: EnumUsageFeatureFilter<"UsageTracker"> | $Enums.UsageFeature
    count?: IntFilter<"UsageTracker"> | number
    periodStart?: DateTimeFilter<"UsageTracker"> | Date | string
    periodEnd?: DateTimeFilter<"UsageTracker"> | Date | string
    createdAt?: DateTimeFilter<"UsageTracker"> | Date | string
    updatedAt?: DateTimeFilter<"UsageTracker"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "userId_feature_periodStart">

  export type UsageTrackerOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    feature?: SortOrder
    count?: SortOrder
    periodStart?: SortOrder
    periodEnd?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: UsageTrackerCountOrderByAggregateInput
    _avg?: UsageTrackerAvgOrderByAggregateInput
    _max?: UsageTrackerMaxOrderByAggregateInput
    _min?: UsageTrackerMinOrderByAggregateInput
    _sum?: UsageTrackerSumOrderByAggregateInput
  }

  export type UsageTrackerScalarWhereWithAggregatesInput = {
    AND?: UsageTrackerScalarWhereWithAggregatesInput | UsageTrackerScalarWhereWithAggregatesInput[]
    OR?: UsageTrackerScalarWhereWithAggregatesInput[]
    NOT?: UsageTrackerScalarWhereWithAggregatesInput | UsageTrackerScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"UsageTracker"> | string
    userId?: StringWithAggregatesFilter<"UsageTracker"> | string
    feature?: EnumUsageFeatureWithAggregatesFilter<"UsageTracker"> | $Enums.UsageFeature
    count?: IntWithAggregatesFilter<"UsageTracker"> | number
    periodStart?: DateTimeWithAggregatesFilter<"UsageTracker"> | Date | string
    periodEnd?: DateTimeWithAggregatesFilter<"UsageTracker"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"UsageTracker"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"UsageTracker"> | Date | string
  }

  export type BackupCodesWhereInput = {
    AND?: BackupCodesWhereInput | BackupCodesWhereInput[]
    OR?: BackupCodesWhereInput[]
    NOT?: BackupCodesWhereInput | BackupCodesWhereInput[]
    id?: StringFilter<"BackupCodes"> | string
    usedAt?: DateTimeNullableFilter<"BackupCodes"> | Date | string | null
    code?: StringFilter<"BackupCodes"> | string
    userId?: StringFilter<"BackupCodes"> | string
    createdAt?: DateTimeFilter<"BackupCodes"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type BackupCodesOrderByWithRelationInput = {
    id?: SortOrder
    usedAt?: SortOrderInput | SortOrder
    code?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type BackupCodesWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: BackupCodesWhereInput | BackupCodesWhereInput[]
    OR?: BackupCodesWhereInput[]
    NOT?: BackupCodesWhereInput | BackupCodesWhereInput[]
    usedAt?: DateTimeNullableFilter<"BackupCodes"> | Date | string | null
    code?: StringFilter<"BackupCodes"> | string
    userId?: StringFilter<"BackupCodes"> | string
    createdAt?: DateTimeFilter<"BackupCodes"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type BackupCodesOrderByWithAggregationInput = {
    id?: SortOrder
    usedAt?: SortOrderInput | SortOrder
    code?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    _count?: BackupCodesCountOrderByAggregateInput
    _max?: BackupCodesMaxOrderByAggregateInput
    _min?: BackupCodesMinOrderByAggregateInput
  }

  export type BackupCodesScalarWhereWithAggregatesInput = {
    AND?: BackupCodesScalarWhereWithAggregatesInput | BackupCodesScalarWhereWithAggregatesInput[]
    OR?: BackupCodesScalarWhereWithAggregatesInput[]
    NOT?: BackupCodesScalarWhereWithAggregatesInput | BackupCodesScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"BackupCodes"> | string
    usedAt?: DateTimeNullableWithAggregatesFilter<"BackupCodes"> | Date | string | null
    code?: StringWithAggregatesFilter<"BackupCodes"> | string
    userId?: StringWithAggregatesFilter<"BackupCodes"> | string
    createdAt?: DateTimeWithAggregatesFilter<"BackupCodes"> | Date | string
  }

  export type ActivityLogsWhereInput = {
    AND?: ActivityLogsWhereInput | ActivityLogsWhereInput[]
    OR?: ActivityLogsWhereInput[]
    NOT?: ActivityLogsWhereInput | ActivityLogsWhereInput[]
    id?: StringFilter<"ActivityLogs"> | string
  }

  export type ActivityLogsOrderByWithRelationInput = {
    id?: SortOrder
  }

  export type ActivityLogsWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ActivityLogsWhereInput | ActivityLogsWhereInput[]
    OR?: ActivityLogsWhereInput[]
    NOT?: ActivityLogsWhereInput | ActivityLogsWhereInput[]
  }, "id">

  export type ActivityLogsOrderByWithAggregationInput = {
    id?: SortOrder
    _count?: ActivityLogsCountOrderByAggregateInput
    _max?: ActivityLogsMaxOrderByAggregateInput
    _min?: ActivityLogsMinOrderByAggregateInput
  }

  export type ActivityLogsScalarWhereWithAggregatesInput = {
    AND?: ActivityLogsScalarWhereWithAggregatesInput | ActivityLogsScalarWhereWithAggregatesInput[]
    OR?: ActivityLogsScalarWhereWithAggregatesInput[]
    NOT?: ActivityLogsScalarWhereWithAggregatesInput | ActivityLogsScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ActivityLogs"> | string
  }

  export type NotificationSettingWhereInput = {
    AND?: NotificationSettingWhereInput | NotificationSettingWhereInput[]
    OR?: NotificationSettingWhereInput[]
    NOT?: NotificationSettingWhereInput | NotificationSettingWhereInput[]
    id?: StringFilter<"NotificationSetting"> | string
    budgetAlertMail?: BoolFilter<"NotificationSetting"> | boolean
    budgetAlertApp?: BoolFilter<"NotificationSetting"> | boolean
    billReminderMail?: BoolFilter<"NotificationSetting"> | boolean
    billReminderApp?: BoolFilter<"NotificationSetting"> | boolean
    weeklyReportMail?: BoolFilter<"NotificationSetting"> | boolean
    weeklyReportApp?: BoolFilter<"NotificationSetting"> | boolean
    aiInsightsMail?: BoolFilter<"NotificationSetting"> | boolean
    aiInsightsApp?: BoolFilter<"NotificationSetting"> | boolean
    goalsAlertMail?: BoolFilter<"NotificationSetting"> | boolean
    goalsAlertApp?: BoolFilter<"NotificationSetting"> | boolean
    splitsAlertMail?: BoolFilter<"NotificationSetting"> | boolean
    splitsAlertApp?: BoolFilter<"NotificationSetting"> | boolean
    newsLetterAlert?: BoolFilter<"NotificationSetting"> | boolean
    communityAlert?: BoolFilter<"NotificationSetting"> | boolean
    userId?: StringFilter<"NotificationSetting"> | string
    createdAt?: DateTimeFilter<"NotificationSetting"> | Date | string
    updatedAt?: DateTimeFilter<"NotificationSetting"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type NotificationSettingOrderByWithRelationInput = {
    id?: SortOrder
    budgetAlertMail?: SortOrder
    budgetAlertApp?: SortOrder
    billReminderMail?: SortOrder
    billReminderApp?: SortOrder
    weeklyReportMail?: SortOrder
    weeklyReportApp?: SortOrder
    aiInsightsMail?: SortOrder
    aiInsightsApp?: SortOrder
    goalsAlertMail?: SortOrder
    goalsAlertApp?: SortOrder
    splitsAlertMail?: SortOrder
    splitsAlertApp?: SortOrder
    newsLetterAlert?: SortOrder
    communityAlert?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    user?: UserOrderByWithRelationInput
  }

  export type NotificationSettingWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId?: string
    AND?: NotificationSettingWhereInput | NotificationSettingWhereInput[]
    OR?: NotificationSettingWhereInput[]
    NOT?: NotificationSettingWhereInput | NotificationSettingWhereInput[]
    budgetAlertMail?: BoolFilter<"NotificationSetting"> | boolean
    budgetAlertApp?: BoolFilter<"NotificationSetting"> | boolean
    billReminderMail?: BoolFilter<"NotificationSetting"> | boolean
    billReminderApp?: BoolFilter<"NotificationSetting"> | boolean
    weeklyReportMail?: BoolFilter<"NotificationSetting"> | boolean
    weeklyReportApp?: BoolFilter<"NotificationSetting"> | boolean
    aiInsightsMail?: BoolFilter<"NotificationSetting"> | boolean
    aiInsightsApp?: BoolFilter<"NotificationSetting"> | boolean
    goalsAlertMail?: BoolFilter<"NotificationSetting"> | boolean
    goalsAlertApp?: BoolFilter<"NotificationSetting"> | boolean
    splitsAlertMail?: BoolFilter<"NotificationSetting"> | boolean
    splitsAlertApp?: BoolFilter<"NotificationSetting"> | boolean
    newsLetterAlert?: BoolFilter<"NotificationSetting"> | boolean
    communityAlert?: BoolFilter<"NotificationSetting"> | boolean
    createdAt?: DateTimeFilter<"NotificationSetting"> | Date | string
    updatedAt?: DateTimeFilter<"NotificationSetting"> | Date | string
    user?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "userId">

  export type NotificationSettingOrderByWithAggregationInput = {
    id?: SortOrder
    budgetAlertMail?: SortOrder
    budgetAlertApp?: SortOrder
    billReminderMail?: SortOrder
    billReminderApp?: SortOrder
    weeklyReportMail?: SortOrder
    weeklyReportApp?: SortOrder
    aiInsightsMail?: SortOrder
    aiInsightsApp?: SortOrder
    goalsAlertMail?: SortOrder
    goalsAlertApp?: SortOrder
    splitsAlertMail?: SortOrder
    splitsAlertApp?: SortOrder
    newsLetterAlert?: SortOrder
    communityAlert?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: NotificationSettingCountOrderByAggregateInput
    _max?: NotificationSettingMaxOrderByAggregateInput
    _min?: NotificationSettingMinOrderByAggregateInput
  }

  export type NotificationSettingScalarWhereWithAggregatesInput = {
    AND?: NotificationSettingScalarWhereWithAggregatesInput | NotificationSettingScalarWhereWithAggregatesInput[]
    OR?: NotificationSettingScalarWhereWithAggregatesInput[]
    NOT?: NotificationSettingScalarWhereWithAggregatesInput | NotificationSettingScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"NotificationSetting"> | string
    budgetAlertMail?: BoolWithAggregatesFilter<"NotificationSetting"> | boolean
    budgetAlertApp?: BoolWithAggregatesFilter<"NotificationSetting"> | boolean
    billReminderMail?: BoolWithAggregatesFilter<"NotificationSetting"> | boolean
    billReminderApp?: BoolWithAggregatesFilter<"NotificationSetting"> | boolean
    weeklyReportMail?: BoolWithAggregatesFilter<"NotificationSetting"> | boolean
    weeklyReportApp?: BoolWithAggregatesFilter<"NotificationSetting"> | boolean
    aiInsightsMail?: BoolWithAggregatesFilter<"NotificationSetting"> | boolean
    aiInsightsApp?: BoolWithAggregatesFilter<"NotificationSetting"> | boolean
    goalsAlertMail?: BoolWithAggregatesFilter<"NotificationSetting"> | boolean
    goalsAlertApp?: BoolWithAggregatesFilter<"NotificationSetting"> | boolean
    splitsAlertMail?: BoolWithAggregatesFilter<"NotificationSetting"> | boolean
    splitsAlertApp?: BoolWithAggregatesFilter<"NotificationSetting"> | boolean
    newsLetterAlert?: BoolWithAggregatesFilter<"NotificationSetting"> | boolean
    communityAlert?: BoolWithAggregatesFilter<"NotificationSetting"> | boolean
    userId?: StringWithAggregatesFilter<"NotificationSetting"> | string
    createdAt?: DateTimeWithAggregatesFilter<"NotificationSetting"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"NotificationSetting"> | Date | string
  }

  export type CurrenciesCreateInput = {
    id?: string
    currency: $Enums.Currency
    label: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CurrenciesUncheckedCreateInput = {
    id?: string
    currency: $Enums.Currency
    label: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CurrenciesUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    label?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CurrenciesUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    label?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CurrenciesCreateManyInput = {
    id?: string
    currency: $Enums.Currency
    label: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CurrenciesUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    label?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CurrenciesUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    label?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LocaleCreateInput = {
    id?: string
    language: $Enums.Language
    label: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LocaleUncheckedCreateInput = {
    id?: string
    language: $Enums.Language
    label: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LocaleUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    language?: EnumLanguageFieldUpdateOperationsInput | $Enums.Language
    label?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LocaleUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    language?: EnumLanguageFieldUpdateOperationsInput | $Enums.Language
    label?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LocaleCreateManyInput = {
    id?: string
    language: $Enums.Language
    label: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type LocaleUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    language?: EnumLanguageFieldUpdateOperationsInput | $Enums.Language
    label?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LocaleUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    language?: EnumLanguageFieldUpdateOperationsInput | $Enums.Language
    label?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserCreateInput = {
    id?: string
    email: string
    password?: string | null
    loginAttempts?: number
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    firstName: string
    lastName: string
    avatar?: string | null
    lastLoginAt?: Date | string | null
    twoFactorAttempts?: number
    twoFactorEnabled?: boolean
    twoFactorSecret?: string | null
    twoFactorLastUsedAt?: Date | string | null
    currency?: $Enums.Currency
    language?: $Enums.Language
    timezone?: string
    dateFormat?: $Enums.DateFormat
    scheduledDeletionAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountCreateNestedManyWithoutUserInput
    sessions?: SessionCreateNestedManyWithoutUserInput
    subscription?: SubscriptionCreateNestedOneWithoutUserInput
    usageTrackers?: UsageTrackerCreateNestedManyWithoutUserInput
    backupCodes?: BackupCodesCreateNestedManyWithoutUserInput
    loginActivity?: LoginActivityCreateNestedManyWithoutUserInput
    setting?: NotificationSettingCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    email: string
    password?: string | null
    loginAttempts?: number
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    firstName: string
    lastName: string
    avatar?: string | null
    lastLoginAt?: Date | string | null
    twoFactorAttempts?: number
    twoFactorEnabled?: boolean
    twoFactorSecret?: string | null
    twoFactorLastUsedAt?: Date | string | null
    currency?: $Enums.Currency
    language?: $Enums.Language
    timezone?: string
    dateFormat?: $Enums.DateFormat
    scheduledDeletionAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountUncheckedCreateNestedManyWithoutUserInput
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
    subscription?: SubscriptionUncheckedCreateNestedOneWithoutUserInput
    usageTrackers?: UsageTrackerUncheckedCreateNestedManyWithoutUserInput
    backupCodes?: BackupCodesUncheckedCreateNestedManyWithoutUserInput
    loginActivity?: LoginActivityUncheckedCreateNestedManyWithoutUserInput
    setting?: NotificationSettingUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    loginAttempts?: IntFieldUpdateOperationsInput | number
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    twoFactorAttempts?: IntFieldUpdateOperationsInput | number
    twoFactorEnabled?: BoolFieldUpdateOperationsInput | boolean
    twoFactorSecret?: NullableStringFieldUpdateOperationsInput | string | null
    twoFactorLastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    language?: EnumLanguageFieldUpdateOperationsInput | $Enums.Language
    timezone?: StringFieldUpdateOperationsInput | string
    dateFormat?: EnumDateFormatFieldUpdateOperationsInput | $Enums.DateFormat
    scheduledDeletionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUpdateManyWithoutUserNestedInput
    sessions?: SessionUpdateManyWithoutUserNestedInput
    subscription?: SubscriptionUpdateOneWithoutUserNestedInput
    usageTrackers?: UsageTrackerUpdateManyWithoutUserNestedInput
    backupCodes?: BackupCodesUpdateManyWithoutUserNestedInput
    loginActivity?: LoginActivityUpdateManyWithoutUserNestedInput
    setting?: NotificationSettingUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    loginAttempts?: IntFieldUpdateOperationsInput | number
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    twoFactorAttempts?: IntFieldUpdateOperationsInput | number
    twoFactorEnabled?: BoolFieldUpdateOperationsInput | boolean
    twoFactorSecret?: NullableStringFieldUpdateOperationsInput | string | null
    twoFactorLastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    language?: EnumLanguageFieldUpdateOperationsInput | $Enums.Language
    timezone?: StringFieldUpdateOperationsInput | string
    dateFormat?: EnumDateFormatFieldUpdateOperationsInput | $Enums.DateFormat
    scheduledDeletionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUncheckedUpdateManyWithoutUserNestedInput
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
    subscription?: SubscriptionUncheckedUpdateOneWithoutUserNestedInput
    usageTrackers?: UsageTrackerUncheckedUpdateManyWithoutUserNestedInput
    backupCodes?: BackupCodesUncheckedUpdateManyWithoutUserNestedInput
    loginActivity?: LoginActivityUncheckedUpdateManyWithoutUserNestedInput
    setting?: NotificationSettingUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    email: string
    password?: string | null
    loginAttempts?: number
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    firstName: string
    lastName: string
    avatar?: string | null
    lastLoginAt?: Date | string | null
    twoFactorAttempts?: number
    twoFactorEnabled?: boolean
    twoFactorSecret?: string | null
    twoFactorLastUsedAt?: Date | string | null
    currency?: $Enums.Currency
    language?: $Enums.Language
    timezone?: string
    dateFormat?: $Enums.DateFormat
    scheduledDeletionAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    loginAttempts?: IntFieldUpdateOperationsInput | number
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    twoFactorAttempts?: IntFieldUpdateOperationsInput | number
    twoFactorEnabled?: BoolFieldUpdateOperationsInput | boolean
    twoFactorSecret?: NullableStringFieldUpdateOperationsInput | string | null
    twoFactorLastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    language?: EnumLanguageFieldUpdateOperationsInput | $Enums.Language
    timezone?: StringFieldUpdateOperationsInput | string
    dateFormat?: EnumDateFormatFieldUpdateOperationsInput | $Enums.DateFormat
    scheduledDeletionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    loginAttempts?: IntFieldUpdateOperationsInput | number
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    twoFactorAttempts?: IntFieldUpdateOperationsInput | number
    twoFactorEnabled?: BoolFieldUpdateOperationsInput | boolean
    twoFactorSecret?: NullableStringFieldUpdateOperationsInput | string | null
    twoFactorLastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    language?: EnumLanguageFieldUpdateOperationsInput | $Enums.Language
    timezone?: StringFieldUpdateOperationsInput | string
    dateFormat?: EnumDateFormatFieldUpdateOperationsInput | $Enums.DateFormat
    scheduledDeletionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AccountCreateInput = {
    id?: string
    type: $Enums.AccountType
    provider: $Enums.AccountProvider
    providerAccountId: string
    refreshToken?: string | null
    accessToken?: string | null
    expiresAt?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutAccountsInput
  }

  export type AccountUncheckedCreateInput = {
    id?: string
    userId: string
    type: $Enums.AccountType
    provider: $Enums.AccountProvider
    providerAccountId: string
    refreshToken?: string | null
    accessToken?: string | null
    expiresAt?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AccountUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumAccountTypeFieldUpdateOperationsInput | $Enums.AccountType
    provider?: EnumAccountProviderFieldUpdateOperationsInput | $Enums.AccountProvider
    providerAccountId?: StringFieldUpdateOperationsInput | string
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    expiresAt?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutAccountsNestedInput
  }

  export type AccountUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: EnumAccountTypeFieldUpdateOperationsInput | $Enums.AccountType
    provider?: EnumAccountProviderFieldUpdateOperationsInput | $Enums.AccountProvider
    providerAccountId?: StringFieldUpdateOperationsInput | string
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    expiresAt?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AccountCreateManyInput = {
    id?: string
    userId: string
    type: $Enums.AccountType
    provider: $Enums.AccountProvider
    providerAccountId: string
    refreshToken?: string | null
    accessToken?: string | null
    expiresAt?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AccountUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumAccountTypeFieldUpdateOperationsInput | $Enums.AccountType
    provider?: EnumAccountProviderFieldUpdateOperationsInput | $Enums.AccountProvider
    providerAccountId?: StringFieldUpdateOperationsInput | string
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    expiresAt?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AccountUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: EnumAccountTypeFieldUpdateOperationsInput | $Enums.AccountType
    provider?: EnumAccountProviderFieldUpdateOperationsInput | $Enums.AccountProvider
    providerAccountId?: StringFieldUpdateOperationsInput | string
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    expiresAt?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionCreateInput = {
    id?: string
    sessionToken: string
    expires: Date | string
    deviceId: string
    userAgent?: string | null
    ipAddress?: string | null
    location?: string | null
    lastUsedAt?: Date | string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutSessionsInput
  }

  export type SessionUncheckedCreateInput = {
    id?: string
    sessionToken: string
    userId: string
    expires: Date | string
    deviceId: string
    userAgent?: string | null
    ipAddress?: string | null
    location?: string | null
    lastUsedAt?: Date | string
    createdAt?: Date | string
  }

  export type SessionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionToken?: StringFieldUpdateOperationsInput | string
    expires?: DateTimeFieldUpdateOperationsInput | Date | string
    deviceId?: StringFieldUpdateOperationsInput | string
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    lastUsedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutSessionsNestedInput
  }

  export type SessionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionToken?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    expires?: DateTimeFieldUpdateOperationsInput | Date | string
    deviceId?: StringFieldUpdateOperationsInput | string
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    lastUsedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionCreateManyInput = {
    id?: string
    sessionToken: string
    userId: string
    expires: Date | string
    deviceId: string
    userAgent?: string | null
    ipAddress?: string | null
    location?: string | null
    lastUsedAt?: Date | string
    createdAt?: Date | string
  }

  export type SessionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionToken?: StringFieldUpdateOperationsInput | string
    expires?: DateTimeFieldUpdateOperationsInput | Date | string
    deviceId?: StringFieldUpdateOperationsInput | string
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    lastUsedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionToken?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    expires?: DateTimeFieldUpdateOperationsInput | Date | string
    deviceId?: StringFieldUpdateOperationsInput | string
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    lastUsedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LoginActivityCreateInput = {
    id?: string
    type: $Enums.LoginActivityType
    status: $Enums.LoginActivityStatus
    deviceId: string
    userAgent?: string | null
    ipAddress?: string | null
    location?: string | null
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutLoginActivityInput
  }

  export type LoginActivityUncheckedCreateInput = {
    id?: string
    type: $Enums.LoginActivityType
    status: $Enums.LoginActivityStatus
    deviceId: string
    userAgent?: string | null
    ipAddress?: string | null
    location?: string | null
    userId: string
    createdAt?: Date | string
  }

  export type LoginActivityUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumLoginActivityTypeFieldUpdateOperationsInput | $Enums.LoginActivityType
    status?: EnumLoginActivityStatusFieldUpdateOperationsInput | $Enums.LoginActivityStatus
    deviceId?: StringFieldUpdateOperationsInput | string
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutLoginActivityNestedInput
  }

  export type LoginActivityUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumLoginActivityTypeFieldUpdateOperationsInput | $Enums.LoginActivityType
    status?: EnumLoginActivityStatusFieldUpdateOperationsInput | $Enums.LoginActivityStatus
    deviceId?: StringFieldUpdateOperationsInput | string
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LoginActivityCreateManyInput = {
    id?: string
    type: $Enums.LoginActivityType
    status: $Enums.LoginActivityStatus
    deviceId: string
    userAgent?: string | null
    ipAddress?: string | null
    location?: string | null
    userId: string
    createdAt?: Date | string
  }

  export type LoginActivityUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumLoginActivityTypeFieldUpdateOperationsInput | $Enums.LoginActivityType
    status?: EnumLoginActivityStatusFieldUpdateOperationsInput | $Enums.LoginActivityStatus
    deviceId?: StringFieldUpdateOperationsInput | string
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LoginActivityUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumLoginActivityTypeFieldUpdateOperationsInput | $Enums.LoginActivityType
    status?: EnumLoginActivityStatusFieldUpdateOperationsInput | $Enums.LoginActivityStatus
    deviceId?: StringFieldUpdateOperationsInput | string
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationTokenCreateInput = {
    id?: string
    identifier: $Enums.VerificationIdentifier
    email: string
    token: string
    newEmail?: string | null
    expires: Date | string
    createdAt?: Date | string
  }

  export type VerificationTokenUncheckedCreateInput = {
    id?: string
    identifier: $Enums.VerificationIdentifier
    email: string
    token: string
    newEmail?: string | null
    expires: Date | string
    createdAt?: Date | string
  }

  export type VerificationTokenUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    identifier?: EnumVerificationIdentifierFieldUpdateOperationsInput | $Enums.VerificationIdentifier
    email?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    newEmail?: NullableStringFieldUpdateOperationsInput | string | null
    expires?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationTokenUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    identifier?: EnumVerificationIdentifierFieldUpdateOperationsInput | $Enums.VerificationIdentifier
    email?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    newEmail?: NullableStringFieldUpdateOperationsInput | string | null
    expires?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationTokenCreateManyInput = {
    id?: string
    identifier: $Enums.VerificationIdentifier
    email: string
    token: string
    newEmail?: string | null
    expires: Date | string
    createdAt?: Date | string
  }

  export type VerificationTokenUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    identifier?: EnumVerificationIdentifierFieldUpdateOperationsInput | $Enums.VerificationIdentifier
    email?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    newEmail?: NullableStringFieldUpdateOperationsInput | string | null
    expires?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VerificationTokenUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    identifier?: EnumVerificationIdentifierFieldUpdateOperationsInput | $Enums.VerificationIdentifier
    email?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    newEmail?: NullableStringFieldUpdateOperationsInput | string | null
    expires?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubscriptionCreateInput = {
    id?: string
    stripeCustomerId?: string | null
    stripeSubscriptionId?: string | null
    stripePriceId?: string | null
    stripeCurrentPeriodStart?: Date | string | null
    stripeCurrentPeriodEnd?: Date | string | null
    stripeCancelAtPeriodEnd?: boolean
    status?: $Enums.SubscriptionStatus
    plan?: $Enums.SubscriptionPlan
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutSubscriptionInput
  }

  export type SubscriptionUncheckedCreateInput = {
    id?: string
    userId: string
    stripeCustomerId?: string | null
    stripeSubscriptionId?: string | null
    stripePriceId?: string | null
    stripeCurrentPeriodStart?: Date | string | null
    stripeCurrentPeriodEnd?: Date | string | null
    stripeCancelAtPeriodEnd?: boolean
    status?: $Enums.SubscriptionStatus
    plan?: $Enums.SubscriptionPlan
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SubscriptionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    stripeCustomerId?: NullableStringFieldUpdateOperationsInput | string | null
    stripeSubscriptionId?: NullableStringFieldUpdateOperationsInput | string | null
    stripePriceId?: NullableStringFieldUpdateOperationsInput | string | null
    stripeCurrentPeriodStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeCurrentPeriodEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeCancelAtPeriodEnd?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumSubscriptionStatusFieldUpdateOperationsInput | $Enums.SubscriptionStatus
    plan?: EnumSubscriptionPlanFieldUpdateOperationsInput | $Enums.SubscriptionPlan
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutSubscriptionNestedInput
  }

  export type SubscriptionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    stripeCustomerId?: NullableStringFieldUpdateOperationsInput | string | null
    stripeSubscriptionId?: NullableStringFieldUpdateOperationsInput | string | null
    stripePriceId?: NullableStringFieldUpdateOperationsInput | string | null
    stripeCurrentPeriodStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeCurrentPeriodEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeCancelAtPeriodEnd?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumSubscriptionStatusFieldUpdateOperationsInput | $Enums.SubscriptionStatus
    plan?: EnumSubscriptionPlanFieldUpdateOperationsInput | $Enums.SubscriptionPlan
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubscriptionCreateManyInput = {
    id?: string
    userId: string
    stripeCustomerId?: string | null
    stripeSubscriptionId?: string | null
    stripePriceId?: string | null
    stripeCurrentPeriodStart?: Date | string | null
    stripeCurrentPeriodEnd?: Date | string | null
    stripeCancelAtPeriodEnd?: boolean
    status?: $Enums.SubscriptionStatus
    plan?: $Enums.SubscriptionPlan
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SubscriptionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    stripeCustomerId?: NullableStringFieldUpdateOperationsInput | string | null
    stripeSubscriptionId?: NullableStringFieldUpdateOperationsInput | string | null
    stripePriceId?: NullableStringFieldUpdateOperationsInput | string | null
    stripeCurrentPeriodStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeCurrentPeriodEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeCancelAtPeriodEnd?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumSubscriptionStatusFieldUpdateOperationsInput | $Enums.SubscriptionStatus
    plan?: EnumSubscriptionPlanFieldUpdateOperationsInput | $Enums.SubscriptionPlan
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubscriptionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    stripeCustomerId?: NullableStringFieldUpdateOperationsInput | string | null
    stripeSubscriptionId?: NullableStringFieldUpdateOperationsInput | string | null
    stripePriceId?: NullableStringFieldUpdateOperationsInput | string | null
    stripeCurrentPeriodStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeCurrentPeriodEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeCancelAtPeriodEnd?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumSubscriptionStatusFieldUpdateOperationsInput | $Enums.SubscriptionStatus
    plan?: EnumSubscriptionPlanFieldUpdateOperationsInput | $Enums.SubscriptionPlan
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UsageTrackerCreateInput = {
    id?: string
    feature: $Enums.UsageFeature
    count?: number
    periodStart: Date | string
    periodEnd: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutUsageTrackersInput
  }

  export type UsageTrackerUncheckedCreateInput = {
    id?: string
    userId: string
    feature: $Enums.UsageFeature
    count?: number
    periodStart: Date | string
    periodEnd: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UsageTrackerUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    feature?: EnumUsageFeatureFieldUpdateOperationsInput | $Enums.UsageFeature
    count?: IntFieldUpdateOperationsInput | number
    periodStart?: DateTimeFieldUpdateOperationsInput | Date | string
    periodEnd?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutUsageTrackersNestedInput
  }

  export type UsageTrackerUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    feature?: EnumUsageFeatureFieldUpdateOperationsInput | $Enums.UsageFeature
    count?: IntFieldUpdateOperationsInput | number
    periodStart?: DateTimeFieldUpdateOperationsInput | Date | string
    periodEnd?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UsageTrackerCreateManyInput = {
    id?: string
    userId: string
    feature: $Enums.UsageFeature
    count?: number
    periodStart: Date | string
    periodEnd: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UsageTrackerUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    feature?: EnumUsageFeatureFieldUpdateOperationsInput | $Enums.UsageFeature
    count?: IntFieldUpdateOperationsInput | number
    periodStart?: DateTimeFieldUpdateOperationsInput | Date | string
    periodEnd?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UsageTrackerUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    feature?: EnumUsageFeatureFieldUpdateOperationsInput | $Enums.UsageFeature
    count?: IntFieldUpdateOperationsInput | number
    periodStart?: DateTimeFieldUpdateOperationsInput | Date | string
    periodEnd?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BackupCodesCreateInput = {
    id?: string
    usedAt?: Date | string | null
    code: string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutBackupCodesInput
  }

  export type BackupCodesUncheckedCreateInput = {
    id?: string
    usedAt?: Date | string | null
    code: string
    userId: string
    createdAt?: Date | string
  }

  export type BackupCodesUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    usedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    code?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutBackupCodesNestedInput
  }

  export type BackupCodesUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    usedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    code?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BackupCodesCreateManyInput = {
    id?: string
    usedAt?: Date | string | null
    code: string
    userId: string
    createdAt?: Date | string
  }

  export type BackupCodesUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    usedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    code?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BackupCodesUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    usedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    code?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ActivityLogsCreateInput = {
    id?: string
  }

  export type ActivityLogsUncheckedCreateInput = {
    id?: string
  }

  export type ActivityLogsUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
  }

  export type ActivityLogsUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
  }

  export type ActivityLogsCreateManyInput = {
    id?: string
  }

  export type ActivityLogsUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
  }

  export type ActivityLogsUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
  }

  export type NotificationSettingCreateInput = {
    id?: string
    budgetAlertMail?: boolean
    budgetAlertApp?: boolean
    billReminderMail?: boolean
    billReminderApp?: boolean
    weeklyReportMail?: boolean
    weeklyReportApp?: boolean
    aiInsightsMail?: boolean
    aiInsightsApp?: boolean
    goalsAlertMail?: boolean
    goalsAlertApp?: boolean
    splitsAlertMail?: boolean
    splitsAlertApp?: boolean
    newsLetterAlert?: boolean
    communityAlert?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    user: UserCreateNestedOneWithoutSettingInput
  }

  export type NotificationSettingUncheckedCreateInput = {
    id?: string
    budgetAlertMail?: boolean
    budgetAlertApp?: boolean
    billReminderMail?: boolean
    billReminderApp?: boolean
    weeklyReportMail?: boolean
    weeklyReportApp?: boolean
    aiInsightsMail?: boolean
    aiInsightsApp?: boolean
    goalsAlertMail?: boolean
    goalsAlertApp?: boolean
    splitsAlertMail?: boolean
    splitsAlertApp?: boolean
    newsLetterAlert?: boolean
    communityAlert?: boolean
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type NotificationSettingUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    budgetAlertMail?: BoolFieldUpdateOperationsInput | boolean
    budgetAlertApp?: BoolFieldUpdateOperationsInput | boolean
    billReminderMail?: BoolFieldUpdateOperationsInput | boolean
    billReminderApp?: BoolFieldUpdateOperationsInput | boolean
    weeklyReportMail?: BoolFieldUpdateOperationsInput | boolean
    weeklyReportApp?: BoolFieldUpdateOperationsInput | boolean
    aiInsightsMail?: BoolFieldUpdateOperationsInput | boolean
    aiInsightsApp?: BoolFieldUpdateOperationsInput | boolean
    goalsAlertMail?: BoolFieldUpdateOperationsInput | boolean
    goalsAlertApp?: BoolFieldUpdateOperationsInput | boolean
    splitsAlertMail?: BoolFieldUpdateOperationsInput | boolean
    splitsAlertApp?: BoolFieldUpdateOperationsInput | boolean
    newsLetterAlert?: BoolFieldUpdateOperationsInput | boolean
    communityAlert?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutSettingNestedInput
  }

  export type NotificationSettingUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    budgetAlertMail?: BoolFieldUpdateOperationsInput | boolean
    budgetAlertApp?: BoolFieldUpdateOperationsInput | boolean
    billReminderMail?: BoolFieldUpdateOperationsInput | boolean
    billReminderApp?: BoolFieldUpdateOperationsInput | boolean
    weeklyReportMail?: BoolFieldUpdateOperationsInput | boolean
    weeklyReportApp?: BoolFieldUpdateOperationsInput | boolean
    aiInsightsMail?: BoolFieldUpdateOperationsInput | boolean
    aiInsightsApp?: BoolFieldUpdateOperationsInput | boolean
    goalsAlertMail?: BoolFieldUpdateOperationsInput | boolean
    goalsAlertApp?: BoolFieldUpdateOperationsInput | boolean
    splitsAlertMail?: BoolFieldUpdateOperationsInput | boolean
    splitsAlertApp?: BoolFieldUpdateOperationsInput | boolean
    newsLetterAlert?: BoolFieldUpdateOperationsInput | boolean
    communityAlert?: BoolFieldUpdateOperationsInput | boolean
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationSettingCreateManyInput = {
    id?: string
    budgetAlertMail?: boolean
    budgetAlertApp?: boolean
    billReminderMail?: boolean
    billReminderApp?: boolean
    weeklyReportMail?: boolean
    weeklyReportApp?: boolean
    aiInsightsMail?: boolean
    aiInsightsApp?: boolean
    goalsAlertMail?: boolean
    goalsAlertApp?: boolean
    splitsAlertMail?: boolean
    splitsAlertApp?: boolean
    newsLetterAlert?: boolean
    communityAlert?: boolean
    userId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type NotificationSettingUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    budgetAlertMail?: BoolFieldUpdateOperationsInput | boolean
    budgetAlertApp?: BoolFieldUpdateOperationsInput | boolean
    billReminderMail?: BoolFieldUpdateOperationsInput | boolean
    billReminderApp?: BoolFieldUpdateOperationsInput | boolean
    weeklyReportMail?: BoolFieldUpdateOperationsInput | boolean
    weeklyReportApp?: BoolFieldUpdateOperationsInput | boolean
    aiInsightsMail?: BoolFieldUpdateOperationsInput | boolean
    aiInsightsApp?: BoolFieldUpdateOperationsInput | boolean
    goalsAlertMail?: BoolFieldUpdateOperationsInput | boolean
    goalsAlertApp?: BoolFieldUpdateOperationsInput | boolean
    splitsAlertMail?: BoolFieldUpdateOperationsInput | boolean
    splitsAlertApp?: BoolFieldUpdateOperationsInput | boolean
    newsLetterAlert?: BoolFieldUpdateOperationsInput | boolean
    communityAlert?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationSettingUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    budgetAlertMail?: BoolFieldUpdateOperationsInput | boolean
    budgetAlertApp?: BoolFieldUpdateOperationsInput | boolean
    billReminderMail?: BoolFieldUpdateOperationsInput | boolean
    billReminderApp?: BoolFieldUpdateOperationsInput | boolean
    weeklyReportMail?: BoolFieldUpdateOperationsInput | boolean
    weeklyReportApp?: BoolFieldUpdateOperationsInput | boolean
    aiInsightsMail?: BoolFieldUpdateOperationsInput | boolean
    aiInsightsApp?: BoolFieldUpdateOperationsInput | boolean
    goalsAlertMail?: BoolFieldUpdateOperationsInput | boolean
    goalsAlertApp?: BoolFieldUpdateOperationsInput | boolean
    splitsAlertMail?: BoolFieldUpdateOperationsInput | boolean
    splitsAlertApp?: BoolFieldUpdateOperationsInput | boolean
    newsLetterAlert?: BoolFieldUpdateOperationsInput | boolean
    communityAlert?: BoolFieldUpdateOperationsInput | boolean
    userId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type EnumCurrencyFilter<$PrismaModel = never> = {
    equals?: $Enums.Currency | EnumCurrencyFieldRefInput<$PrismaModel>
    in?: $Enums.Currency[] | ListEnumCurrencyFieldRefInput<$PrismaModel>
    notIn?: $Enums.Currency[] | ListEnumCurrencyFieldRefInput<$PrismaModel>
    not?: NestedEnumCurrencyFilter<$PrismaModel> | $Enums.Currency
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type CurrenciesCountOrderByAggregateInput = {
    id?: SortOrder
    currency?: SortOrder
    label?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CurrenciesMaxOrderByAggregateInput = {
    id?: SortOrder
    currency?: SortOrder
    label?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CurrenciesMinOrderByAggregateInput = {
    id?: SortOrder
    currency?: SortOrder
    label?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type EnumCurrencyWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Currency | EnumCurrencyFieldRefInput<$PrismaModel>
    in?: $Enums.Currency[] | ListEnumCurrencyFieldRefInput<$PrismaModel>
    notIn?: $Enums.Currency[] | ListEnumCurrencyFieldRefInput<$PrismaModel>
    not?: NestedEnumCurrencyWithAggregatesFilter<$PrismaModel> | $Enums.Currency
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCurrencyFilter<$PrismaModel>
    _max?: NestedEnumCurrencyFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumLanguageFilter<$PrismaModel = never> = {
    equals?: $Enums.Language | EnumLanguageFieldRefInput<$PrismaModel>
    in?: $Enums.Language[] | ListEnumLanguageFieldRefInput<$PrismaModel>
    notIn?: $Enums.Language[] | ListEnumLanguageFieldRefInput<$PrismaModel>
    not?: NestedEnumLanguageFilter<$PrismaModel> | $Enums.Language
  }

  export type LocaleCountOrderByAggregateInput = {
    id?: SortOrder
    language?: SortOrder
    label?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LocaleMaxOrderByAggregateInput = {
    id?: SortOrder
    language?: SortOrder
    label?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type LocaleMinOrderByAggregateInput = {
    id?: SortOrder
    language?: SortOrder
    label?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumLanguageWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Language | EnumLanguageFieldRefInput<$PrismaModel>
    in?: $Enums.Language[] | ListEnumLanguageFieldRefInput<$PrismaModel>
    notIn?: $Enums.Language[] | ListEnumLanguageFieldRefInput<$PrismaModel>
    not?: NestedEnumLanguageWithAggregatesFilter<$PrismaModel> | $Enums.Language
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumLanguageFilter<$PrismaModel>
    _max?: NestedEnumLanguageFilter<$PrismaModel>
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type EnumDateFormatFilter<$PrismaModel = never> = {
    equals?: $Enums.DateFormat | EnumDateFormatFieldRefInput<$PrismaModel>
    in?: $Enums.DateFormat[] | ListEnumDateFormatFieldRefInput<$PrismaModel>
    notIn?: $Enums.DateFormat[] | ListEnumDateFormatFieldRefInput<$PrismaModel>
    not?: NestedEnumDateFormatFilter<$PrismaModel> | $Enums.DateFormat
  }

  export type AccountListRelationFilter = {
    every?: AccountWhereInput
    some?: AccountWhereInput
    none?: AccountWhereInput
  }

  export type SessionListRelationFilter = {
    every?: SessionWhereInput
    some?: SessionWhereInput
    none?: SessionWhereInput
  }

  export type SubscriptionNullableScalarRelationFilter = {
    is?: SubscriptionWhereInput | null
    isNot?: SubscriptionWhereInput | null
  }

  export type UsageTrackerListRelationFilter = {
    every?: UsageTrackerWhereInput
    some?: UsageTrackerWhereInput
    none?: UsageTrackerWhereInput
  }

  export type BackupCodesListRelationFilter = {
    every?: BackupCodesWhereInput
    some?: BackupCodesWhereInput
    none?: BackupCodesWhereInput
  }

  export type LoginActivityListRelationFilter = {
    every?: LoginActivityWhereInput
    some?: LoginActivityWhereInput
    none?: LoginActivityWhereInput
  }

  export type NotificationSettingNullableScalarRelationFilter = {
    is?: NotificationSettingWhereInput | null
    isNot?: NotificationSettingWhereInput | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type AccountOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type SessionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UsageTrackerOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type BackupCodesOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type LoginActivityOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrder
    loginAttempts?: SortOrder
    emailVerified?: SortOrder
    emailVerifiedAt?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    avatar?: SortOrder
    lastLoginAt?: SortOrder
    twoFactorAttempts?: SortOrder
    twoFactorEnabled?: SortOrder
    twoFactorSecret?: SortOrder
    twoFactorLastUsedAt?: SortOrder
    currency?: SortOrder
    language?: SortOrder
    timezone?: SortOrder
    dateFormat?: SortOrder
    scheduledDeletionAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    loginAttempts?: SortOrder
    twoFactorAttempts?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrder
    loginAttempts?: SortOrder
    emailVerified?: SortOrder
    emailVerifiedAt?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    avatar?: SortOrder
    lastLoginAt?: SortOrder
    twoFactorAttempts?: SortOrder
    twoFactorEnabled?: SortOrder
    twoFactorSecret?: SortOrder
    twoFactorLastUsedAt?: SortOrder
    currency?: SortOrder
    language?: SortOrder
    timezone?: SortOrder
    dateFormat?: SortOrder
    scheduledDeletionAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    password?: SortOrder
    loginAttempts?: SortOrder
    emailVerified?: SortOrder
    emailVerifiedAt?: SortOrder
    firstName?: SortOrder
    lastName?: SortOrder
    avatar?: SortOrder
    lastLoginAt?: SortOrder
    twoFactorAttempts?: SortOrder
    twoFactorEnabled?: SortOrder
    twoFactorSecret?: SortOrder
    twoFactorLastUsedAt?: SortOrder
    currency?: SortOrder
    language?: SortOrder
    timezone?: SortOrder
    dateFormat?: SortOrder
    scheduledDeletionAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    loginAttempts?: SortOrder
    twoFactorAttempts?: SortOrder
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type EnumDateFormatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.DateFormat | EnumDateFormatFieldRefInput<$PrismaModel>
    in?: $Enums.DateFormat[] | ListEnumDateFormatFieldRefInput<$PrismaModel>
    notIn?: $Enums.DateFormat[] | ListEnumDateFormatFieldRefInput<$PrismaModel>
    not?: NestedEnumDateFormatWithAggregatesFilter<$PrismaModel> | $Enums.DateFormat
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumDateFormatFilter<$PrismaModel>
    _max?: NestedEnumDateFormatFilter<$PrismaModel>
  }

  export type EnumAccountTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.AccountType | EnumAccountTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AccountType[] | ListEnumAccountTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.AccountType[] | ListEnumAccountTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumAccountTypeFilter<$PrismaModel> | $Enums.AccountType
  }

  export type EnumAccountProviderFilter<$PrismaModel = never> = {
    equals?: $Enums.AccountProvider | EnumAccountProviderFieldRefInput<$PrismaModel>
    in?: $Enums.AccountProvider[] | ListEnumAccountProviderFieldRefInput<$PrismaModel>
    notIn?: $Enums.AccountProvider[] | ListEnumAccountProviderFieldRefInput<$PrismaModel>
    not?: NestedEnumAccountProviderFilter<$PrismaModel> | $Enums.AccountProvider
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type AccountProviderProviderAccountIdCompoundUniqueInput = {
    provider: $Enums.AccountProvider
    providerAccountId: string
  }

  export type AccountCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    provider?: SortOrder
    providerAccountId?: SortOrder
    refreshToken?: SortOrder
    accessToken?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AccountAvgOrderByAggregateInput = {
    expiresAt?: SortOrder
  }

  export type AccountMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    provider?: SortOrder
    providerAccountId?: SortOrder
    refreshToken?: SortOrder
    accessToken?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AccountMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    provider?: SortOrder
    providerAccountId?: SortOrder
    refreshToken?: SortOrder
    accessToken?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type AccountSumOrderByAggregateInput = {
    expiresAt?: SortOrder
  }

  export type EnumAccountTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AccountType | EnumAccountTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AccountType[] | ListEnumAccountTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.AccountType[] | ListEnumAccountTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumAccountTypeWithAggregatesFilter<$PrismaModel> | $Enums.AccountType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAccountTypeFilter<$PrismaModel>
    _max?: NestedEnumAccountTypeFilter<$PrismaModel>
  }

  export type EnumAccountProviderWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AccountProvider | EnumAccountProviderFieldRefInput<$PrismaModel>
    in?: $Enums.AccountProvider[] | ListEnumAccountProviderFieldRefInput<$PrismaModel>
    notIn?: $Enums.AccountProvider[] | ListEnumAccountProviderFieldRefInput<$PrismaModel>
    not?: NestedEnumAccountProviderWithAggregatesFilter<$PrismaModel> | $Enums.AccountProvider
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAccountProviderFilter<$PrismaModel>
    _max?: NestedEnumAccountProviderFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type SessionUserIdDeviceIdCompoundUniqueInput = {
    userId: string
    deviceId: string
  }

  export type SessionCountOrderByAggregateInput = {
    id?: SortOrder
    sessionToken?: SortOrder
    userId?: SortOrder
    expires?: SortOrder
    deviceId?: SortOrder
    userAgent?: SortOrder
    ipAddress?: SortOrder
    location?: SortOrder
    lastUsedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type SessionMaxOrderByAggregateInput = {
    id?: SortOrder
    sessionToken?: SortOrder
    userId?: SortOrder
    expires?: SortOrder
    deviceId?: SortOrder
    userAgent?: SortOrder
    ipAddress?: SortOrder
    location?: SortOrder
    lastUsedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type SessionMinOrderByAggregateInput = {
    id?: SortOrder
    sessionToken?: SortOrder
    userId?: SortOrder
    expires?: SortOrder
    deviceId?: SortOrder
    userAgent?: SortOrder
    ipAddress?: SortOrder
    location?: SortOrder
    lastUsedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type EnumLoginActivityTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.LoginActivityType | EnumLoginActivityTypeFieldRefInput<$PrismaModel>
    in?: $Enums.LoginActivityType[] | ListEnumLoginActivityTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.LoginActivityType[] | ListEnumLoginActivityTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumLoginActivityTypeFilter<$PrismaModel> | $Enums.LoginActivityType
  }

  export type EnumLoginActivityStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.LoginActivityStatus | EnumLoginActivityStatusFieldRefInput<$PrismaModel>
    in?: $Enums.LoginActivityStatus[] | ListEnumLoginActivityStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.LoginActivityStatus[] | ListEnumLoginActivityStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumLoginActivityStatusFilter<$PrismaModel> | $Enums.LoginActivityStatus
  }

  export type LoginActivityCountOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    status?: SortOrder
    deviceId?: SortOrder
    userAgent?: SortOrder
    ipAddress?: SortOrder
    location?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
  }

  export type LoginActivityMaxOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    status?: SortOrder
    deviceId?: SortOrder
    userAgent?: SortOrder
    ipAddress?: SortOrder
    location?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
  }

  export type LoginActivityMinOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    status?: SortOrder
    deviceId?: SortOrder
    userAgent?: SortOrder
    ipAddress?: SortOrder
    location?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
  }

  export type EnumLoginActivityTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.LoginActivityType | EnumLoginActivityTypeFieldRefInput<$PrismaModel>
    in?: $Enums.LoginActivityType[] | ListEnumLoginActivityTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.LoginActivityType[] | ListEnumLoginActivityTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumLoginActivityTypeWithAggregatesFilter<$PrismaModel> | $Enums.LoginActivityType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumLoginActivityTypeFilter<$PrismaModel>
    _max?: NestedEnumLoginActivityTypeFilter<$PrismaModel>
  }

  export type EnumLoginActivityStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.LoginActivityStatus | EnumLoginActivityStatusFieldRefInput<$PrismaModel>
    in?: $Enums.LoginActivityStatus[] | ListEnumLoginActivityStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.LoginActivityStatus[] | ListEnumLoginActivityStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumLoginActivityStatusWithAggregatesFilter<$PrismaModel> | $Enums.LoginActivityStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumLoginActivityStatusFilter<$PrismaModel>
    _max?: NestedEnumLoginActivityStatusFilter<$PrismaModel>
  }

  export type EnumVerificationIdentifierFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationIdentifier | EnumVerificationIdentifierFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationIdentifier[] | ListEnumVerificationIdentifierFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationIdentifier[] | ListEnumVerificationIdentifierFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationIdentifierFilter<$PrismaModel> | $Enums.VerificationIdentifier
  }

  export type VerificationTokenEmailTokenIdentifierCompoundUniqueInput = {
    email: string
    token: string
    identifier: $Enums.VerificationIdentifier
  }

  export type VerificationTokenCountOrderByAggregateInput = {
    id?: SortOrder
    identifier?: SortOrder
    email?: SortOrder
    token?: SortOrder
    newEmail?: SortOrder
    expires?: SortOrder
    createdAt?: SortOrder
  }

  export type VerificationTokenMaxOrderByAggregateInput = {
    id?: SortOrder
    identifier?: SortOrder
    email?: SortOrder
    token?: SortOrder
    newEmail?: SortOrder
    expires?: SortOrder
    createdAt?: SortOrder
  }

  export type VerificationTokenMinOrderByAggregateInput = {
    id?: SortOrder
    identifier?: SortOrder
    email?: SortOrder
    token?: SortOrder
    newEmail?: SortOrder
    expires?: SortOrder
    createdAt?: SortOrder
  }

  export type EnumVerificationIdentifierWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationIdentifier | EnumVerificationIdentifierFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationIdentifier[] | ListEnumVerificationIdentifierFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationIdentifier[] | ListEnumVerificationIdentifierFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationIdentifierWithAggregatesFilter<$PrismaModel> | $Enums.VerificationIdentifier
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumVerificationIdentifierFilter<$PrismaModel>
    _max?: NestedEnumVerificationIdentifierFilter<$PrismaModel>
  }

  export type EnumSubscriptionStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SubscriptionStatus | EnumSubscriptionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SubscriptionStatus[] | ListEnumSubscriptionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SubscriptionStatus[] | ListEnumSubscriptionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSubscriptionStatusFilter<$PrismaModel> | $Enums.SubscriptionStatus
  }

  export type EnumSubscriptionPlanFilter<$PrismaModel = never> = {
    equals?: $Enums.SubscriptionPlan | EnumSubscriptionPlanFieldRefInput<$PrismaModel>
    in?: $Enums.SubscriptionPlan[] | ListEnumSubscriptionPlanFieldRefInput<$PrismaModel>
    notIn?: $Enums.SubscriptionPlan[] | ListEnumSubscriptionPlanFieldRefInput<$PrismaModel>
    not?: NestedEnumSubscriptionPlanFilter<$PrismaModel> | $Enums.SubscriptionPlan
  }

  export type SubscriptionCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    stripeCustomerId?: SortOrder
    stripeSubscriptionId?: SortOrder
    stripePriceId?: SortOrder
    stripeCurrentPeriodStart?: SortOrder
    stripeCurrentPeriodEnd?: SortOrder
    stripeCancelAtPeriodEnd?: SortOrder
    status?: SortOrder
    plan?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SubscriptionMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    stripeCustomerId?: SortOrder
    stripeSubscriptionId?: SortOrder
    stripePriceId?: SortOrder
    stripeCurrentPeriodStart?: SortOrder
    stripeCurrentPeriodEnd?: SortOrder
    stripeCancelAtPeriodEnd?: SortOrder
    status?: SortOrder
    plan?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SubscriptionMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    stripeCustomerId?: SortOrder
    stripeSubscriptionId?: SortOrder
    stripePriceId?: SortOrder
    stripeCurrentPeriodStart?: SortOrder
    stripeCurrentPeriodEnd?: SortOrder
    stripeCancelAtPeriodEnd?: SortOrder
    status?: SortOrder
    plan?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumSubscriptionStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SubscriptionStatus | EnumSubscriptionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SubscriptionStatus[] | ListEnumSubscriptionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SubscriptionStatus[] | ListEnumSubscriptionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSubscriptionStatusWithAggregatesFilter<$PrismaModel> | $Enums.SubscriptionStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSubscriptionStatusFilter<$PrismaModel>
    _max?: NestedEnumSubscriptionStatusFilter<$PrismaModel>
  }

  export type EnumSubscriptionPlanWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SubscriptionPlan | EnumSubscriptionPlanFieldRefInput<$PrismaModel>
    in?: $Enums.SubscriptionPlan[] | ListEnumSubscriptionPlanFieldRefInput<$PrismaModel>
    notIn?: $Enums.SubscriptionPlan[] | ListEnumSubscriptionPlanFieldRefInput<$PrismaModel>
    not?: NestedEnumSubscriptionPlanWithAggregatesFilter<$PrismaModel> | $Enums.SubscriptionPlan
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSubscriptionPlanFilter<$PrismaModel>
    _max?: NestedEnumSubscriptionPlanFilter<$PrismaModel>
  }

  export type EnumUsageFeatureFilter<$PrismaModel = never> = {
    equals?: $Enums.UsageFeature | EnumUsageFeatureFieldRefInput<$PrismaModel>
    in?: $Enums.UsageFeature[] | ListEnumUsageFeatureFieldRefInput<$PrismaModel>
    notIn?: $Enums.UsageFeature[] | ListEnumUsageFeatureFieldRefInput<$PrismaModel>
    not?: NestedEnumUsageFeatureFilter<$PrismaModel> | $Enums.UsageFeature
  }

  export type UsageTrackerUserIdFeaturePeriodStartCompoundUniqueInput = {
    userId: string
    feature: $Enums.UsageFeature
    periodStart: Date | string
  }

  export type UsageTrackerCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    feature?: SortOrder
    count?: SortOrder
    periodStart?: SortOrder
    periodEnd?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UsageTrackerAvgOrderByAggregateInput = {
    count?: SortOrder
  }

  export type UsageTrackerMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    feature?: SortOrder
    count?: SortOrder
    periodStart?: SortOrder
    periodEnd?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UsageTrackerMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    feature?: SortOrder
    count?: SortOrder
    periodStart?: SortOrder
    periodEnd?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type UsageTrackerSumOrderByAggregateInput = {
    count?: SortOrder
  }

  export type EnumUsageFeatureWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UsageFeature | EnumUsageFeatureFieldRefInput<$PrismaModel>
    in?: $Enums.UsageFeature[] | ListEnumUsageFeatureFieldRefInput<$PrismaModel>
    notIn?: $Enums.UsageFeature[] | ListEnumUsageFeatureFieldRefInput<$PrismaModel>
    not?: NestedEnumUsageFeatureWithAggregatesFilter<$PrismaModel> | $Enums.UsageFeature
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUsageFeatureFilter<$PrismaModel>
    _max?: NestedEnumUsageFeatureFilter<$PrismaModel>
  }

  export type BackupCodesCountOrderByAggregateInput = {
    id?: SortOrder
    usedAt?: SortOrder
    code?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
  }

  export type BackupCodesMaxOrderByAggregateInput = {
    id?: SortOrder
    usedAt?: SortOrder
    code?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
  }

  export type BackupCodesMinOrderByAggregateInput = {
    id?: SortOrder
    usedAt?: SortOrder
    code?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
  }

  export type ActivityLogsCountOrderByAggregateInput = {
    id?: SortOrder
  }

  export type ActivityLogsMaxOrderByAggregateInput = {
    id?: SortOrder
  }

  export type ActivityLogsMinOrderByAggregateInput = {
    id?: SortOrder
  }

  export type NotificationSettingCountOrderByAggregateInput = {
    id?: SortOrder
    budgetAlertMail?: SortOrder
    budgetAlertApp?: SortOrder
    billReminderMail?: SortOrder
    billReminderApp?: SortOrder
    weeklyReportMail?: SortOrder
    weeklyReportApp?: SortOrder
    aiInsightsMail?: SortOrder
    aiInsightsApp?: SortOrder
    goalsAlertMail?: SortOrder
    goalsAlertApp?: SortOrder
    splitsAlertMail?: SortOrder
    splitsAlertApp?: SortOrder
    newsLetterAlert?: SortOrder
    communityAlert?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type NotificationSettingMaxOrderByAggregateInput = {
    id?: SortOrder
    budgetAlertMail?: SortOrder
    budgetAlertApp?: SortOrder
    billReminderMail?: SortOrder
    billReminderApp?: SortOrder
    weeklyReportMail?: SortOrder
    weeklyReportApp?: SortOrder
    aiInsightsMail?: SortOrder
    aiInsightsApp?: SortOrder
    goalsAlertMail?: SortOrder
    goalsAlertApp?: SortOrder
    splitsAlertMail?: SortOrder
    splitsAlertApp?: SortOrder
    newsLetterAlert?: SortOrder
    communityAlert?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type NotificationSettingMinOrderByAggregateInput = {
    id?: SortOrder
    budgetAlertMail?: SortOrder
    budgetAlertApp?: SortOrder
    billReminderMail?: SortOrder
    billReminderApp?: SortOrder
    weeklyReportMail?: SortOrder
    weeklyReportApp?: SortOrder
    aiInsightsMail?: SortOrder
    aiInsightsApp?: SortOrder
    goalsAlertMail?: SortOrder
    goalsAlertApp?: SortOrder
    splitsAlertMail?: SortOrder
    splitsAlertApp?: SortOrder
    newsLetterAlert?: SortOrder
    communityAlert?: SortOrder
    userId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type EnumCurrencyFieldUpdateOperationsInput = {
    set?: $Enums.Currency
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type EnumLanguageFieldUpdateOperationsInput = {
    set?: $Enums.Language
  }

  export type AccountCreateNestedManyWithoutUserInput = {
    create?: XOR<AccountCreateWithoutUserInput, AccountUncheckedCreateWithoutUserInput> | AccountCreateWithoutUserInput[] | AccountUncheckedCreateWithoutUserInput[]
    connectOrCreate?: AccountCreateOrConnectWithoutUserInput | AccountCreateOrConnectWithoutUserInput[]
    createMany?: AccountCreateManyUserInputEnvelope
    connect?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
  }

  export type SessionCreateNestedManyWithoutUserInput = {
    create?: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput> | SessionCreateWithoutUserInput[] | SessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutUserInput | SessionCreateOrConnectWithoutUserInput[]
    createMany?: SessionCreateManyUserInputEnvelope
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
  }

  export type SubscriptionCreateNestedOneWithoutUserInput = {
    create?: XOR<SubscriptionCreateWithoutUserInput, SubscriptionUncheckedCreateWithoutUserInput>
    connectOrCreate?: SubscriptionCreateOrConnectWithoutUserInput
    connect?: SubscriptionWhereUniqueInput
  }

  export type UsageTrackerCreateNestedManyWithoutUserInput = {
    create?: XOR<UsageTrackerCreateWithoutUserInput, UsageTrackerUncheckedCreateWithoutUserInput> | UsageTrackerCreateWithoutUserInput[] | UsageTrackerUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UsageTrackerCreateOrConnectWithoutUserInput | UsageTrackerCreateOrConnectWithoutUserInput[]
    createMany?: UsageTrackerCreateManyUserInputEnvelope
    connect?: UsageTrackerWhereUniqueInput | UsageTrackerWhereUniqueInput[]
  }

  export type BackupCodesCreateNestedManyWithoutUserInput = {
    create?: XOR<BackupCodesCreateWithoutUserInput, BackupCodesUncheckedCreateWithoutUserInput> | BackupCodesCreateWithoutUserInput[] | BackupCodesUncheckedCreateWithoutUserInput[]
    connectOrCreate?: BackupCodesCreateOrConnectWithoutUserInput | BackupCodesCreateOrConnectWithoutUserInput[]
    createMany?: BackupCodesCreateManyUserInputEnvelope
    connect?: BackupCodesWhereUniqueInput | BackupCodesWhereUniqueInput[]
  }

  export type LoginActivityCreateNestedManyWithoutUserInput = {
    create?: XOR<LoginActivityCreateWithoutUserInput, LoginActivityUncheckedCreateWithoutUserInput> | LoginActivityCreateWithoutUserInput[] | LoginActivityUncheckedCreateWithoutUserInput[]
    connectOrCreate?: LoginActivityCreateOrConnectWithoutUserInput | LoginActivityCreateOrConnectWithoutUserInput[]
    createMany?: LoginActivityCreateManyUserInputEnvelope
    connect?: LoginActivityWhereUniqueInput | LoginActivityWhereUniqueInput[]
  }

  export type NotificationSettingCreateNestedOneWithoutUserInput = {
    create?: XOR<NotificationSettingCreateWithoutUserInput, NotificationSettingUncheckedCreateWithoutUserInput>
    connectOrCreate?: NotificationSettingCreateOrConnectWithoutUserInput
    connect?: NotificationSettingWhereUniqueInput
  }

  export type AccountUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<AccountCreateWithoutUserInput, AccountUncheckedCreateWithoutUserInput> | AccountCreateWithoutUserInput[] | AccountUncheckedCreateWithoutUserInput[]
    connectOrCreate?: AccountCreateOrConnectWithoutUserInput | AccountCreateOrConnectWithoutUserInput[]
    createMany?: AccountCreateManyUserInputEnvelope
    connect?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
  }

  export type SessionUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput> | SessionCreateWithoutUserInput[] | SessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutUserInput | SessionCreateOrConnectWithoutUserInput[]
    createMany?: SessionCreateManyUserInputEnvelope
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
  }

  export type SubscriptionUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<SubscriptionCreateWithoutUserInput, SubscriptionUncheckedCreateWithoutUserInput>
    connectOrCreate?: SubscriptionCreateOrConnectWithoutUserInput
    connect?: SubscriptionWhereUniqueInput
  }

  export type UsageTrackerUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<UsageTrackerCreateWithoutUserInput, UsageTrackerUncheckedCreateWithoutUserInput> | UsageTrackerCreateWithoutUserInput[] | UsageTrackerUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UsageTrackerCreateOrConnectWithoutUserInput | UsageTrackerCreateOrConnectWithoutUserInput[]
    createMany?: UsageTrackerCreateManyUserInputEnvelope
    connect?: UsageTrackerWhereUniqueInput | UsageTrackerWhereUniqueInput[]
  }

  export type BackupCodesUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<BackupCodesCreateWithoutUserInput, BackupCodesUncheckedCreateWithoutUserInput> | BackupCodesCreateWithoutUserInput[] | BackupCodesUncheckedCreateWithoutUserInput[]
    connectOrCreate?: BackupCodesCreateOrConnectWithoutUserInput | BackupCodesCreateOrConnectWithoutUserInput[]
    createMany?: BackupCodesCreateManyUserInputEnvelope
    connect?: BackupCodesWhereUniqueInput | BackupCodesWhereUniqueInput[]
  }

  export type LoginActivityUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<LoginActivityCreateWithoutUserInput, LoginActivityUncheckedCreateWithoutUserInput> | LoginActivityCreateWithoutUserInput[] | LoginActivityUncheckedCreateWithoutUserInput[]
    connectOrCreate?: LoginActivityCreateOrConnectWithoutUserInput | LoginActivityCreateOrConnectWithoutUserInput[]
    createMany?: LoginActivityCreateManyUserInputEnvelope
    connect?: LoginActivityWhereUniqueInput | LoginActivityWhereUniqueInput[]
  }

  export type NotificationSettingUncheckedCreateNestedOneWithoutUserInput = {
    create?: XOR<NotificationSettingCreateWithoutUserInput, NotificationSettingUncheckedCreateWithoutUserInput>
    connectOrCreate?: NotificationSettingCreateOrConnectWithoutUserInput
    connect?: NotificationSettingWhereUniqueInput
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type EnumDateFormatFieldUpdateOperationsInput = {
    set?: $Enums.DateFormat
  }

  export type AccountUpdateManyWithoutUserNestedInput = {
    create?: XOR<AccountCreateWithoutUserInput, AccountUncheckedCreateWithoutUserInput> | AccountCreateWithoutUserInput[] | AccountUncheckedCreateWithoutUserInput[]
    connectOrCreate?: AccountCreateOrConnectWithoutUserInput | AccountCreateOrConnectWithoutUserInput[]
    upsert?: AccountUpsertWithWhereUniqueWithoutUserInput | AccountUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: AccountCreateManyUserInputEnvelope
    set?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
    disconnect?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
    delete?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
    connect?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
    update?: AccountUpdateWithWhereUniqueWithoutUserInput | AccountUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: AccountUpdateManyWithWhereWithoutUserInput | AccountUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: AccountScalarWhereInput | AccountScalarWhereInput[]
  }

  export type SessionUpdateManyWithoutUserNestedInput = {
    create?: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput> | SessionCreateWithoutUserInput[] | SessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutUserInput | SessionCreateOrConnectWithoutUserInput[]
    upsert?: SessionUpsertWithWhereUniqueWithoutUserInput | SessionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SessionCreateManyUserInputEnvelope
    set?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    disconnect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    delete?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    update?: SessionUpdateWithWhereUniqueWithoutUserInput | SessionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SessionUpdateManyWithWhereWithoutUserInput | SessionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SessionScalarWhereInput | SessionScalarWhereInput[]
  }

  export type SubscriptionUpdateOneWithoutUserNestedInput = {
    create?: XOR<SubscriptionCreateWithoutUserInput, SubscriptionUncheckedCreateWithoutUserInput>
    connectOrCreate?: SubscriptionCreateOrConnectWithoutUserInput
    upsert?: SubscriptionUpsertWithoutUserInput
    disconnect?: SubscriptionWhereInput | boolean
    delete?: SubscriptionWhereInput | boolean
    connect?: SubscriptionWhereUniqueInput
    update?: XOR<XOR<SubscriptionUpdateToOneWithWhereWithoutUserInput, SubscriptionUpdateWithoutUserInput>, SubscriptionUncheckedUpdateWithoutUserInput>
  }

  export type UsageTrackerUpdateManyWithoutUserNestedInput = {
    create?: XOR<UsageTrackerCreateWithoutUserInput, UsageTrackerUncheckedCreateWithoutUserInput> | UsageTrackerCreateWithoutUserInput[] | UsageTrackerUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UsageTrackerCreateOrConnectWithoutUserInput | UsageTrackerCreateOrConnectWithoutUserInput[]
    upsert?: UsageTrackerUpsertWithWhereUniqueWithoutUserInput | UsageTrackerUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: UsageTrackerCreateManyUserInputEnvelope
    set?: UsageTrackerWhereUniqueInput | UsageTrackerWhereUniqueInput[]
    disconnect?: UsageTrackerWhereUniqueInput | UsageTrackerWhereUniqueInput[]
    delete?: UsageTrackerWhereUniqueInput | UsageTrackerWhereUniqueInput[]
    connect?: UsageTrackerWhereUniqueInput | UsageTrackerWhereUniqueInput[]
    update?: UsageTrackerUpdateWithWhereUniqueWithoutUserInput | UsageTrackerUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: UsageTrackerUpdateManyWithWhereWithoutUserInput | UsageTrackerUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: UsageTrackerScalarWhereInput | UsageTrackerScalarWhereInput[]
  }

  export type BackupCodesUpdateManyWithoutUserNestedInput = {
    create?: XOR<BackupCodesCreateWithoutUserInput, BackupCodesUncheckedCreateWithoutUserInput> | BackupCodesCreateWithoutUserInput[] | BackupCodesUncheckedCreateWithoutUserInput[]
    connectOrCreate?: BackupCodesCreateOrConnectWithoutUserInput | BackupCodesCreateOrConnectWithoutUserInput[]
    upsert?: BackupCodesUpsertWithWhereUniqueWithoutUserInput | BackupCodesUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: BackupCodesCreateManyUserInputEnvelope
    set?: BackupCodesWhereUniqueInput | BackupCodesWhereUniqueInput[]
    disconnect?: BackupCodesWhereUniqueInput | BackupCodesWhereUniqueInput[]
    delete?: BackupCodesWhereUniqueInput | BackupCodesWhereUniqueInput[]
    connect?: BackupCodesWhereUniqueInput | BackupCodesWhereUniqueInput[]
    update?: BackupCodesUpdateWithWhereUniqueWithoutUserInput | BackupCodesUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: BackupCodesUpdateManyWithWhereWithoutUserInput | BackupCodesUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: BackupCodesScalarWhereInput | BackupCodesScalarWhereInput[]
  }

  export type LoginActivityUpdateManyWithoutUserNestedInput = {
    create?: XOR<LoginActivityCreateWithoutUserInput, LoginActivityUncheckedCreateWithoutUserInput> | LoginActivityCreateWithoutUserInput[] | LoginActivityUncheckedCreateWithoutUserInput[]
    connectOrCreate?: LoginActivityCreateOrConnectWithoutUserInput | LoginActivityCreateOrConnectWithoutUserInput[]
    upsert?: LoginActivityUpsertWithWhereUniqueWithoutUserInput | LoginActivityUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: LoginActivityCreateManyUserInputEnvelope
    set?: LoginActivityWhereUniqueInput | LoginActivityWhereUniqueInput[]
    disconnect?: LoginActivityWhereUniqueInput | LoginActivityWhereUniqueInput[]
    delete?: LoginActivityWhereUniqueInput | LoginActivityWhereUniqueInput[]
    connect?: LoginActivityWhereUniqueInput | LoginActivityWhereUniqueInput[]
    update?: LoginActivityUpdateWithWhereUniqueWithoutUserInput | LoginActivityUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: LoginActivityUpdateManyWithWhereWithoutUserInput | LoginActivityUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: LoginActivityScalarWhereInput | LoginActivityScalarWhereInput[]
  }

  export type NotificationSettingUpdateOneWithoutUserNestedInput = {
    create?: XOR<NotificationSettingCreateWithoutUserInput, NotificationSettingUncheckedCreateWithoutUserInput>
    connectOrCreate?: NotificationSettingCreateOrConnectWithoutUserInput
    upsert?: NotificationSettingUpsertWithoutUserInput
    disconnect?: NotificationSettingWhereInput | boolean
    delete?: NotificationSettingWhereInput | boolean
    connect?: NotificationSettingWhereUniqueInput
    update?: XOR<XOR<NotificationSettingUpdateToOneWithWhereWithoutUserInput, NotificationSettingUpdateWithoutUserInput>, NotificationSettingUncheckedUpdateWithoutUserInput>
  }

  export type AccountUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<AccountCreateWithoutUserInput, AccountUncheckedCreateWithoutUserInput> | AccountCreateWithoutUserInput[] | AccountUncheckedCreateWithoutUserInput[]
    connectOrCreate?: AccountCreateOrConnectWithoutUserInput | AccountCreateOrConnectWithoutUserInput[]
    upsert?: AccountUpsertWithWhereUniqueWithoutUserInput | AccountUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: AccountCreateManyUserInputEnvelope
    set?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
    disconnect?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
    delete?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
    connect?: AccountWhereUniqueInput | AccountWhereUniqueInput[]
    update?: AccountUpdateWithWhereUniqueWithoutUserInput | AccountUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: AccountUpdateManyWithWhereWithoutUserInput | AccountUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: AccountScalarWhereInput | AccountScalarWhereInput[]
  }

  export type SessionUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput> | SessionCreateWithoutUserInput[] | SessionUncheckedCreateWithoutUserInput[]
    connectOrCreate?: SessionCreateOrConnectWithoutUserInput | SessionCreateOrConnectWithoutUserInput[]
    upsert?: SessionUpsertWithWhereUniqueWithoutUserInput | SessionUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: SessionCreateManyUserInputEnvelope
    set?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    disconnect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    delete?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    connect?: SessionWhereUniqueInput | SessionWhereUniqueInput[]
    update?: SessionUpdateWithWhereUniqueWithoutUserInput | SessionUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: SessionUpdateManyWithWhereWithoutUserInput | SessionUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: SessionScalarWhereInput | SessionScalarWhereInput[]
  }

  export type SubscriptionUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<SubscriptionCreateWithoutUserInput, SubscriptionUncheckedCreateWithoutUserInput>
    connectOrCreate?: SubscriptionCreateOrConnectWithoutUserInput
    upsert?: SubscriptionUpsertWithoutUserInput
    disconnect?: SubscriptionWhereInput | boolean
    delete?: SubscriptionWhereInput | boolean
    connect?: SubscriptionWhereUniqueInput
    update?: XOR<XOR<SubscriptionUpdateToOneWithWhereWithoutUserInput, SubscriptionUpdateWithoutUserInput>, SubscriptionUncheckedUpdateWithoutUserInput>
  }

  export type UsageTrackerUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<UsageTrackerCreateWithoutUserInput, UsageTrackerUncheckedCreateWithoutUserInput> | UsageTrackerCreateWithoutUserInput[] | UsageTrackerUncheckedCreateWithoutUserInput[]
    connectOrCreate?: UsageTrackerCreateOrConnectWithoutUserInput | UsageTrackerCreateOrConnectWithoutUserInput[]
    upsert?: UsageTrackerUpsertWithWhereUniqueWithoutUserInput | UsageTrackerUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: UsageTrackerCreateManyUserInputEnvelope
    set?: UsageTrackerWhereUniqueInput | UsageTrackerWhereUniqueInput[]
    disconnect?: UsageTrackerWhereUniqueInput | UsageTrackerWhereUniqueInput[]
    delete?: UsageTrackerWhereUniqueInput | UsageTrackerWhereUniqueInput[]
    connect?: UsageTrackerWhereUniqueInput | UsageTrackerWhereUniqueInput[]
    update?: UsageTrackerUpdateWithWhereUniqueWithoutUserInput | UsageTrackerUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: UsageTrackerUpdateManyWithWhereWithoutUserInput | UsageTrackerUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: UsageTrackerScalarWhereInput | UsageTrackerScalarWhereInput[]
  }

  export type BackupCodesUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<BackupCodesCreateWithoutUserInput, BackupCodesUncheckedCreateWithoutUserInput> | BackupCodesCreateWithoutUserInput[] | BackupCodesUncheckedCreateWithoutUserInput[]
    connectOrCreate?: BackupCodesCreateOrConnectWithoutUserInput | BackupCodesCreateOrConnectWithoutUserInput[]
    upsert?: BackupCodesUpsertWithWhereUniqueWithoutUserInput | BackupCodesUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: BackupCodesCreateManyUserInputEnvelope
    set?: BackupCodesWhereUniqueInput | BackupCodesWhereUniqueInput[]
    disconnect?: BackupCodesWhereUniqueInput | BackupCodesWhereUniqueInput[]
    delete?: BackupCodesWhereUniqueInput | BackupCodesWhereUniqueInput[]
    connect?: BackupCodesWhereUniqueInput | BackupCodesWhereUniqueInput[]
    update?: BackupCodesUpdateWithWhereUniqueWithoutUserInput | BackupCodesUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: BackupCodesUpdateManyWithWhereWithoutUserInput | BackupCodesUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: BackupCodesScalarWhereInput | BackupCodesScalarWhereInput[]
  }

  export type LoginActivityUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<LoginActivityCreateWithoutUserInput, LoginActivityUncheckedCreateWithoutUserInput> | LoginActivityCreateWithoutUserInput[] | LoginActivityUncheckedCreateWithoutUserInput[]
    connectOrCreate?: LoginActivityCreateOrConnectWithoutUserInput | LoginActivityCreateOrConnectWithoutUserInput[]
    upsert?: LoginActivityUpsertWithWhereUniqueWithoutUserInput | LoginActivityUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: LoginActivityCreateManyUserInputEnvelope
    set?: LoginActivityWhereUniqueInput | LoginActivityWhereUniqueInput[]
    disconnect?: LoginActivityWhereUniqueInput | LoginActivityWhereUniqueInput[]
    delete?: LoginActivityWhereUniqueInput | LoginActivityWhereUniqueInput[]
    connect?: LoginActivityWhereUniqueInput | LoginActivityWhereUniqueInput[]
    update?: LoginActivityUpdateWithWhereUniqueWithoutUserInput | LoginActivityUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: LoginActivityUpdateManyWithWhereWithoutUserInput | LoginActivityUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: LoginActivityScalarWhereInput | LoginActivityScalarWhereInput[]
  }

  export type NotificationSettingUncheckedUpdateOneWithoutUserNestedInput = {
    create?: XOR<NotificationSettingCreateWithoutUserInput, NotificationSettingUncheckedCreateWithoutUserInput>
    connectOrCreate?: NotificationSettingCreateOrConnectWithoutUserInput
    upsert?: NotificationSettingUpsertWithoutUserInput
    disconnect?: NotificationSettingWhereInput | boolean
    delete?: NotificationSettingWhereInput | boolean
    connect?: NotificationSettingWhereUniqueInput
    update?: XOR<XOR<NotificationSettingUpdateToOneWithWhereWithoutUserInput, NotificationSettingUpdateWithoutUserInput>, NotificationSettingUncheckedUpdateWithoutUserInput>
  }

  export type UserCreateNestedOneWithoutAccountsInput = {
    create?: XOR<UserCreateWithoutAccountsInput, UserUncheckedCreateWithoutAccountsInput>
    connectOrCreate?: UserCreateOrConnectWithoutAccountsInput
    connect?: UserWhereUniqueInput
  }

  export type EnumAccountTypeFieldUpdateOperationsInput = {
    set?: $Enums.AccountType
  }

  export type EnumAccountProviderFieldUpdateOperationsInput = {
    set?: $Enums.AccountProvider
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type UserUpdateOneRequiredWithoutAccountsNestedInput = {
    create?: XOR<UserCreateWithoutAccountsInput, UserUncheckedCreateWithoutAccountsInput>
    connectOrCreate?: UserCreateOrConnectWithoutAccountsInput
    upsert?: UserUpsertWithoutAccountsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutAccountsInput, UserUpdateWithoutAccountsInput>, UserUncheckedUpdateWithoutAccountsInput>
  }

  export type UserCreateNestedOneWithoutSessionsInput = {
    create?: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSessionsInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutSessionsNestedInput = {
    create?: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
    connectOrCreate?: UserCreateOrConnectWithoutSessionsInput
    upsert?: UserUpsertWithoutSessionsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSessionsInput, UserUpdateWithoutSessionsInput>, UserUncheckedUpdateWithoutSessionsInput>
  }

  export type UserCreateNestedOneWithoutLoginActivityInput = {
    create?: XOR<UserCreateWithoutLoginActivityInput, UserUncheckedCreateWithoutLoginActivityInput>
    connectOrCreate?: UserCreateOrConnectWithoutLoginActivityInput
    connect?: UserWhereUniqueInput
  }

  export type EnumLoginActivityTypeFieldUpdateOperationsInput = {
    set?: $Enums.LoginActivityType
  }

  export type EnumLoginActivityStatusFieldUpdateOperationsInput = {
    set?: $Enums.LoginActivityStatus
  }

  export type UserUpdateOneRequiredWithoutLoginActivityNestedInput = {
    create?: XOR<UserCreateWithoutLoginActivityInput, UserUncheckedCreateWithoutLoginActivityInput>
    connectOrCreate?: UserCreateOrConnectWithoutLoginActivityInput
    upsert?: UserUpsertWithoutLoginActivityInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutLoginActivityInput, UserUpdateWithoutLoginActivityInput>, UserUncheckedUpdateWithoutLoginActivityInput>
  }

  export type EnumVerificationIdentifierFieldUpdateOperationsInput = {
    set?: $Enums.VerificationIdentifier
  }

  export type UserCreateNestedOneWithoutSubscriptionInput = {
    create?: XOR<UserCreateWithoutSubscriptionInput, UserUncheckedCreateWithoutSubscriptionInput>
    connectOrCreate?: UserCreateOrConnectWithoutSubscriptionInput
    connect?: UserWhereUniqueInput
  }

  export type EnumSubscriptionStatusFieldUpdateOperationsInput = {
    set?: $Enums.SubscriptionStatus
  }

  export type EnumSubscriptionPlanFieldUpdateOperationsInput = {
    set?: $Enums.SubscriptionPlan
  }

  export type UserUpdateOneRequiredWithoutSubscriptionNestedInput = {
    create?: XOR<UserCreateWithoutSubscriptionInput, UserUncheckedCreateWithoutSubscriptionInput>
    connectOrCreate?: UserCreateOrConnectWithoutSubscriptionInput
    upsert?: UserUpsertWithoutSubscriptionInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSubscriptionInput, UserUpdateWithoutSubscriptionInput>, UserUncheckedUpdateWithoutSubscriptionInput>
  }

  export type UserCreateNestedOneWithoutUsageTrackersInput = {
    create?: XOR<UserCreateWithoutUsageTrackersInput, UserUncheckedCreateWithoutUsageTrackersInput>
    connectOrCreate?: UserCreateOrConnectWithoutUsageTrackersInput
    connect?: UserWhereUniqueInput
  }

  export type EnumUsageFeatureFieldUpdateOperationsInput = {
    set?: $Enums.UsageFeature
  }

  export type UserUpdateOneRequiredWithoutUsageTrackersNestedInput = {
    create?: XOR<UserCreateWithoutUsageTrackersInput, UserUncheckedCreateWithoutUsageTrackersInput>
    connectOrCreate?: UserCreateOrConnectWithoutUsageTrackersInput
    upsert?: UserUpsertWithoutUsageTrackersInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutUsageTrackersInput, UserUpdateWithoutUsageTrackersInput>, UserUncheckedUpdateWithoutUsageTrackersInput>
  }

  export type UserCreateNestedOneWithoutBackupCodesInput = {
    create?: XOR<UserCreateWithoutBackupCodesInput, UserUncheckedCreateWithoutBackupCodesInput>
    connectOrCreate?: UserCreateOrConnectWithoutBackupCodesInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutBackupCodesNestedInput = {
    create?: XOR<UserCreateWithoutBackupCodesInput, UserUncheckedCreateWithoutBackupCodesInput>
    connectOrCreate?: UserCreateOrConnectWithoutBackupCodesInput
    upsert?: UserUpsertWithoutBackupCodesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutBackupCodesInput, UserUpdateWithoutBackupCodesInput>, UserUncheckedUpdateWithoutBackupCodesInput>
  }

  export type UserCreateNestedOneWithoutSettingInput = {
    create?: XOR<UserCreateWithoutSettingInput, UserUncheckedCreateWithoutSettingInput>
    connectOrCreate?: UserCreateOrConnectWithoutSettingInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutSettingNestedInput = {
    create?: XOR<UserCreateWithoutSettingInput, UserUncheckedCreateWithoutSettingInput>
    connectOrCreate?: UserCreateOrConnectWithoutSettingInput
    upsert?: UserUpsertWithoutSettingInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutSettingInput, UserUpdateWithoutSettingInput>, UserUncheckedUpdateWithoutSettingInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedEnumCurrencyFilter<$PrismaModel = never> = {
    equals?: $Enums.Currency | EnumCurrencyFieldRefInput<$PrismaModel>
    in?: $Enums.Currency[] | ListEnumCurrencyFieldRefInput<$PrismaModel>
    notIn?: $Enums.Currency[] | ListEnumCurrencyFieldRefInput<$PrismaModel>
    not?: NestedEnumCurrencyFilter<$PrismaModel> | $Enums.Currency
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedEnumCurrencyWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Currency | EnumCurrencyFieldRefInput<$PrismaModel>
    in?: $Enums.Currency[] | ListEnumCurrencyFieldRefInput<$PrismaModel>
    notIn?: $Enums.Currency[] | ListEnumCurrencyFieldRefInput<$PrismaModel>
    not?: NestedEnumCurrencyWithAggregatesFilter<$PrismaModel> | $Enums.Currency
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCurrencyFilter<$PrismaModel>
    _max?: NestedEnumCurrencyFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumLanguageFilter<$PrismaModel = never> = {
    equals?: $Enums.Language | EnumLanguageFieldRefInput<$PrismaModel>
    in?: $Enums.Language[] | ListEnumLanguageFieldRefInput<$PrismaModel>
    notIn?: $Enums.Language[] | ListEnumLanguageFieldRefInput<$PrismaModel>
    not?: NestedEnumLanguageFilter<$PrismaModel> | $Enums.Language
  }

  export type NestedEnumLanguageWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Language | EnumLanguageFieldRefInput<$PrismaModel>
    in?: $Enums.Language[] | ListEnumLanguageFieldRefInput<$PrismaModel>
    notIn?: $Enums.Language[] | ListEnumLanguageFieldRefInput<$PrismaModel>
    not?: NestedEnumLanguageWithAggregatesFilter<$PrismaModel> | $Enums.Language
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumLanguageFilter<$PrismaModel>
    _max?: NestedEnumLanguageFilter<$PrismaModel>
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedEnumDateFormatFilter<$PrismaModel = never> = {
    equals?: $Enums.DateFormat | EnumDateFormatFieldRefInput<$PrismaModel>
    in?: $Enums.DateFormat[] | ListEnumDateFormatFieldRefInput<$PrismaModel>
    notIn?: $Enums.DateFormat[] | ListEnumDateFormatFieldRefInput<$PrismaModel>
    not?: NestedEnumDateFormatFilter<$PrismaModel> | $Enums.DateFormat
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedEnumDateFormatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.DateFormat | EnumDateFormatFieldRefInput<$PrismaModel>
    in?: $Enums.DateFormat[] | ListEnumDateFormatFieldRefInput<$PrismaModel>
    notIn?: $Enums.DateFormat[] | ListEnumDateFormatFieldRefInput<$PrismaModel>
    not?: NestedEnumDateFormatWithAggregatesFilter<$PrismaModel> | $Enums.DateFormat
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumDateFormatFilter<$PrismaModel>
    _max?: NestedEnumDateFormatFilter<$PrismaModel>
  }

  export type NestedEnumAccountTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.AccountType | EnumAccountTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AccountType[] | ListEnumAccountTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.AccountType[] | ListEnumAccountTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumAccountTypeFilter<$PrismaModel> | $Enums.AccountType
  }

  export type NestedEnumAccountProviderFilter<$PrismaModel = never> = {
    equals?: $Enums.AccountProvider | EnumAccountProviderFieldRefInput<$PrismaModel>
    in?: $Enums.AccountProvider[] | ListEnumAccountProviderFieldRefInput<$PrismaModel>
    notIn?: $Enums.AccountProvider[] | ListEnumAccountProviderFieldRefInput<$PrismaModel>
    not?: NestedEnumAccountProviderFilter<$PrismaModel> | $Enums.AccountProvider
  }

  export type NestedEnumAccountTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AccountType | EnumAccountTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AccountType[] | ListEnumAccountTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.AccountType[] | ListEnumAccountTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumAccountTypeWithAggregatesFilter<$PrismaModel> | $Enums.AccountType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAccountTypeFilter<$PrismaModel>
    _max?: NestedEnumAccountTypeFilter<$PrismaModel>
  }

  export type NestedEnumAccountProviderWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AccountProvider | EnumAccountProviderFieldRefInput<$PrismaModel>
    in?: $Enums.AccountProvider[] | ListEnumAccountProviderFieldRefInput<$PrismaModel>
    notIn?: $Enums.AccountProvider[] | ListEnumAccountProviderFieldRefInput<$PrismaModel>
    not?: NestedEnumAccountProviderWithAggregatesFilter<$PrismaModel> | $Enums.AccountProvider
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAccountProviderFilter<$PrismaModel>
    _max?: NestedEnumAccountProviderFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumLoginActivityTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.LoginActivityType | EnumLoginActivityTypeFieldRefInput<$PrismaModel>
    in?: $Enums.LoginActivityType[] | ListEnumLoginActivityTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.LoginActivityType[] | ListEnumLoginActivityTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumLoginActivityTypeFilter<$PrismaModel> | $Enums.LoginActivityType
  }

  export type NestedEnumLoginActivityStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.LoginActivityStatus | EnumLoginActivityStatusFieldRefInput<$PrismaModel>
    in?: $Enums.LoginActivityStatus[] | ListEnumLoginActivityStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.LoginActivityStatus[] | ListEnumLoginActivityStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumLoginActivityStatusFilter<$PrismaModel> | $Enums.LoginActivityStatus
  }

  export type NestedEnumLoginActivityTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.LoginActivityType | EnumLoginActivityTypeFieldRefInput<$PrismaModel>
    in?: $Enums.LoginActivityType[] | ListEnumLoginActivityTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.LoginActivityType[] | ListEnumLoginActivityTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumLoginActivityTypeWithAggregatesFilter<$PrismaModel> | $Enums.LoginActivityType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumLoginActivityTypeFilter<$PrismaModel>
    _max?: NestedEnumLoginActivityTypeFilter<$PrismaModel>
  }

  export type NestedEnumLoginActivityStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.LoginActivityStatus | EnumLoginActivityStatusFieldRefInput<$PrismaModel>
    in?: $Enums.LoginActivityStatus[] | ListEnumLoginActivityStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.LoginActivityStatus[] | ListEnumLoginActivityStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumLoginActivityStatusWithAggregatesFilter<$PrismaModel> | $Enums.LoginActivityStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumLoginActivityStatusFilter<$PrismaModel>
    _max?: NestedEnumLoginActivityStatusFilter<$PrismaModel>
  }

  export type NestedEnumVerificationIdentifierFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationIdentifier | EnumVerificationIdentifierFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationIdentifier[] | ListEnumVerificationIdentifierFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationIdentifier[] | ListEnumVerificationIdentifierFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationIdentifierFilter<$PrismaModel> | $Enums.VerificationIdentifier
  }

  export type NestedEnumVerificationIdentifierWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.VerificationIdentifier | EnumVerificationIdentifierFieldRefInput<$PrismaModel>
    in?: $Enums.VerificationIdentifier[] | ListEnumVerificationIdentifierFieldRefInput<$PrismaModel>
    notIn?: $Enums.VerificationIdentifier[] | ListEnumVerificationIdentifierFieldRefInput<$PrismaModel>
    not?: NestedEnumVerificationIdentifierWithAggregatesFilter<$PrismaModel> | $Enums.VerificationIdentifier
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumVerificationIdentifierFilter<$PrismaModel>
    _max?: NestedEnumVerificationIdentifierFilter<$PrismaModel>
  }

  export type NestedEnumSubscriptionStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.SubscriptionStatus | EnumSubscriptionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SubscriptionStatus[] | ListEnumSubscriptionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SubscriptionStatus[] | ListEnumSubscriptionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSubscriptionStatusFilter<$PrismaModel> | $Enums.SubscriptionStatus
  }

  export type NestedEnumSubscriptionPlanFilter<$PrismaModel = never> = {
    equals?: $Enums.SubscriptionPlan | EnumSubscriptionPlanFieldRefInput<$PrismaModel>
    in?: $Enums.SubscriptionPlan[] | ListEnumSubscriptionPlanFieldRefInput<$PrismaModel>
    notIn?: $Enums.SubscriptionPlan[] | ListEnumSubscriptionPlanFieldRefInput<$PrismaModel>
    not?: NestedEnumSubscriptionPlanFilter<$PrismaModel> | $Enums.SubscriptionPlan
  }

  export type NestedEnumSubscriptionStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SubscriptionStatus | EnumSubscriptionStatusFieldRefInput<$PrismaModel>
    in?: $Enums.SubscriptionStatus[] | ListEnumSubscriptionStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.SubscriptionStatus[] | ListEnumSubscriptionStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumSubscriptionStatusWithAggregatesFilter<$PrismaModel> | $Enums.SubscriptionStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSubscriptionStatusFilter<$PrismaModel>
    _max?: NestedEnumSubscriptionStatusFilter<$PrismaModel>
  }

  export type NestedEnumSubscriptionPlanWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.SubscriptionPlan | EnumSubscriptionPlanFieldRefInput<$PrismaModel>
    in?: $Enums.SubscriptionPlan[] | ListEnumSubscriptionPlanFieldRefInput<$PrismaModel>
    notIn?: $Enums.SubscriptionPlan[] | ListEnumSubscriptionPlanFieldRefInput<$PrismaModel>
    not?: NestedEnumSubscriptionPlanWithAggregatesFilter<$PrismaModel> | $Enums.SubscriptionPlan
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumSubscriptionPlanFilter<$PrismaModel>
    _max?: NestedEnumSubscriptionPlanFilter<$PrismaModel>
  }

  export type NestedEnumUsageFeatureFilter<$PrismaModel = never> = {
    equals?: $Enums.UsageFeature | EnumUsageFeatureFieldRefInput<$PrismaModel>
    in?: $Enums.UsageFeature[] | ListEnumUsageFeatureFieldRefInput<$PrismaModel>
    notIn?: $Enums.UsageFeature[] | ListEnumUsageFeatureFieldRefInput<$PrismaModel>
    not?: NestedEnumUsageFeatureFilter<$PrismaModel> | $Enums.UsageFeature
  }

  export type NestedEnumUsageFeatureWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UsageFeature | EnumUsageFeatureFieldRefInput<$PrismaModel>
    in?: $Enums.UsageFeature[] | ListEnumUsageFeatureFieldRefInput<$PrismaModel>
    notIn?: $Enums.UsageFeature[] | ListEnumUsageFeatureFieldRefInput<$PrismaModel>
    not?: NestedEnumUsageFeatureWithAggregatesFilter<$PrismaModel> | $Enums.UsageFeature
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUsageFeatureFilter<$PrismaModel>
    _max?: NestedEnumUsageFeatureFilter<$PrismaModel>
  }

  export type AccountCreateWithoutUserInput = {
    id?: string
    type: $Enums.AccountType
    provider: $Enums.AccountProvider
    providerAccountId: string
    refreshToken?: string | null
    accessToken?: string | null
    expiresAt?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AccountUncheckedCreateWithoutUserInput = {
    id?: string
    type: $Enums.AccountType
    provider: $Enums.AccountProvider
    providerAccountId: string
    refreshToken?: string | null
    accessToken?: string | null
    expiresAt?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type AccountCreateOrConnectWithoutUserInput = {
    where: AccountWhereUniqueInput
    create: XOR<AccountCreateWithoutUserInput, AccountUncheckedCreateWithoutUserInput>
  }

  export type AccountCreateManyUserInputEnvelope = {
    data: AccountCreateManyUserInput | AccountCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type SessionCreateWithoutUserInput = {
    id?: string
    sessionToken: string
    expires: Date | string
    deviceId: string
    userAgent?: string | null
    ipAddress?: string | null
    location?: string | null
    lastUsedAt?: Date | string
    createdAt?: Date | string
  }

  export type SessionUncheckedCreateWithoutUserInput = {
    id?: string
    sessionToken: string
    expires: Date | string
    deviceId: string
    userAgent?: string | null
    ipAddress?: string | null
    location?: string | null
    lastUsedAt?: Date | string
    createdAt?: Date | string
  }

  export type SessionCreateOrConnectWithoutUserInput = {
    where: SessionWhereUniqueInput
    create: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput>
  }

  export type SessionCreateManyUserInputEnvelope = {
    data: SessionCreateManyUserInput | SessionCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type SubscriptionCreateWithoutUserInput = {
    id?: string
    stripeCustomerId?: string | null
    stripeSubscriptionId?: string | null
    stripePriceId?: string | null
    stripeCurrentPeriodStart?: Date | string | null
    stripeCurrentPeriodEnd?: Date | string | null
    stripeCancelAtPeriodEnd?: boolean
    status?: $Enums.SubscriptionStatus
    plan?: $Enums.SubscriptionPlan
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SubscriptionUncheckedCreateWithoutUserInput = {
    id?: string
    stripeCustomerId?: string | null
    stripeSubscriptionId?: string | null
    stripePriceId?: string | null
    stripeCurrentPeriodStart?: Date | string | null
    stripeCurrentPeriodEnd?: Date | string | null
    stripeCancelAtPeriodEnd?: boolean
    status?: $Enums.SubscriptionStatus
    plan?: $Enums.SubscriptionPlan
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SubscriptionCreateOrConnectWithoutUserInput = {
    where: SubscriptionWhereUniqueInput
    create: XOR<SubscriptionCreateWithoutUserInput, SubscriptionUncheckedCreateWithoutUserInput>
  }

  export type UsageTrackerCreateWithoutUserInput = {
    id?: string
    feature: $Enums.UsageFeature
    count?: number
    periodStart: Date | string
    periodEnd: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UsageTrackerUncheckedCreateWithoutUserInput = {
    id?: string
    feature: $Enums.UsageFeature
    count?: number
    periodStart: Date | string
    periodEnd: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type UsageTrackerCreateOrConnectWithoutUserInput = {
    where: UsageTrackerWhereUniqueInput
    create: XOR<UsageTrackerCreateWithoutUserInput, UsageTrackerUncheckedCreateWithoutUserInput>
  }

  export type UsageTrackerCreateManyUserInputEnvelope = {
    data: UsageTrackerCreateManyUserInput | UsageTrackerCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type BackupCodesCreateWithoutUserInput = {
    id?: string
    usedAt?: Date | string | null
    code: string
    createdAt?: Date | string
  }

  export type BackupCodesUncheckedCreateWithoutUserInput = {
    id?: string
    usedAt?: Date | string | null
    code: string
    createdAt?: Date | string
  }

  export type BackupCodesCreateOrConnectWithoutUserInput = {
    where: BackupCodesWhereUniqueInput
    create: XOR<BackupCodesCreateWithoutUserInput, BackupCodesUncheckedCreateWithoutUserInput>
  }

  export type BackupCodesCreateManyUserInputEnvelope = {
    data: BackupCodesCreateManyUserInput | BackupCodesCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type LoginActivityCreateWithoutUserInput = {
    id?: string
    type: $Enums.LoginActivityType
    status: $Enums.LoginActivityStatus
    deviceId: string
    userAgent?: string | null
    ipAddress?: string | null
    location?: string | null
    createdAt?: Date | string
  }

  export type LoginActivityUncheckedCreateWithoutUserInput = {
    id?: string
    type: $Enums.LoginActivityType
    status: $Enums.LoginActivityStatus
    deviceId: string
    userAgent?: string | null
    ipAddress?: string | null
    location?: string | null
    createdAt?: Date | string
  }

  export type LoginActivityCreateOrConnectWithoutUserInput = {
    where: LoginActivityWhereUniqueInput
    create: XOR<LoginActivityCreateWithoutUserInput, LoginActivityUncheckedCreateWithoutUserInput>
  }

  export type LoginActivityCreateManyUserInputEnvelope = {
    data: LoginActivityCreateManyUserInput | LoginActivityCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type NotificationSettingCreateWithoutUserInput = {
    id?: string
    budgetAlertMail?: boolean
    budgetAlertApp?: boolean
    billReminderMail?: boolean
    billReminderApp?: boolean
    weeklyReportMail?: boolean
    weeklyReportApp?: boolean
    aiInsightsMail?: boolean
    aiInsightsApp?: boolean
    goalsAlertMail?: boolean
    goalsAlertApp?: boolean
    splitsAlertMail?: boolean
    splitsAlertApp?: boolean
    newsLetterAlert?: boolean
    communityAlert?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type NotificationSettingUncheckedCreateWithoutUserInput = {
    id?: string
    budgetAlertMail?: boolean
    budgetAlertApp?: boolean
    billReminderMail?: boolean
    billReminderApp?: boolean
    weeklyReportMail?: boolean
    weeklyReportApp?: boolean
    aiInsightsMail?: boolean
    aiInsightsApp?: boolean
    goalsAlertMail?: boolean
    goalsAlertApp?: boolean
    splitsAlertMail?: boolean
    splitsAlertApp?: boolean
    newsLetterAlert?: boolean
    communityAlert?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type NotificationSettingCreateOrConnectWithoutUserInput = {
    where: NotificationSettingWhereUniqueInput
    create: XOR<NotificationSettingCreateWithoutUserInput, NotificationSettingUncheckedCreateWithoutUserInput>
  }

  export type AccountUpsertWithWhereUniqueWithoutUserInput = {
    where: AccountWhereUniqueInput
    update: XOR<AccountUpdateWithoutUserInput, AccountUncheckedUpdateWithoutUserInput>
    create: XOR<AccountCreateWithoutUserInput, AccountUncheckedCreateWithoutUserInput>
  }

  export type AccountUpdateWithWhereUniqueWithoutUserInput = {
    where: AccountWhereUniqueInput
    data: XOR<AccountUpdateWithoutUserInput, AccountUncheckedUpdateWithoutUserInput>
  }

  export type AccountUpdateManyWithWhereWithoutUserInput = {
    where: AccountScalarWhereInput
    data: XOR<AccountUpdateManyMutationInput, AccountUncheckedUpdateManyWithoutUserInput>
  }

  export type AccountScalarWhereInput = {
    AND?: AccountScalarWhereInput | AccountScalarWhereInput[]
    OR?: AccountScalarWhereInput[]
    NOT?: AccountScalarWhereInput | AccountScalarWhereInput[]
    id?: StringFilter<"Account"> | string
    userId?: StringFilter<"Account"> | string
    type?: EnumAccountTypeFilter<"Account"> | $Enums.AccountType
    provider?: EnumAccountProviderFilter<"Account"> | $Enums.AccountProvider
    providerAccountId?: StringFilter<"Account"> | string
    refreshToken?: StringNullableFilter<"Account"> | string | null
    accessToken?: StringNullableFilter<"Account"> | string | null
    expiresAt?: IntNullableFilter<"Account"> | number | null
    createdAt?: DateTimeFilter<"Account"> | Date | string
    updatedAt?: DateTimeFilter<"Account"> | Date | string
  }

  export type SessionUpsertWithWhereUniqueWithoutUserInput = {
    where: SessionWhereUniqueInput
    update: XOR<SessionUpdateWithoutUserInput, SessionUncheckedUpdateWithoutUserInput>
    create: XOR<SessionCreateWithoutUserInput, SessionUncheckedCreateWithoutUserInput>
  }

  export type SessionUpdateWithWhereUniqueWithoutUserInput = {
    where: SessionWhereUniqueInput
    data: XOR<SessionUpdateWithoutUserInput, SessionUncheckedUpdateWithoutUserInput>
  }

  export type SessionUpdateManyWithWhereWithoutUserInput = {
    where: SessionScalarWhereInput
    data: XOR<SessionUpdateManyMutationInput, SessionUncheckedUpdateManyWithoutUserInput>
  }

  export type SessionScalarWhereInput = {
    AND?: SessionScalarWhereInput | SessionScalarWhereInput[]
    OR?: SessionScalarWhereInput[]
    NOT?: SessionScalarWhereInput | SessionScalarWhereInput[]
    id?: StringFilter<"Session"> | string
    sessionToken?: StringFilter<"Session"> | string
    userId?: StringFilter<"Session"> | string
    expires?: DateTimeFilter<"Session"> | Date | string
    deviceId?: StringFilter<"Session"> | string
    userAgent?: StringNullableFilter<"Session"> | string | null
    ipAddress?: StringNullableFilter<"Session"> | string | null
    location?: StringNullableFilter<"Session"> | string | null
    lastUsedAt?: DateTimeFilter<"Session"> | Date | string
    createdAt?: DateTimeFilter<"Session"> | Date | string
  }

  export type SubscriptionUpsertWithoutUserInput = {
    update: XOR<SubscriptionUpdateWithoutUserInput, SubscriptionUncheckedUpdateWithoutUserInput>
    create: XOR<SubscriptionCreateWithoutUserInput, SubscriptionUncheckedCreateWithoutUserInput>
    where?: SubscriptionWhereInput
  }

  export type SubscriptionUpdateToOneWithWhereWithoutUserInput = {
    where?: SubscriptionWhereInput
    data: XOR<SubscriptionUpdateWithoutUserInput, SubscriptionUncheckedUpdateWithoutUserInput>
  }

  export type SubscriptionUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    stripeCustomerId?: NullableStringFieldUpdateOperationsInput | string | null
    stripeSubscriptionId?: NullableStringFieldUpdateOperationsInput | string | null
    stripePriceId?: NullableStringFieldUpdateOperationsInput | string | null
    stripeCurrentPeriodStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeCurrentPeriodEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeCancelAtPeriodEnd?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumSubscriptionStatusFieldUpdateOperationsInput | $Enums.SubscriptionStatus
    plan?: EnumSubscriptionPlanFieldUpdateOperationsInput | $Enums.SubscriptionPlan
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubscriptionUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    stripeCustomerId?: NullableStringFieldUpdateOperationsInput | string | null
    stripeSubscriptionId?: NullableStringFieldUpdateOperationsInput | string | null
    stripePriceId?: NullableStringFieldUpdateOperationsInput | string | null
    stripeCurrentPeriodStart?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeCurrentPeriodEnd?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    stripeCancelAtPeriodEnd?: BoolFieldUpdateOperationsInput | boolean
    status?: EnumSubscriptionStatusFieldUpdateOperationsInput | $Enums.SubscriptionStatus
    plan?: EnumSubscriptionPlanFieldUpdateOperationsInput | $Enums.SubscriptionPlan
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UsageTrackerUpsertWithWhereUniqueWithoutUserInput = {
    where: UsageTrackerWhereUniqueInput
    update: XOR<UsageTrackerUpdateWithoutUserInput, UsageTrackerUncheckedUpdateWithoutUserInput>
    create: XOR<UsageTrackerCreateWithoutUserInput, UsageTrackerUncheckedCreateWithoutUserInput>
  }

  export type UsageTrackerUpdateWithWhereUniqueWithoutUserInput = {
    where: UsageTrackerWhereUniqueInput
    data: XOR<UsageTrackerUpdateWithoutUserInput, UsageTrackerUncheckedUpdateWithoutUserInput>
  }

  export type UsageTrackerUpdateManyWithWhereWithoutUserInput = {
    where: UsageTrackerScalarWhereInput
    data: XOR<UsageTrackerUpdateManyMutationInput, UsageTrackerUncheckedUpdateManyWithoutUserInput>
  }

  export type UsageTrackerScalarWhereInput = {
    AND?: UsageTrackerScalarWhereInput | UsageTrackerScalarWhereInput[]
    OR?: UsageTrackerScalarWhereInput[]
    NOT?: UsageTrackerScalarWhereInput | UsageTrackerScalarWhereInput[]
    id?: StringFilter<"UsageTracker"> | string
    userId?: StringFilter<"UsageTracker"> | string
    feature?: EnumUsageFeatureFilter<"UsageTracker"> | $Enums.UsageFeature
    count?: IntFilter<"UsageTracker"> | number
    periodStart?: DateTimeFilter<"UsageTracker"> | Date | string
    periodEnd?: DateTimeFilter<"UsageTracker"> | Date | string
    createdAt?: DateTimeFilter<"UsageTracker"> | Date | string
    updatedAt?: DateTimeFilter<"UsageTracker"> | Date | string
  }

  export type BackupCodesUpsertWithWhereUniqueWithoutUserInput = {
    where: BackupCodesWhereUniqueInput
    update: XOR<BackupCodesUpdateWithoutUserInput, BackupCodesUncheckedUpdateWithoutUserInput>
    create: XOR<BackupCodesCreateWithoutUserInput, BackupCodesUncheckedCreateWithoutUserInput>
  }

  export type BackupCodesUpdateWithWhereUniqueWithoutUserInput = {
    where: BackupCodesWhereUniqueInput
    data: XOR<BackupCodesUpdateWithoutUserInput, BackupCodesUncheckedUpdateWithoutUserInput>
  }

  export type BackupCodesUpdateManyWithWhereWithoutUserInput = {
    where: BackupCodesScalarWhereInput
    data: XOR<BackupCodesUpdateManyMutationInput, BackupCodesUncheckedUpdateManyWithoutUserInput>
  }

  export type BackupCodesScalarWhereInput = {
    AND?: BackupCodesScalarWhereInput | BackupCodesScalarWhereInput[]
    OR?: BackupCodesScalarWhereInput[]
    NOT?: BackupCodesScalarWhereInput | BackupCodesScalarWhereInput[]
    id?: StringFilter<"BackupCodes"> | string
    usedAt?: DateTimeNullableFilter<"BackupCodes"> | Date | string | null
    code?: StringFilter<"BackupCodes"> | string
    userId?: StringFilter<"BackupCodes"> | string
    createdAt?: DateTimeFilter<"BackupCodes"> | Date | string
  }

  export type LoginActivityUpsertWithWhereUniqueWithoutUserInput = {
    where: LoginActivityWhereUniqueInput
    update: XOR<LoginActivityUpdateWithoutUserInput, LoginActivityUncheckedUpdateWithoutUserInput>
    create: XOR<LoginActivityCreateWithoutUserInput, LoginActivityUncheckedCreateWithoutUserInput>
  }

  export type LoginActivityUpdateWithWhereUniqueWithoutUserInput = {
    where: LoginActivityWhereUniqueInput
    data: XOR<LoginActivityUpdateWithoutUserInput, LoginActivityUncheckedUpdateWithoutUserInput>
  }

  export type LoginActivityUpdateManyWithWhereWithoutUserInput = {
    where: LoginActivityScalarWhereInput
    data: XOR<LoginActivityUpdateManyMutationInput, LoginActivityUncheckedUpdateManyWithoutUserInput>
  }

  export type LoginActivityScalarWhereInput = {
    AND?: LoginActivityScalarWhereInput | LoginActivityScalarWhereInput[]
    OR?: LoginActivityScalarWhereInput[]
    NOT?: LoginActivityScalarWhereInput | LoginActivityScalarWhereInput[]
    id?: StringFilter<"LoginActivity"> | string
    type?: EnumLoginActivityTypeFilter<"LoginActivity"> | $Enums.LoginActivityType
    status?: EnumLoginActivityStatusFilter<"LoginActivity"> | $Enums.LoginActivityStatus
    deviceId?: StringFilter<"LoginActivity"> | string
    userAgent?: StringNullableFilter<"LoginActivity"> | string | null
    ipAddress?: StringNullableFilter<"LoginActivity"> | string | null
    location?: StringNullableFilter<"LoginActivity"> | string | null
    userId?: StringFilter<"LoginActivity"> | string
    createdAt?: DateTimeFilter<"LoginActivity"> | Date | string
  }

  export type NotificationSettingUpsertWithoutUserInput = {
    update: XOR<NotificationSettingUpdateWithoutUserInput, NotificationSettingUncheckedUpdateWithoutUserInput>
    create: XOR<NotificationSettingCreateWithoutUserInput, NotificationSettingUncheckedCreateWithoutUserInput>
    where?: NotificationSettingWhereInput
  }

  export type NotificationSettingUpdateToOneWithWhereWithoutUserInput = {
    where?: NotificationSettingWhereInput
    data: XOR<NotificationSettingUpdateWithoutUserInput, NotificationSettingUncheckedUpdateWithoutUserInput>
  }

  export type NotificationSettingUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    budgetAlertMail?: BoolFieldUpdateOperationsInput | boolean
    budgetAlertApp?: BoolFieldUpdateOperationsInput | boolean
    billReminderMail?: BoolFieldUpdateOperationsInput | boolean
    billReminderApp?: BoolFieldUpdateOperationsInput | boolean
    weeklyReportMail?: BoolFieldUpdateOperationsInput | boolean
    weeklyReportApp?: BoolFieldUpdateOperationsInput | boolean
    aiInsightsMail?: BoolFieldUpdateOperationsInput | boolean
    aiInsightsApp?: BoolFieldUpdateOperationsInput | boolean
    goalsAlertMail?: BoolFieldUpdateOperationsInput | boolean
    goalsAlertApp?: BoolFieldUpdateOperationsInput | boolean
    splitsAlertMail?: BoolFieldUpdateOperationsInput | boolean
    splitsAlertApp?: BoolFieldUpdateOperationsInput | boolean
    newsLetterAlert?: BoolFieldUpdateOperationsInput | boolean
    communityAlert?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationSettingUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    budgetAlertMail?: BoolFieldUpdateOperationsInput | boolean
    budgetAlertApp?: BoolFieldUpdateOperationsInput | boolean
    billReminderMail?: BoolFieldUpdateOperationsInput | boolean
    billReminderApp?: BoolFieldUpdateOperationsInput | boolean
    weeklyReportMail?: BoolFieldUpdateOperationsInput | boolean
    weeklyReportApp?: BoolFieldUpdateOperationsInput | boolean
    aiInsightsMail?: BoolFieldUpdateOperationsInput | boolean
    aiInsightsApp?: BoolFieldUpdateOperationsInput | boolean
    goalsAlertMail?: BoolFieldUpdateOperationsInput | boolean
    goalsAlertApp?: BoolFieldUpdateOperationsInput | boolean
    splitsAlertMail?: BoolFieldUpdateOperationsInput | boolean
    splitsAlertApp?: BoolFieldUpdateOperationsInput | boolean
    newsLetterAlert?: BoolFieldUpdateOperationsInput | boolean
    communityAlert?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserCreateWithoutAccountsInput = {
    id?: string
    email: string
    password?: string | null
    loginAttempts?: number
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    firstName: string
    lastName: string
    avatar?: string | null
    lastLoginAt?: Date | string | null
    twoFactorAttempts?: number
    twoFactorEnabled?: boolean
    twoFactorSecret?: string | null
    twoFactorLastUsedAt?: Date | string | null
    currency?: $Enums.Currency
    language?: $Enums.Language
    timezone?: string
    dateFormat?: $Enums.DateFormat
    scheduledDeletionAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    sessions?: SessionCreateNestedManyWithoutUserInput
    subscription?: SubscriptionCreateNestedOneWithoutUserInput
    usageTrackers?: UsageTrackerCreateNestedManyWithoutUserInput
    backupCodes?: BackupCodesCreateNestedManyWithoutUserInput
    loginActivity?: LoginActivityCreateNestedManyWithoutUserInput
    setting?: NotificationSettingCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutAccountsInput = {
    id?: string
    email: string
    password?: string | null
    loginAttempts?: number
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    firstName: string
    lastName: string
    avatar?: string | null
    lastLoginAt?: Date | string | null
    twoFactorAttempts?: number
    twoFactorEnabled?: boolean
    twoFactorSecret?: string | null
    twoFactorLastUsedAt?: Date | string | null
    currency?: $Enums.Currency
    language?: $Enums.Language
    timezone?: string
    dateFormat?: $Enums.DateFormat
    scheduledDeletionAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
    subscription?: SubscriptionUncheckedCreateNestedOneWithoutUserInput
    usageTrackers?: UsageTrackerUncheckedCreateNestedManyWithoutUserInput
    backupCodes?: BackupCodesUncheckedCreateNestedManyWithoutUserInput
    loginActivity?: LoginActivityUncheckedCreateNestedManyWithoutUserInput
    setting?: NotificationSettingUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutAccountsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutAccountsInput, UserUncheckedCreateWithoutAccountsInput>
  }

  export type UserUpsertWithoutAccountsInput = {
    update: XOR<UserUpdateWithoutAccountsInput, UserUncheckedUpdateWithoutAccountsInput>
    create: XOR<UserCreateWithoutAccountsInput, UserUncheckedCreateWithoutAccountsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutAccountsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutAccountsInput, UserUncheckedUpdateWithoutAccountsInput>
  }

  export type UserUpdateWithoutAccountsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    loginAttempts?: IntFieldUpdateOperationsInput | number
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    twoFactorAttempts?: IntFieldUpdateOperationsInput | number
    twoFactorEnabled?: BoolFieldUpdateOperationsInput | boolean
    twoFactorSecret?: NullableStringFieldUpdateOperationsInput | string | null
    twoFactorLastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    language?: EnumLanguageFieldUpdateOperationsInput | $Enums.Language
    timezone?: StringFieldUpdateOperationsInput | string
    dateFormat?: EnumDateFormatFieldUpdateOperationsInput | $Enums.DateFormat
    scheduledDeletionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sessions?: SessionUpdateManyWithoutUserNestedInput
    subscription?: SubscriptionUpdateOneWithoutUserNestedInput
    usageTrackers?: UsageTrackerUpdateManyWithoutUserNestedInput
    backupCodes?: BackupCodesUpdateManyWithoutUserNestedInput
    loginActivity?: LoginActivityUpdateManyWithoutUserNestedInput
    setting?: NotificationSettingUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutAccountsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    loginAttempts?: IntFieldUpdateOperationsInput | number
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    twoFactorAttempts?: IntFieldUpdateOperationsInput | number
    twoFactorEnabled?: BoolFieldUpdateOperationsInput | boolean
    twoFactorSecret?: NullableStringFieldUpdateOperationsInput | string | null
    twoFactorLastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    language?: EnumLanguageFieldUpdateOperationsInput | $Enums.Language
    timezone?: StringFieldUpdateOperationsInput | string
    dateFormat?: EnumDateFormatFieldUpdateOperationsInput | $Enums.DateFormat
    scheduledDeletionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
    subscription?: SubscriptionUncheckedUpdateOneWithoutUserNestedInput
    usageTrackers?: UsageTrackerUncheckedUpdateManyWithoutUserNestedInput
    backupCodes?: BackupCodesUncheckedUpdateManyWithoutUserNestedInput
    loginActivity?: LoginActivityUncheckedUpdateManyWithoutUserNestedInput
    setting?: NotificationSettingUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateWithoutSessionsInput = {
    id?: string
    email: string
    password?: string | null
    loginAttempts?: number
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    firstName: string
    lastName: string
    avatar?: string | null
    lastLoginAt?: Date | string | null
    twoFactorAttempts?: number
    twoFactorEnabled?: boolean
    twoFactorSecret?: string | null
    twoFactorLastUsedAt?: Date | string | null
    currency?: $Enums.Currency
    language?: $Enums.Language
    timezone?: string
    dateFormat?: $Enums.DateFormat
    scheduledDeletionAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountCreateNestedManyWithoutUserInput
    subscription?: SubscriptionCreateNestedOneWithoutUserInput
    usageTrackers?: UsageTrackerCreateNestedManyWithoutUserInput
    backupCodes?: BackupCodesCreateNestedManyWithoutUserInput
    loginActivity?: LoginActivityCreateNestedManyWithoutUserInput
    setting?: NotificationSettingCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutSessionsInput = {
    id?: string
    email: string
    password?: string | null
    loginAttempts?: number
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    firstName: string
    lastName: string
    avatar?: string | null
    lastLoginAt?: Date | string | null
    twoFactorAttempts?: number
    twoFactorEnabled?: boolean
    twoFactorSecret?: string | null
    twoFactorLastUsedAt?: Date | string | null
    currency?: $Enums.Currency
    language?: $Enums.Language
    timezone?: string
    dateFormat?: $Enums.DateFormat
    scheduledDeletionAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountUncheckedCreateNestedManyWithoutUserInput
    subscription?: SubscriptionUncheckedCreateNestedOneWithoutUserInput
    usageTrackers?: UsageTrackerUncheckedCreateNestedManyWithoutUserInput
    backupCodes?: BackupCodesUncheckedCreateNestedManyWithoutUserInput
    loginActivity?: LoginActivityUncheckedCreateNestedManyWithoutUserInput
    setting?: NotificationSettingUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutSessionsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
  }

  export type UserUpsertWithoutSessionsInput = {
    update: XOR<UserUpdateWithoutSessionsInput, UserUncheckedUpdateWithoutSessionsInput>
    create: XOR<UserCreateWithoutSessionsInput, UserUncheckedCreateWithoutSessionsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSessionsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSessionsInput, UserUncheckedUpdateWithoutSessionsInput>
  }

  export type UserUpdateWithoutSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    loginAttempts?: IntFieldUpdateOperationsInput | number
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    twoFactorAttempts?: IntFieldUpdateOperationsInput | number
    twoFactorEnabled?: BoolFieldUpdateOperationsInput | boolean
    twoFactorSecret?: NullableStringFieldUpdateOperationsInput | string | null
    twoFactorLastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    language?: EnumLanguageFieldUpdateOperationsInput | $Enums.Language
    timezone?: StringFieldUpdateOperationsInput | string
    dateFormat?: EnumDateFormatFieldUpdateOperationsInput | $Enums.DateFormat
    scheduledDeletionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUpdateManyWithoutUserNestedInput
    subscription?: SubscriptionUpdateOneWithoutUserNestedInput
    usageTrackers?: UsageTrackerUpdateManyWithoutUserNestedInput
    backupCodes?: BackupCodesUpdateManyWithoutUserNestedInput
    loginActivity?: LoginActivityUpdateManyWithoutUserNestedInput
    setting?: NotificationSettingUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutSessionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    loginAttempts?: IntFieldUpdateOperationsInput | number
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    twoFactorAttempts?: IntFieldUpdateOperationsInput | number
    twoFactorEnabled?: BoolFieldUpdateOperationsInput | boolean
    twoFactorSecret?: NullableStringFieldUpdateOperationsInput | string | null
    twoFactorLastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    language?: EnumLanguageFieldUpdateOperationsInput | $Enums.Language
    timezone?: StringFieldUpdateOperationsInput | string
    dateFormat?: EnumDateFormatFieldUpdateOperationsInput | $Enums.DateFormat
    scheduledDeletionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUncheckedUpdateManyWithoutUserNestedInput
    subscription?: SubscriptionUncheckedUpdateOneWithoutUserNestedInput
    usageTrackers?: UsageTrackerUncheckedUpdateManyWithoutUserNestedInput
    backupCodes?: BackupCodesUncheckedUpdateManyWithoutUserNestedInput
    loginActivity?: LoginActivityUncheckedUpdateManyWithoutUserNestedInput
    setting?: NotificationSettingUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateWithoutLoginActivityInput = {
    id?: string
    email: string
    password?: string | null
    loginAttempts?: number
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    firstName: string
    lastName: string
    avatar?: string | null
    lastLoginAt?: Date | string | null
    twoFactorAttempts?: number
    twoFactorEnabled?: boolean
    twoFactorSecret?: string | null
    twoFactorLastUsedAt?: Date | string | null
    currency?: $Enums.Currency
    language?: $Enums.Language
    timezone?: string
    dateFormat?: $Enums.DateFormat
    scheduledDeletionAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountCreateNestedManyWithoutUserInput
    sessions?: SessionCreateNestedManyWithoutUserInput
    subscription?: SubscriptionCreateNestedOneWithoutUserInput
    usageTrackers?: UsageTrackerCreateNestedManyWithoutUserInput
    backupCodes?: BackupCodesCreateNestedManyWithoutUserInput
    setting?: NotificationSettingCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutLoginActivityInput = {
    id?: string
    email: string
    password?: string | null
    loginAttempts?: number
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    firstName: string
    lastName: string
    avatar?: string | null
    lastLoginAt?: Date | string | null
    twoFactorAttempts?: number
    twoFactorEnabled?: boolean
    twoFactorSecret?: string | null
    twoFactorLastUsedAt?: Date | string | null
    currency?: $Enums.Currency
    language?: $Enums.Language
    timezone?: string
    dateFormat?: $Enums.DateFormat
    scheduledDeletionAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountUncheckedCreateNestedManyWithoutUserInput
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
    subscription?: SubscriptionUncheckedCreateNestedOneWithoutUserInput
    usageTrackers?: UsageTrackerUncheckedCreateNestedManyWithoutUserInput
    backupCodes?: BackupCodesUncheckedCreateNestedManyWithoutUserInput
    setting?: NotificationSettingUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutLoginActivityInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutLoginActivityInput, UserUncheckedCreateWithoutLoginActivityInput>
  }

  export type UserUpsertWithoutLoginActivityInput = {
    update: XOR<UserUpdateWithoutLoginActivityInput, UserUncheckedUpdateWithoutLoginActivityInput>
    create: XOR<UserCreateWithoutLoginActivityInput, UserUncheckedCreateWithoutLoginActivityInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutLoginActivityInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutLoginActivityInput, UserUncheckedUpdateWithoutLoginActivityInput>
  }

  export type UserUpdateWithoutLoginActivityInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    loginAttempts?: IntFieldUpdateOperationsInput | number
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    twoFactorAttempts?: IntFieldUpdateOperationsInput | number
    twoFactorEnabled?: BoolFieldUpdateOperationsInput | boolean
    twoFactorSecret?: NullableStringFieldUpdateOperationsInput | string | null
    twoFactorLastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    language?: EnumLanguageFieldUpdateOperationsInput | $Enums.Language
    timezone?: StringFieldUpdateOperationsInput | string
    dateFormat?: EnumDateFormatFieldUpdateOperationsInput | $Enums.DateFormat
    scheduledDeletionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUpdateManyWithoutUserNestedInput
    sessions?: SessionUpdateManyWithoutUserNestedInput
    subscription?: SubscriptionUpdateOneWithoutUserNestedInput
    usageTrackers?: UsageTrackerUpdateManyWithoutUserNestedInput
    backupCodes?: BackupCodesUpdateManyWithoutUserNestedInput
    setting?: NotificationSettingUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutLoginActivityInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    loginAttempts?: IntFieldUpdateOperationsInput | number
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    twoFactorAttempts?: IntFieldUpdateOperationsInput | number
    twoFactorEnabled?: BoolFieldUpdateOperationsInput | boolean
    twoFactorSecret?: NullableStringFieldUpdateOperationsInput | string | null
    twoFactorLastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    language?: EnumLanguageFieldUpdateOperationsInput | $Enums.Language
    timezone?: StringFieldUpdateOperationsInput | string
    dateFormat?: EnumDateFormatFieldUpdateOperationsInput | $Enums.DateFormat
    scheduledDeletionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUncheckedUpdateManyWithoutUserNestedInput
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
    subscription?: SubscriptionUncheckedUpdateOneWithoutUserNestedInput
    usageTrackers?: UsageTrackerUncheckedUpdateManyWithoutUserNestedInput
    backupCodes?: BackupCodesUncheckedUpdateManyWithoutUserNestedInput
    setting?: NotificationSettingUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateWithoutSubscriptionInput = {
    id?: string
    email: string
    password?: string | null
    loginAttempts?: number
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    firstName: string
    lastName: string
    avatar?: string | null
    lastLoginAt?: Date | string | null
    twoFactorAttempts?: number
    twoFactorEnabled?: boolean
    twoFactorSecret?: string | null
    twoFactorLastUsedAt?: Date | string | null
    currency?: $Enums.Currency
    language?: $Enums.Language
    timezone?: string
    dateFormat?: $Enums.DateFormat
    scheduledDeletionAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountCreateNestedManyWithoutUserInput
    sessions?: SessionCreateNestedManyWithoutUserInput
    usageTrackers?: UsageTrackerCreateNestedManyWithoutUserInput
    backupCodes?: BackupCodesCreateNestedManyWithoutUserInput
    loginActivity?: LoginActivityCreateNestedManyWithoutUserInput
    setting?: NotificationSettingCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutSubscriptionInput = {
    id?: string
    email: string
    password?: string | null
    loginAttempts?: number
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    firstName: string
    lastName: string
    avatar?: string | null
    lastLoginAt?: Date | string | null
    twoFactorAttempts?: number
    twoFactorEnabled?: boolean
    twoFactorSecret?: string | null
    twoFactorLastUsedAt?: Date | string | null
    currency?: $Enums.Currency
    language?: $Enums.Language
    timezone?: string
    dateFormat?: $Enums.DateFormat
    scheduledDeletionAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountUncheckedCreateNestedManyWithoutUserInput
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
    usageTrackers?: UsageTrackerUncheckedCreateNestedManyWithoutUserInput
    backupCodes?: BackupCodesUncheckedCreateNestedManyWithoutUserInput
    loginActivity?: LoginActivityUncheckedCreateNestedManyWithoutUserInput
    setting?: NotificationSettingUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutSubscriptionInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSubscriptionInput, UserUncheckedCreateWithoutSubscriptionInput>
  }

  export type UserUpsertWithoutSubscriptionInput = {
    update: XOR<UserUpdateWithoutSubscriptionInput, UserUncheckedUpdateWithoutSubscriptionInput>
    create: XOR<UserCreateWithoutSubscriptionInput, UserUncheckedCreateWithoutSubscriptionInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSubscriptionInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSubscriptionInput, UserUncheckedUpdateWithoutSubscriptionInput>
  }

  export type UserUpdateWithoutSubscriptionInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    loginAttempts?: IntFieldUpdateOperationsInput | number
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    twoFactorAttempts?: IntFieldUpdateOperationsInput | number
    twoFactorEnabled?: BoolFieldUpdateOperationsInput | boolean
    twoFactorSecret?: NullableStringFieldUpdateOperationsInput | string | null
    twoFactorLastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    language?: EnumLanguageFieldUpdateOperationsInput | $Enums.Language
    timezone?: StringFieldUpdateOperationsInput | string
    dateFormat?: EnumDateFormatFieldUpdateOperationsInput | $Enums.DateFormat
    scheduledDeletionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUpdateManyWithoutUserNestedInput
    sessions?: SessionUpdateManyWithoutUserNestedInput
    usageTrackers?: UsageTrackerUpdateManyWithoutUserNestedInput
    backupCodes?: BackupCodesUpdateManyWithoutUserNestedInput
    loginActivity?: LoginActivityUpdateManyWithoutUserNestedInput
    setting?: NotificationSettingUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutSubscriptionInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    loginAttempts?: IntFieldUpdateOperationsInput | number
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    twoFactorAttempts?: IntFieldUpdateOperationsInput | number
    twoFactorEnabled?: BoolFieldUpdateOperationsInput | boolean
    twoFactorSecret?: NullableStringFieldUpdateOperationsInput | string | null
    twoFactorLastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    language?: EnumLanguageFieldUpdateOperationsInput | $Enums.Language
    timezone?: StringFieldUpdateOperationsInput | string
    dateFormat?: EnumDateFormatFieldUpdateOperationsInput | $Enums.DateFormat
    scheduledDeletionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUncheckedUpdateManyWithoutUserNestedInput
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
    usageTrackers?: UsageTrackerUncheckedUpdateManyWithoutUserNestedInput
    backupCodes?: BackupCodesUncheckedUpdateManyWithoutUserNestedInput
    loginActivity?: LoginActivityUncheckedUpdateManyWithoutUserNestedInput
    setting?: NotificationSettingUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateWithoutUsageTrackersInput = {
    id?: string
    email: string
    password?: string | null
    loginAttempts?: number
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    firstName: string
    lastName: string
    avatar?: string | null
    lastLoginAt?: Date | string | null
    twoFactorAttempts?: number
    twoFactorEnabled?: boolean
    twoFactorSecret?: string | null
    twoFactorLastUsedAt?: Date | string | null
    currency?: $Enums.Currency
    language?: $Enums.Language
    timezone?: string
    dateFormat?: $Enums.DateFormat
    scheduledDeletionAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountCreateNestedManyWithoutUserInput
    sessions?: SessionCreateNestedManyWithoutUserInput
    subscription?: SubscriptionCreateNestedOneWithoutUserInput
    backupCodes?: BackupCodesCreateNestedManyWithoutUserInput
    loginActivity?: LoginActivityCreateNestedManyWithoutUserInput
    setting?: NotificationSettingCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutUsageTrackersInput = {
    id?: string
    email: string
    password?: string | null
    loginAttempts?: number
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    firstName: string
    lastName: string
    avatar?: string | null
    lastLoginAt?: Date | string | null
    twoFactorAttempts?: number
    twoFactorEnabled?: boolean
    twoFactorSecret?: string | null
    twoFactorLastUsedAt?: Date | string | null
    currency?: $Enums.Currency
    language?: $Enums.Language
    timezone?: string
    dateFormat?: $Enums.DateFormat
    scheduledDeletionAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountUncheckedCreateNestedManyWithoutUserInput
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
    subscription?: SubscriptionUncheckedCreateNestedOneWithoutUserInput
    backupCodes?: BackupCodesUncheckedCreateNestedManyWithoutUserInput
    loginActivity?: LoginActivityUncheckedCreateNestedManyWithoutUserInput
    setting?: NotificationSettingUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutUsageTrackersInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutUsageTrackersInput, UserUncheckedCreateWithoutUsageTrackersInput>
  }

  export type UserUpsertWithoutUsageTrackersInput = {
    update: XOR<UserUpdateWithoutUsageTrackersInput, UserUncheckedUpdateWithoutUsageTrackersInput>
    create: XOR<UserCreateWithoutUsageTrackersInput, UserUncheckedCreateWithoutUsageTrackersInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutUsageTrackersInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutUsageTrackersInput, UserUncheckedUpdateWithoutUsageTrackersInput>
  }

  export type UserUpdateWithoutUsageTrackersInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    loginAttempts?: IntFieldUpdateOperationsInput | number
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    twoFactorAttempts?: IntFieldUpdateOperationsInput | number
    twoFactorEnabled?: BoolFieldUpdateOperationsInput | boolean
    twoFactorSecret?: NullableStringFieldUpdateOperationsInput | string | null
    twoFactorLastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    language?: EnumLanguageFieldUpdateOperationsInput | $Enums.Language
    timezone?: StringFieldUpdateOperationsInput | string
    dateFormat?: EnumDateFormatFieldUpdateOperationsInput | $Enums.DateFormat
    scheduledDeletionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUpdateManyWithoutUserNestedInput
    sessions?: SessionUpdateManyWithoutUserNestedInput
    subscription?: SubscriptionUpdateOneWithoutUserNestedInput
    backupCodes?: BackupCodesUpdateManyWithoutUserNestedInput
    loginActivity?: LoginActivityUpdateManyWithoutUserNestedInput
    setting?: NotificationSettingUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutUsageTrackersInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    loginAttempts?: IntFieldUpdateOperationsInput | number
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    twoFactorAttempts?: IntFieldUpdateOperationsInput | number
    twoFactorEnabled?: BoolFieldUpdateOperationsInput | boolean
    twoFactorSecret?: NullableStringFieldUpdateOperationsInput | string | null
    twoFactorLastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    language?: EnumLanguageFieldUpdateOperationsInput | $Enums.Language
    timezone?: StringFieldUpdateOperationsInput | string
    dateFormat?: EnumDateFormatFieldUpdateOperationsInput | $Enums.DateFormat
    scheduledDeletionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUncheckedUpdateManyWithoutUserNestedInput
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
    subscription?: SubscriptionUncheckedUpdateOneWithoutUserNestedInput
    backupCodes?: BackupCodesUncheckedUpdateManyWithoutUserNestedInput
    loginActivity?: LoginActivityUncheckedUpdateManyWithoutUserNestedInput
    setting?: NotificationSettingUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateWithoutBackupCodesInput = {
    id?: string
    email: string
    password?: string | null
    loginAttempts?: number
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    firstName: string
    lastName: string
    avatar?: string | null
    lastLoginAt?: Date | string | null
    twoFactorAttempts?: number
    twoFactorEnabled?: boolean
    twoFactorSecret?: string | null
    twoFactorLastUsedAt?: Date | string | null
    currency?: $Enums.Currency
    language?: $Enums.Language
    timezone?: string
    dateFormat?: $Enums.DateFormat
    scheduledDeletionAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountCreateNestedManyWithoutUserInput
    sessions?: SessionCreateNestedManyWithoutUserInput
    subscription?: SubscriptionCreateNestedOneWithoutUserInput
    usageTrackers?: UsageTrackerCreateNestedManyWithoutUserInput
    loginActivity?: LoginActivityCreateNestedManyWithoutUserInput
    setting?: NotificationSettingCreateNestedOneWithoutUserInput
  }

  export type UserUncheckedCreateWithoutBackupCodesInput = {
    id?: string
    email: string
    password?: string | null
    loginAttempts?: number
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    firstName: string
    lastName: string
    avatar?: string | null
    lastLoginAt?: Date | string | null
    twoFactorAttempts?: number
    twoFactorEnabled?: boolean
    twoFactorSecret?: string | null
    twoFactorLastUsedAt?: Date | string | null
    currency?: $Enums.Currency
    language?: $Enums.Language
    timezone?: string
    dateFormat?: $Enums.DateFormat
    scheduledDeletionAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountUncheckedCreateNestedManyWithoutUserInput
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
    subscription?: SubscriptionUncheckedCreateNestedOneWithoutUserInput
    usageTrackers?: UsageTrackerUncheckedCreateNestedManyWithoutUserInput
    loginActivity?: LoginActivityUncheckedCreateNestedManyWithoutUserInput
    setting?: NotificationSettingUncheckedCreateNestedOneWithoutUserInput
  }

  export type UserCreateOrConnectWithoutBackupCodesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutBackupCodesInput, UserUncheckedCreateWithoutBackupCodesInput>
  }

  export type UserUpsertWithoutBackupCodesInput = {
    update: XOR<UserUpdateWithoutBackupCodesInput, UserUncheckedUpdateWithoutBackupCodesInput>
    create: XOR<UserCreateWithoutBackupCodesInput, UserUncheckedCreateWithoutBackupCodesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutBackupCodesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutBackupCodesInput, UserUncheckedUpdateWithoutBackupCodesInput>
  }

  export type UserUpdateWithoutBackupCodesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    loginAttempts?: IntFieldUpdateOperationsInput | number
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    twoFactorAttempts?: IntFieldUpdateOperationsInput | number
    twoFactorEnabled?: BoolFieldUpdateOperationsInput | boolean
    twoFactorSecret?: NullableStringFieldUpdateOperationsInput | string | null
    twoFactorLastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    language?: EnumLanguageFieldUpdateOperationsInput | $Enums.Language
    timezone?: StringFieldUpdateOperationsInput | string
    dateFormat?: EnumDateFormatFieldUpdateOperationsInput | $Enums.DateFormat
    scheduledDeletionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUpdateManyWithoutUserNestedInput
    sessions?: SessionUpdateManyWithoutUserNestedInput
    subscription?: SubscriptionUpdateOneWithoutUserNestedInput
    usageTrackers?: UsageTrackerUpdateManyWithoutUserNestedInput
    loginActivity?: LoginActivityUpdateManyWithoutUserNestedInput
    setting?: NotificationSettingUpdateOneWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutBackupCodesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    loginAttempts?: IntFieldUpdateOperationsInput | number
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    twoFactorAttempts?: IntFieldUpdateOperationsInput | number
    twoFactorEnabled?: BoolFieldUpdateOperationsInput | boolean
    twoFactorSecret?: NullableStringFieldUpdateOperationsInput | string | null
    twoFactorLastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    language?: EnumLanguageFieldUpdateOperationsInput | $Enums.Language
    timezone?: StringFieldUpdateOperationsInput | string
    dateFormat?: EnumDateFormatFieldUpdateOperationsInput | $Enums.DateFormat
    scheduledDeletionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUncheckedUpdateManyWithoutUserNestedInput
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
    subscription?: SubscriptionUncheckedUpdateOneWithoutUserNestedInput
    usageTrackers?: UsageTrackerUncheckedUpdateManyWithoutUserNestedInput
    loginActivity?: LoginActivityUncheckedUpdateManyWithoutUserNestedInput
    setting?: NotificationSettingUncheckedUpdateOneWithoutUserNestedInput
  }

  export type UserCreateWithoutSettingInput = {
    id?: string
    email: string
    password?: string | null
    loginAttempts?: number
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    firstName: string
    lastName: string
    avatar?: string | null
    lastLoginAt?: Date | string | null
    twoFactorAttempts?: number
    twoFactorEnabled?: boolean
    twoFactorSecret?: string | null
    twoFactorLastUsedAt?: Date | string | null
    currency?: $Enums.Currency
    language?: $Enums.Language
    timezone?: string
    dateFormat?: $Enums.DateFormat
    scheduledDeletionAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountCreateNestedManyWithoutUserInput
    sessions?: SessionCreateNestedManyWithoutUserInput
    subscription?: SubscriptionCreateNestedOneWithoutUserInput
    usageTrackers?: UsageTrackerCreateNestedManyWithoutUserInput
    backupCodes?: BackupCodesCreateNestedManyWithoutUserInput
    loginActivity?: LoginActivityCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutSettingInput = {
    id?: string
    email: string
    password?: string | null
    loginAttempts?: number
    emailVerified?: boolean
    emailVerifiedAt?: Date | string | null
    firstName: string
    lastName: string
    avatar?: string | null
    lastLoginAt?: Date | string | null
    twoFactorAttempts?: number
    twoFactorEnabled?: boolean
    twoFactorSecret?: string | null
    twoFactorLastUsedAt?: Date | string | null
    currency?: $Enums.Currency
    language?: $Enums.Language
    timezone?: string
    dateFormat?: $Enums.DateFormat
    scheduledDeletionAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    accounts?: AccountUncheckedCreateNestedManyWithoutUserInput
    sessions?: SessionUncheckedCreateNestedManyWithoutUserInput
    subscription?: SubscriptionUncheckedCreateNestedOneWithoutUserInput
    usageTrackers?: UsageTrackerUncheckedCreateNestedManyWithoutUserInput
    backupCodes?: BackupCodesUncheckedCreateNestedManyWithoutUserInput
    loginActivity?: LoginActivityUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutSettingInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutSettingInput, UserUncheckedCreateWithoutSettingInput>
  }

  export type UserUpsertWithoutSettingInput = {
    update: XOR<UserUpdateWithoutSettingInput, UserUncheckedUpdateWithoutSettingInput>
    create: XOR<UserCreateWithoutSettingInput, UserUncheckedCreateWithoutSettingInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutSettingInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutSettingInput, UserUncheckedUpdateWithoutSettingInput>
  }

  export type UserUpdateWithoutSettingInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    loginAttempts?: IntFieldUpdateOperationsInput | number
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    twoFactorAttempts?: IntFieldUpdateOperationsInput | number
    twoFactorEnabled?: BoolFieldUpdateOperationsInput | boolean
    twoFactorSecret?: NullableStringFieldUpdateOperationsInput | string | null
    twoFactorLastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    language?: EnumLanguageFieldUpdateOperationsInput | $Enums.Language
    timezone?: StringFieldUpdateOperationsInput | string
    dateFormat?: EnumDateFormatFieldUpdateOperationsInput | $Enums.DateFormat
    scheduledDeletionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUpdateManyWithoutUserNestedInput
    sessions?: SessionUpdateManyWithoutUserNestedInput
    subscription?: SubscriptionUpdateOneWithoutUserNestedInput
    usageTrackers?: UsageTrackerUpdateManyWithoutUserNestedInput
    backupCodes?: BackupCodesUpdateManyWithoutUserNestedInput
    loginActivity?: LoginActivityUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutSettingInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    password?: NullableStringFieldUpdateOperationsInput | string | null
    loginAttempts?: IntFieldUpdateOperationsInput | number
    emailVerified?: BoolFieldUpdateOperationsInput | boolean
    emailVerifiedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    firstName?: StringFieldUpdateOperationsInput | string
    lastName?: StringFieldUpdateOperationsInput | string
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    lastLoginAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    twoFactorAttempts?: IntFieldUpdateOperationsInput | number
    twoFactorEnabled?: BoolFieldUpdateOperationsInput | boolean
    twoFactorSecret?: NullableStringFieldUpdateOperationsInput | string | null
    twoFactorLastUsedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    currency?: EnumCurrencyFieldUpdateOperationsInput | $Enums.Currency
    language?: EnumLanguageFieldUpdateOperationsInput | $Enums.Language
    timezone?: StringFieldUpdateOperationsInput | string
    dateFormat?: EnumDateFormatFieldUpdateOperationsInput | $Enums.DateFormat
    scheduledDeletionAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    accounts?: AccountUncheckedUpdateManyWithoutUserNestedInput
    sessions?: SessionUncheckedUpdateManyWithoutUserNestedInput
    subscription?: SubscriptionUncheckedUpdateOneWithoutUserNestedInput
    usageTrackers?: UsageTrackerUncheckedUpdateManyWithoutUserNestedInput
    backupCodes?: BackupCodesUncheckedUpdateManyWithoutUserNestedInput
    loginActivity?: LoginActivityUncheckedUpdateManyWithoutUserNestedInput
  }

  export type AccountCreateManyUserInput = {
    id?: string
    type: $Enums.AccountType
    provider: $Enums.AccountProvider
    providerAccountId: string
    refreshToken?: string | null
    accessToken?: string | null
    expiresAt?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SessionCreateManyUserInput = {
    id?: string
    sessionToken: string
    expires: Date | string
    deviceId: string
    userAgent?: string | null
    ipAddress?: string | null
    location?: string | null
    lastUsedAt?: Date | string
    createdAt?: Date | string
  }

  export type UsageTrackerCreateManyUserInput = {
    id?: string
    feature: $Enums.UsageFeature
    count?: number
    periodStart: Date | string
    periodEnd: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BackupCodesCreateManyUserInput = {
    id?: string
    usedAt?: Date | string | null
    code: string
    createdAt?: Date | string
  }

  export type LoginActivityCreateManyUserInput = {
    id?: string
    type: $Enums.LoginActivityType
    status: $Enums.LoginActivityStatus
    deviceId: string
    userAgent?: string | null
    ipAddress?: string | null
    location?: string | null
    createdAt?: Date | string
  }

  export type AccountUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumAccountTypeFieldUpdateOperationsInput | $Enums.AccountType
    provider?: EnumAccountProviderFieldUpdateOperationsInput | $Enums.AccountProvider
    providerAccountId?: StringFieldUpdateOperationsInput | string
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    expiresAt?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AccountUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumAccountTypeFieldUpdateOperationsInput | $Enums.AccountType
    provider?: EnumAccountProviderFieldUpdateOperationsInput | $Enums.AccountProvider
    providerAccountId?: StringFieldUpdateOperationsInput | string
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    expiresAt?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AccountUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumAccountTypeFieldUpdateOperationsInput | $Enums.AccountType
    provider?: EnumAccountProviderFieldUpdateOperationsInput | $Enums.AccountProvider
    providerAccountId?: StringFieldUpdateOperationsInput | string
    refreshToken?: NullableStringFieldUpdateOperationsInput | string | null
    accessToken?: NullableStringFieldUpdateOperationsInput | string | null
    expiresAt?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionToken?: StringFieldUpdateOperationsInput | string
    expires?: DateTimeFieldUpdateOperationsInput | Date | string
    deviceId?: StringFieldUpdateOperationsInput | string
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    lastUsedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionToken?: StringFieldUpdateOperationsInput | string
    expires?: DateTimeFieldUpdateOperationsInput | Date | string
    deviceId?: StringFieldUpdateOperationsInput | string
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    lastUsedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SessionUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    sessionToken?: StringFieldUpdateOperationsInput | string
    expires?: DateTimeFieldUpdateOperationsInput | Date | string
    deviceId?: StringFieldUpdateOperationsInput | string
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    lastUsedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UsageTrackerUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    feature?: EnumUsageFeatureFieldUpdateOperationsInput | $Enums.UsageFeature
    count?: IntFieldUpdateOperationsInput | number
    periodStart?: DateTimeFieldUpdateOperationsInput | Date | string
    periodEnd?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UsageTrackerUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    feature?: EnumUsageFeatureFieldUpdateOperationsInput | $Enums.UsageFeature
    count?: IntFieldUpdateOperationsInput | number
    periodStart?: DateTimeFieldUpdateOperationsInput | Date | string
    periodEnd?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UsageTrackerUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    feature?: EnumUsageFeatureFieldUpdateOperationsInput | $Enums.UsageFeature
    count?: IntFieldUpdateOperationsInput | number
    periodStart?: DateTimeFieldUpdateOperationsInput | Date | string
    periodEnd?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BackupCodesUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    usedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    code?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BackupCodesUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    usedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    code?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BackupCodesUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    usedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    code?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LoginActivityUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumLoginActivityTypeFieldUpdateOperationsInput | $Enums.LoginActivityType
    status?: EnumLoginActivityStatusFieldUpdateOperationsInput | $Enums.LoginActivityStatus
    deviceId?: StringFieldUpdateOperationsInput | string
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LoginActivityUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumLoginActivityTypeFieldUpdateOperationsInput | $Enums.LoginActivityType
    status?: EnumLoginActivityStatusFieldUpdateOperationsInput | $Enums.LoginActivityStatus
    deviceId?: StringFieldUpdateOperationsInput | string
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type LoginActivityUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: EnumLoginActivityTypeFieldUpdateOperationsInput | $Enums.LoginActivityType
    status?: EnumLoginActivityStatusFieldUpdateOperationsInput | $Enums.LoginActivityStatus
    deviceId?: StringFieldUpdateOperationsInput | string
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    location?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}