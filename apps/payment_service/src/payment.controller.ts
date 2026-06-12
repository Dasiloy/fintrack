import { Observable } from 'rxjs';

import { Controller, Logger, UseGuards } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';

import {
  CreateCheckoutSessionResponse,
  CreatePortalSessionResponse,
  Empty,
  OriginUrlReq,
  PaymentServiceControllerMethods,
} from '@fintrack/types/protos/payment/payment';
import { RpcAuthGuard } from '@fintrack/common/guards/rpc.guard';
import { RpcUser } from '@fintrack/common/decorators/rpc_user.decorator';

import { PaymentService } from './payment.service';

/**
 * Controller responsible for handling all payment related operations
 * Handles GRPC requests for creating checkout sessions, portal sessions and webhooks
 *
 * @class PaymentController
 */
@Controller()
@UseGuards(RpcAuthGuard)
@PaymentServiceControllerMethods()
export class PaymentController {
  logger = new Logger(PaymentController.name);
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * @description Create a checkout session for a user
   *
   * @async
   * @public
   * @param {OriginUrlReq} request The request object
   * @param {string} user.id The user id
   * @returns {Promise<CreateCheckoutSessionResponse>} The checkout session response
   */
  @GrpcMethod('PaymentService', 'CreateCheckoutSession')
  createCheckoutSession(
    @Payload() request: OriginUrlReq,
    @RpcUser() user: { id: string },
  ):
    | Promise<CreateCheckoutSessionResponse>
    | Observable<CreateCheckoutSessionResponse>
    | CreateCheckoutSessionResponse {
    return this.paymentService.createCheckoutSession(user.id, request);
  }

  /**
   * @description Create a portal session for a user
   *
   * @async
   * @public
   * @param {OriginUrlReq} request The request object
   * @param {string} user.id The user id
   * @returns {Promise<CreatePortalSessionResponse>} The portal session response
   */
  @GrpcMethod('PaymentService', 'CreatePortalSession')
  createPortalSession(
    @Payload() request: OriginUrlReq,
    @RpcUser() user: { id: string },
  ):
    | Promise<CreatePortalSessionResponse>
    | Observable<CreatePortalSessionResponse>
    | CreatePortalSessionResponse {
    return this.paymentService.createPortalSession(user.id, request);
  }

  /**
   * @description Start the 2-month free Pro trial for a user.
   * Initializes a ₦50 card-verification charge via Paystack. On `charge.success`
   * the webhook handler creates the future-dated subscription and refunds the charge.
   *
   * @async
   * @public
   * @param {OriginUrlReq} request The origin URL used to build the Paystack callback
   * @param {string} user.id The authenticated user id
   * @returns {Promise<CreateCheckoutSessionResponse>} Paystack hosted payment URL
   */
  @GrpcMethod('PaymentService', 'CreateTrialSession')
  createTrialSession(
    @Payload() request: OriginUrlReq,
    @RpcUser() user: { id: string },
  ):
    | Promise<CreateCheckoutSessionResponse>
    | Observable<CreateCheckoutSessionResponse>
    | CreateCheckoutSessionResponse {
    return this.paymentService.startTrialSession(user.id, request);
  }

  /**
   * @description Cancel a subscription for a user
   *
   * @async
   * @public
   * @param {Empty} request The empty request object
   * @param {string} user.id The user id
   * @returns {Promise<Empty>} The empty response
   */
  @GrpcMethod('PaymentService', 'CancelSubscription')
  cancelSubscription(
    @RpcUser() user: { id: string },
  ): Promise<Empty> | Observable<Empty> | Empty {
    return this.paymentService.cancelSubscription(user.id);
  }

  /**
   * @description Resume a previously cancelled subscription for a user.
   * Re-enables auto-renewal on Paystack — the customer stays on their current plan.
   *
   * @async
   * @public
   * @param {string} user.id The authenticated user id
   * @returns {Promise<Empty>} Empty response on success
   */
  @GrpcMethod('PaymentService', 'ResumeSubscription')
  resumeSubscription(
    @RpcUser() user: { id: string },
  ): Promise<Empty> | Observable<Empty> | Empty {
    return this.paymentService.resumeSubscription(user.id);
  }
}
