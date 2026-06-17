import { Module } from '@nestjs/common';

import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { UsageModule } from '../usage/usage.module';

/**
 * Module for the Financial Health Score board. Forwards requests to the Finance
 * microservice via gRPC. Imports UsageModule to gate access to Pro plans.
 */
@Module({
  imports: [UsageModule],
  controllers: [FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}
