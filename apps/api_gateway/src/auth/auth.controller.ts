import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { StandardResponse } from '@fintrack/types/interfaces/server_response';
import { RegisterRes } from '@fintrack/types/protos/auth/auth';

import { RegisterUserDto } from './dto/auth.dto';
import { AuthService } from './auth.service';

/**
 * Controller responsible for managing user authentication
 * Handles HTTP requests for Auth operations via the Auth microservice
 *
 * @class AuthController
 */
@ApiTags('Auth')
@Controller({
  path: 'auth',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ================================================================
  //. Register a new User via local Credentials
  // ================================================================
  @Post('register')
  @ApiOperation({
    summary: 'Register User',
    description: 'Register new or existing user with local credentials',
  })
  @ApiBody({
    description: 'Payload for registering user via local credentials',
    required: true,
    type: RegisterUserDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Successfully registerd user',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.CREATED,
        data: {
          user: {
            id: '29407dc3-d62d-4b0a-b842-fe8113c0aaf3',
            email: 'dasiloy@dasy.com',
            avatar: '',
            firstName: 'dasiloy',
            lastName: 'dasy',
          },
          emailToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjI5NDA3ZGMzLWQ2MmQtNGIwYS1iODQyLWZlODExM2MwYWFmMyIsInR5cGUiOiJlbWFpbF9vdHAiLCJlbWFpbCI6ImRhc2lsb3lAZGFzeS5jb20iLCJhdmF0YXIiOm51bGwsImZpcnN0TmFtZSI6ImRhc2lsb3kiLCJsYXN0TmFtZSI6ImRhc3kiLCJpYXQiOjE3NzE0OTk0MDgsImV4cCI6MTc3MTUwMTIwOH0.5JACriWw9C6QsswTSUESfqwi4nYJ6QCEUMimjz804PM',
        },
        message: 'User registered Successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Soem request data missing or incorrect',
    example: {
      success: false,
      statusCode: HttpStatus.BAD_REQUEST,
      data: null,
      message: 'User registration failed',
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User already registered via local credentials',
    example: {
      success: true,
      statusCode: HttpStatus.BAD_REQUEST,
      data: false,
      message: 'User registration failed',
    },
  })
  async register(
    @Body() body: RegisterUserDto,
  ): Promise<StandardResponse<RegisterRes>> {
    const user = await this.authService.register(body);

    return {
      success: true,
      data: user,
      statusCode: HttpStatus.CREATED,
      message: 'User registered Successfully',
    };
  }

  // ================================================================
  //. Verify User Email
  // ================================================================
  @Post('verify')
  verifyMail() {}

  // ================================================================
  //. Resend Email Verification Token
  // ================================================================
  @Post('resend-verify')
  resendVerifyMailToken() {}

  // ================================================================
  //. Login User via local Credentials
  // ================================================================
  @Post('login')
  login() {}

  // ================================================================
  //. Handle forgot password request
  // ================================================================
  @Post('forgot-password')
  forgotPassword() {}

  // ================================================================
  //. Resend forgot password token
  // ================================================================
  @Post('resend-forgot-password')
  resendForgotPasswordToken() {}

  // ================================================================
  //. Refresh authentication token
  // ================================================================
  @Post('refresh')
  refreshToken() {}
}
