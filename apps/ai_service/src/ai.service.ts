import { Injectable } from '@nestjs/common';

/**
 * AiService.
 */
@Injectable()
export class AiService {
  getHello(): string {
    return 'Hello World!';
  }
}
