import {
  BadRequestException,
  Controller,
  FileTypeValidator,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { StandardResponse } from '@fintrack/types/interfaces/server_response';
import {
  MAX_FILE_SIZE,
  IMAGE_FILE_TYPE,
} from '@fintrack/types/constants/file.constants';

import { UploadService } from './upload.service';
import { ApiGuard } from '../guards/api.guard';
import { CurrentUser } from '../decorators/current_user.decorator';
import { type User } from '@fintrack/database/src/generated/prisma';

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
          new FileTypeValidator({ fileType: IMAGE_FILE_TYPE }),
        ],
        exceptionFactory: (errors) => {
          console.log('errors', errors);
          return new BadRequestException('Invalid file type');
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
}
