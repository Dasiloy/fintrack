import * as crypto from 'crypto';

import type Redis from 'ioredis';

import { Inject, Injectable, Logger } from '@nestjs/common';

import { REDIS_CLIENT } from '@fintrack/types/constants/redis.costants';
import { EXPORT_CACHE_TTL_SECONDS } from '@fintrack/types/constants/export.constants';

import type {
  CachedExport,
  ExportResult,
  GenerateExportDto,
} from './dto/generate_export.dto';

/**
 * Redis cache layer for generated exports.
 *
 * Cache key format: `export:{userId}:{type}:{format}:{sha256[:16]}`
 * TTL: EXPORT_CACHE_TTL_SECONDS (3600 s)
 *
 * @class ExportCacheService
 */
@Injectable()
export class ExportCacheService {
  private readonly logger = new Logger(ExportCacheService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  // ================================================================
  //. Key helpers
  // ================================================================

  /**
   * @description Build a deterministic Redis key from user ID and canonicalised DTO fields.
   *
   * @public
   */
  buildKey(userId: string, dto: GenerateExportDto): string {
    const canonical = JSON.stringify({
      type: dto.type,
      format: dto.format,
      startDate: dto.startDate ?? '',
      endDate: dto.endDate ?? '',
      txType: dto.txType ?? '',
      months: dto.months ?? '',
    });
    const hash = crypto
      .createHash('sha256')
      .update(canonical)
      .digest('hex')
      .slice(0, 16);
    return `export:${userId}:${dto.type}:${dto.format}:${hash}`;
  }

  // ================================================================
  //. CRUD
  // ================================================================

  /**
   * @description Read a cached export; returns null on miss or parse failure.
   *
   * @async
   * @public
   */
  async get(key: string): Promise<ExportResult | null> {
    try {
      const raw = await this.redis.get(key);
      if (!raw) return null;
      const cached: CachedExport = JSON.parse(raw);
      return {
        buffer: Buffer.from(cached.bufferBase64, 'base64'),
        filename: cached.filename,
        mimeType: cached.mimeType,
        generatedAt: cached.generatedAt,
        previewData: cached.previewData ?? null,
        cached: true,
      };
    } catch (err) {
      this.logger.warn(
        `Cache read failed for ${key}: ${(err as Error).message}`,
      );
      return null;
    }
  }

  /**
   * @description Persist an export buffer with EXPORT_CACHE_TTL_SECONDS TTL.
   *
   * @async
   * @public
   */
  async set(key: string, result: ExportResult): Promise<void> {
    try {
      const cached: CachedExport = {
        bufferBase64: result.buffer.toString('base64'),
        filename: result.filename,
        mimeType: result.mimeType,
        generatedAt: result.generatedAt,
        previewData: result.previewData ?? null,
      };
      await this.redis.setex(
        key,
        EXPORT_CACHE_TTL_SECONDS,
        JSON.stringify(cached),
      );
    } catch (err) {
      this.logger.warn(
        `Cache write failed for ${key}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * @description SCAN-delete all `export:{userId}:*` keys.
   *
   * @async
   * @public
   */
  async invalidateUser(userId: string): Promise<void> {
    try {
      const pattern = `export:v2:${userId}:*`;
      let cursor = '0';
      const keys: string[] = [];
      do {
        const [next, batch] = await this.redis.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = next;
        keys.push(...batch);
      } while (cursor !== '0');
      if (keys.length > 0) await this.redis.del(...keys);
    } catch (err) {
      this.logger.warn(
        `Cache invalidation failed for user ${userId}: ${(err as Error).message}`,
      );
    }
  }
}
