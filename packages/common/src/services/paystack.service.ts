import * as crypto from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  TRIAL_DURATION_DAYS,
  TRIAL_VERIFICATION_AMOUNT_KOBO,
} from '@fintrack/types/constants/payment.constants';
import type {
  CreateRefundPayload,
  CreateRefundResponse,
  CreateSubscriptionPayload,
  CreateSubscriptionResponse,
  DisableSubscriptionResponse,
  EnableSubscriptionResponse,
  FetchSubscriptionResponse,
  GetSubscriptionManageLinkResponse,
  InitializePaystackTranactionPayload,
  InitializePaystackTransactionResponse,
  PaystackResponse,
  PaystackWebhookEvent,
  VerifyTransactionResponse,
} from '@fintrack/types/interfaces/payment';

import { FetcherService } from './fetcher.service.js';
import { emailTrialHash } from '../utils/trial_hash.js';

/**
 * Single source of truth for all Paystack REST API calls.
 *
 * Both `payment_service` (gRPC, request-driven) and `api_gateway` (webhook handler +
 * subscription creation) consume this service. Neither app re-implements HTTP auth,
 * signature verification, or kobo/naira conversion logic.
 *
 * **Encryption contract** — this service returns tokens exactly as Paystack sends them.
 * Callers must encrypt `authorization_code` and `email_token` with `EncryptionService`
 * before persisting, and decrypt only at the Paystack call site (i.e. just before
 * passing back into `disableSubscription` / `enableSubscription`).
 *
 * **Webhook verification** — Paystack signs the raw request body with HMAC-SHA512 keyed
 * by `PAYSTACK_SECRET_KEY`. There is no separate webhook secret.
 *
 * @class PaystackService
 */
@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly BASE_URL = 'https://api.paystack.co';
  private readonly secretKey: string;

  /** Default trial duration in days  */
  readonly trialDurationDays = TRIAL_DURATION_DAYS;

  /** Verification charge in kobo (₦50) refunded immediately after trial creation */
  readonly trialVerificationAmountKobo = TRIAL_VERIFICATION_AMOUNT_KOBO;

  constructor(
    private readonly config: ConfigService,
    private readonly fetcher: FetcherService,
  ) {
    this.secretKey = this.config.getOrThrow<string>('PAYSTACK_SECRET_KEY');
  }

  // ---------------------------------------------------------------------------
  // Transactions
  // ---------------------------------------------------------------------------

  /**
   * Initializes a Paystack transaction and returns a hosted payment page URL.
   *
   * Used for two distinct purposes — set `metadata.purpose` to distinguish them
   * in the `charge.success` webhook handler:
   * - `'pro_upgrade'` — direct paid upgrade, full monthly amount in kobo.
   * - `'trial_card_verification'` — ₦50 card capture for the free-trial flow;
   *    refund immediately after creating the future-dated subscription.
   *
   * @param input - Transaction parameters including email, amount in kobo, and metadata
   * @returns Hosted payment URL (`authorization_url`), access code, and transaction reference
   * @throws If Paystack returns a business-logic failure (`status: false`)
   */
  async initializeTransaction(
    input: InitializePaystackTranactionPayload,
  ): Promise<InitializePaystackTransactionResponse> {
    const { data } = await this.fetcher.post<
      PaystackResponse<InitializePaystackTransactionResponse>
    >(
      `${this.BASE_URL}/transaction/initialize`,
      {
        email: input.email,
        plan: input.plan,
        amount: input.amountKobo,
        reference: input.reference,
        callback_url: input.callbackUrl,
        channels: input.channels ?? ['card'],
        metadata: input.metadata,
      },
      { headers: this.authHeaders },
    );

    this.assertSuccess(data, '/transaction/initialize');
    return data.data!;
  }

  /**
   * Verifies a transaction by reference and returns its full details.
   *
   * Call after a `charge.success` webhook to confirm terminal status and extract
   * the `authorization_code` needed for future subscription creation.
   *
   * @param reference - Transaction reference from the webhook payload or callback URL
   * @returns Full transaction data including authorization and customer objects
   * @throws If the reference is unknown or Paystack returns a failure status
   */
  async verifyTransaction(reference: string): Promise<VerifyTransactionResponse> {
    const { data } = await this.fetcher.get<PaystackResponse<VerifyTransactionResponse>>(
      `${this.BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: this.authHeaders },
    );

    this.assertSuccess(data, `/transaction/verify/${reference}`);
    return data.data!;
  }

  /**
   * Initiates a refund for a previously charged transaction.
   *
   * In the trial flow, call this after successfully creating the future-dated
   * subscription to return the ₦50 verification charge to the customer.
   * Failures should be treated as non-fatal — catch and warn rather than aborting.
   *
   * @param input - Refund parameters; omit `amount` to refund the full transaction amount
   * @returns Refund record with current status and expected completion timestamp
   * @throws If Paystack rejects the refund request
   */
  async refund(input: CreateRefundPayload): Promise<CreateRefundResponse> {
    const { data } = await this.fetcher.post<PaystackResponse<CreateRefundResponse>>(
      `${this.BASE_URL}/refund`,
      {
        transaction: input.transaction,
        amount: input.amount,
        currency: input.currency,
        customer_note: input.customer_note,
        merchant_note: input.merchant_note,
      },
      { headers: this.authHeaders },
    );

    this.assertSuccess(data, '/refund');
    return data.data!;
  }

  // ---------------------------------------------------------------------------
  // Subscriptions
  // ---------------------------------------------------------------------------

  /**
   * Creates a Paystack-managed recurring subscription.
   *
   * For the free-trial flow, set `start_date` to `now + trialDurationDays` — Paystack
   * will not charge the card until that date. Pass the `authorization_code` from the
   * preceding `charge.success` event to pin the subscription to that specific card.
   *
   * The returned `email_token` is required by `disableSubscription` and
   * `enableSubscription`. **Encrypt it with `EncryptionService` before persisting.**
   *
   * @param input - Customer code or email, plan code, optional authorization and start date
   * @returns Full subscription object including `subscription_code` and `email_token`
   * @throws If the customer has no valid authorization or Paystack returns a failure
   */
  async createSubscription(input: CreateSubscriptionPayload): Promise<CreateSubscriptionResponse> {
    const { data } = await this.fetcher.post<PaystackResponse<CreateSubscriptionResponse>>(
      `${this.BASE_URL}/subscription`,
      {
        customer: input.customer,
        plan: input.plan,
        authorization: input.authorization,
        start_date: input.start_date,
      },
      { headers: this.authHeaders },
    );

    this.assertSuccess(data, '/subscription');
    return data.data!;
  }

  /**
   * Disables auto-renewal on an active subscription.
   *
   * The customer retains Pro access until `paystackCurrentPeriodEnd`. The resulting
   * state change returns as a `subscription.disable` or `subscription.not_renew` webhook.
   *
   * The `emailToken` must be **decrypted** from `paystackEmailToken` before calling.
   *
   * @param code - Subscription code (SUB_xxx) from `paystackSubscriptionCode`
   * @param emailToken - Plaintext email token — decrypt from `paystackEmailToken` first
   * @throws If the subscription code or token is invalid
   */
  async disableSubscription(
    code: string,
    emailToken: string,
  ): Promise<DisableSubscriptionResponse> {
    const { data } = await this.fetcher.post<PaystackResponse<DisableSubscriptionResponse>>(
      `${this.BASE_URL}/subscription/disable`,
      { code, token: emailToken },
      { headers: this.authHeaders },
    );

    this.assertSuccess(data, '/subscription/disable');
    return (data.data ?? {}) as DisableSubscriptionResponse;
  }

  /**
   * Re-enables auto-renewal on a previously disabled subscription.
   *
   * The `emailToken` must be **decrypted** from `paystackEmailToken` before calling.
   *
   * @param code - Subscription code (SUB_xxx) from `paystackSubscriptionCode`
   * @param emailToken - Plaintext email token — decrypt from `paystackEmailToken` first
   * @throws If the subscription code or token is invalid
   */
  async enableSubscription(code: string, emailToken: string): Promise<EnableSubscriptionResponse> {
    const { data } = await this.fetcher.post<PaystackResponse<EnableSubscriptionResponse>>(
      `${this.BASE_URL}/subscription/enable`,
      { code, token: emailToken },
      { headers: this.authHeaders },
    );

    this.assertSuccess(data, '/subscription/enable');
    return (data.data ?? {}) as EnableSubscriptionResponse;
  }

  /**
   * Returns a short-lived hosted URL where the customer manages their subscription.
   *
   * This is the billing-portal equivalent. Redirect the user to `link` from
   * the frontend — they can update their card or cancel on Paystack's hosted page.
   * All resulting state changes come back as webhooks (`subscription.disable`, etc.).
   *
   * @param code - Subscription code (SUB_xxx) from `paystackSubscriptionCode`
   * @returns Object containing the hosted Paystack management `link`
   * @throws If the subscription code is invalid or Paystack returns a failure
   */
  async getSubscriptionManageLink(code: string): Promise<GetSubscriptionManageLinkResponse> {
    const { data } = await this.fetcher.get<PaystackResponse<GetSubscriptionManageLinkResponse>>(
      `${this.BASE_URL}/subscription/${encodeURIComponent(code)}/manage/link`,
      { headers: this.authHeaders },
    );

    this.assertSuccess(data, `/subscription/${code}/manage/link`);
    return data.data!;
  }

  /**
   * Fetches full subscription details by subscription code.
   *
   * Use this in the `subscription.create` webhook handler to retrieve the
   * `email_token`, which Paystack omits from the webhook payload but is required
   * for all `disableSubscription` / `enableSubscription` calls. Encrypt and persist
   * the returned `email_token` with `EncryptionService` immediately.
   *
   * @param code - Subscription code (SUB_xxx)
   * @returns Full subscription object including `email_token`
   * @throws If the subscription code is unknown or Paystack returns a failure
   */
  async fetchSubscription(code: string): Promise<FetchSubscriptionResponse> {
    const { data } = await this.fetcher.get<PaystackResponse<FetchSubscriptionResponse>>(
      `${this.BASE_URL}/subscription/${encodeURIComponent(code)}`,
      { headers: this.authHeaders },
    );

    this.assertSuccess(data, `/subscription/${code}`);
    return data.data!;
  }

  // ---------------------------------------------------------------------------
  // Webhook
  // ---------------------------------------------------------------------------

  /**
   * Verifies a Paystack webhook signature (HMAC-SHA512 over the raw request body).
   *
   * Paystack reuses `PAYSTACK_SECRET_KEY` as the HMAC key — there is no separate
   * webhook secret. Pass the **raw** `Buffer` (not parsed JSON) to get a correct
   * digest. The webhook route must use `express.raw`, not the JSON body parser.
   *
   * @param rawBody - Unmodified request body buffer from the Paystack webhook request
   * @param signature - Value of the `x-paystack-signature` request header
   * @returns `true` if the signature is valid; `false` if tampered or forged
   */
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const hash = crypto.createHmac('sha512', this.secretKey).update(rawBody).digest('hex');
    return hash === signature;
  }

  // ---------------------------------------------------------------------------
  // Static helpers
  // ---------------------------------------------------------------------------

  /**
   * Converts a naira amount to kobo (Paystack's smallest currency unit).
   *
   * @example
   * PaystackService.toKobo(4500)  // → 450000
   * PaystackService.toKobo(50)    // → 5000  (trial verification charge)
   */
  static ToKobo(naira: number): number {
    return Math.round(naira * 100);
  }

  /**
   * Converts a kobo amount to naira.
   *
   * @example
   * PaystackService.fromKobo(450000)  // → 4500
   */
  static FromKobo(kobo: number): number {
    return kobo / 100;
  }

  /**
   * Derives a stable, privacy-preserving trial abuse-guard key from an email address.
   *
   * Returns `sha256(lowercase(trim(email)))`. Stored in `SusbcriptionFreeTrials.emailHash`
   * and survives account deletion, so a re-registered account with the same email cannot
   * claim a second free trial. The hash is not reversible PII (NDPR data-minimisation).
   *
   * @param email - Raw customer email address (any casing, with or without whitespace)
   * @returns Hex-encoded SHA-256 hash of the normalised email
   */
  static EmailHash(email: string): string {
    return emailTrialHash(email);
  }

  /**
   * Derives a stable idempotency key from any Paystack webhook event.
   *
   * Uses a waterfall over known unique fields, prefixed by the event type so
   * two events sharing the same resource code (e.g. `subscription.disable` and
   * `subscription.not_renew` on the same `SUB_xxx`) never collide:
   *
   * ```
   * data.reference  →  data.invoice_code  →  data.subscription_code  →  data.id
   * ```
   *
   * Falls back to `sha256(eventType + serialisedData)` for unknown event shapes —
   * guarantees uniqueness but loses retry-safety (retry with a different body would
   * re-process the event). Log a warning when the fallback fires.
   *
   * Pass a server-generated `reference` when calling `initializeTransaction` so
   * that `charge.success` events always resolve via the first waterfall arm.
   *
   * @param event - Parsed Paystack webhook event
   * @returns Stable string key for `PaystackWebhookEvent.eventId`
   */
  static GetEventId(event: PaystackWebhookEvent): string {
    const { event: type, data } = event;
    const d = data as Record<string, unknown>;

    const primaryKey =
      (typeof d['reference'] === 'string' ? d['reference'] : undefined) ??
      (typeof d['invoice_code'] === 'string' ? d['invoice_code'] : undefined) ??
      (typeof d['subscription_code'] === 'string' ? d['subscription_code'] : undefined) ??
      (d['id'] != null ? String(d['id']) : undefined);

    if (primaryKey) {
      return `${type}:${primaryKey}`;
    }

    return crypto
      .createHash('sha256')
      .update(`${type}:${JSON.stringify(data)}`)
      .digest('hex');
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private get authHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${this.secretKey}` };
  }

  /**
   * Guards against Paystack's business-logic failure pattern: HTTP 200 with
   * `status: false` (e.g. duplicate subscription, invalid plan code, bad token).
   * Throws with Paystack's own message so callers surface the real reason.
   */
  private assertSuccess<T>(response: PaystackResponse<T>, path: string): void {
    if (!response.status) {
      this.logger.error(`Paystack ${path} failed: ${response.message}`);
      throw new Error(response.message || `Paystack request failed: ${path}`);
    }
  }
}
