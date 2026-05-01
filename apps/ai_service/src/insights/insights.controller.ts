import { Controller } from '@nestjs/common';

import { InsightService } from './insights.service';

/**
 *
 * @class InsightsController
 */
@Controller({
  path: 'insights',
})
export class InsightsController {
  constructor(private readonly insightsService: InsightService) {}
}
