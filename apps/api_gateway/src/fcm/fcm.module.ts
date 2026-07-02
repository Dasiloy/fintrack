import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { FcmService } from './fcm.service';
import { FCM_NOTIFICATION_QUEUE } from '@fintrack/types/constants/queus.constants';

//fcm keys';
import { FcmProcessor } from './fcm.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: FCM_NOTIFICATION_QUEUE,
    }),
  ],
  providers: [FcmService, FcmProcessor],
  exports: [FcmService],
})
export class FcmModule {}
