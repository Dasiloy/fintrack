import { Injectable } from '@nestjs/common';

/**
 * FinanceService.
 */
@Injectable()
export class FinanceService {
  getHello(): string {
    return 'Hello World!';
  }
}
