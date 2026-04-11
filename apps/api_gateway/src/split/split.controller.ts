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
  GetSplitAggregateRes,
  Split as ProtoSplit,
  SplitParticipant as ProtoParticipant,
  SplitSettlement as ProtoSettlement,
} from '@fintrack/types/protos/finance/split';
import { StandardResponse } from '@fintrack/types/interfaces/server_response';

import { SplitService } from './split.service';
import { ApiGuard } from '../guards/api.guard';
import { CurrentUser } from '../decorators/current_user.decorator';
import {
  AddParticipantDto,
  CreateSplitDto,
  GetSplitsQueryDto,
  PaySettlementDto,
  UpdateParticipantDto,
  UpdateSplitDto,
} from './dto/split.dto';

/**
 * Controller for split expense operations.
 * Forwards HTTP requests to the Finance microservice via gRPC.
 *
 * @class SplitController
 */
@ApiTags('Splits')
@ApiBearerAuth()
@Controller({ path: 'split' })
@UseGuards(ApiGuard)
export class SplitController {
  constructor(private readonly splitService: SplitService) {}

  // ================================================================
  //. Create Split
  // ================================================================
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a split expense' })
  @ApiBody({ required: true, type: CreateSplitDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Split created successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.CREATED,
        message: 'Split created successfully',
        data: {
          id: 'split_abc123',
          name: 'Friday Night Out',
          amount: 20000,
          status: 'OPEN',
          createdAt: '2026-04-10T18:45:00.000Z',
          updatedAt: '2026-04-10T18:45:00.000Z',
          participants: [],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async createSplit(
    @CurrentUser() user: User,
    @Body() body: CreateSplitDto,
  ): Promise<StandardResponse<ProtoSplit>> {
    const data = await this.splitService.createSplit(user, body);
    return {
      success: true,
      message: 'Split created successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }

  // ================================================================
  //. Get Aggregates
  // ================================================================

  @Get('aggregate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get split aggregate summary for the authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Split aggregate fetched successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Split aggregate fetched successfully',
        data: {
          totalOwed: 22000,
          totalPaid: 10000,
          openCount: 3,
          partialCount: 1,
          settledCount: 2,
          settledAmount: 45000,
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getSplitAggregate(
    @CurrentUser() user: User,
  ): Promise<StandardResponse<GetSplitAggregateRes>> {
    const data = await this.splitService.getSplitAggregate(user);
    return {
      success: true,
      message: 'Split aggregate fetched successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  // ================================================================
  //. Get Splits
  // ================================================================
  @Get('')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all splits for the authenticated user' })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description:
      'Comma-separated statuses to filter by. Allowed values: OPEN, PARTIALLY_SETTLED, SETTLED',
    example: 'OPEN,PARTIALLY_SETTLED',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Reuested page',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of records to take',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Splits fetched successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Splits fetched successfully',
        data: [
          {
            id: 'split_abc123',
            name: 'Friday Night Out',
            amount: 20000,
            status: 'PARTIALLY_SETTLED',
            totalPaid: 8000,
            totalOwed: 12000,
            participants: [],
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
  async getSplits(
    @CurrentUser() user: User,
    @Query() query: GetSplitsQueryDto,
  ): Promise<StandardResponse<ProtoSplit[]>> {
    const response = await this.splitService.getSplits(user, query);
    return {
      success: true,
      message: 'Splits fetched successfully',
      statusCode: HttpStatus.OK,
      data: response.splits ?? [],
      meta: response.meta,
    };
  }

  // ================================================================
  //. Get single Split
  // ================================================================
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single split by ID' })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Split ID',
    example: 'split_abc123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Split fetched successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Split fetched successfully',
        data: {
          id: 'split_abc123',
          name: 'Friday Night Out',
          amount: 20000,
          status: 'PARTIALLY_SETTLED',
          participants: [
            {
              id: 'participant_1',
              name: 'Ada',
              email: 'ada@example.com',
              amount: 8000,
              paid: 3000,
              balance: 5000,
              settlements: [
                {
                  id: 'settle_1',
                  paidAmount: 3000,
                  paidAt: '2026-04-03T20:00:00.000Z',
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
              ],
            },
          ],
          totalPaid: 8000,
          totalOwed: 12000,
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Split not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getSplit(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<StandardResponse<ProtoSplit>> {
    const data = await this.splitService.getSplit(user, id);
    return {
      success: true,
      message: 'Split fetched successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  // ================================================================
  //. Update a Split
  // ================================================================
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a split' })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Split ID',
    example: 'split_abc123',
  })
  @ApiBody({ required: true, type: UpdateSplitDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Split updated successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Split updated successfully',
        data: {
          id: 'split_abc123',
          name: 'Friday Night Out (Updated)',
          amount: 25000,
          status: 'OPEN',
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Split not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async updateSplit(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: UpdateSplitDto,
  ): Promise<StandardResponse<ProtoSplit>> {
    const data = await this.splitService.updateSplit(user, id, body);
    return {
      success: true,
      message: 'Split updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  // ================================================================
  //. Delete Split
  // ================================================================
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a split' })
  @ApiParam({
    name: 'id',
    required: true,
    type: String,
    description: 'Split ID',
    example: 'split_abc123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Split deleted successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Split deleted successfully',
        data: null,
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Split not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async deleteSplit(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ): Promise<StandardResponse<null>> {
    await this.splitService.deleteSplit(user, id);
    return {
      success: true,
      message: 'Split deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }

  // ================================================================
  //. Add participant
  // ================================================================
  @Post(':splitId/participant')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a participant to a split' })
  @ApiParam({
    name: 'splitId',
    required: true,
    type: String,
    description: 'Split ID',
    example: 'split_abc123',
  })
  @ApiBody({ required: true, type: AddParticipantDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Participant added successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.CREATED,
        message: 'Participant added successfully',
        data: {
          id: 'participant_1',
          name: 'Ada',
          email: 'ada@example.com',
          amount: 8000,
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Split not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async addParticipant(
    @CurrentUser() user: User,
    @Param('splitId') splitId: string,
    @Body() body: AddParticipantDto,
  ): Promise<StandardResponse<ProtoParticipant>> {
    const data = await this.splitService.addParticipant(user, splitId, body);
    return {
      success: true,
      message: 'Participant added successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }

  // ================================================================
  //. Update a split participant
  // ================================================================
  @Patch(':splitId/participant/:participantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a split participant' })
  @ApiParam({
    name: 'splitId',
    required: true,
    type: String,
    description: 'Split ID',
    example: 'split_abc123',
  })
  @ApiParam({
    name: 'participantId',
    required: true,
    type: String,
    description: 'Participant ID',
    example: 'participant_1',
  })
  @ApiBody({ required: true, type: UpdateParticipantDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Participant updated successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Participant updated successfully',
        data: {
          id: 'participant_1',
          name: 'Ada Lovelace',
          email: 'adalovelace@example.com',
          amount: 9000,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Split or participant not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async updateParticipant(
    @CurrentUser() user: User,
    @Param('splitId') splitId: string,
    @Param('participantId') participantId: string,
    @Body() body: UpdateParticipantDto,
  ): Promise<StandardResponse<ProtoParticipant>> {
    const data = await this.splitService.updateParticipant(
      user,
      splitId,
      participantId,
      body,
    );
    return {
      success: true,
      message: 'Participant updated successfully',
      statusCode: HttpStatus.OK,
      data,
    };
  }

  // ================================================================
  //. Delete Participant
  // ================================================================
  @Delete(':splitId/participant/:participantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a split participant' })
  @ApiParam({
    name: 'splitId',
    required: true,
    type: String,
    description: 'Split ID',
    example: 'split_abc123',
  })
  @ApiParam({
    name: 'participantId',
    required: true,
    type: String,
    description: 'Participant ID',
    example: 'participant_1',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Participant deleted successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Participant deleted successfully',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Split or participant not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async deleteParticipant(
    @CurrentUser() user: User,
    @Param('splitId') splitId: string,
    @Param('participantId') participantId: string,
  ): Promise<StandardResponse<null>> {
    await this.splitService.deleteParticipant(user, splitId, participantId);
    return {
      success: true,
      message: 'Participant deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }

  // ================================================================
  //. Add settlement
  // ================================================================
  @Post(':splitId/participant/:participantId/settlement')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a settlement payment for a participant' })
  @ApiParam({
    name: 'splitId',
    required: true,
    type: String,
    description: 'Split ID',
    example: 'split_abc123',
  })
  @ApiParam({
    name: 'participantId',
    required: true,
    type: String,
    description: 'Participant ID',
    example: 'participant_1',
  })
  @ApiBody({ required: true, type: PaySettlementDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Settlement recorded successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.CREATED,
        message: 'Settlement recorded successfully',
        data: {
          id: 'settlement_1',
          paidAmount: 5000,
          paidAt: '2026-04-05T21:00:00.000Z',
          createdAt: '2026-04-05T21:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Split or participant not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async paySettlement(
    @CurrentUser() user: User,
    @Param('splitId') splitId: string,
    @Param('participantId') participantId: string,
    @Body() body: PaySettlementDto,
  ): Promise<StandardResponse<ProtoSettlement>> {
    const data = await this.splitService.paySettlement(
      user,
      splitId,
      participantId,
      body,
    );
    return {
      success: true,
      message: 'Settlement recorded successfully',
      statusCode: HttpStatus.CREATED,
      data,
    };
  }

  // ================================================================
  //. Delete Settlement
  // ================================================================
  @Delete(':splitId/settlement/:settlementId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a split settlement' })
  @ApiParam({
    name: 'splitId',
    required: true,
    type: String,
    description: 'Split ID',
    example: 'split_abc123',
  })
  @ApiParam({
    name: 'settlementId',
    required: true,
    type: String,
    description: 'Settlement ID',
    example: 'settlement_1',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settlement deleted successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Settlement deleted successfully',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Split or settlement not found',
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  async deleteSettlement(
    @CurrentUser() user: User,
    @Param('splitId') splitId: string,
    @Param('settlementId') settlementId: string,
  ): Promise<StandardResponse<null>> {
    await this.splitService.deleteSettlement(user, splitId, settlementId);
    return {
      success: true,
      message: 'Settlement deleted successfully',
      statusCode: HttpStatus.OK,
      data: null,
    };
  }
}
