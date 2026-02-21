import { Request } from 'express';

import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { StandardResponse } from '@fintrack/types/interfaces/server_response';
import {
  ForgotPasswordRes,
  LoginRes,
  RefreshTokenRes,
  RegisterRes,
  ResendForgotPasswordTokenRes,
  ResendVerifyEmailTokenRes,
  ResetPasswordRes,
  VerifyEmailRes,
} from '@fintrack/types/protos/auth/auth';

import {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterUserDto,
  ResendForgotPasswordDto,
  ResendVerifyEmailDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';
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
      statusCode: HttpStatus.CONFLICT,
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
  @ApiOperation({
    summary: 'Verify Email',
    description: 'Verify email of local users',
  })
  @ApiBody({
    description: 'Payload for verifying email of users via local credentials',
    required: true,
    type: VerifyEmailDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully verified email',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.CREATED,
        data: {
          user: {
            id: '61848663-52c2-4ff5-a6c2-e6cf5b355eb9',
            email: 'dasiloy@dasy14.com',
            firstName: 'dasiloy',
            lastName: 'dasy',
          },
          accessToken: 'eyJhbG...',
          refreshToken: 'eyJhbG...',
        },
        message: 'User Verified Successfully',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'OTP or token Expired',
    example: {
      success: true,
      statusCode: HttpStatus.UNAUTHORIZED,
      data: false,
      message: 'User could not be verified',
    },
  })
  @HttpCode(HttpStatus.OK)
  async verifyMail(
    @Body() body: VerifyEmailDto,
    @Req() req: Request,
  ): Promise<StandardResponse<VerifyEmailRes>> {
    const token = req.headers['x-token'] || (body as any).token;

    if (!token) {
      throw new UnauthorizedException('Token is invalid');
    }

    const res = await this.authService.verifyEmail(body, token as string);

    return {
      success: true,
      message: 'Email verified successfully',
      statusCode: HttpStatus.OK,
      data: res,
    };
  }

  // ================================================================
  //. Resend Email Verification Token
  // ================================================================
  @Post('resend-verify')
  @ApiOperation({
    summary: 'Resend Verification Token',
    description: 'Resend the email verification OTP if it has expired',
  })
  @ApiBody({
    description: 'Resend email payload',
    required: true,
    type: ResendVerifyEmailDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification token resent successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Verification token resent successfully',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A valid token still exists or user is already verified',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.CONFLICT,
        message: 'User already verified or token unexpired',
        data: null,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async resendVerifyMailToken(
    @Body() body: ResendVerifyEmailDto,
  ): Promise<StandardResponse<ResendVerifyEmailTokenRes>> {
    const res = await this.authService.resendVerifyEmailToken(body);
    return {
      success: true,
      message: 'Verification token resent successfully',
      statusCode: HttpStatus.OK,
      data: res,
    };
  }

  // ================================================================
  //. Login User via local Credentials
  // ================================================================
  @Post('login')
  @ApiOperation({
    summary: 'Login User',
    description: 'Authenticate user with email and password',
  })
  @ApiBody({
    description: 'Login credentials',
    required: true,
    type: LoginDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Login successful',
        data: {
          user: {
            id: '61848663-52c2-4ff5-a6c2-e6cf5b355eb9',
            email: 'dasiloy@dasy14.com',
            firstName: 'dasiloy',
            lastName: 'dasy',
          },
          accessToken: 'eyJhbG...',
          refreshToken: 'eyJhbG...',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials or account locked',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid credentials',
        data: null,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto): Promise<StandardResponse<LoginRes>> {
    const res = await this.authService.login(body);
    return {
      success: true,
      message: 'Login successful',
      statusCode: HttpStatus.OK,
      data: res,
    };
  }

  // ================================================================
  //. Handle forgot password request
  // ================================================================
  @Post('forgot-password')
  @ApiOperation({
    summary: 'Forgot Password',
    description: 'Initiate password reset process',
  })
  @ApiBody({
    description: 'User email to send reset link',
    required: true,
    type: ForgotPasswordDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reset instructions sent to email',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Reset instructions sent to email',
        data: null,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() body: ForgotPasswordDto,
  ): Promise<StandardResponse<ForgotPasswordRes>> {
    const res = await this.authService.forgotPassword(body);
    return {
      success: true,
      message: 'Reset instructions sent to email',
      statusCode: HttpStatus.OK,
      data: res,
    };
  }

  // ================================================================
  //. Resend forgot password token
  // ================================================================
  @Post('resend-forgot-password')
  @ApiOperation({
    summary: 'Resend Forgot Password Token',
    description: 'Resend the password reset OTP',
  })
  @ApiBody({
    description: 'User email for resending reset token',
    required: true,
    type: ResendForgotPasswordDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset token resent',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Password reset token resent',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'A valid forgot password token still exists',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.CONFLICT,
        message: 'A valid token already exists',
        data: null,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async resendForgotPasswordToken(
    @Body() body: ResendForgotPasswordDto,
  ): Promise<StandardResponse<ResendForgotPasswordTokenRes>> {
    const res = await this.authService.resendForgotPasswordToken(body);
    return {
      success: true,
      message: 'Password reset token resent',
      statusCode: HttpStatus.OK,
      data: res,
    };
  }

  // ================================================================
  //. Reset password
  // ================================================================
  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset Password',
    description: 'Set a new password using the OTP',
  })
  @ApiBody({
    description: 'New password and OTP',
    required: true,
    type: ResetPasswordDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successful',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Password reset successful',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid OTP or session expired',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid or expired OTP',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'New password cannot be the same as the old password',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.CONFLICT,
        message: 'New password cannot be the same as old',
        data: null,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() body: ResetPasswordDto,
    @Req() req: Request,
  ): Promise<StandardResponse<ResetPasswordRes>> {
    const token = req.headers['x-token'] || (body as any).token;

    if (!token) {
      throw new UnauthorizedException('Reset token is invalid');
    }

    const res = await this.authService.resetPassword(token as string, body);
    return {
      success: true,
      message: 'Password reset successful',
      statusCode: HttpStatus.OK,
      data: res,
    };
  }

  // ================================================================
  //. Refresh authentication token
  // ================================================================
  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh Token',
    description: 'Get new access token using a valid refresh token',
  })
  @ApiBody({
    description: 'Refresh token payload',
    required: true,
    type: RefreshTokenDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Token refreshed successfully',
        data: {
          accessToken: 'eyJhbG...',
          refreshToken: 'eyJhbG...',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired refresh token',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid refresh token',
        data: null,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() body: RefreshTokenDto,
  ): Promise<StandardResponse<RefreshTokenRes>> {
    const res = await this.authService.refreshToken(body);
    return {
      success: true,
      message: 'Token refreshed successfully',
      statusCode: HttpStatus.OK,
      data: res,
    };
  }
}
