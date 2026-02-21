import { NotificationService } from './notification.service';

export class AppController {
  constructor(private readonly notificationService: NotificationService) {}
}
