import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

import {
  getProtoIncludeDirs,
  getServiceConfig,
  getServiceUrl,
} from '@fintrack/common/config/services';

import { AdvisorService } from './advisor.service';
import { AdvisorController } from './advisor.controller';
import { AdvisorActionExecutor } from './advisor.action-executor';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: getServiceConfig()['FINANCE_SERVICE'].PACKAGE_NAME,
        useFactory: async () => {
          const config = getServiceConfig()['FINANCE_SERVICE'];
          return {
            transport: Transport.GRPC,
            options: {
              package: config.NAME,
              url: getServiceUrl('FINANCE_SERVICE'),
              protoPath: [
                ...config.PROTO_PATH.map((path) => require.resolve(path)),
              ],
              loader: { includeDirs: getProtoIncludeDirs() },
            },
          };
        },
      },
    ]),
  ],
  controllers: [AdvisorController],
  providers: [AdvisorService, AdvisorActionExecutor],
})
export class AdvisorModule {}
