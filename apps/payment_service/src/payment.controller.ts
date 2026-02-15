import { Metadata } from '@grpc/grpc-js';

import { Controller, Logger } from '@nestjs/common';
import { Ctx, Payload } from '@nestjs/microservices';

import {
  SubscribeReq,
  SubscribeRes,
  PaymentServiceControllerMethods,
} from '@fintrack/types/protos/payment/payment';
import { RpcUser } from '@fintrack/common/decorators/rpc_user.decorator';

import { PaymentService } from './payment.service';

@Controller()
@PaymentServiceControllerMethods()
export class PaymentController {
  logger = new Logger(PaymentController.name);
  constructor(private readonly paymentService: PaymentService) {}

  async subscribe(
    @Payload() request: SubscribeReq,
    @Ctx() metadata: Metadata,
    @RpcUser() user: any,
  ): Promise<SubscribeRes> {
    return {
      message: 'Payment successsful',
    };
  }
}
