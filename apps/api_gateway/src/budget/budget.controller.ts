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
import {
  Budget as ProtoBudget,
  BudgetDetail,
  GetBudgetsRes,
  GetSpendingTrendRes,
} from '@fintrack/types/protos/finance/budget';
import { StandardResponse } from '@fintrack/types/interfaces/server_response';

import {
  CreateBudgetDto,
  GetBudgetsQueryDto,
  GetSpendingTrendQueryDto,
  UpdateBudgetDto,
} from './dto/budget.dto';
import { BudgetService } from './budget.service';
import { ApiGuard } from '../guards/api.guard';
import { CurrentUser } from '../decorators/current_user.decorator';

/**
 * Controller responsible for managing user budgets.
 * Handles HTTP requests for CRUD operations on budgets and
 * forwards them to the Finance microservice via gRPC.
 *
 * @class BudgetController
 */
@ApiTags('Budgets')
@ApiBearerAuth()
@Controller({ path: 'budget' })
@UseGuards(ApiGuard)
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  // ================================================================
  //. Get budgets for a month/year
  // ================================================================
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get budgets for a given month and year' })
  @ApiQuery({ name: 'month', type: Number, required: true, description: '0-indexed month (0 = January)', example: 0 })
  @ApiQuery({ name: 'year', type: Number, required: true, description: 'Full year', example: 2026 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Budgets retrieved successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async getBudgets(
    @CurrentUser() user: User,
    @Query() query: GetBudgetsQueryDto,
  ): Promise<StandardResponse<GetBudgetsRes>> {
    const res = await this.budgetService.getBudgets(user, query);
    return {
      data: res,
      message: 'Budgets retrieved successfully',
      success: true,
      statusCode: HttpStatus.OK,
    };
  }

  // ================================================================
  //. Get spending trend
  // ================================================================
  @Get('trend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get spending trend over a lookback window' })
  @ApiQuery({ name: 'months', type: Number, required: false, description: 'Lookback window: 3, 6, or 12', example: 6 })
  @ApiResponse({ status: HttpStatus.OK, description: 'Spending trend retrieved successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async getSpendingTrend(
    @CurrentUser() user: User,
    @Query() query: GetSpendingTrendQueryDto,
  ): Promise<StandardResponse<GetSpendingTrendRes>> {
    const res = await this.budgetService.getSpendingTrend(user, query);
    return {
      data: res,
      message: 'Spending trend retrieved successfully',
      success: true,
      statusCode: HttpStatus.OK,
    };
  }

  // ================================================================
  //. Get a single budget by id
  // ================================================================
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a budget by ID including history' })
  @ApiParam({ name: 'id', type: String, required: true, description: 'Budget ID', example: 'cmnoh1rlt0001i0rqneqmzb77' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Budget retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Budget not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async getBudget(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<StandardResponse<BudgetDetail>> {
    const res = await this.budgetService.getBudget(user, id);
    return {
      data: res,
      message: 'Budget retrieved successfully',
      success: true,
      statusCode: HttpStatus.OK,
    };
  }

  // ================================================================
  //. Create a budget
  // ================================================================
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a budget' })
  @ApiBody({
    required: true,
    type: CreateBudgetDto,
    description:
      'Payload for creating a budget. Provide month (0-indexed) and year to backdate.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Budget created successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.CREATED,
        message: 'Budget created successfully',
        data: {
          id: 'cmnoh1rlt0001i0rqneqmzb77',
          name: 'Food Budget',
          amount: 500,
          description: 'Monthly food expenses',
          period: 'MONTHLY',
          carryOver: false,
          alertThreshold: 0.8,
          category: {
            name: 'Food & Dining',
            slug: 'food-and-dining',
            color: '#FF5733',
            icon: 'utensils',
          },
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
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
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Category not found',
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
  async createBudget(
    @CurrentUser() user: User,
    @Body() body: CreateBudgetDto,
  ): Promise<StandardResponse<ProtoBudget>> {
    const res = await this.budgetService.createBudget(user, body);
    return {
      data: res,
      message: 'Budget created successfully',
      success: true,
      statusCode: HttpStatus.CREATED,
    };
  }

  // ================================================================
  //. Update a budget
  // ================================================================
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a budget' })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'The ID of the budget to update',
    example: 'cmnoh1rlt0001i0rqneqmzb77',
  })
  @ApiBody({
    required: true,
    type: UpdateBudgetDto,
    description:
      'Fields to update on the budget. Amount changes are tracked in budget history.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Budget updated successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Budget updated successfully',
        data: {
          id: 'cmnoh1rlt0001i0rqneqmzb77',
          name: 'Food Budget',
          amount: 600,
          description: 'Updated monthly food expenses',
          period: 'MONTHLY',
          carryOver: false,
          alertThreshold: 0.8,
          category: {
            name: 'Food & Dining',
            slug: 'food-and-dining',
            color: '#FF5733',
            icon: 'utensils',
          },
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-04-07T00:00:00.000Z',
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
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Budget not found',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Budget not found',
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
  async updateBudget(
    @CurrentUser() user: User,
    @Body() body: UpdateBudgetDto,
    @Param('id') id: string,
  ): Promise<StandardResponse<ProtoBudget>> {
    const res = await this.budgetService.updateBudget(user, body, id);
    return {
      data: res,
      message: 'Budget updated successfully',
      success: true,
      statusCode: HttpStatus.OK,
    };
  }

  // ================================================================
  //. Delete a budget
  // ================================================================
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a budget' })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'The ID of the budget to delete',
    example: 'cmnoh1rlt0001i0rqneqmzb77',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Budget deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Budget not found',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Budget not found',
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
  async deleteBudget(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<StandardResponse<null>> {
    await this.budgetService.deleteBudget(user, id);
    return {
      data: null,
      message: 'Budget deleted successfully',
      success: true,
      statusCode: HttpStatus.NO_CONTENT,
    };
  }
}
