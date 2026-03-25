import { Observable } from 'rxjs';

import { Controller, Logger, UseGuards } from '@nestjs/common';
import { GrpcMethod, Payload, RpcException } from '@nestjs/microservices';

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
 * Handles GRPC requests for creating stripe customers, checkout sessions, portal sessions and webhooks
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
}
