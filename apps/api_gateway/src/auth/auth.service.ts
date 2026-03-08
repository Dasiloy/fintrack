import { lastValueFrom, timeout } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

import { DeviceInfo } from '@fintrack/types/interfaces/device';

import {
  AUTH_PACKAGE_NAME,
  AUTH_SERVICE_NAME,
  AuthServiceClient,
  ConfirmTwoFactorSetupRes,
  Empty,
  ForgotPasswordRes,
  InitiateTwoFactorSetupRes,
  InitiateEmailChangeRes,
  LoginRes,
  RefreshTokenRes,
  RegisterRes,
  ResendForgotPasswordTokenRes,
  ResendVerifyEmailTokenRes,
  VerifyEmailRes,
  VerifyPasswordTokenRes,
} from '@fintrack/types/protos/auth/auth';

import {
  ChangeEmailDto,
  ChangePasswordDto,
  Confirm2faDto,
  Disable2faDto,
  ForgotPasswordDto,
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

@Injectable()
export class AuthService implements OnModuleInit {
  private authService: AuthServiceClient;

  constructor(@Inject(AUTH_PACKAGE_NAME) private client: ClientGrpc) {}

  onModuleInit() {
    this.authService =
      this.client.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  /**
   * @description Register a new user via the auth microservice
   *
   * @async
   * @public
   * @param {RegisterUserDto} data User registration data
   * @returns {Promise<RegisterRes>} Registered user data
   * @throws {ConflictException} If the user email is already registered (mapped from microservice ALREADY_EXISTS)
   * @throws {RequestTimeoutException} If the auth microservice times out (mapped from 15s timeout)
   */
  async register(data: RegisterUserDto): Promise<RegisterRes> {
    const user = await lastValueFrom(
      this.authService.register(data).pipe(timeout(25000)),
    );

    return user;
  }

  /**
   * @description Verify User Email  via the auth microservice
   *
   * @async
   * @public
   * @param  {VerifyEmailDto} data  contains otp code
   * @param  {string} jwtToken  contains user verification data
   * @returns {Promise<VerifyEmailRes>} Verify Email response contains tokens
   * @throws {UnauthorizedException} If the otp code, emailtoken is expired, or incorrect data is passed
   * @throws {RequestTimeoutException} If the auth microservice times out (mapped from 15s timeout)
   */
  async verifyEmail(
    data: VerifyEmailDto,
    jwtToken: string,
    deviceInfo: DeviceInfo,
  ): Promise<VerifyEmailRes> {
    const metadata = new Metadata();
    metadata.add('x-token', jwtToken);
    return lastValueFrom(
      this.authService
        .verifyEmail(
          {
            otp: data.otp,
            deviceId: deviceInfo.deviceId,
            userAgent: deviceInfo.userAgent,
            ipAddress: deviceInfo.ipAddress,
            location: deviceInfo.location,
          },
          metadata,
        )
        .pipe(timeout(25000)),
    );
  }

  /**
   * @description Validate a JWT token via the auth microservice
   *
   * @async
   * @private
   * @param {string} token JWT token to validate
   * @returns {Promise<any | null>} Validated user payload or null if invalid
   */
  async validateToken(token: string): Promise<any | null> {
    try {
      const metadata = new Metadata();
      metadata.add('x-token', token);
      return lastValueFrom(
        this.authService.validateToken({}, metadata).pipe(timeout(8000)),
      );
    } catch (error) {
      // Don't throw - return undefined so Apiguard can handle it
      return null;
    }
  }

  /**
   * @description Login user via auth microservice
   *
   * @async
   * @public
   * @param {LoginDto} data login credentials
   * @returns {Promise<LoginRes>} login response contains tokens
   * @throws {UnauthorizedException} If credentials are invalid (mapped from microservice UNAUTHENTICATED)
   * @throws {RequestTimeoutException} If the auth microservice times out (mapped from 15s timeout)
   */
  async login(data: LoginDto, deviceInfo: DeviceInfo): Promise<LoginRes> {
    return lastValueFrom(
      this.authService
        .login({
          email: data.email,
          password: data.password,
          deviceId: deviceInfo.deviceId,
          userAgent: deviceInfo.userAgent,
          ipAddress: deviceInfo.ipAddress,
          location: deviceInfo.location,
        })
        .pipe(timeout(25000)),
    );
  }

  /**
   * @description Resend verification email token
   *
   * @async
   * @public
   * @param {ResendVerifyEmailDto} data email of user
   * @returns {Promise<ResendVerifyEmailTokenRes>} resend verification response
   * @throws {ConflictException} If user is already verified or token is unexpired (mapped from microservice ALREADY_EXISTS)
   * @throws {RequestTimeoutException} If the auth microservice times out (mapped from 15s timeout)
   */
  async resendVerifyEmailToken(
    data: ResendVerifyEmailDto,
  ): Promise<ResendVerifyEmailTokenRes> {
    return lastValueFrom(
      this.authService.resendVerifyEmailToken(data).pipe(timeout(25000)),
    );
  }

  /**
   * @description Handle forgot password request
   *
   * @async
   * @public
   * @param {ForgotPasswordDto} data email of user
   * @returns {Promise<ForgotPasswordRes>} forgot password response
   * @throws {RequestTimeoutException} If the auth microservice times out (mapped from 15s timeout)
   */
  async forgotPassword(data: ForgotPasswordDto): Promise<ForgotPasswordRes> {
    return lastValueFrom(
      this.authService.forgotPassword(data).pipe(timeout(25000)),
    );
  }

  /**
   * @description Resend forgot password token
   *
   * @async
   * @public
   * @param {ResendForgotPasswordDto} data email of user
   * @returns {Promise<ResendForgotPasswordTokenRes>} resend forgot password token response
   * @throws {ConflictException} If a valid token still exists (mapped from microservice ALREADY_EXISTS)
   * @throws {RequestTimeoutException} If the auth microservice times out (mapped from 15s timeout)
   */
  async resendForgotPasswordToken(
    data: ResendForgotPasswordDto,
  ): Promise<ResendForgotPasswordTokenRes> {
    return lastValueFrom(
      this.authService.resendForgotPasswordToken(data).pipe(timeout(25000)),
    );
  }

  /**
   * @description Verify password reset token
   *
   * @async
   * @public
   * @param {VerifyPasswordTokenReqDto} data Contains the email and otp token
   * @returns {Promise<VerifyPasswordTokenRes>} The password token
   * @throws {RpcException} UNAUTHENTICATED if the token is invalid or expired
   * @throws {RpcException} ALREADY_EXISTS if the new password is the same as the old one
   */
  async verifyPasswordToken(
    data: VerifyPasswordTokenReqDto,
  ): Promise<VerifyPasswordTokenRes> {
    return lastValueFrom(
      this.authService.verifyPasswordToken(data).pipe(timeout(25000)),
    );
  }

  /**
   * @description Reset user password
   *
   * @async
   * @public
   * @param {string} jwtToken otp token
   * @param {ResetPasswordDto} data new password and otp
   * @returns {Promise<ResetPasswordRes>} reset password response
   * @throws {UnauthorizedException} If OTP or token is invalid/expired (mapped from microservice UNAUTHENTICATED)
   * @throws {ConflictException} If the new password is same as old (mapped from microservice ALREADY_EXISTS)
   * @throws {RequestTimeoutException} If the auth microservice times out (mapped from 15s timeout)
   */
  async resetPassword(
    jwtToken: string,
    data: ResetPasswordDto,
  ): Promise<Empty> {
    const metadata = new Metadata();
    metadata.add('x-token', jwtToken);
    return lastValueFrom(
      this.authService.resetPassword(data, metadata).pipe(timeout(25000)),
    );
  }

  /**
   * @description Refresh authentication token
   *
   * @async
   * @public
   * @param {RefreshTokenDto} data refresh token (contains refreshToken field used as bearer)
   * @returns {Promise<RefreshTokenRes>} refresh token response
   * @throws {UnauthorizedException} If refresh token is invalid or expired (mapped from microservice UNAUTHENTICATED)
   * @throws {RequestTimeoutException} If the auth microservice times out (mapped from 15s timeout)
   */
  async refreshToken(data: RefreshTokenDto): Promise<RefreshTokenRes> {
    const metadata = new Metadata();
    metadata.add('x-token', data.refreshToken);

    return lastValueFrom(
      this.authService.refreshToken(data, metadata).pipe(timeout(15000)),
    );
  }

  /**
   * @description Login user with Google via auth microservice
   *
   * @async
   * @public
   * @param {string} idToken Google id_token from the OAuth sign-in flow
   * @returns {Promise<LoginRes>} login response contains tokens
   * @throws {UnauthorizedException} If credentials are invalid (mapped from microservice UNAUTHENTICATED)
   * @throws {RequestTimeoutException} If the auth microservice times out (mapped from 15s timeout)
   */
  async loginWithGoogle(
    idToken: string,
    deviceInfo: DeviceInfo,
  ): Promise<LoginRes> {
    return lastValueFrom(
      this.authService
        .loginWithGoogle({
          idToken,
          deviceId: deviceInfo.deviceId,
          userAgent: deviceInfo.userAgent,
          ipAddress: deviceInfo.ipAddress,
          location: deviceInfo.location,
        })
        .pipe(timeout(25000)),
    );
  }

  /**
   * @description Initiate TOTP 2FA setup via the auth microservice
   *
   * @async
   * @public
   * @param {string} token Access JWT
   * @returns {Promise<InitiateTwoFactorSetupRes>} TOTP secret and otpauth URI
   * @throws {UnauthorizedException} If the access token is invalid or expired
   */
  async init2fa(token: string): Promise<InitiateTwoFactorSetupRes> {
    const metadata = new Metadata();
    metadata.add('x-token', token);
    return lastValueFrom(
      this.authService
        .initiateTwoFactorSetup({}, metadata)
        .pipe(timeout(10000)),
    );
  }

  /**
   * @description Confirm TOTP 2FA setup via the auth microservice
   *
   * @async
   * @public
   * @param {string} token Access JWT
   * @param {Confirm2faDto} data 6-digit TOTP code from the authenticator app
   * @returns {Promise<ConfirmTwoFactorSetupRes>} One-time backup codes
   * @throws {UnauthorizedException} If the token is invalid or the TOTP code does not match
   */
  async confirm2fa(token: string, data: Confirm2faDto): Promise<ConfirmTwoFactorSetupRes> {
    const metadata = new Metadata();
    metadata.add('x-token', token);
    return lastValueFrom(
      this.authService
        .confirmTwoFactorSetup({ code: data.code }, metadata)
        .pipe(timeout(10000)),
    );
  }

  /**
   * @description Disable TOTP 2FA via the auth microservice
   *
   * @async
   * @public
   * @param {string} token Access JWT
   * @param {Disable2faDto} data Current 6-digit TOTP code
   * @returns {Promise<Empty>}
   * @throws {UnauthorizedException} If the token or TOTP code is invalid
   */
  async disable2fa(token: string, data: Disable2faDto): Promise<Empty> {
    const metadata = new Metadata();
    metadata.add('x-token', token);
    return lastValueFrom(
      this.authService
        .disableTwoFactor({ code: data.code }, metadata)
        .pipe(timeout(10000)),
    );
  }

  /**
   * @description Complete a 2FA login challenge via the auth microservice
   *
   * @async
   * @public
   * @param {VerifyTwoFactorDto} data Challenge JWT, TOTP/backup code
   * @param {DeviceInfo} deviceInfo Client device information
   * @returns {Promise<LoginRes>} Full auth tokens on success
   * @throws {UnauthorizedException} If the challenge token or code is invalid
   */
  async verify2fa(data: VerifyTwoFactorDto, deviceInfo: DeviceInfo): Promise<LoginRes> {
    return lastValueFrom(
      this.authService
        .verifyTwoFactor({
          twoFactorToken: data.twoFactorToken,
          code: data.code,
          deviceId: deviceInfo.deviceId,
          userAgent: deviceInfo.userAgent,
          ipAddress: deviceInfo.ipAddress,
          location: deviceInfo.location,
        })
        .pipe(timeout(25000)),
    );
  }

  /**
   * @description Change the authenticated user's password via the auth microservice
   *
   * @async
   * @public
   * @param {string} token Access JWT
   * @param {ChangePasswordDto} data Current and new passwords
   * @returns {Promise<Empty>}
   * @throws {UnauthorizedException} If the token or current password is invalid
   * @throws {ConflictException} If the new password matches the current one
   */
  async changePassword(token: string, data: ChangePasswordDto): Promise<Empty> {
    const metadata = new Metadata();
    metadata.add('x-token', token);
    return lastValueFrom(
      this.authService
        .changePassword(
          { currentPassword: data.currentPassword, newPassword: data.newPassword },
          metadata,
        )
        .pipe(timeout(25000)),
    );
  }

  /**
   * @description Initiate an in-app email change via the auth microservice
   *
   * @async
   * @public
   * @param {string} token Access JWT
   * @param {ChangeEmailDto} data New email address and current password
   * @returns {Promise<InitiateEmailChangeRes>} The new email address the OTP was sent to
   * @throws {UnauthorizedException} If the token or current password is invalid
   * @throws {ConflictException} If the new email is already registered
   */
  async initiateEmailChange(token: string, data: ChangeEmailDto): Promise<InitiateEmailChangeRes> {
    const metadata = new Metadata();
    metadata.add('x-token', token);
    return lastValueFrom(
      this.authService
        .initiateEmailChange(
          { newEmail: data.newEmail, currentPassword: data.currentPassword },
          metadata,
        )
        .pipe(timeout(25000)),
    );
  }

  /**
   * @description Complete an in-app email change via the auth microservice
   *
   * @async
   * @public
   * @param {string} token Access JWT
   * @param {VerifyEmailChangeDto} data 6-digit OTP sent to the new email address
   * @returns {Promise<Empty>}
   * @throws {UnauthorizedException} If the token or OTP is invalid or expired
   * @throws {ConflictException} If the target email was claimed since initiation
   */
  async verifyEmailChange(token: string, data: VerifyEmailChangeDto): Promise<Empty> {
    const metadata = new Metadata();
    metadata.add('x-token', token);
    return lastValueFrom(
      this.authService
        .verifyEmailChange({ otp: data.otp }, metadata)
        .pipe(timeout(25000)),
    );
  }
}
