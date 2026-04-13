import { Module } from '@nestjs/common';

import { GoalController } from './goal.controller';
import { GoalService } from './goal.service';
import { UsageModule } from '../usage/usage.module';

/**
 * Module for savings goal and contribution CRUD operations.
 * Forwards requests to the Finance microservice via gRPC.
 */
@Module({
  imports: [UsageModule],
  controllers: [GoalController],
  providers: [GoalService],
})
export class GoalModule {}
