import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { StandardResponse } from '@fintrack/types/interfaces/server_response';

import { AppService } from './app.service';

/**
 *
 * Handles HTTP requests for the health check of the API Gateway
 *
 * @class AppController
 */
@ApiTags('System')
@Controller({
  version: VERSION_NEUTRAL,
})
/**
 * AppController.
 */
export class AppController {
  constructor(private readonly appService: AppService) {}

  // ================================================================
  //. Get merchants
  // ================================================================
  @Get('merchants')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all merchants (public, cached 24 h)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Merchants fetched successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        data: [
          { id: 'cm123', name: 'NETFLIX', aliases: ['NETFLIX.COM', 'NFLX'] },
        ],
        message: 'Merchants fetched successfully',
      },
    },
  })
  async getMerchants(): Promise<
    StandardResponse<{ id: string; name: string; aliases: string[] }[]>
  > {
    const data = await this.appService.getMerchants();
    return {
      success: true,
      data,
      statusCode: HttpStatus.OK,
      message: 'Merchants fetched successfully',
    };
  }

  // ================================================================
  //. Health Check
  // ================================================================
  @Get('health')
  @ApiOperation({
    summary: 'Health Check',
    description: 'Check if the API Gateway and Database are running correctly',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'System is healthy',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        data: null,
        message: 'Api Gateway running successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'System is unhealthy (e.g. Database connection failed)',
  })
  async getHealth(): Promise<StandardResponse<any>> {
    await this.appService.getHealth();

    return {
      success: true,
      data: null,
      statusCode: HttpStatus.OK,
      message: 'System is healthy',
    };
  }

  // ================================================================
  //. Resolve Balances
  // ================================================================
  @Get('resolve-balances')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolve Balances',
    description:
      'Hard-recomputes every user balance from source transactions and upserts the previous and current monthly snapshots',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        data: { processed: 42, failed: 0 },
        message: 'Balances resolved successfully',
      },
    },
  })
  @ApiResponse({ status: HttpStatus.SERVICE_UNAVAILABLE })
  async resolveBalances(): Promise<StandardResponse<any>> {
    const data = await this.appService.resolveBalances();
    return {
      success: true,
      data,
      statusCode: HttpStatus.OK,
      message: 'Balances resolved successfully',
    };
  }

  // ================================================================
  //. Embeddings
  // ================================================================
  @Get('embeddings')
  @ApiOperation({
    summary: 'Embeddings',
    description: 'Update Embeddings',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Embeddings collected',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        data: [],
        message: 'Embeddings ran successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'System is unavailable',
  })
  async embed(): Promise<StandardResponse<any>> {
    const transactions = await this.appService.updateSemantics();

    return {
      success: true,
      data: transactions,
      statusCode: HttpStatus.OK,
      message: 'System is healthy',
    };
  }
}
