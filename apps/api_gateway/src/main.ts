// CRITICAL: Load environment variables FIRST, before any imports that use them
import { loadEnv } from '@fintrack/common/env/index';
loadEnv();

// Now safe to import modules that depend on environment variables
import helmet from 'helmet';
import * as basicAuth from 'express-basic-auth';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  // create app
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

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
  // 4. Basic Auth For Swagger and TRPC Docs
  if (process.env.NODE_ENV === 'production') {
    app.use(
      ['/docs'],
      basicAuth({
        challenge: true,
        users: {
          [process.env.SWAGGER_DOC_USER!]: process.env.SWAGGER_DOC_PASS!,
        },
      }),
    );
  }

  /// ROUTE PREFIX
  app.setGlobalPrefix('api', {
    exclude: ['/health', '/docs'],
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

  // set up redis
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);

  class RedisIoAdapter extends IoAdapter {
    createIOServer(port: number, options?: any) {
      const server = super.createIOServer(port, options);
      server.adapter(createAdapter(pubClient, subClient));
      return server;
    }
  }

  app.useWebSocketAdapter(new RedisIoAdapter(app));

  app.enableShutdownHooks();

  // start server
  const port = Number(process.env.API_GATEWAY_PORT);
  app.listen(port, () => {
    logger.log(`Running on port ${port}`);
  });
}
bootstrap();
