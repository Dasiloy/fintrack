import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { StandardResponse } from '@fintrack/types/interfaces/server_response';
import {
  ConfirmTwoFactorSetupRes,
  ForgotPasswordRes,
  InitiateEmailChangeRes,
  InitiateTwoFactorSetupRes,
  LoginRes,
  RefreshTokenRes,
  RegisterRes,
  ResendForgotPasswordTokenRes,
  ResendVerifyEmailTokenRes,
  Empty,
  VerifyEmailRes,
  VerifyPasswordTokenRes,
} from '@fintrack/types/protos/auth/auth';

import {
  ChangeEmailDto,
  ChangePasswordDto,
  Confirm2faDto,
  Disable2faDto,
  ForgotPasswordDto,
  GoogleOAuthDto,
  LoginDto,
  RefreshTokenDto,
  RegisterUserDto,
  ResendForgotPasswordDto,
  ResendVerifyEmailDto,
  ResetPasswordDto,
  VerifyEmailChangeDto,
  VerifyEmailDto,
  VerifyPasswordTokenReqDto,
  VerifyTwoFactorDto,
} from './dto/auth.dto';
import { AuthService } from './auth.service';
import { AccessToken, HeaderToken } from '../decorators/token.decorator';
import { Device } from '../decorators/devoce_info.decorator';
import { DeviceInfo } from '@fintrack/types/interfaces/device';

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
    @Device() deviceInfo: DeviceInfo,
    @HeaderToken('x-token') token: string,
  ): Promise<StandardResponse<VerifyEmailRes>> {
    if (!token) {
      throw new UnauthorizedException('Token is invalid');
    }

    const res = await this.authService.verifyEmail(
      body,
      token as string,
      deviceInfo,
    );

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
  async login(
    @Body() body: LoginDto,
    @Device() deviceInfo: DeviceInfo,
  ): Promise<StandardResponse<LoginRes>> {
    const res = await this.authService.login(body, deviceInfo);
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
  //. Verify password reset token
  // ================================================================
  @Post('verify-password-token')
  @ApiOperation({
    summary: 'Verify Password Reset Token',
    description: 'Verify the password reset token',
  })
  @ApiBody({
    description: 'Password reset token payload',
    required: true,
    type: VerifyPasswordTokenReqDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset token verified',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Password reset token verified',
        data: {
          passwordToken: 'eyJhbG...',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid token or token expired',
    schema: {
      example: {
        success: false,
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid token or token expired',
        data: null,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  async verifyPasswordToken(
    @Body() body: VerifyPasswordTokenReqDto,
  ): Promise<StandardResponse<VerifyPasswordTokenRes>> {
    const res = await this.authService.verifyPasswordToken(body);
    return {
      success: true,
      message: 'Password reset token verified',
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
    @HeaderToken('x-token') token: string,
  ): Promise<StandardResponse<Empty>> {
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

  // ================================================================
  //. Google OAuth sign-in — accepts id_token only; verified server-side
  // ================================================================
  @Post('oauth/google')
  @ApiOperation({
    summary: 'Google OAuth Sign-in',
    description:
      "Accepts a Google id_token. The auth service verifies it against Google's public keys before creating or signing in the user.",
  })
  @ApiBody({
    description: 'Google id_token from the client-side OAuth flow',
    required: true,
    type: GoogleOAuthDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sign-in successful',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Login successful',
        data: {
          user: { id: '…', email: '…', firstName: '…', lastName: '…' },
          accessToken: 'eyJhbG…',
          refreshToken: 'eyJhbG…',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired Google id_token',
  })
  @HttpCode(HttpStatus.OK)
  async loginWithGoogle(
    @Body() body: GoogleOAuthDto,
    @Device() deviceInfo: DeviceInfo,
  ): Promise<StandardResponse<LoginRes>> {
    const res = await this.authService.loginWithGoogle(
      body.idToken,
      deviceInfo,
    );
    return {
      success: true,
      message: 'Login successful',
      statusCode: HttpStatus.OK,
      data: res,
    };
  }

  // ================================================================
  //. Initiate 2FA setup
  // ================================================================
  @ApiBearerAuth()
  @Post('2fa/init')
  @ApiOperation({
    summary: 'Initiate 2FA Setup',
    description:
      'Generate a TOTP secret and QR code URI for the authenticated user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      '2FA setup initiated — scan the QR code with an authenticator app',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: '2FA setup initiated successfully',
        data: {
          secret: 'JBSWY3DPEHPK3PXP',
          otpauthUri: 'otpauth://totp/Fintrack:user@example.com?secret=…',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired access token',
  })
  @HttpCode(HttpStatus.OK)
  async init2fa(
    @AccessToken() token: string,
  ): Promise<StandardResponse<InitiateTwoFactorSetupRes>> {
    const res = await this.authService.init2fa(token);
    return {
      success: true,
      message: '2FA setup initiated successfully',
      statusCode: HttpStatus.OK,
      data: res,
    };
  }

  // ================================================================
  //. Confirm 2FA setup
  // ================================================================
  @ApiBearerAuth()
  @Post('2fa/confirm')
  @ApiOperation({
    summary: 'Confirm 2FA Setup',
    description:
      'Verify the first TOTP code to activate 2FA. Returns one-time backup codes.',
  })
  @ApiBody({
    description: '6-digit TOTP code from the authenticator app',
    type: Confirm2faDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '2FA confirmed — backup codes returned (shown only once)',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: '2FA enabled successfully',
        data: { backupCodes: ['abc12345', 'def67890'] },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid token or TOTP code mismatch',
  })
  @HttpCode(HttpStatus.OK)
  async confirm2fa(
    @AccessToken() token: string,
    @Body() body: Confirm2faDto,
  ): Promise<StandardResponse<ConfirmTwoFactorSetupRes>> {
    const res = await this.authService.confirm2fa(token, body);
    return {
      success: true,
      message: '2FA enabled successfully',
      statusCode: HttpStatus.OK,
      data: res,
    };
  }

  // ================================================================
  //. Verify 2FA login challenge
  // ================================================================
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @Post('2fa/verify')
  @ApiOperation({
    summary: 'Verify 2FA Challenge',
    description:
      'Complete a 2FA login challenge using a TOTP code or backup code. Rate limited to 5 attempts per 15 minutes to prevent brute-force attacks.',
  })
  @ApiBody({
    description: 'Challenge JWT, TOTP/backup code, and device info',
    type: VerifyTwoFactorDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login completed — full auth tokens returned',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Login successful',
        data: { accessToken: 'eyJhbG…', refreshToken: 'eyJhbG…' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid challenge token or TOTP code',
  })
  @HttpCode(HttpStatus.OK)
  async verify2fa(
    @Body() body: VerifyTwoFactorDto,
    @Device() deviceInfo: DeviceInfo,
  ): Promise<StandardResponse<LoginRes>> {
    const res = await this.authService.verify2fa(body, deviceInfo);
    return {
      success: true,
      message: 'Login successful',
      statusCode: HttpStatus.OK,
      data: res,
    };
  }

  // ================================================================
  //. Disable 2FA
  // ================================================================
  @ApiBearerAuth()
  @Delete('2fa')
  @ApiOperation({
    summary: 'Disable 2FA',
    description:
      'Disable TOTP 2FA on the account. Requires the current TOTP code.',
  })
  @ApiBody({ description: 'Current 6-digit TOTP code', type: Disable2faDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '2FA disabled successfully',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: '2FA disabled successfully',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid token or TOTP code',
  })
  @HttpCode(HttpStatus.OK)
  async disable2fa(
    @AccessToken() token: string,
    @Body() body: Disable2faDto,
  ): Promise<StandardResponse<Empty>> {
    const res = await this.authService.disable2fa(token, body);
    return {
      success: true,
      message: '2FA disabled successfully',
      statusCode: HttpStatus.OK,
      data: res,
    };
  }

  // ================================================================
  //. Change password
  // ================================================================
  @ApiBearerAuth()
  @Post('change-password')
  @ApiOperation({
    summary: 'Change Password',
    description:
      "Change the authenticated user's password. Invalidates all sessions on success.",
  })
  @ApiBody({
    description: 'Current and new passwords',
    type: ChangePasswordDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed — all sessions invalidated',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Password changed successfully',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid token or incorrect current password',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'New password cannot be the same as the current one',
  })
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @AccessToken() token: string,
    @Body() body: ChangePasswordDto,
  ): Promise<StandardResponse<Empty>> {
    const res = await this.authService.changePassword(token, body);
    return {
      success: true,
      message: 'Password changed successfully',
      statusCode: HttpStatus.OK,
      data: res,
    };
  }

  // ================================================================
  //. Initiate email change — send OTP to new address
  // ================================================================
  @ApiBearerAuth()
  @Post('email/initiate')
  @ApiOperation({
    summary: 'Initiate Email Change',
    description:
      'Verify password ownership and dispatch a 6-digit OTP to the new email address.',
  })
  @ApiBody({
    description: 'New email address and current password',
    type: ChangeEmailDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP dispatched to the new email address',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'OTP sent to new email address',
        data: { newEmail: 'new@example.com' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid token or incorrect password',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'New email is already registered',
  })
  @HttpCode(HttpStatus.OK)
  async initiateEmailChange(
    @AccessToken() token: string,
    @Body() body: ChangeEmailDto,
  ): Promise<StandardResponse<InitiateEmailChangeRes>> {
    const res = await this.authService.initiateEmailChange(token, body);
    return {
      success: true,
      message: 'OTP sent to new email address',
      statusCode: HttpStatus.OK,
      data: res,
    };
  }

  // ================================================================
  //. Verify email change — confirm OTP, swap email, drop sessions
  // ================================================================
  @ApiBearerAuth()
  @Post('email/verify')
  @ApiOperation({
    summary: 'Verify Email Change',
    description:
      'Submit the OTP sent to the new address to confirm the email change. All sessions are invalidated on success.',
  })
  @ApiBody({
    description: '6-digit OTP sent to the new email address',
    type: VerifyEmailChangeDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email changed — all sessions invalidated',
    schema: {
      example: {
        success: true,
        statusCode: HttpStatus.OK,
        message: 'Email changed successfully',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid token or OTP expired',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Target email was claimed by another account',
  })
  @HttpCode(HttpStatus.OK)
  async verifyEmailChange(
    @AccessToken() token: string,
    @Body() body: VerifyEmailChangeDto,
  ): Promise<StandardResponse<Empty>> {
    const res = await this.authService.verifyEmailChange(token, body);
    return {
      success: true,
      message: 'Email changed successfully',
      statusCode: HttpStatus.OK,
      data: res,
    };
  }
}
