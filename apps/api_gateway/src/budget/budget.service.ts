import { Metadata } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';

import { ClientGrpc } from '@nestjs/microservices';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { UsageService } from '../usage/usage.service';

import {
  FINANCE_SERVICE_NAME,
  FinanceServiceClient,
} from '@fintrack/types/protos/finance/finance';
import {
  Empty,
  FINANCE_PACKAGE_NAME,
} from '@fintrack/types/protos/finance/transaction';
import { User } from '@fintrack/database/types';
import { Budget as ProtoBudget } from '@fintrack/types/protos/finance/budget';

import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';

/**
 * Service responsible for managing user budgets
 * Handles HTTP requests for CRUD operations on budgets
 * Forwards requests to the Finance microservice
 *
 * @class BudgetService
 */
@Injectable()
export class BudgetService implements OnModuleInit {
  private financeService: FinanceServiceClient;
  constructor(
    @Inject(FINANCE_PACKAGE_NAME) private readonly client: ClientGrpc,
    private readonly usageService: UsageService,
  ) {}

  onModuleInit() {
    this.financeService =
      this.client.getService<FinanceServiceClient>(FINANCE_SERVICE_NAME);
  }

  async createBudget(user: User, data: CreateBudgetDto): Promise<ProtoBudget> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    const result = await lastValueFrom(
      this.financeService.createBudget(
        {
          name: data.name,
          amount: data.amount,
          categorySlug: data.categorySlug,
          description: data.description,
          alertThreshold: data.alertThreshold,
          month: data.month,
          year: data.year,
          period: data.period,
        },
        metadata,
      ),
    );
    void this.usageService.invalidateGatedUsageCache(user.id);
    return result;
  }

  async updateBudget(
    user: User,
    data: UpdateBudgetDto,
    budgetId: string,
  ): Promise<ProtoBudget> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(
      this.financeService.updateBudget({ ...data, id: budgetId }, metadata),
    );
  }

  async deleteBudget(user: User, id: string): Promise<Empty> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    const result = await lastValueFrom(this.financeService.deleteBudget({ id }, metadata));
    void this.usageService.invalidateGatedUsageCache(user.id);
    return result;
  }
}
