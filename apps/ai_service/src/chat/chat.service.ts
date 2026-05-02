import { Injectable, Logger } from '@nestjs/common';

/**
 *
 * @class ChatService
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
}
