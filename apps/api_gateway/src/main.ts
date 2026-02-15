import helmet from 'helmet';
import * as dotenv from 'dotenv';
import * as basicAuth from 'express-basic-auth';

import { NestFactory } from '@nestjs/core';
import { Logger, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { getServiceConfig } from '@fintrack/common/config/services';

import { AppModule } from './app.module';

async function bootstrap() {
  dotenv.config();

  // get service config
  const config = getServiceConfig()['API_GATEWAY'];

  // create app
  const app = await NestFactory.create(AppModule);

  // logger for dbug purposes
  const logger = new Logger('API_GATEWAY');

  /// MIDDLEWARES
  // 1. cors
  app.enableCors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  });
  // 2. helmet
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          imgSrc: [
            `'self'`,
            'data:',
            'apollo-server-landing-page.cdn.apollographql.com',
          ],
          scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
          manifestSrc: [
            `'self'`,
            'apollo-server-landing-page.cdn.apollographql.com',
          ],
          frameSrc: [`'self'`, 'sandbox.embed.apollographql.com'],
        },
      },
    }),
  );
  // 4. Basic Auth For Swagger Docs
  app.use(
    '/docs',
    basicAuth({
      challenge: true,
      users: {
        [process.env.SWAGGER_DOC_USER!]: process.env.SWAGGER_DOC_PASS!,
      },
    }),
  );

  /// VERSIONING
  app.setGlobalPrefix('api', {
    exclude: ['/health', '/docs'],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
  });

  /// DOCUMENTATIONS
  const swaggerDoc = new DocumentBuilder()
    .setTitle('Fintrack Api Docs')
    .setDescription(
      'API documentation for Fintrack, A financial tracking tool (Nest/TypeScript) backend application.\n',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerDoc);
  SwaggerModule.setup('docs', app, document);

  // start server
  app.listen(config.DEFAULT_PORT, () => {
    logger.log(`Running on port ${config.DEFAULT_PORT}`);
  });
}
bootstrap();
