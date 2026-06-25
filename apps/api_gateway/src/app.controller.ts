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
}
