import { lastValueFrom, timeout } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';
import { Queue } from 'bullmq';

import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';

import {
  CreateCheckoutSessionResponse,
  CreatePortalSessionResponse,
  Empty,
  PAYMENT_PACKAGE_NAME,
  PAYMENT_SERVICE_NAME,
  PaymentServiceClient,
} from '@fintrack/types/protos/payment/payment';
import { PrismaService } from '@fintrack/database/service';
import { Prisma } from '@fintrack/database/types';
import dayjs from '@fintrack/utils/date';
import {
  CREATE_CHECKOUT_SESSION_JOB,
  FCM_NOTIFICATION_JOB,
  FCM_NOTIFICATION_QUEUE,
  INVOICE_PAID_JOB,
  INVOICE_PAYMENT_FAILED_JOB,
  PAYMENT_QUEUE,
  SUBSCRIPTION_ACTIVATED_JOB,
  SUBSCRIPTION_DEACTIVATED_JOB,
  SUBSCRIPTION_DELETED_JOB,
} from '@fintrack/types/constants/queus.constants';
import { PaystackService } from '@fintrack/common/services/paystack.service';
import {
  ChargeSuccessEvent,
  InvoiceCreateEvent,
  InvoiceUpdateEvent,
  InvoicePaymentFailedEvent,
  SubscriptionCreateEvent,
  SubscriptionDisableEvent,
  SubscriptionNotRenewEvent,
  PaymmentMetadata,
  PaystackEvent,
} from '@fintrack/types/interfaces/payment';
import {
  PRO_PLAN_KEY,
  TRIAL_KEY,
  TRIAL_DURATION_DAYS,
} from '@fintrack/types/constants/payment.constants';
import { EncryptionService } from '@fintrack/common/services/encryption.service';
import { UsageService } from '../usage/usage.service';

/**
 * Service Responsible for interacting with the payment microservice
 * Handles GRPC Requests for payments and subscriptions
 *
 * @class PaymentService
 */
@Injectable()
export class PaymentService {
  private grpcPaymentService: PaymentServiceClient;
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly usageService: UsageService,
    private readonly paystackService: PaystackService,
    private readonly encryptionService: EncryptionService,
    @InjectQueue(PAYMENT_QUEUE) private readonly paymentQueue: Queue,
    @InjectQueue(FCM_NOTIFICATION_QUEUE) private readonly fcmQueue: Queue,
    @Inject(PAYMENT_PACKAGE_NAME) private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.grpcPaymentService =
      this.client.getService<PaymentServiceClient>(PAYMENT_SERVICE_NAME);
  }

  /**
   * @description Create a checkout session for a user
   *
   * @async
   * @public
   * @param {{userId: string, origin: string}} data object containing userId and origin
   * @returns {Promise<CreateCheckoutSessionResponse>} checkout session response
   * @throws {RequestTimeoutException} If the payment microservice times out (mapped from 25s timeout)
   * @throws {BadRequestException} If the webhook signature verification fails
   * @throws {InternalServerErrorException} If the webhook processing fails
   */
  async createCheckoutSession({
    userId,
    originUrl,
  }: {
    userId: string;
    originUrl: string;
  }): Promise<CreateCheckoutSessionResponse> {
    const metadata = new Metadata();
    metadata.add('x-user-id', userId);

    return lastValueFrom(
      this.grpcPaymentService
        .createCheckoutSession({ originUrl }, metadata)
        .pipe(timeout(25000)),
    );
  }

  /**
   * @description Create a portal session for a user
   *
   * @async
   * @public
   * @param {string} userId The user id
   * @param {string} originUrl The origin url
   * @returns {Promise<CreatePortalSessionResponse>} portal session response
   * @throws {RequestTimeoutException} If the payment microservice times out (mapped from 25s timeout)
   */
  async createPortalSession({
    userId,
    originUrl,
  }: {
    userId: string;
    originUrl: string;
  }): Promise<CreatePortalSessionResponse> {
    const metadata = new Metadata();
    metadata.add('x-user-id', userId);

    return lastValueFrom(
      this.grpcPaymentService
        .createPortalSession({ originUrl }, metadata)
        .pipe(timeout(25000)),
    );
  }

  /**
   * @description Start the 2-month free Pro trial for a user.
   * Delegates to the payment microservice which initializes a ₦50 card-verification
   * charge. The actual subscription creation and refund happen in the charge.success
   * webhook handler once the user completes the Paystack card capture.
   *
   * @async
   * @public
   * @param {{userId: string, originUrl: string}} data userId and frontend origin for the callback URL
   * @returns {Promise<CreateCheckoutSessionResponse>} Paystack hosted payment URL
   * @throws {RequestTimeoutException} If the payment microservice times out (25s)
   */
  async createTrialSession({
    userId,
    originUrl,
  }: {
    userId: string;
    originUrl: string;
  }): Promise<CreateCheckoutSessionResponse> {
    const metadata = new Metadata();
    metadata.add('x-user-id', userId);

    const { checkoutSessionUrl } = await lastValueFrom(
      this.grpcPaymentService
        .createTrialSession({ originUrl }, metadata)
        .pipe(timeout(25000)),
    );
    return { checkoutSessionUrl };
  }

  /**
   * @description Cancel (disable auto-renewal on) the authenticated user's subscription.
   * The user retains Pro access until paystackCurrentPeriodEnd — actual downgrade
   * is handled by the scheduler sweep at period end.
   *
   * @async
   * @public
   * @param {{userId: string}} data The authenticated user id
   * @returns {Promise<Empty>} Empty response on success
   * @throws {RequestTimeoutException} If the payment microservice times out (25s)
   */
  async cancelSubscription({ userId }: { userId: string }): Promise<Empty> {
    const metadata = new Metadata();
    metadata.add('x-user-id', userId);

    return lastValueFrom(
      this.grpcPaymentService
        .cancelSubscription({}, metadata)
        .pipe(timeout(25000)),
    );
  }

  /**
   * @description Resume (re-enable auto-renewal on) a previously cancelled subscription.
   * Only valid while the subscription is still within its current billing period.
   *
   * @async
   * @public
   * @param {{userId: string}} data The authenticated user id
   * @returns {Promise<Empty>} Empty response on success
   * @throws {RequestTimeoutException} If the payment microservice times out (25s)
   */
  async resumeSubscription({ userId }: { userId: string }): Promise<Empty> {
    const metadata = new Metadata();
    metadata.add('x-user-id', userId);

    const result = await lastValueFrom(
      this.grpcPaymentService
        .resumeSubscription({}, metadata)
        .pipe(timeout(25000)),
    );

    // Paystack doesn't fire a webhook for re-enabling — update DB and notify here.
    const subscription = await this.prisma.subscription.update({
      where: { userId },
      data: { status: 'ACTIVE' },
      include: { user: { select: { email: true, firstName: true } } },
    });

    this.paymentQueue.add(SUBSCRIPTION_ACTIVATED_JOB, {
      email: subscription.user.email,
      firstName: subscription.user.firstName,
      planName: 'PRO',
      nextBillingDate: subscription.paystackCurrentPeriodEnd
        ? dayjs(subscription.paystackCurrentPeriodEnd).format('MMMM D, YYYY')
        : '',
    });

    return result;
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    //* Verify Signature
    if (!this.paystackService.verifyWebhookSignature(rawBody, signature)) {
      throw new BadRequestException('Invalid Paystack signature');
    }
    const event = JSON.parse(rawBody.toString()) as PaystackEvent;

    //* idempotency — derive a stable key (Paystack has no top-level event id)
    const eventId = PaystackService.GetEventId(event);
    try {
      await this.prisma.paystackWebhookEvent.create({
        data: { eventId, eventType: event.event },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      )
        return; // event already processed
      throw new InternalServerErrorException('Failed to record webhook');
    }

    // 3. dispatch
    switch (event.event) {
      case 'charge.success':
        return this.handleChargeSuccess(event as ChargeSuccessEvent);
      case 'subscription.create':
        return this.handleSubscriptionCreate(event as SubscriptionCreateEvent);
      case 'invoice.create':
        return this.handleUpcomingInvoice(event as InvoiceCreateEvent); // ~3 days pre-charge
      case 'invoice.update':
        return this.handleInvoicePaid(event as InvoiceUpdateEvent);
      case 'invoice.payment_failed':
        return this.handleInvoiceFailed(event as InvoicePaymentFailedEvent);
      case 'subscription.disable':
        return this.subscriptionDisable(event as SubscriptionDisableEvent);
      case 'subscription.not_renew':
        return this.handleSubscriptionCancelled(
          event as SubscriptionNotRenewEvent,
        );
      default:
        this.logger.warn(`Unhandled: ${event.event}`);
    }
  }

  private async handleChargeSuccess(event: ChargeSuccessEvent) {
    const { metadata, customer, authorization, reference } = event.data;

    const { userId, purpose } = metadata as unknown as PaymmentMetadata;
    if (!userId || !purpose) return;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    if (purpose === TRIAL_KEY) {
      const trialStarts = dayjs();
      const trialEnds = trialStarts.add(Number(TRIAL_DURATION_DAYS), 'day');

      // Schedule the recurring subscription — first charge fires at trialEnds.
      // subscription.create webhook will write codes/tokens and reset usage trackers.
      await this.paystackService.createSubscription({
        customer: customer.customer_code,
        plan: this.configService.getOrThrow('PAYSTACK_PRO_MONTHLY_PRICE_ID'),
        authorization: authorization.authorization_code,
        start_date: trialEnds.toISOString(),
      });

      await this.prisma.$transaction(
        async (tx) => {
          await tx.subscription.update({
            where: { userId },
            data: {
              plan: 'PRO',
              status: 'ACTIVE',
              paystackCustomerCode: customer.customer_code,
            },
          });

          await tx.susbcriptionFreeTrials.create({
            data: {
              emailHash: PaystackService.EmailHash(user.email),
              userId,
              trialStartsAt: trialStarts.toDate(),
              trialEndsAt: trialEnds.toDate(),
            },
          });
        },
        {
          maxWait: 10000,
          timeout: 30000,
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      await this.paystackService
        .refund({ transaction: reference })
        .catch((e) =>
          this.logger.warn(`Verification refund failed: ${e.message}`),
        );

      return;
    }

    if (purpose === PRO_PLAN_KEY) {
      // Paystack auto-creates a subscription via the plan code in initializeTransaction.
      // subscription.create webhook will write codes/tokens and reset usage trackers.
      await this.prisma.subscription.update({
        where: { userId },
        data: {
          plan: 'PRO',
          status: 'ACTIVE',
          paystackCustomerCode: customer.customer_code,
        },
      });

      return;
    }

    this.logger.warn(
      `Unsupported purpose '${purpose}' for charge.success ${reference}`,
    );
  }

  // ---------------------------------------------------------------------------
  // subscription.create — authoritative writer for subscription codes / tokens
  // ---------------------------------------------------------------------------

  private async handleSubscriptionCreate(event: SubscriptionCreateEvent) {
    const {
      subscription_code,
      customer,
      plan,
      authorization,
      next_payment_date,
    } = event.data;

    const subscription = await this.prisma.subscription.findFirst({
      where: { paystackCustomerCode: customer.customer_code },
      include: { user: { select: { email: true, firstName: true } } },
    });

    if (!subscription) {
      this.logger.warn(
        `subscription.create: no DB record for customer ${customer.customer_code}`,
      );
      return;
    }

    // Paystack omits email_token from the webhook — fetch it from the API.
    const { email_token } =
      await this.paystackService.fetchSubscription(subscription_code);

    const { userId } = subscription;
    const periodStart = dayjs();
    const periodEnd = next_payment_date
      ? dayjs(next_payment_date)
      : (this.logger.warn(
          `subscription.create: missing next_payment_date for ${subscription_code}`,
        ),
        periodStart.add(30, 'day'));

    await this.prisma.$transaction(
      async (tx) => {
        await tx.subscription.update({
          where: { userId },
          data: {
            paystackSubscriptionCode: subscription_code,
            paystackEmailToken: this.encryptionService.encrypt(email_token),
            paystackAuthorizationCode: this.encryptionService.encrypt(
              authorization.authorization_code,
            ),
            paystackPlanCode: plan.plan_code,
            paystackCurrentPeriodStart: periodStart.toDate(),
            paystackCurrentPeriodEnd: periodEnd.toDate(),
          },
        });

        await this.resetUsageTracker(tx, {
          userId,
          periodStart: periodStart.toDate(),
          periodEnd: periodEnd.toDate(),
        });
      },
      {
        maxWait: 10000,
        timeout: 30000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    void this.usageService.invalidateGatedUsageCache(userId);
    this.paymentQueue.add(CREATE_CHECKOUT_SESSION_JOB, {
      email: subscription.user.email,
      firstName: subscription.user.firstName,
      planName: plan.name,
      billingInterval: plan.interval,
      currency: 'NGN',
      amount: PaystackService.FromKobo(event.data.amount),
    });
  }

  // ---------------------------------------------------------------------------
  // invoice.create — upcoming charge notification (~3 days before renewal)
  // ---------------------------------------------------------------------------

  private async handleUpcomingInvoice(event: InvoiceCreateEvent) {
    const { subscription, amount } = event.data;

    const dbSub = await this.prisma.subscription.findFirst({
      where: { paystackSubscriptionCode: subscription.subscription_code },
      include: { user: { select: { id: true } } },
    });

    if (!dbSub) {
      this.logger.warn(
        `invoice.create: no subscription for code ${subscription.subscription_code}`,
      );
      return;
    }

    this.fcmQueue.add(FCM_NOTIFICATION_JOB, {
      userId: dbSub.userId,
      title: 'Upcoming charge',
      body: `Your PRO subscription renewal of ₦${PaystackService.FromKobo(amount).toLocaleString()} is coming up soon.`,
    });
  }

  // ---------------------------------------------------------------------------
  // invoice.update — successful recurring charge; advance billing period
  // ---------------------------------------------------------------------------

  private async handleInvoicePaid(event: InvoiceUpdateEvent) {
    if (!event.data.paid || event.data.status !== 'success') return;

    const {
      subscription,
      period_start,
      period_end,
      amount,
      invoice_code,
      paid_at,
      authorization,
    } = event.data;

    const dbSub = await this.prisma.subscription.findFirst({
      where: { paystackSubscriptionCode: subscription.subscription_code },
      include: { user: { select: { email: true, firstName: true } } },
    });

    if (!dbSub) {
      this.logger.warn(
        `invoice.update: no subscription for code ${subscription.subscription_code}`,
      );
      return;
    }

    const { userId } = dbSub;
    const periodStart = new Date(period_start);
    const periodEnd = new Date(period_end);

    await this.prisma.$transaction(
      async (tx) => {
        await tx.subscription.update({
          where: { userId },
          data: {
            status: 'ACTIVE',
            paystackCurrentPeriodStart: periodStart,
            paystackCurrentPeriodEnd: periodEnd,
            paystackAuthorizationCode: this.encryptionService.encrypt(
              authorization.authorization_code,
            ),
          },
        });

        await this.resetUsageTracker(tx, { userId, periodStart, periodEnd });
      },
      {
        maxWait: 10000,
        timeout: 30000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    void this.usageService.invalidateGatedUsageCache(userId);
    this.paymentQueue.add(INVOICE_PAID_JOB, {
      email: dbSub.user.email,
      firstName: dbSub.user.firstName,
      currency: 'NGN',
      amountPaid: PaystackService.FromKobo(amount).toFixed(2),
      invoiceNumber: invoice_code,
      planName: 'PRO',
      periodStart: dayjs(periodStart).format('YYYY-MM-DD'),
      periodEnd: dayjs(periodEnd).format('YYYY-MM-DD'),
      paymentDate: paid_at
        ? dayjs(paid_at).format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD'),
    });
  }

  // ---------------------------------------------------------------------------
  // invoice.payment_failed — mark subscription past due
  // ---------------------------------------------------------------------------

  private async handleInvoiceFailed(event: InvoicePaymentFailedEvent) {
    const { subscription, amount } = event.data;

    const dbSub = await this.prisma.subscription.findFirst({
      where: { paystackSubscriptionCode: subscription.subscription_code },
      include: { user: { select: { email: true, firstName: true } } },
    });

    if (!dbSub) {
      this.logger.warn(
        `invoice.payment_failed: no subscription for code ${subscription.subscription_code}`,
      );
      return;
    }

    // Disable the subscription on Paystack — no retries; user must re-subscribe.
    if (dbSub.paystackSubscriptionCode && dbSub.paystackEmailToken) {
      await this.paystackService
        .disableSubscription(
          dbSub.paystackSubscriptionCode,
          this.encryptionService.decrypt(dbSub.paystackEmailToken),
        )
        .catch((e) =>
          this.logger.warn(
            `Failed to disable subscription on Paystack: ${e.message}`,
          ),
        );
    }

    await this.prisma.subscription.update({
      where: { userId: dbSub.userId },
      data: { plan: 'FREE', status: 'ACTIVE' },
    });

    void this.usageService.invalidateGatedUsageCache(dbSub.userId);
    this.paymentQueue.add(INVOICE_PAYMENT_FAILED_JOB, {
      email: dbSub.user.email,
      firstName: dbSub.user.firstName,
      currency: 'NGN',
      amountDue: PaystackService.FromKobo(amount ?? 0).toFixed(2),
    });
  }

  // ---------------------------------------------------------------------------
  // subscription.not_renew — fires immediately when the user cancels
  // ---------------------------------------------------------------------------

  private async handleSubscriptionCancelled(event: SubscriptionNotRenewEvent) {
    const { subscription_code } = event.data;

    const dbSub = await this.prisma.subscription.findFirst({
      where: { paystackSubscriptionCode: subscription_code },
      include: { user: { select: { email: true, firstName: true } } },
    });

    if (!dbSub) {
      this.logger.warn(
        `subscription.not_renew: no DB record for ${subscription_code}`,
      );
      return;
    }

    await this.prisma.subscription.update({
      where: { userId: dbSub.userId },
      data: { status: 'NON_RENEWING' },
    });

    this.paymentQueue.add(SUBSCRIPTION_DEACTIVATED_JOB, {
      email: dbSub.user.email,
      firstName: dbSub.user.firstName,
      planName: 'PRO',
      accessEndsAt: dbSub.paystackCurrentPeriodEnd
        ? dayjs(dbSub.paystackCurrentPeriodEnd).format('MMMM D, YYYY')
        : 'your current billing period end',
    });
  }

  // ---------------------------------------------------------------------------
  // subscription.disable — fires on the next payment date (period end)
  // ---------------------------------------------------------------------------

  private async subscriptionDisable(event: SubscriptionDisableEvent) {
    const { subscription_code, status } = event.data;

    const dbSub = await this.prisma.subscription.findFirst({
      where: { paystackSubscriptionCode: subscription_code },
      include: { user: { select: { email: true, firstName: true } } },
    });

    if (!dbSub) {
      this.logger.warn(
        `subscription.disable: no DB record for ${subscription_code}`,
      );
      return;
    }

    await this.prisma.subscription.update({
      where: { userId: dbSub.userId },
      data: { plan: 'FREE', status: 'ACTIVE' },
    });

    void this.usageService.invalidateGatedUsageCache(dbSub.userId);
    this.paymentQueue.add(SUBSCRIPTION_DELETED_JOB, {
      email: dbSub.user.email,
      firstName: dbSub.user.firstName,
      previousPlanName: 'PRO',
      endedAt: dayjs().format('MMMM D, YYYY'),
    });

    this.logger.log(
      `subscription.disable: ${subscription_code} expired (status: ${status})`,
    );
  }

  private async resetUsageTracker(
    tx: Prisma.TransactionClient,
    options: {
      userId: string;
      periodStart: Date;
      periodEnd: Date;
    },
  ) {
    const { periodEnd, periodStart, userId } = options;
    await tx.usageTracker.deleteMany({
      where: {
        userId,
      },
    });
    await tx.usageTracker.createMany({
      data: [
        {
          userId,
          feature: 'AI_INSIGHTS_QUERIES',
          count: 0,
          periodStart,
          periodEnd,
        },
        {
          userId,
          feature: 'AI_CHAT_MESSAGES',
          count: 0,
          periodStart,
          periodEnd,
        },
        {
          userId,
          feature: 'RECEIPT_UPLOADS',
          count: 0,
          periodStart,
          periodEnd,
        },
      ],
      skipDuplicates: true,
    });
  }
}
