import { Module } from '@nestjs/common';

import { GoalController } from './goal.controller';
import { GoalService } from './goal.service';

/**
 * Module for savings goal and contribution CRUD operations.
 * Forwards requests to the Finance microservice via gRPC.
 */
@Module({
  controllers: [GoalController],
  providers: [GoalService],
})
export class GoalModule {}
