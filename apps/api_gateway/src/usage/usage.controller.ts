import { Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { User } from '@fintrack/database/types';
import { StandardResponse } from '@fintrack/types/interfaces/server_response';
import { ApiGuard } from '../guards/api.guard';
import { CurrentUser } from '../decorators/current_user.decorator';
import { UsageService } from './usage.service';
import { GatedUsageResponse } from './response/usage.dto';

/**
 * Exposes gated usage data for the authenticated user.
 * Results are Redis-cached with a 10-minute TTL in UsageService.
 */
@ApiTags('Usage')
@ApiBearerAuth()
@UseGuards(ApiGuard)
@Controller({ path: 'usage' })
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get('gated')
  @ApiOperation({
    summary: 'Get gated usage',
    description:
      "Returns the user's subscription plan, limits, and resource counts. Cached in Redis for 10 minutes.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Gated usage fetched successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async getGatedUsage(
    @CurrentUser() user: User,
  ): Promise<StandardResponse<GatedUsageResponse>> {
    const data = await this.usageService.getGatedUsage(user.id);
    return {
      success: true,
      data,
      statusCode: HttpStatus.OK,
      message: 'Gated usage fetched successfully',
    };
  }
}
