import { memoryStorage } from 'multer';

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { UserModule } from '../user/user.module';
import { TransactionModule } from '../transaction/transaction.module';
import { UsageModule } from '../usage/usage.module';

@Module({
  imports: [
    MulterModule.register({ storage: memoryStorage() }),
    UserModule,
    TransactionModule,
    UsageModule,
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
