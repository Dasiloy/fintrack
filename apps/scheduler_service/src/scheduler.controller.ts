import { Controller } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';

@Controller()
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  getHello(): string {
    return this.schedulerService.getHello();
  }
}
