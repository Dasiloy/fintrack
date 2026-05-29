import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ClientsModule, Transport } from '@nestjs/microservices';

import {
  getProtoIncludeDirs,
  getServiceConfig,
  getServiceUrl,
} from '@fintrack/common/config/services';
import {
  FCM_NOTIFICATION_QUEUE,
  INSIGHTS_QUEUE,
  TOKEN_NOTIFICATION_QUEUE,
} from '@fintrack/types/constants/queus.constants';

import { InsightService } from './insights.service';
import { InsightsController } from './insights.controller';
import { InsightsWorker } from './insights.worker';
import { InsightsOracleService } from './insights.oracle.service';

/**
 * InsightsModule — AI-powered proactive spending insights.
 *
 * ## Entry points
 *   BullMQ `INSIGHTS_QUEUE` → InsightsWorker → InsightService.runGraph()
 *   (gRPC GenerateInsights — stub until proto is extended)
 *
 * ## Dependencies wired here
 *   - `INSIGHTS_QUEUE` BullMQ consumer (InsightsWorker)
 *   - Finance service gRPC client — for goals, budgets, recurring, splits
 *   - InsightsOracleService — Redis-cached NGN rate + macro data
 *   - PrismaService, LangraphService — from global DatabaseModule / RegistoryModule
 */
@Module({
  imports: [
    BullModule.registerQueue(
      { name: INSIGHTS_QUEUE },
      { name: FCM_NOTIFICATION_QUEUE },
      { name: TOKEN_NOTIFICATION_QUEUE },
    ),
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
  controllers: [InsightsController],
  providers: [InsightService, InsightsWorker, InsightsOracleService],
  exports: [InsightService],
})
export class InsightsModule {}
