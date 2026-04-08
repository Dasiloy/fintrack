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
import { Recurinrg as ProtoRecurring } from '@fintrack/types/protos/finance/recurring';
import { StandardResponse } from '@fintrack/types/interfaces/server_response';

import { RecurringService } from './recurring.service';
import { ApiGuard } from '../guards/api.guard';
import { CurrentUser } from '../decorators/current_user.decorator';
import {
  CreateRecurringDto,
  GetRecurringsQueryDto,
  UpdateRecurringDto,
} from './dto/recurring.dto';

const RECURRING_EXAMPLE = {
  id: 'cmnoh1rlt0001i0rqneqmzb77',
  name: 'Netflix Subscription',
  amount: 15.99,
  type: 'EXPENSE',
  frequency: 'MONTHLY',
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: null,
  description: 'Streaming service',
  merchant: 'Netflix',
  lastRunAt: null,
  nextRunAt: '2026-05-01T00:00:00.000Z',
  isActive: true,
  category: {
    name: 'Subscriptions',
    slug: 'subscriptions',
    color: '#7c7aff',
    icon: 'repeat',
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
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
};

/**
 * Controller for managing recurring items.
 * Handles HTTP requests and forwards them to the Finance microservice via gRPC.
 *
 * @class RecurringController
 */
@ApiTags('Recurring')
@ApiBearerAuth()
@Controller({ path: 'recurring' })
@UseGuards(ApiGuard)
export class RecurringController {
  constructor(private readonly recurringService: RecurringService) {}

  // ================================================================
  //. Create a recurring item
  // ================================================================
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a recurring item' })
  @ApiBody({ type: CreateRecurringDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Recurring item created successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.CREATED,
        message: 'Recurring item created successfully',
        data: RECURRING_EXAMPLE,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async createRecurring(
    @CurrentUser() user: User,
    @Body() body: CreateRecurringDto,
  ): Promise<StandardResponse<ProtoRecurring>> {
    const res = await this.recurringService.createRecurring(user, body);
    return {
      data: res,
      message: 'Recurring item created successfully',
      success: true,
      statusCode: HttpStatus.CREATED,
    };
  }

  // ================================================================
  //. Get all recurring items
  // ================================================================
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all recurring items for the authenticated user',
  })
  @ApiQuery({
    name: 'isActive',
    type: Boolean,
    required: false,
    description: 'Filter by active status. Omit to return all.',
    example: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recurring items fetched successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Recurring items fetched successfully',
        data: [RECURRING_EXAMPLE],
      },
    },
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getRecurrings(
    @CurrentUser() user: User,
    @Query() query: GetRecurringsQueryDto,
  ): Promise<StandardResponse<ProtoRecurring[]>> {
    const res = await this.recurringService.getRecurrings(user, query);
    return {
      data: res.recurrings ?? [],
      message: 'Recurring items fetched successfully',
      success: true,
      statusCode: HttpStatus.OK,
    };
  }

  // ================================================================
  //. Get a single recurring item
  // ================================================================
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single recurring item by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Recurring item ID',
    example: 'cmnoh1rlt0001i0rqneqmzb77',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recurring item fetched successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Recurring item fetched successfully',
        data: RECURRING_EXAMPLE,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recurring item not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getRecurring(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<StandardResponse<ProtoRecurring>> {
    const res = await this.recurringService.getRecurring(user, id);
    return {
      data: {
        ...res,
        transactions: res.transactions ?? [],
      },
      message: 'Recurring item fetched successfully',
      success: true,
      statusCode: HttpStatus.OK,
    };
  }

  // ================================================================
  //. Update a recurring item
  // ================================================================
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a recurring item' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Recurring item ID',
    example: 'cmnoh1rlt0001i0rqneqmzb77',
  })
  @ApiBody({ type: UpdateRecurringDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recurring item updated successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Recurring item updated successfully',
        data: RECURRING_EXAMPLE,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recurring item not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async updateRecurring(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: UpdateRecurringDto,
  ): Promise<StandardResponse<ProtoRecurring>> {
    const res = await this.recurringService.updateRecurring(user, id, body);
    return {
      data: res,
      message: 'Recurring item updated successfully',
      success: true,
      statusCode: HttpStatus.OK,
    };
  }

  // ================================================================
  //. Toggle active state
  // ================================================================
  @Patch(':id/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle the active state of a recurring item' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Recurring item ID',
    example: 'cmnoh1rlt0001i0rqneqmzb77',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recurring item toggled successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Recurring item toggled successfully',
        data: { ...RECURRING_EXAMPLE, isActive: false },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recurring item not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async toggleRecurring(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<StandardResponse<ProtoRecurring>> {
    const res = await this.recurringService.toggleRecurring(user, id);
    return {
      data: res,
      message: 'Recurring item toggled successfully',
      success: true,
      statusCode: HttpStatus.OK,
    };
  }

  // ================================================================
  //. Delete a recurring item
  // ================================================================
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a recurring item' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Recurring item ID',
    example: 'cmnoh1rlt0001i0rqneqmzb77',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Recurring item deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Recurring item not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async deleteRecurring(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<StandardResponse<null>> {
    await this.recurringService.deleteRecurring(user, id);
    return {
      data: null,
      message: 'Recurring item deleted successfully',
      success: true,
      statusCode: HttpStatus.NO_CONTENT,
    };
  }
}
