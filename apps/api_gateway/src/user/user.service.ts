import type Redis from 'ioredis';

import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '@fintrack/database/service';
import { Prisma, User } from '@fintrack/database/types';
import {
  USER_SELECT,
  type GetMeResponse,
} from '@fintrack/database/user.select';
import {
  REDIS_CLIENT,
  USER_CACHE_TTL,
  USER_PROFILE_CACHE_PREFIX,
} from '@fintrack/types/constants/redis.costants';

import { UpdateMeDto, UpdateSettingsDto } from './dto/user.dto';

export type UserProfile = GetMeResponse;

/**
 * @description Manages the authenticated user's profile and notification settings with Redis cache-aside.
 *
 * ## Responsibilities
 * - Fetching and caching the current user's profile
 * - Updating user profile fields and notification settings
 * - Exposing a cache invalidation helper called after profile or avatar mutations
 *
 * ## Cache strategy
 * Cache key: `user_profile:{userId}`, TTL: USER_CACHE_TTL. On a cache miss the profile is
 * fetched from DB and written back; mutations invalidate the key immediately.
 *
 * ## Side effects
 * `updateMe` and `updateSettings` both call `invalidateUserProfileCache` to ensure stale
 * profile data is never served after a write.
 *
 * @class UserService
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * @description Returns the authenticated user's full profile, serving from Redis cache when available.
   * On a cache miss the profile is fetched from DB and written back to Redis.
   *
   * @async
   * @public
   * @param {string} userId The authenticated user's ID
   * @returns {Promise<UserProfile>} Full user profile including subscription and notification settings
   */
  async getMe(userId: string): Promise<UserProfile> {
    const cacheKey = `${USER_PROFILE_CACHE_PREFIX}:${userId}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as UserProfile;
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: USER_SELECT,
    });

    await this.redis
      .setex(cacheKey, USER_CACHE_TTL, JSON.stringify(user))
      .catch((err) =>
        this.logger.warn(`Failed to cache user profile: ${err.message}`),
      );

    return user;
  }

  /**
   * @description Updates the authenticated user's profile fields and invalidates the profile cache.
   * Only fields explicitly provided in the DTO are written; undefined fields are left unchanged.
   *
   * @async
   * @public
   * @param {User} user Authenticated user
   * @param {UpdateMeDto} dto Profile fields to update
   * @returns {Promise<UserProfile>} The updated user profile
   * @throws {NotFoundException} If the user record no longer exists (P2025)
   */
  async updateMe(user: User, dto: UpdateMeDto): Promise<UserProfile> {
    try {
      const data: Prisma.UserUpdateInput = {};
      if (dto.firstName !== undefined) data.firstName = dto.firstName;
      if (dto.lastName !== undefined) data.lastName = dto.lastName;
      if (dto.avatar !== undefined) data.avatar = dto.avatar;
      if (dto.language !== undefined) data.language = dto.language;
      if (dto.currency !== undefined) data.currency = dto.currency;
      if (dto.dateFormat !== undefined) data.dateFormat = dto.dateFormat;
      if (dto.timezone !== undefined) data.timezone = dto.timezone;

      const updated = await this.prisma.user.update({
        where: { id: user.id },
        data,
        select: USER_SELECT,
      });

      await this.invalidateUserProfileCache(user.id);
      return updated;
    } catch (error) {
      this.logger.error(`updateMe failed: ${error.message}`);
      if (error instanceof HttpException) throw error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('User not found');
      }
      throw new InternalServerErrorException('Failed to update profile');
    }
  }

  /**
   * @description Updates the user's notification settings and invalidates the profile cache.
   *
   * @async
   * @public
   * @param {string} userId The authenticated user's ID
   * @param {UpdateSettingsDto} dto Notification setting fields to update
   * @returns {Promise<void>}
   * @throws {NotFoundException} If the notification settings record does not exist (P2025)
   */
  async updateSettings(userId: string, dto: UpdateSettingsDto): Promise<void> {
    try {
      await this.prisma.notificationSetting.update({
        where: { userId },
        data: dto,
      });
      await this.invalidateUserProfileCache(userId);
    } catch (error) {
      this.logger.error(`updateSettings failed: ${error.message}`);
      if (error instanceof HttpException) throw error;
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Settings not found');
      }
      throw new InternalServerErrorException('Failed to update settings');
    }
  }

  /**
   * @description Removes the cached user profile entry for the given user.
   * Fire-and-forget — errors are logged but not re-thrown.
   *
   * @async
   * @public
   * @param {string} userId The user whose profile cache should be purged
   * @returns {Promise<void>}
   */
  async invalidateUserProfileCache(userId: string): Promise<void> {
    const cacheKey = `${USER_PROFILE_CACHE_PREFIX}:${userId}`;
    await this.redis
      .del(cacheKey)
      .catch((err) =>
        this.logger.warn(
          `Failed to invalidate user profile cache: ${err.message}`,
        ),
      );
  }
}
