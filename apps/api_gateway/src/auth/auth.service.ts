import { lastValueFrom, timeout } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

import {
  AUTH_PACKAGE_NAME,
  AUTH_SERVICE_NAME,
  AuthServiceClient,
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
      this.authService.register(data).pipe(timeout(15000)),
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
  ): Promise<VerifyEmailRes> {
    const metadata = new Metadata();
    metadata.add('x-token', jwtToken);
    return lastValueFrom(
      this.authService
        .verifyEmail({ otp: data.otp }, metadata)
        .pipe(timeout(15000)),
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
  async login(data: LoginDto): Promise<LoginRes> {
    return lastValueFrom(this.authService.login(data).pipe(timeout(15000)));
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
      this.authService.resendVerifyEmailToken(data).pipe(timeout(15000)),
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
      this.authService.forgotPassword(data).pipe(timeout(15000)),
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
      this.authService.resendForgotPasswordToken(data).pipe(timeout(15000)),
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
  ): Promise<ResetPasswordRes> {
    const metadata = new Metadata();
    metadata.add('x-token', jwtToken);
    return lastValueFrom(
      this.authService.resetPassword(data, metadata).pipe(timeout(15000)),
    );
  }

  /**
   * @description Refresh authentication token
   *
   * @async
   * @public
   * @param {RefreshTokenDto} data refresh token
   * @param {string} jwtToken containg refreshToken
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
}
