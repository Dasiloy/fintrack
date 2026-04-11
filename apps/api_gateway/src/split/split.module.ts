import { Module } from '@nestjs/common';

import { SplitController } from './split.controller';
import { SplitService } from './split.service';

/**
 * Module for split expense operations.
 * Forwards requests to the Finance microservice via gRPC.
 */
@Module({
  controllers: [SplitController],
  providers: [SplitService],
})
export class SplitModule {}
