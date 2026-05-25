import {
  Body,
  Controller,
  Delete,
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

import { User } from '@fintrack/database/types';
import { StandardResponse } from '@fintrack/types/interfaces/server_response';

import { ExportService } from './export.service';
import { CachedExport, GenerateExportDto } from './dto/generate_export.dto';
import { ApiGuard } from '../guards/api.guard';
import { CurrentUser } from '../decorators/current_user.decorator';

/**
 * Controller for the analytics export center.
 * Generates downloadable reports (CSV, XLSX, PDF, PNG) for the authenticated user.
 *
 * @class ExportController
 */
@ApiTags('Export')
@ApiBearerAuth()
@Controller({ path: 'export' })
@UseGuards(ApiGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  // ================================================================
  //. Generate export
  // ================================================================

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate an export',
    description:
      'Generates or returns a cached export for the authenticated user. ' +
      'Free users are silently capped to ANALYTICS_MONTHS_LIMIT × 30 days. ' +
      'Returns the file as a base64-encoded string inside the standard response envelope.',
  })
  @ApiBody({ type: GenerateExportDto })
  @ApiResponse({
    status: 200,
    description: 'Export generated or served from cache',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or unsupported format for type',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generate(
    @CurrentUser() user: User,
    @Body() dto: GenerateExportDto,
  ): Promise<StandardResponse<CachedExport>> {
    const result = await this.exportService.generate(dto, user);
    return {
      data: {
        bufferBase64: result.buffer.toString('base64'),
        filename: result.filename,
        mimeType: result.mimeType,
        generatedAt: result.generatedAt,
        previewData: result.previewData ?? null,
      },
      message: result.cached ? 'Served from cache' : 'Export generated',
      success: true,
      statusCode: HttpStatus.OK,
    };
  }

  // ================================================================
  //. Invalidate cache
  // ================================================================

  @Delete('cache')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Invalidate all cached exports for the current user',
    description:
      'User-initiated full cache clear. Mutation endpoints (transactions, budgets, goals, ' +
      'recurring) also invalidate `export:{userId}:*` automatically after writes — clients ' +
      'only need this route when forcing a fresh export without changing data.',
  })
  @ApiResponse({ status: 200, description: 'Cache cleared' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async invalidateCache(
    @CurrentUser() user: User,
  ): Promise<StandardResponse<null>> {
    await this.exportService.invalidateCache(user.id);
    return {
      data: null,
      message: 'Export cache cleared',
      success: true,
      statusCode: HttpStatus.OK,
    };
  }
}
