import { Controller } from '@nestjs/common';
import { FinanceService } from './finance.service';

@Controller()
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  getHello(): string {
    return this.financeService.getHello();
  }
}
