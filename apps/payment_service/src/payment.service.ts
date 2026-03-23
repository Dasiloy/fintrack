import Stripe from 'stripe';
import { status } from '@grpc/grpc-js';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';

import { PrismaService } from '@fintrack/database/service';
import {
  CreateCheckoutSessionResponse,
  CreatePortalSessionResponse,
  Empty,
  OriginUrlReq,
} from '@fintrack/types/protos/payment/payment';

/**
 * Service responsible for handling all payment related operations
 * Handles stripe customer creation and management
 * Handles stripe subscription creation and management
 * Handles webhooks calls from api_gateway
 *
 *
 * @class PaymentService
 */
@Injectable()
export class PaymentService implements OnModuleInit {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  // ================================================================
  //. MODULE INITIALIZTION === Setup Stripe Client
  // ================================================================
  onModuleInit() {
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

      if (subscription.stripeSubscriptionId) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Customer already has a subscription',
        });
      }

      const customer = await this.stripe.customers.create({
        email: subscription.user.email,
      });

      const checkoutSession = await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [
          {
            price: this.configService.getOrThrow('STRIPE_PRO_MONTHLY_PRICE_ID'),
            quantity: 1,
          },
        ],
        success_url: `${data.originUrl}/dashboard`,
        cancel_url: `${data.originUrl}/pricing`,
        metadata: { userId },
        subscription_data: { metadata: { userId } },
        customer: customer.id,
      });

      return {
        checkoutSessionUrl: checkoutSession.url ?? '',
      };
    } catch (error) {
      console.log('error in createCheckoutSession', error);
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

      if (!subscription) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Customer details  missing',
        });
      }

      if (!subscription.stripeCustomerId) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Customer details  missing',
        });
      }

      const portalSession = await this.stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: data.originUrl,
      });

      return {
        portalSessionUrl: portalSession.url ?? '',
      };
    } catch (error) {
      console.log('error in createPortalSession', error);
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

      if (!subscription) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Subscription not found',
        });
      }

      if (!subscription.stripeSubscriptionId) {
        throw new RpcException({
          code: status.INVALID_ARGUMENT,
          message: 'Subscription ID not found',
        });
      }

      await this.stripe.subscriptions.cancel(
        subscription.stripeSubscriptionId,
        {
          cancellation_details: {
            feedback: 'customer_service',
          },
        },
        {
          idempotencyKey: subscription.stripeSubscriptionId,
        },
      );

      return {};
    } catch (error) {
      console.log('error in cancelSubscription', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Failed to cancel subscription',
      });
    }
  }
}
