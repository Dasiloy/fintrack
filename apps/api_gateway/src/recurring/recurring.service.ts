import { Metadata } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';

import { ClientGrpc } from '@nestjs/microservices';
import { UsageService } from '../usage/usage.service';

import {
  FINANCE_PACKAGE_NAME,
  FINANCE_SERVICE_NAME,
  FinanceServiceClient,
} from '@fintrack/types/protos/finance/finance';
import {
  Recurinrg as ProtoRecurring,
  GetRecurringsRes,
} from '@fintrack/types/protos/finance/recurring';
import { Empty } from '@fintrack/types/protos/finance/transaction';
import { User } from '@fintrack/database/types';

import {
  CreateRecurringDto,
  GetRecurringsQueryDto,
  UpdateRecurringDto,
} from './dto/recurring.dto';

/**
 * API Gateway service for recurring items.
 * Proxies HTTP requests to the Finance microservice via gRPC.
 *
 * @class RecurringService
 */
@Injectable()
export class RecurringService implements OnModuleInit {
  private financeService: FinanceServiceClient;

  constructor(
    @Inject(FINANCE_PACKAGE_NAME) private readonly client: ClientGrpc,
    private readonly usageService: UsageService,
  ) {}

  onModuleInit() {
    this.financeService =
      this.client.getService<FinanceServiceClient>(FINANCE_SERVICE_NAME);
  }

  async createRecurring(
    user: User,
    data: CreateRecurringDto,
  ): Promise<ProtoRecurring> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    const result = await lastValueFrom(
      this.financeService.createRecurring(
        {
          name: data.name,
          amount: data.amount,
          frequency: data.frequency,
          type: data.type,
          startDate: data.startDate,
          categorySlug: data.categorySlug,
          endDate: data.endDate,
          description: data.description,
          merchant: data.merchant,
        },
        metadata,
      ),
    );
    void this.usageService.invalidateGatedUsageCache(user.id);
    return result;
  }

  async getRecurrings(
    user: User,
    query: GetRecurringsQueryDto,
  ): Promise<GetRecurringsRes> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(
      this.financeService.getRecurrings({ isActive: query.isActive }, metadata),
    );
  }

  async getRecurring(user: User, id: string): Promise<ProtoRecurring> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(this.financeService.getRecurring({ id }, metadata));
  }

  async updateRecurring(
    user: User,
    id: string,
    data: UpdateRecurringDto,
  ): Promise<ProtoRecurring> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(
      this.financeService.updateRecurring({ ...data, id }, metadata),
    );
  }

  async toggleRecurring(user: User, id: string): Promise<ProtoRecurring> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(this.financeService.toggleRecurring({ id }, metadata));
  }

  async deleteRecurring(user: User, id: string): Promise<Empty> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    const result = await lastValueFrom(this.financeService.deleteRecurring({ id }, metadata));
    void this.usageService.invalidateGatedUsageCache(user.id);
    return result;
  }
}
