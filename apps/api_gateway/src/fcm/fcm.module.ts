import * as admin from 'firebase-admin';

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { FcmService } from './fcm.service';
import { FCM_ADMIN } from '@fintrack/types/constants/fcm.constants';
import { FCM_NOTIFICATION_QUEUE } from '@fintrack/types/constants/queus.constants';

//fcm keys';
import { FcmProcessor } from './fcm.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: FCM_NOTIFICATION_QUEUE,
    }),
  ],
  providers: [
    {
      provide: FCM_ADMIN,
      useFactory: () => {
        return admin.initializeApp({
          credential: admin.credential.cert(
            require.resolve('../../../../service.json') as admin.ServiceAccount,
          ),
        });
      },
    },
    FcmService,
    FcmProcessor,
  ],
  exports: [FcmService, FCM_ADMIN],
})
export class FcmModule {}
