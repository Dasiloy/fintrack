import { Controller } from '@nestjs/common';

import { InsightService } from './insights.service';

/**
 * InsightsController — gRPC handler for synchronous insight generation.
 *
 * Used by the scheduler service when it needs a synchronous response rather
 * than fire-and-forget via BullMQ (e.g. when the result is needed immediately
 * after a post-sync hook).
 *
 * TODO: Wire @GrpcMethod once GenerateInsights is added to ai/ai.proto:
 *   rpc GenerateInsights (GenerateInsightsReq) returns (GenerateInsightsRes);
 *   Then add @GrpcMethod(AI_SERVICE_NAME, 'GenerateInsights') decorator.
 */
@Controller()
export class InsightsController {
  constructor(private readonly insightsService: InsightService) {}
}
