import { lastValueFrom, timeout } from 'rxjs';

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

import {
  PAYMENT_PACKAGE_NAME,
  PAYMENT_SERVICE_NAME,
  PaymentServiceClient,
} from '@fintrack/types/protos/payment/payment';

/**
 * Service Responsible for interacting with the payment microservice
 * Handles GRPC Requests for payments and subscriptions
 *
 * @class PaymentService
 */
@Injectable()
export class PaymentService implements OnModuleInit {
  private grpcPaymentService: PaymentServiceClient;
  constructor(
    @Inject(PAYMENT_PACKAGE_NAME) private readonly client: ClientGrpc,
  ) {}

  // ================================================================
  //. MODULE INITIALIZTION === Setup Payment Service
  // ================================================================
  onModuleInit() {
    this.grpcPaymentService =
      this.client.getService<PaymentServiceClient>(PAYMENT_SERVICE_NAME);
  }

  /**
   * @description  subscribe to paid plans, will handle plan selection and also stripe integration
   *
   * @async
   * @public
   * @returns {Promise<any>} Subscription Message
   * @throws {InternalServerErrorException} Server Error with payment process
   */
  async subscribe(): Promise<void> {
    await lastValueFrom(
      this.grpcPaymentService.subscribe({ id: '1' }).pipe(timeout(5000)),
    );
  }
}
