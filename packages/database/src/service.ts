import { join } from 'node:path';
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaClient } from './generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger(PrismaService.name);
  constructor(private readonly configService: ConfigService) {
    const sslRootCert = join(process.cwd(), '..', '..', 'ca.pem');
    const connectionString = `${configService.getOrThrow<string>('DATABASE_URL')}?sslmode=verify-full&sslrootcert=${sslRootCert}`;

    const adapter = new PrismaPg({
      connectionString,
      ssl: { rejectUnauthorized: false },
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
