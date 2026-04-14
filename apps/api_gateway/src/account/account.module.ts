import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { MONO_QUEUE } from '@fintrack/types/constants/queus.constants';
import { TransactionModule } from '../transaction/transaction.module';
import { MonoAccountSyncProcessor } from './account.processor';
import { FcmModule } from '../fcm/fcm.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: MONO_QUEUE,
    }),
    TransactionModule,
    FcmModule,
  ],
  controllers: [AccountController],
  providers: [AccountService, MonoAccountSyncProcessor],
})
export class AccountModule {}
