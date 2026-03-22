import { status } from '@grpc/grpc-js';
import { Observable } from 'rxjs';

import { Controller, Logger, UseGuards } from '@nestjs/common';
import { GrpcMethod, Payload, RpcException } from '@nestjs/microservices';

import {
  CreateCheckoutSessionResponse,
  CreatePortalSessionResponse,
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
}
