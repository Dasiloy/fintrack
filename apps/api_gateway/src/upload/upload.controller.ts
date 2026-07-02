import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  HttpStatus,
  Logger,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { type User } from '@fintrack/database/types';
import { StandardResponse } from '@fintrack/types/interfaces/server_response';
import {
  ADVISOR_FILES_MAX_COUNT,
  ADVISOR_FILES_MAX_TOTAL_SIZE,
  MAX_FILE_SIZE,
  IMAGE_FILE_TYPE,
  IMAGE_PDF_FILE_TYPE,
} from '@fintrack/types/constants/file.constants';
import type {
  AdvisorAttachmentKind,
  AdvisorAttachmentUploadResult,
} from '@fintrack/types/interfaces/ai';

import { UploadService } from './upload.service';
import { ApiGuard } from '../guards/api.guard';
import { CurrentUser } from '../decorators/current_user.decorator';
import {
  GetAdvisorFileUrlDto,
  UploadReceiptResponse,
  DeleteAdvisorFileDto,
} from './dto/upload_receipt.dto';

/**
 * Controller responsible for managing user uploads
 * Handles HTTP requests for Upload operations via the api gateway
 *
 * @class UploadController
 */
@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(ApiGuard)
@Controller({
  path: 'upload',
})
/**
 * UploadController.
 */
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // ================================================================
  //. Upload User Profile Image
  // ================================================================
  @Post('profile-image')
  @ApiOperation({
    summary: 'Upload User Profile Image',
    description: 'Upload a profile image for the user',
  })
  @ApiBody({
    description: 'Payload for uploading a profile image',
    required: true,
    schema: {
      example: {
        file: 'base64 encoded image',
      },
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile image uploaded successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        data: null,
        message: 'Profile image uploaded successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Bad Request',
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
        data: null,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal Server Error',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        message: 'Internal Server Error',
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(
    @CurrentUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({
            fileType: IMAGE_FILE_TYPE,
            skipMagicNumbersValidation: true,
          }),
        ],
        exceptionFactory: (errors) => {
          const logger = new Logger(ParseFilePipe.name);
          logger.error('Error', JSON.stringify(errors));
          return new BadRequestException('File upload failed');
        },
      }),
    )
    file: Express.Multer.File,
  ): Promise<StandardResponse<null>> {
    await this.uploadService.uploadProfileImage(user, file);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: null,
      message: 'Profile image uploaded successfully',
    };
  }

  // ================================================================
  //. Upload Receipt
  // ================================================================
  @Post('receipt')
  @ApiOperation({
    summary: 'Upload Receipt Image or Pdf',
    description: 'Upload a receipt image or pdf',
  })
  @ApiBody({
    description: 'Payload for uploading a receipt image/pdf',
    required: true,
    schema: {
      example: {
        file: 'base64 encoded image or podf file',
      },
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Receipt uploaded successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        data: {
          draftId: 'ocnmbreyrbfign68964bgmn',
          isNew: false,
        },
        message: 'Profile image uploaded successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        data: null,
        message: 'Bad Request',
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
        data: null,
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal Server Error',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        message: 'Internal Server Error',
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadReceipt(
    @CurrentUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({
            fileType: IMAGE_PDF_FILE_TYPE,
            skipMagicNumbersValidation: true,
          }),
        ],
        exceptionFactory: (errors) => {
          const logger = new Logger(ParseFilePipe.name);
          logger.error('Error', JSON.stringify(errors));
          return new BadRequestException('File upload failed');
        },
      }),
    )
    file: Express.Multer.File,
  ): Promise<StandardResponse<UploadReceiptResponse>> {
    const data = await this.uploadService.uploadReceipt(user, file);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      message: 'Receipt uploaded successfully',
    };
  }

  // ================================================================
  //. Upload Advisor File
  // ================================================================
  @Post('advisor-file')
  @ApiOperation({
    summary: 'Upload Advisor Attachments',
    description:
      'Upload one or more advisor attachment images, PDFs, CSVs, or XLSX files',
  })
  @ApiBody({
    description: 'Multipart payload for advisor attachment files',
    required: true,
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          maxItems: ADVISOR_FILES_MAX_COUNT,
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', ADVISOR_FILES_MAX_COUNT))
  async uploadAdvisorFiles(
    @CurrentUser() user: User,
    @UploadedFiles()
    files: Express.Multer.File[],
  ): Promise<StandardResponse<AdvisorAttachmentUploadResult>> {
    if (files.length === 0) {
      throw new BadRequestException('At least one advisor file is required');
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > ADVISOR_FILES_MAX_TOTAL_SIZE) {
      throw new BadRequestException('Advisor files cannot exceed 10 MB total');
    }

    const data = await this.uploadService.uploadAdvisorFiles(user, files);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data,
      message: 'Advisor files uploaded successfully',
    };
  }

  // ================================================================
  //. Get Advisor File URL
  // ================================================================
  @Post('advisor-file/url')
  @ApiOperation({
    summary: 'Get Advisor Attachment URL',
    description:
      'Generates a short-lived view URL for a private advisor attachment',
  })
  async getAdvisorFileUrl(
    @CurrentUser() user: User,
    @Body()
    body: GetAdvisorFileUrlDto,
  ): Promise<StandardResponse<{ url: string }>> {
    const url = this.uploadService.getAdvisorFileUrlForUser(
      user.id,
      body.publicId,
      body.format,
      body.kind,
    );

    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: { url },
      message: 'Advisor file URL generated',
    };
  }

  // ================================================================
  //. Delete Advisor File
  // ================================================================
  @Delete('advisor-file')
  @ApiOperation({
    summary: 'Delete Advisor Attachment',
    description:
      'Best-effort cleanup for an advisor attachment removed before send',
  })
  async deleteAdvisorFile(
    @CurrentUser() user: User,
    @Body()
    body: DeleteAdvisorFileDto,
  ): Promise<StandardResponse<{ deleted: boolean }>> {
    const deleted = await this.uploadService.deleteAdvisorFile(
      user,
      body.publicId,
    );
    return {
      success: true,
      statusCode: HttpStatus.OK,
      data: { deleted },
      message: 'Advisor file cleanup queued',
    };
  }
}
