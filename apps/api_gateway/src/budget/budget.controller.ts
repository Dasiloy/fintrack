import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { User } from '@fintrack/database/types';
import { Budget as ProtoBudget } from '@fintrack/types/protos/finance/budget';
import { StandardResponse } from '@fintrack/types/interfaces/server_response';

import { CreateBudgetDto, UpdateBudgetDto } from './dto/budget.dto';
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
