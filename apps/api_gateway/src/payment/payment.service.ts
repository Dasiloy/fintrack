import { lastValueFrom, timeout } from 'rxjs';
import Stripe from 'stripe';
import { Metadata } from '@grpc/grpc-js';
import { Queue } from 'bullmq';

import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';

import {
  CreateCheckoutSessionResponse,
  CreatePortalSessionResponse,
  PAYMENT_PACKAGE_NAME,
  PAYMENT_SERVICE_NAME,
  PaymentServiceClient,
} from '@fintrack/types/protos/payment/payment';
import { PrismaService } from '@fintrack/database/service';
import { Prisma } from '@fintrack/database/types';
import dayjs from '@fintrack/utils/date';
import {
  CREATE_CHECKOUT_SESSION_JOB,
  PAYMENT_QUEUE,
  INVOICE_PAID_JOB,
  INVOICE_PAYMENT_FAILED_JOB,
  SUBSCRIPTION_ACTIVATED_JOB,
  SUBSCRIPTION_DEACTIVATED_JOB,
  SUBSCRIPTION_DELETED_JOB,
} from '@fintrack/types/constants/queus.constants';

/**
 * Service Responsible for interacting with the payment microservice
 * Handles GRPC Requests for payments and subscriptions
 *
 * @class PaymentService
 */
@Injectable()
export class PaymentService implements OnModuleInit {
  private stripe: Stripe;
  private grpcPaymentService: PaymentServiceClient;
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @InjectQueue(PAYMENT_QUEUE) private readonly paymentQueue: Queue,
    @Inject(PAYMENT_PACKAGE_NAME) private readonly client: ClientGrpc,
  ) {}

  // ================================================================
  //. MODULE INITIALIZTION === Setup Payment Service and Stripe Client
  // ================================================================
  onModuleInit() {
    this.grpcPaymentService =
      this.client.getService<PaymentServiceClient>(PAYMENT_SERVICE_NAME);

    this.stripe = new Stripe(
      this.configService.getOrThrow('STRIPE_SECRET_KEY'),
      {
        apiVersion: '2026-02-25.clover',
        typescript: true,
        telemetry: false,
        maxNetworkRetries: 3,
      },
    );
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
   * @description Handle a webhook event from Stripe
   *
   * @async
   * @public
   * @param {Buffer} body The body of the webhook event
   * @param {string} signature The signature of the webhook event
   * @returns {Promise<void>} void
   */
  async handleWebhook(body: Buffer, signature: string): Promise<void> {
    //1. Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        this.configService.getOrThrow('STRIPE_WEBHOOK_SECRET'),
      );
    } catch (err) {
      throw new BadRequestException(
        `Webhook signature verification failed: ${err.message}`,
      );
    }

    //2. Ensure idempotency
    try {
      await this.prisma.stripeWebhookEvent.create({
        data: { eventId: event.id, eventType: event.type },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      )
        return; // Already processed — P2002 = Event handled already
      throw new InternalServerErrorException('Failed to process webhook');
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event);
        break;
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaid(event);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event);
        break;
      default:
        this.logger.warn(`Unsupported event type: ${event.type}`);
        break;
    }
  }

  /**
   * @description Handle a checkout session completed event from Stripe
   *
   * @async
   * @private
   * @param {Stripe.Event} event The event object
   * @returns {Promise<void>} void
   */
  private async handleCheckoutSessionCompleted(
    event: Stripe.Event,
  ): Promise<void> {
    try {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;

      // early return if mode is not subscription
      const mode = checkoutSession.mode;
      if (mode !== 'subscription') {
        return;
      }

      // early return if status is not complete
      const status = checkoutSession.status;
      if (status !== 'complete') {
        return;
      }

      // get subscription id
      const subscriptionId = checkoutSession.subscription as string;

      // get customer
      const customer = checkoutSession.customer as string;

      // get metadat
      const metadata = checkoutSession.metadata as { userId: string };

      // update subscription , to pro, add customerid. subscription id => fire and forget
      const subscription = await this.prisma.subscription.update({
        where: {
          userId: metadata.userId,
        },
        data: {
          plan: 'PRO',
          status: 'INCOMPLETE',
          stripeCustomerId: customer,
          stripeSubscriptionId: subscriptionId,
        },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
            },
          },
        },
      });

      if (!subscription) {
        throw new InternalServerErrorException('Failed to update subscription');
      }

      this.paymentQueue.add(CREATE_CHECKOUT_SESSION_JOB, {
        email: subscription.user.email,
        firstName: subscription.user.firstName,
        planName: subscription.plan,
        billingInterval: 'month',
        currency: 'USD',
        amount: 5,
      });
    } catch (error) {
      this.logger.error(
        'Failed to handle checkout session completed event',
        error,
      );
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Failed to handle checkout session completed event',
      );
    }
  }

  /**
   * @description Handle a invoice paid event from Stripe
   *
   * @async
   * @private
   * @param {Stripe.Event} event The event object
   * @returns {Promise<void>} void
   */
  private async handleInvoicePaid(event: Stripe.Event): Promise<void> {
    try {
      const invoice = event.data.object as Stripe.Invoice;

      // early return if status is not paid
      const status = invoice.status;
      if (status !== 'paid') {
        return;
      }

      // get line item => we only need the first one, early return if not found
      const lineItem = invoice.lines.data?.[0] as Stripe.InvoiceLineItem;
      if (!lineItem) {
        return;
      }

      // get period start and end
      const periodStart = new Date(lineItem.period.start * 1000);
      const periodEnd = new Date(lineItem.period.end * 1000);

      // atomically update subscription, drop current usage trackers, create new ones in line with stripe billing cycle
      const [subscription] = await this.prisma.$transaction([
        this.prisma.subscription.update({
          where: {
            userId: lineItem.metadata.userId,
          },
          data: {
            status: 'ACTIVE',
            stripeCancelAtPeriodEnd: false,
            stripeCurrentPeriodStart: periodStart,
            stripeCurrentPeriodEnd: periodEnd,
            stripePriceId: (lineItem as any).price.id,
          },
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
              },
            },
          },
        }),
        this.prisma.usageTracker.deleteMany({
          where: {
            userId: lineItem.metadata.userId,
          },
        }),
        this.prisma.usageTracker.createMany({
          data: [
            {
              userId: lineItem.metadata.userId,
              feature: 'AI_INSIGHTS_QUERIES',
              count: 0,
              periodStart,
              periodEnd,
            },
            {
              userId: lineItem.metadata.userId,
              feature: 'AI_CHAT_MESSAGES',
              count: 0,
              periodStart,
              periodEnd,
            },
            {
              userId: lineItem.metadata.userId,
              feature: 'RECEIPT_UPLOADS',
              count: 0,
              periodStart,
              periodEnd,
            },
          ],
          skipDuplicates: true,
        }),
      ]);

      this.paymentQueue.add(INVOICE_PAID_JOB, {
        firstName: subscription.user.firstName,
        currency: 'USD',
        amountPaid: parseFloat(String(lineItem.amount / 100)).toFixed(2),
        invoiceNumber: invoice.number,
        planName: subscription.plan,
        periodStart: dayjs(periodStart).format('YYYY-MM-DD'),
        periodEnd: dayjs(periodEnd).format('YYYY-MM-DD'),
        paymentDate: dayjs(new Date(invoice.created * 1000)).format(
          'YYYY-MM-DD',
        ),
        email: subscription.user.email,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
      });
    } catch (error) {
      this.logger.error('Failed to handle invoice paid event', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Failed to handle invoice paid event',
      );
    }
  }

  /**
   * @description Handle a invoice payment failed event from Stripe
   *
   * @async
   * @private
   * @param {Stripe.Event} event The event object
   * @returns {Promise<void>} void
   */
  private async handleInvoicePaymentFailed(event: Stripe.Event): Promise<void> {
    try {
      const invoice = event.data.object as Stripe.Invoice;

      // get line item => we only need the first one, early return if not found
      const lineItem = invoice.lines.data?.[0] as Stripe.InvoiceLineItem;
      if (!lineItem) {
        return;
      }

      // get metadata
      const metadata = lineItem.metadata as { userId: string };

      const subscription = await this.prisma.subscription.update({
        where: {
          userId: metadata.userId,
        },
        data: {
          status: 'PAST_DUE',
        },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
            },
          },
        },
      });

      this.paymentQueue.add(INVOICE_PAYMENT_FAILED_JOB, {
        firstName: subscription.user.firstName,
        currency: 'USD',
        amountDue: parseFloat(String(lineItem.amount / 100)).toFixed(2),
        email: subscription.user.email,
      });
    } catch (error) {
      this.logger.error('Failed to handle invoice payment failed event', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Failed to handle invoice payment failed event',
      );
    }
  }

  /**
   * @description Handle a subscription updated event from Stripe
   *
   * @async
   * @private
   * @param {Stripe.Event} event The event object
   * @returns {Promise<void>} void
   */
  private async handleSubscriptionUpdated(event: Stripe.Event): Promise<void> {
    try {
      const subscription = event.data.object as Stripe.Subscription;

      const userId = subscription.metadata.userId;
      if (!userId) return;

      const currentDbSub = await this.prisma.subscription.findUnique({
        where: { userId },
      });

      // Cancellation flag set
      if (subscription.cancel_at && !currentDbSub?.stripeCancelAtPeriodEnd) {
        const sub = await this.prisma.subscription.update({
          where: { userId },
          data: { stripeCancelAtPeriodEnd: true },
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
              },
            },
          },
        });

        if (!sub) {
          throw new InternalServerErrorException(
            'Failed to update subscription',
          );
        }

        this.paymentQueue.add(SUBSCRIPTION_DEACTIVATED_JOB, {
          firstName: sub.user.firstName,
          planName: sub.plan,
          accessEndsAt: dayjs(currentDbSub?.stripeCurrentPeriodEnd).format(
            'YYYY-MM-DD',
          ),
          email: sub.user.email,
        });

        this.logger.log(
          `User ${userId} scheduled for cancellation at ${new Date(subscription.cancel_at! * 1000).toISOString()}`,
        );
        return;
      }

      // Reactivation (flag cleared)
      if (!subscription.cancel_at && currentDbSub?.stripeCancelAtPeriodEnd) {
        const sub = await this.prisma.subscription.update({
          where: { userId },
          data: {
            stripeCancelAtPeriodEnd: false,
          },
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
              },
            },
          },
        });

        if (!sub) {
          throw new InternalServerErrorException(
            'Failed to update subscription',
          );
        }

        this.paymentQueue.add(SUBSCRIPTION_ACTIVATED_JOB, {
          firstName: sub.user.firstName,
          planName: currentDbSub.plan,
          nextBillingDate: dayjs(
            new Date((subscription as any).current_period_end * 1000),
          ).format('YYYY-MM-DD'),
          email: sub.user.email,
        });
      }
    } catch (error) {
      this.logger.error('Failed to handle subscription updated event', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Failed to handle subscription updated event',
      );
    }
  }

  /**
   * @description Handle a subscription deleted event from Stripe
   *
   * @async
   * @private
   * @param {Stripe.Event} event The event object
   * @returns {Promise<void>} void
   */
  private async handleSubscriptionDeleted(event: Stripe.Event): Promise<void> {
    try {
      const subscription = event.data.object as Stripe.Subscription;

      // get metadata
      const metadata = subscription.metadata as { userId: string };

      const sub = await this.prisma.subscription.update({
        where: {
          userId: metadata.userId,
        },
        data: {
          plan: 'FREE',
          status: 'ACTIVE',
          stripeCancelAtPeriodEnd: false,
          stripeCurrentPeriodStart: null,
          stripeCurrentPeriodEnd: null,
          stripePriceId: null,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
        },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
            },
          },
        },
      });

      if (!sub) {
        throw new InternalServerErrorException('Failed to update subscription');
      }

      this.paymentQueue.add(SUBSCRIPTION_DELETED_JOB, {
        firstName: sub.user.firstName,
        planName: sub.plan,
        endedAt: dayjs(new Date()).format('YYYY-MM-DD'),
        email: sub.user.email,
      });
    } catch (error) {
      this.logger.error('Failed to handle subscription deleted event', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Failed to handle subscription deleted event',
      );
    }
  }
}
