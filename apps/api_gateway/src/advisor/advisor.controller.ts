import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { User, AiInsight } from '@fintrack/database/types';
import { StandardResponse } from '@fintrack/types/interfaces/server_response';

import { AdvisorService } from './advisor.service';
import { GetInsightsQueryDto } from './dto/advisor.dto';
import { ApiGuard } from '../guards/api.guard';
import { CurrentUser } from '../decorators/current_user.decorator';

/**
 * Controller for the AI Advisor module.
 * Serves cached AI insight records and manages read-state for the notification badge.
 *
 * All routes are protected by `ApiGuard` and scoped to the authenticated user —
 * no cross-user access is possible at the service layer.
 *
 * @class AdvisorController
 */
@ApiTags('Advisor')
@ApiBearerAuth()
@Controller({ path: 'advisor' })
@UseGuards(ApiGuard)
export class AdvisorController {
  constructor(private readonly advisorService: AdvisorService) {}

  // ================================================================
  // GET /advisor/insights
  // ================================================================
  @Get('insights')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get recent AI insights for the authenticated user',
    description:
      'Returns the most recent AI-generated insight records, newest first. ' +
      'The default `limit=1` response is served from Redis cache (TTL 1 h) and ' +
      'is invalidated automatically after each new graph run in the AI service.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Insights fetched successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Insights fetched successfully',
        data: [
          {
            id: 'cm_abc123',
            userId: 'user_xyz',
            generatedAt: '2026-05-27T08:00:00.000Z',
            trigger: 'DAILY',
            severity: 'INFO',
            summary:
              'Your food spend is 18% above last month. Three subscriptions remain unused.',
            anomalies: ['Food spend spike: ₦45,000 vs ₦38,000 avg'],
            goalAlerts: ['Emergency Fund is 12% behind schedule'],
            cashFlowForecast:
              '₦28,500 available after recurring bills on the 15th',
            recommendations: [
              {
                text: 'Reduce dining out by ₦5,000 this week',
                priority: 'high',
                category: 'budget',
                actionable: true,
              },
            ],
            macroContext: {
              ngnUsdRate: 1580,
              foodCpiYoY: 18.2,
              cbnPolicyRate: 26.75,
              fetchedAt: '2026-05-27T06:00:00.000Z',
            },
            readAt: null,
            notifiedAt: '2026-05-27T08:01:00.000Z',
            createdAt: '2026-05-27T08:00:00.000Z',
            updatedAt: '2026-05-27T08:00:00.000Z',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getInsights(
    @CurrentUser() user: User,
    @Query() query: GetInsightsQueryDto,
  ): Promise<StandardResponse<AiInsight[]>> {
    const data = await this.advisorService.getInsights(user.id, query.limit);
    return {
      success: true,
      message: 'Insights fetched successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  // ================================================================
  // GET /advisor/insights/unread-count
  // ================================================================
  @Get('insights/unread-count')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get the count of unread AI insights',
    description:
      'Returns the number of insights the user has not yet read. ' +
      'Cached in Redis for 5 minutes; powers the notification badge on the frontend.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unread insight count fetched successfully',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Unread count fetched successfully',
        data: { count: 3 },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getUnreadCount(
    @CurrentUser() user: User,
  ): Promise<StandardResponse<{ count: number }>> {
    const count = await this.advisorService.getUnreadCount(user.id);
    return {
      success: true,
      message: 'Unread count fetched successfully',
      statusCode: HttpStatus.OK,
      data: { count },
    };
  }

  // ================================================================
  // PATCH /advisor/insights/:id/read
  // ================================================================
  @Patch('insights/:id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark a specific insight as read',
    description:
      'Sets `readAt` on the insight to the current timestamp. ' +
      'No-ops if the insight is already read. ' +
      'Ownership is enforced — returns 404 if the insight does not belong to the caller.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'AiInsight ID',
    example: 'cm_abc123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Insight marked as read',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Insight marked as read',
        data: { id: 'cm_abc123', readAt: '2026-05-27T10:00:00.000Z' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Insight not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async markInsightRead(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<StandardResponse<AiInsight>> {
    const data = await this.advisorService.markInsightRead(user.id, id);
    return {
      success: true,
      message: 'Insight marked as read',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  // ================================================================
  // PATCH /advisor/insights/read-all
  // ================================================================
  @Patch('insights/read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark all insights as read',
    description:
      'Bulk-sets `readAt` on every unread insight for the authenticated user. ' +
      'Returns the number of records updated (0 if all were already read). ' +
      'Invalidates both the insight list cache and unread-count cache.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All insights marked as read',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'All insights marked as read',
        data: { updated: 3 },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async markAllRead(
    @CurrentUser() user: User,
  ): Promise<StandardResponse<{ updated: number }>> {
    const updated = await this.advisorService.markAllRead(user.id);
    return {
      success: true,
      message: 'All insights marked as read',
      statusCode: HttpStatus.OK,
      data: { updated },
    };
  }

  // ================================================================
  // POST /advisor/insights/trigger
  // ================================================================
  @Post('insights/trigger')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Trigger a real-time AI insights run',
    description:
      'Enqueues a manual insights graph run and returns immediately (HTTP 202). ' +
      'The AI service processes the job asynchronously — results appear in ' +
      '`GET /advisor/insights` within seconds once the graph completes. ' +
      'A 10-minute per-user cooldown prevents queue spam. ' +
      'If the cooldown is active the response still returns 202 with `queued: false` ' +
      'and the remaining `cooldownSeconds` so the client can show a retry timer.',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Insights job accepted (queued or cooldown active)',
    schema: {
      example: {
        success: true,
        statusCode: 202,
        message: 'New insights are on the way',
        data: { queued: true, cooldownSeconds: null },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async triggerInsights(@CurrentUser() user: User): Promise<
    StandardResponse<{
      queued: boolean;
      cooldownSeconds: number | null;
      limitReached: boolean;
    }>
  > {
    const result = await this.advisorService.triggerInsights(user.id);
    return {
      success: true,
      message: result.queued
        ? 'New insights are on the way'
        : result.limitReached
          ? 'Monthly insights limit reached'
          : 'Insights were recently generated — please wait before triggering again',
      statusCode: HttpStatus.ACCEPTED,
      data: {
        queued: result.queued,
        cooldownSeconds: result.cooldownSeconds ?? null,
        limitReached: result.limitReached ?? false,
      },
    };
  }
}
