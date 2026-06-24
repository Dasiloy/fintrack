import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  MessageEvent,
  Param,
  Patch,
  Post,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';

import {
  User,
  AiInsight,
  AdvisorScope,
  AdvisorChatRole,
} from '@fintrack/database/types';
import { StandardResponse } from '@fintrack/types/interfaces/server_response';
import { MacroContext } from '@fintrack/types/interfaces/insights';
import type {
  ConversationMessagePage,
  ConversationSummary,
} from '@fintrack/types/interfaces/ai';

import { AdvisorService } from './advisor.service';
import {
  GetInsightsQueryDto,
  RenameConversationDto,
  SendAdvisorMessageDto,
  UpdateAdvisorScopesDto,
} from './dto/advisor.dto';
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
  // POST /advisor/message  (stage a message, returns a stream token)
  // ================================================================
  @Post('message')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Stage an advisor message for streaming',
    description:
      'Stashes the message and returns a short-lived `streamToken`. Open the SSE ' +
      'stream at GET /advisor/message/stream?token=… to receive the reply. This ' +
      'two-step exists because SSE is GET-only and the message cannot ride in the ' +
      'stream request body.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Message staged' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async stageMessage(
    @CurrentUser() user: User,
    @Body() body: SendAdvisorMessageDto,
  ): Promise<StandardResponse<{ streamToken: string }>> {
    const data = await this.advisorService.stageMessage(user.id, body);
    return {
      success: true,
      message: 'Message staged successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  // ================================================================
  // GET /advisor/message/stream  (Server-Sent Events stream)
  // ================================================================
  @Sse('message/stream')
  @ApiOperation({
    summary: 'Stream an advisor response',
    description:
      'Streams the reply for a staged message (by `token`) as Server-Sent ' +
      'Events. Each event `data` is one advisor chunk { type, content, data }: ' +
      'type=token carries a text delta; approval_required / permission_required ' +
      'carry a JSON payload in `data`; error carries a message in `content`. ' +
      'NestJS unsubscribes from the gRPC stream automatically on disconnect.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SSE stream of advisor chunks',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  streamMessage(
    @CurrentUser() user: User,
    @Query('token') token: string,
  ): Observable<MessageEvent> {
    return this.advisorService.streamMessage(user.id, token);
  }

  // ================================================================
  // GET /advisor/conversations
  // ================================================================
  @Get('conversations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "List the user's advisor conversations",
    description:
      'Returns conversations newest-first (id, title, updatedAt). Redis-cached. ' +
      'Powers the chat history sidebar.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Conversations fetched' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getConversations(
    @CurrentUser() user: User,
  ): Promise<StandardResponse<ConversationSummary[]>> {
    const data = await this.advisorService.getConversations(user.id);
    return {
      success: true,
      message: 'Conversations fetched successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  // ================================================================
  // GET /advisor/conversations/:id/messages?cursor=&limit=
  // ================================================================
  @Get('conversations/:id/messages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get a page of a conversation's messages",
    description:
      'Cursor-paginated, resolved oldest→newest for display, with a `nextCursor` ' +
      'for the previous (older) page — drives infinite scroll-up. Ownership-enforced.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Conversation id' })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: HttpStatus.OK, description: 'Messages fetched' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getConversationMessages(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<StandardResponse<ConversationMessagePage>> {
    const data = await this.advisorService.getConversationMessages(
      user.id,
      id,
      {
        cursor,
        limit: limit ? Number(limit) : undefined,
      },
    );
    return {
      success: true,
      message: 'Messages fetched successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  // ================================================================
  // PATCH /advisor/conversations/:id
  // ================================================================
  @Patch('conversations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rename a conversation',
    description: 'Updates the conversation title. Ownership-enforced.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Conversation id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Conversation renamed' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async renameConversation(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: RenameConversationDto,
  ): Promise<StandardResponse<{ id: string; title: string; updatedAt: Date }>> {
    const data = await this.advisorService.renameConversation(
      user.id,
      id,
      body.title,
    );
    return {
      success: true,
      message: 'Conversation renamed successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  // ================================================================
  // DELETE /advisor/conversations/:id
  // ================================================================
  @Delete('conversations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a conversation',
    description:
      'Permanently deletes the conversation, its messages and its checkpointer ' +
      'thread. No archive. Ownership-enforced.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Conversation id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Conversation deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async deleteConversation(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<StandardResponse<null>> {
    await this.advisorService.deleteConversation(user.id, id);
    return {
      success: true,
      message: 'Conversation deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }

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
  // GET /advisor/macro-context
  // ================================================================
  @Get('macro-context')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get the current macro-economic context',
    description:
      'Returns the latest macro context (USD/NGN rate, food CPI, CBN rate) read ' +
      'live from the Redis cache refreshed hourly by the scheduler. This is the ' +
      'canonical source for displaying macro data on the frontend, so the value ' +
      'is never stale. Returns null when the cache is cold.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Macro context fetched successfully',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getMacroContext(): Promise<StandardResponse<MacroContext | null>> {
    const data = await this.advisorService.getMacroContext();
    return {
      success: true,
      message: 'Macro context fetched successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  // ================================================================
  // GET /advisor/scopes
  // ================================================================
  @Get('scopes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get the user's advisor consent (enabled + granted scopes)",
    description:
      'Returns whether the advisor is enabled and which data scopes the user ' +
      'has granted. Powers the advisor permissions panel.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Scopes fetched' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getScopes(
    @CurrentUser() user: User,
  ): Promise<
    StandardResponse<{ enabled: boolean; grantedScopes: AdvisorScope[] }>
  > {
    const data = await this.advisorService.getAdvisorScopes(user.id);
    return {
      success: true,
      message: 'Advisor scopes fetched successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  // ================================================================
  // PATCH /advisor/scopes
  // ================================================================
  @Patch('scopes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Update the user's advisor consent",
    description:
      'Sets the granted scopes and/or the enabled flag, busts the scopes cache, ' +
      'and records an audit entry. Returns the new consent state.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Scopes updated' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async updateScopes(
    @CurrentUser() user: User,
    @Body() body: UpdateAdvisorScopesDto,
  ): Promise<
    StandardResponse<{ enabled: boolean; grantedScopes: AdvisorScope[] }>
  > {
    const data = await this.advisorService.updateAdvisorScopes(user.id, body);
    return {
      success: true,
      message: 'Advisor scopes updated successfully',
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
