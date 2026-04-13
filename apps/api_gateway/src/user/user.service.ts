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
import { USER_SELECT, type GetMeResponse } from '@fintrack/database/user.select';
import {
  REDIS_CLIENT,
  USER_CACHE_TTL,
  USER_PROFILE_CACHE_PREFIX,
} from '@fintrack/types/constants/redis.costants';

import { UpdateMeDto, UpdateSettingsDto } from './dto/user.dto';

export type UserProfile = GetMeResponse;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

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
