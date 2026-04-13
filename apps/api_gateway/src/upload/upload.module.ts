import { memoryStorage } from 'multer';

import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MulterModule.register({ storage: memoryStorage() }),
    UserModule,
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
