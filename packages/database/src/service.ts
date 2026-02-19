import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaNeon } from '@prisma/adapter-neon';
import { ConfigService } from '@nestjs/config';

import { PrismaClient } from './generated/prisma/index.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger(PrismaService.name);
  constructor(private readonly configService: ConfigService) {
    const connectionString = configService.getOrThrow<string>('DATABASE_URL');

    const adapter = new PrismaNeon(
      {
        connectionString,
      },
      { schema: 'public' },
    );

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
