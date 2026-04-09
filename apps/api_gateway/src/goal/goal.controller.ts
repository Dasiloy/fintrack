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
  Goal as ProtoGoal,
  Contribution as ProtoContribution,
  GetGoalsRes,
} from '@fintrack/types/protos/finance/goal';
import { StandardResponse } from '@fintrack/types/interfaces/server_response';

import { GoalService } from './goal.service';
import { ApiGuard } from '../guards/api.guard';
import {
  CreateGoalDto,
  UpdateGoalDto,
  GetGoalsQueryDto,
  CreateContributionDto,
  UpdateContributionDto,
} from './dto/goal.dto';
import { CurrentUser } from '../decorators/current_user.decorator';

/**
 * Controller responsible for managing savings goals and contributions.
 * Forwards HTTP requests to the Finance microservice via gRPC.
 *
 * @class GoalController
 */
@ApiTags('Goals')
@ApiBearerAuth()
@Controller({ path: 'goal' })
@UseGuards(ApiGuard)
export class GoalController {
  constructor(private readonly goalService: GoalService) {}

  // ================================================================
  // Create a goal
  // ================================================================
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a savings goal' })
  @ApiBody({
    required: true,
    type: CreateGoalDto,
    description: 'Payload for creating a new savings goal',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Goal created successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.CREATED,
        message: 'Goal created successfully',
        data: {
          id: 'goal_abc123',
          name: 'Emergency Fund',
          targetDate: '2027-01-01',
          targetAmount: 5000,
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          description: 'Three months of living expenses',
          createdAt: '2026-04-08T00:00:00.000Z',
          updatedAt: '2026-04-08T00:00:00.000Z',
          contributions: [],
          contributedAmount: 0,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error or target date in the past',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Target date must be in the future',
      },
    },
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.REQUEST_TIMEOUT,
    description: 'Request timeout',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async createGoal(
    @CurrentUser() user: User,
    @Body() createGoalDto: CreateGoalDto,
  ): Promise<StandardResponse<ProtoGoal>> {
    const response = await this.goalService.createGoal(user, createGoalDto);
    return {
      success: true,
      message: 'Goal created successfully',
      statusCode: HttpStatus.CREATED,
      data: response,
    };
  }

  // ================================================================
  // Get all goals
  // ================================================================
  @Get('')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all goals for the authenticated user' })
  @ApiQuery({
    name: 'status',
    type: String,
    required: false,
    description: 'Comma-separated list of statuses to filter by',
    example: 'ACTIVE,COMPLETED',
  })
  @ApiQuery({
    name: 'priority',
    type: String,
    required: false,
    description: 'Comma-separated list of priorities to filter by',
    example: 'HIGH,MEDIUM',
  })
  @ApiQuery({
    name: 'amount',
    type: Number,
    required: false,
    description:
      'Amount threshold for filtering goals by targetAmount. Must be used with `operator`.',
    example: 1000,
  })
  @ApiQuery({
    name: 'operator',
    type: String,
    required: false,
    description:
      'Comparison operator for the `amount` filter. ' +
      'Accepted values: `gt` (>), `gte` (>=), `lt` (<), `lte` (<=), `eq` (=), `ne` (!=). ' +
      'Examples:\n' +
      '  - `operator=gte&amount=1000` → goals with targetAmount >= 1000\n' +
      '  - `operator=lt&amount=500` → goals with targetAmount < 500\n' +
      '  - `operator=eq&amount=2000` → goals with targetAmount exactly 2000',
    example: 'gte',
    enum: ['gt', 'gte', 'lt', 'lte', 'eq', 'ne'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Goals fetched successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Goals fetched successfully',
        data: [
          {
            id: 'goal_abc123',
            name: 'Emergency Fund',
            targetDate: '2027-01-01',
            targetAmount: 5000,
            priority: 'HIGH',
            status: 'IN_PROGRESS',
            contributedAmount: 1200,
            createdAt: '2026-04-08T00:00:00.000Z',
            updatedAt: '2026-04-08T00:00:00.000Z',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.REQUEST_TIMEOUT,
    description: 'Request timeout',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getGoals(
    @CurrentUser() user: User,
    @Query() query: GetGoalsQueryDto,
  ): Promise<StandardResponse<GetGoalsRes['goals']>> {
    const response = await this.goalService.getGoals(user, query);
    return {
      success: true,
      message: 'Goals fetched successfully',
      statusCode: HttpStatus.OK,
      data: response.goals ?? [],
    };
  }

  // ================================================================
  // Get a single goal
  // ================================================================
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single goal by ID with all contributions' })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'Goal ID',
    example: 'goal_abc123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Goal fetched successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Goal fetched successfully',
        data: {
          id: 'goal_abc123',
          name: 'Emergency Fund',
          targetDate: '2027-01-01',
          targetAmount: 5000,
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          contributedAmount: 1200,
          contributions: [
            {
              id: 'contrib_xyz',
              amount: 1200,
              date: '2026-04-01',
              description: 'Monthly savings deposit',
              transaction: {
                id: 'txn_abc123',
                amount: 1200,
                date: '2026-04-01',
                type: 'INCOME',
                description: 'Paycheck',
                merchant: null,
                source: 'MANUAL',
                sourceId: null,
              },
            },
          ],
          createdAt: '2026-04-08T00:00:00.000Z',
          updatedAt: '2026-04-08T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Goal not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.REQUEST_TIMEOUT,
    description: 'Request timeout',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getGoal(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<StandardResponse<ProtoGoal>> {
    const response = await this.goalService.getGoal(user, id);
    return {
      success: true,
      message: 'Goal fetched successfully',
      statusCode: HttpStatus.OK,
      data: response,
    };
  }

  // ================================================================
  // Update a goal
  // ================================================================
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a goal' })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'Goal ID',
    example: 'goal_abc123',
  })
  @ApiBody({
    required: true,
    type: UpdateGoalDto,
    description: 'Fields to update on the goal',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Goal updated successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Goal updated successfully',
        data: {
          id: 'goal_abc123',
          name: 'Emergency Fund — 6 months',
          targetAmount: 10000,
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          updatedAt: '2026-05-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Goal not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.REQUEST_TIMEOUT,
    description: 'Request timeout',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async updateGoal(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateGoalDto: UpdateGoalDto,
  ): Promise<StandardResponse<ProtoGoal>> {
    const response = await this.goalService.updateGoal(user, id, updateGoalDto);
    return {
      success: true,
      message: 'Goal updated successfully',
      statusCode: HttpStatus.OK,
      data: response,
    };
  }

  // ================================================================
  // Delete a goal
  // ================================================================
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a goal and all its contributions' })
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
    description: 'Goal ID',
    example: 'goal_abc123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Goal deleted successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Goal deleted successfully',
        data: null,
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Goal not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.REQUEST_TIMEOUT,
    description: 'Request timeout',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async deleteGoal(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<StandardResponse<null>> {
    await this.goalService.deleteGoal(user, id);
    return {
      success: true,
      message: 'Goal deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }

  // ================================================================
  // Create a contribution
  // ================================================================
  @Post(':goalId/contribution')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a contribution to a goal' })
  @ApiParam({
    name: 'goalId',
    type: String,
    required: true,
    description: 'Goal ID to contribute to',
    example: 'goal_abc123',
  })
  @ApiBody({
    required: true,
    type: CreateContributionDto,
    description: 'Contribution payload',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Contribution added successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.CREATED,
        message: 'Contribution added successfully',
        data: {
          id: 'contrib_xyz',
          amount: 250,
          date: '2026-04-01',
          description: 'Monthly savings deposit',
          createdAt: '2026-04-08T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Contribution would exceed the goal target amount',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Contribution exceeds the remaining goal target amount',
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Goal not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.REQUEST_TIMEOUT,
    description: 'Request timeout',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async contributeToGoal(
    @CurrentUser() user: User,
    @Param('goalId') goalId: string,
    @Body() createContributionDto: CreateContributionDto,
  ): Promise<StandardResponse<ProtoContribution>> {
    const response = await this.goalService.contributeToGoal(
      user,
      goalId,
      createContributionDto,
    );
    return {
      success: true,
      message: 'Contribution added successfully',
      statusCode: HttpStatus.CREATED,
      data: response,
    };
  }

  // ================================================================
  // Update a contribution
  // ================================================================
  @Patch(':goalId/contribution/:contributionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a goal contribution' })
  @ApiParam({
    name: 'goalId',
    type: String,
    required: true,
    description: 'Goal ID',
    example: 'goal_abc123',
  })
  @ApiParam({
    name: 'contributionId',
    type: String,
    required: true,
    description: 'Contribution ID to update',
    example: 'contrib_xyz',
  })
  @ApiBody({
    required: true,
    type: UpdateContributionDto,
    description: 'Fields to update on the contribution',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contribution updated successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Contribution updated successfully',
        data: {
          id: 'contrib_xyz',
          amount: 500,
          date: '2026-05-01',
          updatedAt: '2026-05-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Contribution not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Updated amount would exceed goal target',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.REQUEST_TIMEOUT,
    description: 'Request timeout',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async updateContribution(
    @CurrentUser() user: User,
    @Param('goalId') goalId: string,
    @Param('contributionId') contributionId: string,
    @Body() updateContributionDto: UpdateContributionDto,
  ): Promise<StandardResponse<ProtoContribution>> {
    const response = await this.goalService.updateContribution(
      user,
      goalId,
      contributionId,
      updateContributionDto,
    );
    return {
      success: true,
      message: 'Contribution updated successfully',
      statusCode: HttpStatus.OK,
      data: response,
    };
  }

  // ================================================================
  // Delete a contribution
  // ================================================================
  @Delete(':goalId/contribution/:contributionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a goal contribution' })
  @ApiParam({
    name: 'goalId',
    type: String,
    required: true,
    description: 'Goal ID',
    example: 'goal_abc123',
  })
  @ApiParam({
    name: 'contributionId',
    type: String,
    required: true,
    description: 'Contribution ID to delete',
    example: 'contrib_xyz',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Contribution deleted successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Contribution deleted successfully',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Contribution not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.REQUEST_TIMEOUT,
    description: 'Request timeout',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async deleteContribution(
    @CurrentUser() user: User,
    @Param('goalId') goalId: string,
    @Param('contributionId') contributionId: string,
  ): Promise<StandardResponse<null>> {
    await this.goalService.deleteContribution(user, goalId, contributionId);
    return {
      success: true,
      message: 'Contribution deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }
}
