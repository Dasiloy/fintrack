import { Module } from '@nestjs/common';

import { RecurringController } from './recurring.controller';
import { RecurringService } from './recurring.service';

/**
 * Module for recurring item CRUD operations.
 * Forwards requests to the Finance microservice via gRPC.
 */
@Module({
  controllers: [RecurringController],
  providers: [RecurringService],
})
export class RecurringModule {}
