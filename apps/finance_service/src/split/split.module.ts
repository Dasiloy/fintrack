import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { PaginateService } from '@fintrack/common/services/paginate.service';
import { ACTIVITY_NOTIFICATION_QUEUE } from '@fintrack/types/constants/queus.constants';

import { SplitController } from './split.controller';
import { SplitService } from './split.service';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: ACTIVITY_NOTIFICATION_QUEUE }),
    TransactionModule,
  ],
  controllers: [SplitController],
  providers: [SplitService, PaginateService],
})
export class SplitModule {}
