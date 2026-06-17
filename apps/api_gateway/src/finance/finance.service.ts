import { Metadata } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';

import {
  ForbiddenException,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

import {
  FINANCE_PACKAGE_NAME,
  FINANCE_SERVICE_NAME,
  FinanceServiceClient,
  FinanceBoard,
  FinanceBoardHistory,
} from '@fintrack/types/protos/finance/finance';
import { SubscriptionPlan, User } from '@fintrack/database/types';

import { UsageService } from '../usage/usage.service';

/**
 * API Gateway service for the Financial Health Score board.
 *
 * Thin proxy that forwards requests to the Finance microservice via gRPC,
 * attaching the authenticated user id in metadata (`x-user-id`).
 *
 * @class FinanceService
 */
@Injectable()
export class FinanceService implements OnModuleInit {
  private financeService: FinanceServiceClient;

  constructor(
    @Inject(FINANCE_PACKAGE_NAME) private readonly client: ClientGrpc,
    private readonly usageService: UsageService,
  ) {}

  onModuleInit() {
    this.financeService =
      this.client.getService<FinanceServiceClient>(FINANCE_SERVICE_NAME);
  }

  /**
   * @description Financial Health is a Pro-only feature. Throws 403 for any user
   * not on the Pro plan (active trials are surfaced as PRO by the usage service).
   *
   * @private
   * @param {User} user Authenticated user from ApiGuard
   * @throws {ForbiddenException} when the user is not on the Pro plan
   */
  private async assertPro(user: User): Promise<void> {
    const { plan } = await this.usageService.getGatedUsage(user.id);
    if (plan !== SubscriptionPlan.PRO) {
      throw new ForbiddenException(
        'Financial Health Score is only available on the Pro plan',
      );
    }
  }

  /**
   * @description Fetch the live current-week financial health board.
   * @param {User} user Authenticated user from ApiGuard
   * @returns {Promise<FinanceBoard>}
   */
  async getBoard(user: User): Promise<FinanceBoard> {
    await this.assertPro(user);
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(this.financeService.getFinanceBoard({}, metadata));
  }

  /**
   * @description Fetch the user's weekly financial health score history
   * (most recent 12 weeks, oldest-first).
   * @param {User} user Authenticated user from ApiGuard
   * @returns {Promise<FinanceBoardHistory>}
   */
  async getHistory(user: User): Promise<FinanceBoardHistory> {
    await this.assertPro(user);
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(
      this.financeService.getFinanceBoardHistory({}, metadata),
    );
  }
}
