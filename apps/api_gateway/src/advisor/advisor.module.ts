import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { INSIGHTS_QUEUE } from '@fintrack/types/constants/queus.constants';

import { AdvisorController } from './advisor.controller';
import { AdvisorService } from './advisor.service';

/**
 * Module for the AI Advisor feature.
 * Exposes REST endpoints for reading AI insight records, managing their
 * read state, and triggering on-demand graph runs.
 * Uses Prisma (via the global DatabaseModule) and Redis directly —
 * no gRPC hop required since AiInsight rows live in the shared Postgres instance.
 */
@Module({
  imports: [BullModule.registerQueue({ name: INSIGHTS_QUEUE })],
  controllers: [AdvisorController],
  providers: [AdvisorService],
})
export class AdvisorModule {}
