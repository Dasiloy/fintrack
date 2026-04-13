import { Module } from '@nestjs/common';

import { RecurringController } from './recurring.controller';
import { RecurringService } from './recurring.service';
import { UsageModule } from '../usage/usage.module';

/**
 * Module for recurring item CRUD operations.
 * Forwards requests to the Finance microservice via gRPC.
 */
@Module({
  imports: [UsageModule],
  controllers: [RecurringController],
  providers: [RecurringService],
})
export class RecurringModule {}
