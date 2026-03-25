// CRITICAL: Load environment variables FIRST, before any imports that use them
import { loadEnv } from '@fintrack/common/env/index';
loadEnv();

// Now safe to import modules that depend on environment variables
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AiModule } from './ai.module';
import { ReflectionService } from '@grpc/reflection';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  HealthImplementation,
  protoPath as healthCheckProtoPath,
} from 'grpc-health-check';
import {
  getServiceUrl,
  getServiceConfig,
  type Service,
} from '@fintrack/common/config/services';

async function bootstrap() {
  const serviceName: any = process.env.MICROSERVICE_NAME!;
  // Get Service config
  const config = getServiceConfig()[serviceName as Service];

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AiModule,
    {
      transport: Transport.GRPC,
      options: {
        package: config.NAME,
        url: getServiceUrl(serviceName),
        protoPath: [healthCheckProtoPath, require.resolve(config.PROTO_PATH)],
        onLoadPackageDefinition: (pkg, server) => {
          new ReflectionService(pkg).addToServer(server);

          // health check implementation =>> grpc server just started
          const healthImpl = new HealthImplementation({
            '': 'UNKNOWN',
          });

          // set ups grpc health status ==> grpc.health.v1.Health
          healthImpl.addToServer(server);
          healthImpl.setStatus('', 'SERVING');
        },
      },
    },
  );
  const logger = new Logger(serviceName);

  // start microservice
  await app.listen();
  logger.log(`Running on port ${process.env.AI_SERVICE_PORT}`);
}
bootstrap();
