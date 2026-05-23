import { Observable } from 'rxjs';

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
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { User } from '@fintrack/database/types';
import {
  Transaction as ProtoTransaction,
  GetTransactionSummaryRes,
} from '@fintrack/types/protos/finance/transaction';
import { StandardResponse } from '@fintrack/types/interfaces/server_response';

import { TransactionService } from './transaction.service';
import { ApiGuard } from '../guards/api.guard';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
} from './dto/transaction.dto';
import { CurrentUser } from '../decorators/current_user.decorator';
import { TransactionQueryDto } from './dto/transaction_query.dto';
import { TransactionSearchDto } from './dto/transaction_search.dto';

/**
 * HTTP controller for user transaction operations.
 *
 * All routes are protected by `ApiGuard` (JWT bearer token). Each handler
 * delegates to `TransactionService`, which proxies the call to the Finance
 * microservice via gRPC, then wraps the response in a `StandardResponse`.
 *
 * ## Routes
 * | Method | Path                           | Description                               |
 * |--------|--------------------------------|-------------------------------------------|
 * | POST   | /transaction                   | Create a manual transaction               |
 * | GET    | /transaction                   | List transactions (paginated + filtered)  |
 * | GET    | /transaction/summary           | Financial summary (balance, cashflow …)   |
 * | GET    | /transaction/:id               | Get a single transaction by ID            |
 * | PATCH  | /transaction/:id               | Update a transaction                      |
 * | DELETE | /transaction/:id               | Delete a transaction                      |
 * | SSE    | /transaction/draft/:id/stream  | Stream OCR extraction progress            |
 */
@ApiTags('Transactions')
@ApiBearerAuth()
@Controller({ path: 'transaction' })
@UseGuards(ApiGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  // ================================================================
  //. Create a transaction
  // ================================================================
  @Post('')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a transaction' })
  @ApiBody({
    required: true,
    type: CreateTransactionDto,
    description: 'Payload for creating a transaction',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Transaction created successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.CREATED,
        message: 'Transaction created successfully',
        data: {
          id: '123',
          amount: 100,
          date: '2026-01-01',
          type: 'INCOME',
          description: 'Lunch',
          merchant: 'Starbucks',
          category: 'Food and Dining',
          source: 'MANUAL',
          sourceId: '123',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation error',
        data: {
          errors: [
            { field: 'amount', message: 'Amount must be greater than 0' },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      },
    },
  })
  async createTransaction(
    @CurrentUser() user: User,
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<StandardResponse<ProtoTransaction>> {
    const response = await this.transactionService.createTransaction(
      user,
      createTransactionDto,
    );

    return {
      success: true,
      message: 'Transaction created successfully',
      statusCode: HttpStatus.CREATED,
      data: response,
    };
  }

  // ================================================================
  // ================================================================
  //. Search transactions by partial text (must be declared before /:id)
  // ================================================================
  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Search transactions by partial text across description, merchant, notes, narration',
  })
  async searchTransactions(
    @CurrentUser() user: User,
    @Query() dto: TransactionSearchDto,
  ): Promise<StandardResponse<ProtoTransaction[]>> {
    const response = await this.transactionService.searchTransactions(
      dto,
      user,
    );
    return {
      success: true,
      message: 'Transactions fetched successfully',
      statusCode: HttpStatus.OK,
      data: response.transactions ?? [],
    };
  }

  //. Get all transactions for a user
  // ================================================================
  @Get('')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all transactions for a user' })
  @ApiQuery({
    name: 'startDate',
    type: String,
    required: false,
    example: '2026-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    type: String,
    required: false,
    example: '2026-12-31',
  })
  @ApiQuery({
    name: 'categorySlug',
    type: String,
    required: false,
    description: 'Comma-separated slugs',
    example: 'cat-food,cat-transport',
  })
  @ApiQuery({
    name: 'type',
    type: String,
    required: false,
    description: 'Comma-separated types',
    example: 'INCOME,EXPENSE',
  })
  @ApiQuery({
    name: 'source',
    type: String,
    required: false,
    description: 'Comma-separated sources',
    example: 'MANUAL,BANK',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transactions fetched successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Transactions fetched successfully',
        data: [
          {
            id: '123',
            amount: 100,
            date: '2026-01-01',
            type: 'INCOME',
            source: 'MANUAL',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        data: null,
      },
    },
  })
  async getAllTransactions(
    @CurrentUser() user: User,
    @Query() transactionQueryDto: TransactionQueryDto,
  ): Promise<StandardResponse<ProtoTransaction[]>> {
    const response = await this.transactionService.getAllTransactions(
      user,
      transactionQueryDto,
    );

    return {
      success: true,
      message: 'Transactions fetched successfully',
      statusCode: HttpStatus.OK,
      data: response.transactions ?? [],
      meta: response.meta,
    };
  }

  // ================================================================
  // Financial summary — balance, cashflow, weekly + heatmap spending
  // ================================================================

  /**
   * @description `GET /transaction/summary` — pre-materialised financial snapshot for the
   * authenticated user. Reads from `UserBalance` (O(1)) and `MonthlyBalanceSnapshot`
   * (O(months)) — no full transaction table scan.
   *
   * The optional `months` query parameter controls how many calendar months of
   * `monthlySeries` are returned. It is capped server-side by the user's plan:
   * free users are limited to `ANALYTICS_MONTHS_LIMIT` (6), Pro users are unlimited.
   * Omitting `months` defaults to 12.
   *
   * **Route ordering**: must be declared before `GET /:id` to prevent Express
   * matching the literal string `"summary"` as an `:id` parameter.
   *
   * @public
   * @param {User} user - Authenticated user injected by `@CurrentUser()`
   * @param {string} [months] - Raw query string value; parsed to `int` before forwarding
   * @returns {Promise<StandardResponse<GetTransactionSummaryRes>>} Wrapped summary payload
   * @throws {UnauthorizedException} — invalid or missing bearer token
   * @throws {InternalServerErrorException} — unexpected Finance microservice error
   */
  @Get('summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Financial summary — net balance, monthly cashflow, weekly spending, 84-day heatmap, monthly series',
  })
  @ApiQuery({
    name: 'months',
    required: false,
    type: Number,
    description:
      'How many months of monthlySeries to return. Capped by plan (free ≤ 6, pro unlimited). Defaults to 12.',
    example: 6,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Financial summary retrieved',
    schema: {
      example: {
        success: true,
        statusCode: 200,
        message: 'Financial summary retrieved',
        data: {
          netBalance: '1500000.00',
          monthlyIncome: '350000.00',
          monthlyExpense: '210000.00',
          monthlyNet: '140000.00',
          balanceChangePct: 12.5,
          weeklySpending: [
            { date: '2026-05-12', amount: '15000.00' },
            { date: '2026-05-13', amount: '0' },
          ],
          spendingHeatmap: [{ date: '2026-02-25', amount: '0' }],
          monthlySeries: [
            { month: '2026-04', income: '320000.00', expense: '200000.00' },
            { month: '2026-05', income: '350000.00', expense: '210000.00' },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    schema: {
      example: {
        success: false,
        statusCode: 401,
        message: 'Unauthorized',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
    schema: {
      example: {
        success: false,
        statusCode: 500,
        message: 'Internal server error',
      },
    },
  })
  async getTransactionSummary(
    @CurrentUser() user: User,
    @Query('months') months?: string,
  ): Promise<StandardResponse<GetTransactionSummaryRes>> {
    const data = await this.transactionService.getTransactionSummary(
      user,
      months ? parseInt(months, 10) : undefined,
    );
    return {
      success: true,
      message: 'Financial summary retrieved',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  // ================================================================
  //. Get a transaction by id
  // ================================================================
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a transaction by id' })
  @ApiParam({ name: 'id', type: String, required: true, example: 'clx1234abc' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction fetched successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Transaction fetched successfully',
        data: {
          id: '123',
          amount: 100,
          date: '2026-01-01',
          type: 'INCOME',
          source: 'MANUAL',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        data: null,
      },
    },
  })
  async getTransactionById(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<StandardResponse<ProtoTransaction>> {
    const response = await this.transactionService.getTransactionById(id, user);

    return {
      success: true,
      message: 'Transaction fetched successfully',
      statusCode: HttpStatus.OK,
      data: response,
    };
  }

  // ================================================================
  //. Update a transaction by id
  // ================================================================
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a transaction by id' })
  @ApiParam({ name: 'id', type: String, required: true, example: 'clx1234abc' })
  @ApiBody({ required: true, type: UpdateTransactionDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction updated successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Transaction updated successfully',
        data: {
          id: '123',
          amount: 100,
          date: '2026-01-01',
          type: 'INCOME',
          source: 'MANUAL',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        data: null,
      },
    },
  })
  async updateTransactionById(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ): Promise<StandardResponse<ProtoTransaction>> {
    const response = await this.transactionService.updateTransactionById(
      id,
      user,
      updateTransactionDto,
    );

    return {
      success: true,
      message: 'Transaction updated successfully',
      statusCode: HttpStatus.OK,
      data: response,
    };
  }

  // ================================================================
  //. Delete a transaction by id
  // ================================================================
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a transaction by id' })
  @ApiParam({ name: 'id', type: String, required: true, example: 'clx1234abc' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction deleted successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Transaction deleted successfully',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Unauthorized',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        data: null,
      },
    },
  })
  async deleteTransactionById(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<StandardResponse<null>> {
    await this.transactionService.deleteTransactionById(id, user);

    return {
      success: true,
      message: 'Transaction deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }

  // ================================================================
  //. SSE support - Stream OCR updates to FE
  // ================================================================
  @Sse('draft/:draftId/stream')
  @ApiOperation({
    summary: 'Stream OCR extraction progress for a receipt draft',
  })
  @ApiParam({
    name: 'draftId',
    type: String,
    required: true,
    example: 'clx1234abc',
  })
  streamOcrDraftEvents(
    @Param('draftId') draftId: string,
    @CurrentUser() user: User,
  ): Observable<MessageEvent> {
    return this.transactionService.streamOcrDraft(user, draftId);
  }
}
