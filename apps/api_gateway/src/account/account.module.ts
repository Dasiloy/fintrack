import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { EncryptionService } from '@fintrack/common/services/encryption.service';

import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { MONO_QUEUE } from '@fintrack/types/constants/queus.constants';
import { TransactionModule } from '../transaction/transaction.module';
import { MonoAccountSyncProcessor } from './account.processor';
import { FcmModule } from '../fcm/fcm.module';
import { UsageModule } from '../usage/usage.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: MONO_QUEUE,
    }),
    TransactionModule,
    UsageModule,
    FcmModule,
  ],
  controllers: [AccountController],
  providers: [AccountService, MonoAccountSyncProcessor, EncryptionService],
})
export class AccountModule {}
