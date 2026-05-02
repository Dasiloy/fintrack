import { Controller } from '@nestjs/common';

import { ChatService } from './chat.service';

/**
 *
 * @class ChatController
 */
@Controller({
  path: 'chat',
})
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
}
