import { Module } from '@nestjs/common';

import { InsightService } from './insights.service';
import { InsightsController } from './insights.controller';

@Module({
  imports: [],
  controllers: [InsightsController],
  providers: [InsightService],
})
export class InsightsModule {}
