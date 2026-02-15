import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PaymentModule } from './payment.module';
import { ReflectionService } from '@grpc/reflection';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  HealthImplementation,
  protoPath as healthCheckProtoPath,
} from 'grpc-health-check';
import {
  getServiceUrl,
  getServiceConfig,
} from '@fintrack/common/config/services';

async function bootstrap() {
  // Get Service config
  const config = getServiceConfig()['PAYMENT_SERVICE'];

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PaymentModule,
    {
      transport: Transport.GRPC,
      options: {
        package: config.NAME,
        url: getServiceUrl('PAYMENT_SERVICE'),
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
  const logger = new Logger('PAYMENT_SERVICE');

  // start microservice
  await app.listen();
  logger.log(`Running on port ${config.DEFAULT_PORT}`);
}
bootstrap();
