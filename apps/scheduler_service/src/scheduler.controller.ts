import { Controller } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';

/**
 * SchedulerController.
 */
@Controller()
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}
}
