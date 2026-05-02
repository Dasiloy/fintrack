import { Injectable, Logger } from '@nestjs/common';

/**
 *
 * @class Insightervice
 */
@Injectable()
export class InsightService {
  private readonly logger = new Logger(InsightService.name);
}
