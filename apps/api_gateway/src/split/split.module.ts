import { Module } from '@nestjs/common';

import { SplitController } from './split.controller';
import { SplitService } from './split.service';
import { UsageModule } from '../usage/usage.module';

/**
 * Module for split expense operations.
 * Forwards requests to the Finance microservice via gRPC.
 */
@Module({
  imports: [UsageModule],
  controllers: [SplitController],
  providers: [SplitService],
})
export class SplitModule {}
