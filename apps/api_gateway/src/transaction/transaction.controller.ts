import {
  Body,
  Controller,
  Delete,
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
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { User } from '@fintrack/database/types';
import { Transaction as ProtoTransaction } from '@fintrack/types/protos/finance/transaction';
import { StandardResponse } from '@fintrack/types/interfaces/server_response';

import { TransactionService } from './transaction.service';
import { ApiGuard } from '../guards/api.guard';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
} from './dto/transaction.dto';
import { CurrentUser } from '../decorators/current_user.decorator';
import { TransactionQueryDto } from './dto/transaction_query.dto';

/**
 * Controller responsible for managing user transactions
 * Handles HTTP requests for CRUD operations on transactions
 * Forwards requests to the Transaction microservice
 *
 * @class TransactionController
 */
@ApiTags('Transactions')
@ApiBearerAuth()
@Controller({
  path: 'transaction',
})
@UseGuards(ApiGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  // ================================================================
  //. Create a transaction
  // ================================================================
  @Post('create')
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
        statusCode: HttpStatus.OK,
        message: 'Transaction created successfully',
        data: {
          transaction: {
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
            {
              field: 'amount',
              message: 'Amount must be greater than 0',
            },
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
    status: HttpStatus.REQUEST_TIMEOUT,
    description: 'Request timeout',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.REQUEST_TIMEOUT,
        message: 'Request timeout',
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
  //. Get all transactions for a user
  // ================================================================
  @Get('')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all transactions for a user' })
  @ApiQuery({
    name: 'startDate',
    type: String,
    required: false,
    description: 'The start date of the transactions',
    example: '2026-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    type: String,
    required: false,
    description: 'The end date of the transactions',
    example: '2026-01-01',
  })
  @ApiQuery({
    name: 'categorySlug',
    type: String,
    required: false,
    description:
      'The category slug of the transactions as a comma separated list',
    example: 'cat-food,cat-travel',
  })
  @ApiQuery({
    name: 'type',
    type: String,
    required: false,
    description: 'The type of the transactions as a comma separated list',
    example: 'INCOME,EXPENSE',
  })
  @ApiQuery({
    name: 'source',
    type: String,
    required: false,
    description: 'The source of the transactions as a comma separated list',
    example: 'MANUAL,OCR',
  })
  @ApiQuery({
    name: 'sourceId',
    type: String,
    required: false,
    description: 'The source id of the transactions',
    example: '123',
  })
  @ApiQuery({
    name: 'bankTransactionId',
    type: String,
    required: false,
    description: 'The bank transaction id of the transactions',
    example: '123',
  })
  @ApiQuery({
    name: 'bankAccountId',
    type: String,
    required: false,
    description: 'The bank account id of the transactions',
    example: '123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transactions fetched successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Transactions fetched successfully',
        data: {
          transactions: [
            {
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
    status: HttpStatus.REQUEST_TIMEOUT,
    description: 'Request timeout',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.REQUEST_TIMEOUT,
        message: 'Request timeout',
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
  //. Get a transaction by id
  // ================================================================
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a transaction by id' })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'The id of the transaction',
    example: 'cuwmhfnomcjvm,vjhcn3546',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction fetched successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Transaction fetched successfully',
        data: {
          transaction: {
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
    status: HttpStatus.REQUEST_TIMEOUT,
    description: 'Request timeout',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.REQUEST_TIMEOUT,
        message: 'Request timeout',
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
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'The id of the transaction',
    example: 'cuwmhfnomcjvm,vjhcn3546',
  })
  @ApiBody({
    required: true,
    type: UpdateTransactionDto,
    description: 'Payload for updating a transaction',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction updated successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Transaction updated successfully',
        data: {
          transaction: {
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
    status: HttpStatus.REQUEST_TIMEOUT,
    description: 'Request timeout',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.REQUEST_TIMEOUT,
        message: 'Request timeout',
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
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'The id of the transaction',
    example: 'cuwmhfnomcjvm,vjhcn3546',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction deleted successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Transaction deleted successfully',
        data: {
          id: 'cuwmhfnomcjvm,vjhcn3546',
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
    status: HttpStatus.REQUEST_TIMEOUT,
    description: 'Request timeout',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.REQUEST_TIMEOUT,
        message: 'Request timeout',
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
  ) {
    await this.transactionService.deleteTransactionById(id, user);

    return {
      success: true,
      message: 'Transaction deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }
}
