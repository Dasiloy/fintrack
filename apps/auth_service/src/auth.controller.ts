import { Metadata, status } from '@grpc/grpc-js';

import { Controller, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

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
} from '@fintrack/types/protos/auth/auth';

import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

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
   * @throws {RpcException} UNIMPLEMENTED
   */
  verifyEmail(
    request: VerifyEmailReq,
  ): Promise<VerifyEmailRes> | Observable<VerifyEmailRes> | VerifyEmailRes {
    throw new RpcException({
      code: status.UNIMPLEMENTED,
      message: 'Method not implemented',
    });
  }

  /**
   * @description Resend email verification token
   *
   * @async
   * @public
   * @param {ResendVerifyEmailTokenReq} request
   * @returns {Promise<ResendVerifyEmailTokenRes> | Observable<ResendVerifyEmailTokenRes> | ResendVerifyEmailTokenRes}
   * @throws {RpcException} UNIMPLEMENTED
   */
  resendVerifyEmailToken(
    request: ResendVerifyEmailTokenReq,
  ):
    | Promise<ResendVerifyEmailTokenRes>
    | Observable<ResendVerifyEmailTokenRes>
    | ResendVerifyEmailTokenRes {
    throw new RpcException({
      code: status.UNIMPLEMENTED,
      message: 'Method not implemented',
    });
  }

  /**
   * @description Login user via credentials
   *
   * @async
   * @public
   * @param {LoginReq} request
   * @returns {Promise<LoginRes> | Observable<LoginRes> | LoginRes}
   * @throws {RpcException} UNIMPLEMENTED
   */
  login(
    request: LoginReq,
  ): Promise<LoginRes> | Observable<LoginRes> | LoginRes {
    throw new RpcException({
      code: status.UNIMPLEMENTED,
      message: 'Method not implemented',
    });
  }

  /**
   * @description Handle forgot password request
   *
   * @async
   * @public
   * @param {ForgotPasswordReq} request
   * @returns {Promise<ForgotPasswordRes> | Observable<ForgotPasswordRes> | ForgotPasswordRes}
   * @throws {RpcException} UNIMPLEMENTED
   */
  forgotPassword(
    request: ForgotPasswordReq,
  ):
    | Promise<ForgotPasswordRes>
    | Observable<ForgotPasswordRes>
    | ForgotPasswordRes {
    throw new RpcException({
      code: status.UNIMPLEMENTED,
      message: 'Method not implemented',
    });
  }

  /**
   * @description Resend forgot password token
   *
   * @async
   * @public
   * @param {ResendForgotPasswordTokenReq} request
   * @returns {Promise<ResendForgotPasswordTokenRes> | Observable<ResendForgotPasswordTokenRes> | ResendForgotPasswordTokenRes}
   * @throws {RpcException} UNIMPLEMENTED
   */
  resendForgotPasswordToken(
    request: ResendForgotPasswordTokenReq,
  ):
    | Promise<ResendForgotPasswordTokenRes>
    | Observable<ResendForgotPasswordTokenRes>
    | ResendForgotPasswordTokenRes {
    throw new RpcException({
      code: status.UNIMPLEMENTED,
      message: 'Method not implemented',
    });
  }

  /**
   * @description Validate authentication token
   *
   * @async
   * @public
   * @param {ValidateTokenReq} request
   * @returns {Promise<ValidateTokenRes> | Observable<ValidateTokenRes> | ValidateTokenRes}
   * @throws {RpcException} UNIMPLEMENTED
   */
  validateToken(
    request: ValidateTokenReq,
  ):
    | Promise<ValidateTokenRes>
    | Observable<ValidateTokenRes>
    | ValidateTokenRes {
    throw new RpcException({
      code: status.UNIMPLEMENTED,
      message: 'Method not implemented',
    });
  }

  /**
   * @description Refresh authentication token
   *
   * @async
   * @public
   * @param {RefreshTokenReq} request
   * @returns {Promise<RefreshTokenRes> | Observable<RefreshTokenRes> | RefreshTokenRes}
   * @throws {RpcException} UNIMPLEMENTED
   */
  refreshToken(
    request: RefreshTokenReq,
  ): Promise<RefreshTokenRes> | Observable<RefreshTokenRes> | RefreshTokenRes {
    throw new RpcException({
      code: status.UNIMPLEMENTED,
      message: 'Method not implemented',
    });
  }
}
