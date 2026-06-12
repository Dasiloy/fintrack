import { randomUUID } from 'node:crypto';

import { Metadata, status } from '@grpc/grpc-js';

import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { PrismaService } from '@fintrack/database/service';
import {
  CreateCheckoutSessionResponse,
  CreatePortalSessionResponse,
  Empty,
  OriginUrlReq,
} from '@fintrack/types/protos/payment/payment';
import { PaystackService } from '@fintrack/common/services/paystack.service';
import {
  PRO_PLAN_PRICE,
  PRO_PLAN_KEY,
  TRIAL_KEY,
  TRIAL_VERIFICATION_AMOUNT_KOBO,
} from '@fintrack/types/constants/payment.constants';
import { PaymmentMetadata } from '@fintrack/types/interfaces/payment';
import { EncryptionService } from '@fintrack/common/services/encryption.service';
import { ConfigService } from '@nestjs/config';

/**
 * Service responsible for handling all payment related operations
 * Handles paystack customer creation and management
 * Handles paystack subscription creation and management
 * Handles webhooks calls from api_gateway
 *
 *
 * @class PaymentService
 */
@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
    private readonly paystackService: PaystackService,
  ) {}

  /**
   * @description Create a trial session for a user
   *
   * @async
   * @public
   * @param {string} userId The user id
   * @param {OriginUrlReq} data The origin url request
   * @returns {Promise<CreateCheckoutSessionResponse>} trial session response
   * @throws {RpcException} If the trial session creation fails
   */
  async startTrialSession(
    userId: string,
    data: OriginUrlReq,
  ): Promise<CreateCheckoutSessionResponse> {
    try {
      const subscription = await this.prismaService.subscription.findUnique({
        where: {
          userId: userId,
        },
        include: {
          user: true,
        },
      });

      if (!subscription) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Customer details  missing',
        });
      }

      const subscriptionTrial =
        await this.prismaService.susbcriptionFreeTrials.findUnique({
          where: {
            emailHash: PaystackService.EmailHash(subscription.user.email),
          },
        });

      if (subscriptionTrial) {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: 'Trial used',
        });
      }

      const { authorization_url } =
        await this.paystackService.initializeTransaction({
          email: subscription.user.email,
          amountKobo: TRIAL_VERIFICATION_AMOUNT_KOBO,
          reference: `trial-${userId}-${randomUUID()}`,
          callbackUrl: `${data.originUrl}/dashboard`,
          metadata: { userId, purpose: TRIAL_KEY } satisfies PaymmentMetadata,
        });

      return {
        checkoutSessionUrl: authorization_url,
      };
    } catch (error) {
      this.logger.log('error in startTrialSession', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to create trial session',
      });
    }
  }

  /**
   * @description Create a checkout session for a user
   *
   * @async
   * @public
   * @param {string} userId The user id
   * @param {OriginUrlReq} data The origin url request
   * @returns {Promise<CreateCheckoutSessionResponse>} checkout session response
   * @throws {RpcException} If the checkout session creation fails
   */
  async createCheckoutSession(
    userId: string,
    data: OriginUrlReq,
  ): Promise<CreateCheckoutSessionResponse> {
    try {
      const subscription = await this.prismaService.subscription.findUnique({
        where: {
          userId: userId,
        },
        include: {
          user: true,
        },
      });

      if (!subscription) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Customer details  missing',
        });
      }

      if (subscription.paystackSubscriptionCode) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Customer already has a subscription',
        });
      }

      const { authorization_url } =
        await this.paystackService.initializeTransaction({
          email: subscription.user.email,
          amountKobo: PRO_PLAN_PRICE,
          reference: `pro-${userId}-${randomUUID()}`,
          callbackUrl: `${data.originUrl}/dashboard`,
          plan: this.configService.getOrThrow('PAYSTACK_PRO_MONTHLY_PRICE_ID'),
          metadata: {
            userId,
            purpose: PRO_PLAN_KEY,
          } satisfies PaymmentMetadata,
        });

      return {
        checkoutSessionUrl: authorization_url ?? '',
      };
    } catch (error) {
      this.logger.log('error in createCheckoutSession', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to create checkout session',
      });
    }
  }

  /**
   * @description Create a portal session for a user
   *
   * @async
   * @public
   * @param {string} userId The user id
   * @param {OriginUrlReq} data The origin url request
   * @returns {Promise<CreatePortalSessionResponse>} portal session response
   * @throws {RpcException} If the portal session creation fails
   */
  async createPortalSession(
    userId: string,
    data: OriginUrlReq,
  ): Promise<CreatePortalSessionResponse> {
    try {
      const subscription = await this.prismaService.subscription.findUnique({
        where: {
          userId: userId,
        },
        include: {
          user: true,
        },
      });

      if (!subscription || !subscription.paystackCustomerCode) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Customer details  missing',
        });
      }

      if (!subscription.paystackSubscriptionCode) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Plan details missing',
        });
      }

      const portalSession =
        await this.paystackService.getSubscriptionManageLink(
          subscription.paystackSubscriptionCode,
        );

      return {
        portalSessionUrl: portalSession.link ?? '',
      };
    } catch (error) {
      this.logger.log('error in createPortalSession', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to create portal session',
      });
    }
  }

  /**
   * @description Cancel a subscription for a user
   *
   * @async
   * @public
   * @param {string} userId The user id
   * @returns {Promise<void>} void
   * @throws {RpcException} If the subscription cancellation fails
   */
  async cancelSubscription(userId: string): Promise<Empty> {
    try {
      const subscription = await this.prismaService.subscription.findUnique({
        where: { userId: userId },
      });

      if (
        !subscription ||
        !subscription.paystackSubscriptionCode ||
        !subscription.paystackEmailToken
      ) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Subscription not found',
        });
      }

      await this.paystackService.disableSubscription(
        subscription.paystackSubscriptionCode,
        this.encryptionService.decrypt(subscription.paystackEmailToken),
      );

      return {};
    } catch (error) {
      this.logger.log('error in cancelSubscription', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to cancel subscription',
      });
    }
  }

  /**
   * @description Resume a subscription for a user
   *
   * @async
   * @public
   * @param {string} userId The user id
   * @returns {Promise<void>} void
   * @throws {RpcException} If the subscription resumption fails
   */
  async resumeSubscription(userId: string): Promise<Empty> {
    try {
      const subscription = await this.prismaService.subscription.findUnique({
        where: { userId: userId },
      });

      if (
        !subscription ||
        !subscription.paystackSubscriptionCode ||
        !subscription.paystackEmailToken
      ) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Subscription not found',
        });
      }

      await this.paystackService.enableSubscription(
        subscription.paystackSubscriptionCode,
        this.encryptionService.decrypt(subscription.paystackEmailToken),
      );

      return {};
    } catch (error) {
      this.logger.log('error in resumeSubscription', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to resume subscription',
      });
    }
  }
}
