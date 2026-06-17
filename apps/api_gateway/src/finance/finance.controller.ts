import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { User } from '@fintrack/database/types';
import {
  FinanceBoard,
  FinanceBoardHistory,
} from '@fintrack/types/protos/finance/finance';
import { StandardResponse } from '@fintrack/types/interfaces/server_response';

import { FinanceService } from './finance.service';
import { ApiGuard } from '../guards/api.guard';
import { CurrentUser } from '../decorators/current_user.decorator';

const BOARD_EXAMPLE: FinanceBoard = {
  id: 'current',
  startDate: '2026-06-15',
  endDate: '2026-06-21',
  score: 82.5,
  budgetScore: 31.5,
  savingScore: 21,
  goalScore: 20,
  splitScore: 10,
};

/**
 * HTTP controller for the Financial Health Score board.
 *
 * ## Auth
 * All routes are protected by `ApiGuard` (JWT bearer); the authenticated user
 * is injected via `@CurrentUser()`.
 *
 * ## HTTP surface
 * | Method | Route                       | Description                          |
 * |--------|-----------------------------|--------------------------------------|
 * | GET    | /api/finance/board          | Live current-week health board       |
 * | GET    | /api/finance/board/history  | Weekly score history (last 12 weeks) |
 *
 * Requests are forwarded to the Finance microservice via gRPC through
 * `FinanceService`.
 *
 * @class FinanceController
 */
@ApiTags('Finance')
@ApiBearerAuth()
@Controller({ path: 'finance' })
@UseGuards(ApiGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ================================================================
  //. Live current-week health board
  // ================================================================
  @Get('board')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the live current-week financial health board' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Financial health board fetched successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Financial health board fetched',
        data: BOARD_EXAMPLE,
      },
    },
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getBoard(
    @CurrentUser() user: User,
  ): Promise<StandardResponse<FinanceBoard>> {
    const data = await this.financeService.getBoard(user);
    return {
      data,
      message: 'Financial health board fetched',
      success: true,
      statusCode: HttpStatus.OK,
    };
  }

  // ================================================================
  //. Weekly score history
  // ================================================================
  @Get('board/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get the weekly financial health score history (last 12 weeks)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Financial health history fetched successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Financial health history fetched',
        data: [{ ...BOARD_EXAMPLE, id: 'cmh1...' }],
      },
    },
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async getHistory(
    @CurrentUser() user: User,
  ): Promise<StandardResponse<FinanceBoardHistory['history']>> {
    const res = await this.financeService.getHistory(user);
    return {
      data: res.history ?? [],
      message: 'Financial health history fetched',
      success: true,
      statusCode: HttpStatus.OK,
    };
  }
}
