import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { MonoBankAccount, User } from '@fintrack/database/types';
import { StandardResponse } from '@fintrack/types/interfaces/server_response';
import { PublicMeta } from '@fintrack/common/decorators/public.decorator';

import { AccountService } from './account.service';
import { ApiGuard } from '../guards/api.guard';
import { MonoGuard } from '../guards/mono.guard';
import { CurrentUser } from '../decorators/current_user.decorator';
import { LinkMonoAccountDto, ReLinkMonoAccountDto } from './dto/account.dto';

/**
 * Controller responsible for Mono bank account linking and webhook handling.
 *
 * @class AccountController
 */
@ApiTags('Account')
@ApiBearerAuth()
@Controller({ path: 'account' })
@UseGuards(ApiGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  // ================================================================
  //. Get linked accounts
  // ================================================================
  @Get('')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all linked bank accounts for the authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Linked accounts fetched successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Accounts fetched successfully',
        data: [
          {
            id: 'clx1234abc',
            accountName: 'John Doe',
            accountNumber: '0123456789',
            accountType: 'SAVINGS',
            accountBalance: 150000,
            accountCurrency: 'NGN',
            bankName: 'GTBank',
            status: 'AVAILABLE',
            lastSyncedAt: '2026-04-12T10:00:00.000Z',
            createdAt: '2026-04-01T08:00:00.000Z',
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
  async getLinkedAccounts(
    @CurrentUser() user: User,
  ): Promise<StandardResponse<Partial<MonoBankAccount>[]>> {
    const accounts = await this.accountService.getLinkedAccounts(user);

    return {
      data: accounts,
      success: true,
      message: 'Accounts fetched successfully',
      statusCode: HttpStatus.OK,
    };
  }

  // ================================================================
  //. Mono Webhook
  // ================================================================
  @Post('mono/webhook')
  @PublicMeta()
  @UseGuards(MonoGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive Mono webhook events' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event received',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Mono event received mono.events.account_updated',
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
  async monoWebhook(@Body() body: any): Promise<StandardResponse<null>> {
    await this.accountService.handleWebhook(body);

    return {
      data: null,
      success: true,
      message: `Mono event received ${body.event}`,
      statusCode: HttpStatus.OK,
    };
  }

  // ================================================================
  //. Link Mono Account
  // ================================================================
  @Post('link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Link a Mono bank account to the authenticated user',
  })
  @ApiBody({
    required: true,
    type: LinkMonoAccountDto,
    description: 'One-time code from the Mono Connect widget',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account linked successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Account linked',
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
  async linkMonoAccount(
    @Body() body: LinkMonoAccountDto,
    @CurrentUser() user: User,
  ): Promise<StandardResponse<null>> {
    await this.accountService.linkAccount(body, user);

    return {
      data: null,
      success: true,
      message: 'Account linked',
      statusCode: HttpStatus.OK,
    };
  }

  // ================================================================
  //. Re-link Mono Account
  // ================================================================
  @Post('relink')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Re-link a Mono bank account after session expiry' })
  @ApiBody({
    required: true,
    type: ReLinkMonoAccountDto,
    description: 'Reauth code and accountId from the Mono Connect widget',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account re-linked successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Account re-linked',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bank account not found',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Bank account not found',
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
  async relinkMonoAccount(
    @Body() body: ReLinkMonoAccountDto,
    @CurrentUser() user: User,
  ): Promise<StandardResponse<null>> {
    await this.accountService.relinkAccount(body, user);

    return {
      data: null,
      success: true,
      message: 'Account re-linked',
      statusCode: HttpStatus.OK,
    };
  }
}
