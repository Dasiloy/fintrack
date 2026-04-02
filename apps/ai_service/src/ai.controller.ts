import { Controller } from '@nestjs/common';
import { AiService } from './ai.service';

/**
 * AiController.
 */
@Controller()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  getHello(): string {
    return this.aiService.getHello();
  }
}
