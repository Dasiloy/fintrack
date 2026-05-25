import { Module } from '@nestjs/common';

import { UsageModule } from '../usage/usage.module';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ExportCacheService } from './export.cache.service';

/**
 * Nest module for the analytics export center.
 *
 * Wires HTTP routes, Redis-backed export cache, plan-gated date windows
 * (via UsageModule), and in-process CSV/XLSX/PDF/PNG generators.
 *
 * Export cache invalidation on data changes is handled in Transaction, Budget,
 * Goal, and Recurring services (fire-and-forget SCAN of `export:{userId}:*`).
 *
 * @module ExportModule
 */
@Module({
  imports: [UsageModule],
  controllers: [ExportController],
  providers: [ExportService, ExportCacheService],
  exports: [ExportService],
})
export class ExportModule {}
