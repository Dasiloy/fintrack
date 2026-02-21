import { Observable } from 'rxjs';
import { Metadata, status } from '@grpc/grpc-js';

import { Controller, Logger, UseGuards } from '@nestjs/common';

import {
  LoginReq,
  LoginRes,
  RegisterRes,
  AuthServiceController,
  AuthServiceControllerMethods,
  RegisterReq,
  VerifyEmailReq,
  VerifyEmailRes,
  ResendVerifyEmailTokenReq,
  ResendVerifyEmailTokenRes,
  ForgotPasswordReq,
  ForgotPasswordRes,
  ResendForgotPasswordTokenReq,
  ResendForgotPasswordTokenRes,
  ValidateTokenReq,
  ValidateTokenRes,
  RefreshTokenReq,
  RefreshTokenRes,
  ResetPasswordReq,
  ResetPasswordRes,
} from '@fintrack/types/protos/auth/auth';

import { AuthService } from './auth.service';
import { TokenGuard } from './guards/token.guard';
import { TokenMeta } from './decorators/token.decorator';

/**
 * Controller Responsible for managing app-wide authentication
 * Communicates with Api Gateway and other microservice via GCP
 * Returns an Observable
 *
 * @class AuthController
 */
@Controller()
@AuthServiceControllerMethods()
export class AuthController implements AuthServiceController {
  logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  /**
   * @description Register a new user
   *
   * @async
   * @public
   * @param {RegisterReq} request
   * @returns {Promise<RegisterRes> | Observable<RegisterRes> | RegisterRes}
   * @throws {RpcException} ALREADY_EXISTS if user already exists
   */
  register(
    request: RegisterReq,
  ): Promise<RegisterRes> | Observable<RegisterRes> | RegisterRes {
    return this.authService.register(request);
  }

  /**
   * @description Verify user email via token
   *
   * @async
   * @public
   * @param {VerifyEmailReq} request
   * @returns {Promise<VerifyEmailRes> | Observable<VerifyEmailRes> | VerifyEmailRes}
   * @throws {RpcException} UNAUTHENTICATED
   */
  @TokenMeta('otp_token')
  @UseGuards(TokenGuard)
  verifyEmail(
    request: VerifyEmailReq,
    metadata: Metadata,
  ): Promise<VerifyEmailRes> | Observable<VerifyEmailRes> | VerifyEmailRes {
    return this.authService.verifyEmail((metadata as any).user, request);
  }

  /**
   * @description Resend email verification token
   *
   * @async
   * @public
   * @param {ResendVerifyEmailTokenReq} request
   * @returns {Promise<ResendVerifyEmailTokenRes> | Observable<ResendVerifyEmailTokenRes> | ResendVerifyEmailTokenRes}
   * @throws {RpcException} ALREADY_EXISTS
   */
  resendVerifyEmailToken(
    request: ResendVerifyEmailTokenReq,
  ):
    | Promise<ResendVerifyEmailTokenRes>
    | Observable<ResendVerifyEmailTokenRes>
    | ResendVerifyEmailTokenRes {
    return this.authService.resendVerificationEmail(request);
  }

  /**
   * @description Login user via credentials
   *
   * @async
   * @public
   * @param {LoginReq} request
   * @returns {Promise<LoginRes> | Observable<LoginRes> | LoginRes}
   * @throws {RpcException} UNAUTHENTICATED
   */
  login(
    request: LoginReq,
  ): Promise<LoginRes> | Observable<LoginRes> | LoginRes {
    return this.authService.login(request);
  }

  /**
   * @description Handle forgot password request
   *
   * @async
   * @public
   * @param {ForgotPasswordReq} request
   * @returns {Promise<ForgotPasswordRes> | Observable<ForgotPasswordRes> | ForgotPasswordRes}
   */
  forgotPassword(
    request: ForgotPasswordReq,
  ):
    | Promise<ForgotPasswordRes>
    | Observable<ForgotPasswordRes>
    | ForgotPasswordRes {
    return this.authService.forgotPassword(request);
  }

  /**
   * @description Resend forgot password token
   *
   * @async
   * @public
   * @param {ResendForgotPasswordTokenReq} request
   * @returns {Promise<ResendForgotPasswordTokenRes> | Observable<ResendForgotPasswordTokenRes> | ResendForgotPasswordTokenRes}
   * @throws {RpcException} ALREADY_EXISTS
   */
  resendForgotPasswordToken(
    request: ResendForgotPasswordTokenReq,
  ):
    | Promise<ResendForgotPasswordTokenRes>
    | Observable<ResendForgotPasswordTokenRes>
    | ResendForgotPasswordTokenRes {
    return this.authService.resendForgotPassword(request);
  }

  /**
   * @description Handle forgot password request
   *
   * @async
   * @public
   * @param {ResetPasswordReq} request
   * @returns {Promise<ResetPasswordRes> | Observable<ResetPasswordRes> | ResetPasswordRes}
   * @throws {RpcException} UNIMPLEMENTED
   */
  @TokenMeta('otp_token')
  @UseGuards(TokenGuard)
  resetPassword(
    request: ResetPasswordReq,
    metadata: Metadata,
  ):
    | Promise<ResetPasswordRes>
    | Observable<ResetPasswordRes>
    | ResetPasswordRes {
    return this.authService.resetPassword((metadata as any).user, request);
  }

  /**
   * @description Validate authentication token
   *
   * @async
   * @public
   * @param {ValidateTokenReq} request
   * @returns {Promise<ValidateTokenRes> | Observable<ValidateTokenRes> | ValidateTokenRes}
   * @throws {RpcException} UNAUTHENTICATED
   */
  @TokenMeta('access_token')
  @UseGuards(TokenGuard)
  validateToken(
    _request: ValidateTokenReq,
    metadata: Metadata,
  ):
    | Promise<ValidateTokenRes>
    | Observable<ValidateTokenRes>
    | ValidateTokenRes {
    const user = (metadata as any).user;
    return this.authService.validateToken(user.id);
  }

  /**
   * @description Refresh authentication token
   *
   * @async
   * @public
   * @param {RefreshTokenReq} request
   * @returns {Promise<RefreshTokenRes> | Observable<RefreshTokenRes> | RefreshTokenRes}
   * @throws {RpcException} UNAUTHENTICATED
   */
  @TokenMeta('refresh_token')
  @UseGuards(TokenGuard)
  refreshToken(
    _request: RefreshTokenReq,
    metadata: Metadata,
  ): Promise<RefreshTokenRes> | Observable<RefreshTokenRes> | RefreshTokenRes {
    const user = (metadata as any).user;
    return this.authService.refreshAuthTokens(user);
  }
}
