import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaClient } from './generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger(PrismaService.name);
  constructor(configService: ConfigService) {
    const databaseCaCertificate = configService.getOrThrow<string>('DATABASE_CA_CERTIFICATE');

    const sslRootCert = Buffer.from(databaseCaCertificate, 'base64').toString('utf-8');

    const adapter = new PrismaPg({
      connectionString: configService.getOrThrow<string>('DATABASE_URL'),
      ssl: { rejectUnauthorized: true, ca: sslRootCert },
      max: 8,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to DB');
  }
  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from DB');
  }
}
