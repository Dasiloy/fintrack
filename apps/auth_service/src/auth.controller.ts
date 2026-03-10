import { Observable } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';

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
  ValidateTokenRes,
  RefreshTokenRes,
  ResetPasswordReq,
  VerifyPasswordTokenRes,
  VerifyPasswordTokenReq,
  LoginwithGoggleReq,
  Empty,
  InitiateTwoFactorSetupRes,
  ConfirmTwoFactorSetupReq,
  ConfirmTwoFactorSetupRes,
  DisableTwoFactorReq,
  VerifyTwoFactorReq,
  ChangePasswordReq,
  ChangeEmailReq,
  InitiateEmailChangeRes,
  VerifyEmailChangeReq,
  DeleteAccountReq,
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
   * @description Complete a 2FA login challenge using a TOTP code or backup code.
   * Returns full auth tokens on success.
   *
   * @public
   * @param {VerifyTwoFactorReq} request Challenge JWT, TOTP/backup code, and device info
   * @returns {Promise<LoginRes> | Observable<LoginRes> | LoginRes}
   * @throws {RpcException} UNAUTHENTICATED if the challenge token or code is invalid
   */
  verifyTwoFactor(
    request: VerifyTwoFactorReq,
    metadata?: Metadata,
  ): Promise<LoginRes> | Observable<LoginRes> | LoginRes {
    return this.authService.verify2faCodes(request);
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
   * @description Verify Password Otp
   *
   * @async
   * @public
   * @param {VerifyPasswordTokenReq} request
   * @returns {Promise<VerifyPasswordTokenRes> | Observable<VerifyPasswordTokenRes> | VerifyPasswordTokenRes}
   * @throws {RpcException} ALREADY_EXISTS
   */
  verifyPasswordToken(
    request: VerifyPasswordTokenReq,
  ):
    | Promise<VerifyPasswordTokenRes>
    | Observable<VerifyPasswordTokenRes>
    | VerifyPasswordTokenRes {
    return this.authService.verifyPasswordToken(request);
  }

  /**
   * @description Handle forgot password request
   *
   * @async
   * @public
   * @param {ResetPasswordReq} request
   * @returns {Promise<Empty> | Observable<Empty> | Empty}
   * @throws {RpcException} UNIMPLEMENTED
   */
  @TokenMeta('otp_token')
  @UseGuards(TokenGuard)
  resetPassword(
    request: ResetPasswordReq,
    metadata: Metadata,
  ): Promise<Empty> | Observable<Empty> | Empty {
    return this.authService.resetPassword((metadata as any).user, request);
  }

  /**
   * @description Validate authentication token
   *
   * @async
   * @public
   * @param {Empty} _request just pass an empty object
   * @returns {Promise<ValidateTokenRes> | Observable<ValidateTokenRes> | ValidateTokenRes}
   * @throws {RpcException} UNAUTHENTICATED
   */
  @TokenMeta('access_token')
  @UseGuards(TokenGuard)
  async validateToken(
    _request: Empty,
    metadata: Metadata,
  ): Promise<ValidateTokenRes> {
    const userMeta = (metadata as any).user;
    const user = await this.authService.validateUser(userMeta.id);

    return {
      id: user.id,
      avatar: user.avatar!,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  /**
   * @description Refresh authentication token
   *
   * @async
   * @public
   * @param {Empty} _request
   * @returns {Promise<RefreshTokenRes> | Observable<RefreshTokenRes> | RefreshTokenRes}
   * @throws {RpcException} UNAUTHENTICATED
   */
  @TokenMeta('refresh_token')
  @UseGuards(TokenGuard)
  refreshToken(
    _request: Empty,
    metadata: Metadata,
  ): Promise<RefreshTokenRes> | Observable<RefreshTokenRes> | RefreshTokenRes {
    const user = (metadata as any).user;
    return this.authService.refreshAuthTokens(user);
  }

  /**
   * @description Login With  Google
   *
   * @async
   * @public
   * @param {LoginwithGoggleReq} request
   * @returns {Promise<LoginRes> | Observable<LoginRes> | LoginRes}
   * @throws {RpcException} UNAUTHENTICATED
   */
  loginWithGoogle(
    request: LoginwithGoggleReq,
  ): Promise<LoginRes> | Observable<LoginRes> | LoginRes {
    return this.authService.loginWithGoogle(request);
  }

  /**
   * @description Initiate TOTP 2FA setup for the authenticated user.
   * Returns a base32 secret and an otpauth URI to render as a QR code.
   *
   * @public
   * @param {Empty} _request
   * @param {Metadata} metadata Contains the access token
   * @returns {Promise<InitiateTwoFactorSetupRes> | Observable<InitiateTwoFactorSetupRes> | InitiateTwoFactorSetupRes}
   * @throws {RpcException} UNAUTHENTICATED if the token is invalid or expired
   */
  @TokenMeta('access_token')
  @UseGuards(TokenGuard)
  initiateTwoFactorSetup(
    _request: Empty,
    metadata?: Metadata,
  ):
    | Promise<InitiateTwoFactorSetupRes>
    | Observable<InitiateTwoFactorSetupRes>
    | InitiateTwoFactorSetupRes {
    const userMeta = (metadata as any).user;
    return this.authService.init2fa(userMeta.id);
  }

  /**
   * @description Confirm TOTP 2FA setup by verifying the first code from the authenticator app.
   * Returns one-time backup codes on success.
   *
   * @public
   * @param {ConfirmTwoFactorSetupReq} request Contains the 6-digit TOTP code
   * @param {Metadata} metadata Contains the access token
   * @returns {Promise<ConfirmTwoFactorSetupRes> | Observable<ConfirmTwoFactorSetupRes> | ConfirmTwoFactorSetupRes}
   * @throws {RpcException} UNAUTHENTICATED if the token is invalid or the TOTP code does not match
   */
  @TokenMeta('access_token')
  @UseGuards(TokenGuard)
  confirmTwoFactorSetup(
    request: ConfirmTwoFactorSetupReq,
    metadata?: Metadata,
  ):
    | Promise<ConfirmTwoFactorSetupRes>
    | Observable<ConfirmTwoFactorSetupRes>
    | ConfirmTwoFactorSetupRes {
    const userMeta = (metadata as any).user;
    return this.authService.confirm2faSetup(userMeta.id, request);
  }

  /**
   * @description Disable TOTP 2FA on the authenticated user's account.
   * Requires the current TOTP code to prevent unauthorised disablement.
   *
   * @public
   * @param {DisableTwoFactorReq} request Contains the current 6-digit TOTP code
   * @param {Metadata} metadata Contains the access token
   * @returns {Promise<Empty> | Observable<Empty> | Empty}
   * @throws {RpcException} UNAUTHENTICATED if the token or TOTP code is invalid
   */
  @TokenMeta('access_token')
  @UseGuards(TokenGuard)
  disableTwoFactor(
    request: DisableTwoFactorReq,
    metadata?: Metadata,
  ): Promise<Empty> | Observable<Empty> | Empty {
    const userMeta = (metadata as any).user;
    return this.authService.disable2fa(userMeta.id, request);
  }

  /**
   * @description Change the authenticated user's password.
   * Verifies the current password, updates to the new one, and invalidates all sessions.
   *
   * @public
   * @param {ChangePasswordReq} request Current and new passwords
   * @param {Metadata} metadata Contains the access token
   * @returns {Promise<Empty> | Observable<Empty> | Empty}
   * @throws {RpcException} UNAUTHENTICATED if the token or current password is invalid
   * @throws {RpcException} ALREADY_EXISTS if the new password matches the current one
   */
  @TokenMeta('access_token')
  @UseGuards(TokenGuard)
  changePassword(
    request: ChangePasswordReq,
    metadata?: Metadata,
  ): Promise<Empty> | Observable<Empty> | Empty {
    const userMeta = (metadata as any).user;
    return this.authService.changePassword(userMeta.id, request);
  }

  /**
   * @description Initiate an in-app email change by verifying the current password
   * and dispatching a 6-digit OTP to the requested new address.
   *
   * @public
   * @param {ChangeEmailReq} request New email address and current password
   * @param {Metadata} metadata Contains the access token
   * @returns {Promise<InitiateEmailChangeRes> | Observable<InitiateEmailChangeRes> | InitiateEmailChangeRes}
   * @throws {RpcException} UNAUTHENTICATED if the token or current password is invalid
   * @throws {RpcException} ALREADY_EXISTS if the new email is already registered
   */
  @TokenMeta('access_token')
  @UseGuards(TokenGuard)
  initiateEmailChange(
    request: ChangeEmailReq,
    metadata?: Metadata,
  ):
    | Promise<InitiateEmailChangeRes>
    | Observable<InitiateEmailChangeRes>
    | InitiateEmailChangeRes {
    const userMeta = (metadata as any).user;
    return this.authService.initiateEmailChange(userMeta.id, request);
  }

  /**
   * @description Complete an in-app email change by verifying the OTP sent to the new address.
   * Updates the email, deletes the pending token, and invalidates all sessions.
   *
   * @public
   * @param {VerifyEmailChangeReq} request 6-digit OTP from the new email address
   * @param {Metadata} metadata Contains the access token
   * @returns {Promise<Empty> | Observable<Empty> | Empty}
   * @throws {RpcException} UNAUTHENTICATED if the token or OTP is invalid or expired
   * @throws {RpcException} ALREADY_EXISTS if the target email was claimed since initiation
   */
  @TokenMeta('access_token')
  @UseGuards(TokenGuard)
  verifyEmailChange(
    request: VerifyEmailChangeReq,
    metadata?: Metadata,
  ): Promise<Empty> | Observable<Empty> | Empty {
    const userMeta = (metadata as any).user;
    return this.authService.verifyEmailChange(userMeta.id, request);
  }

  /**
   * @description Regenerate backup codes for the authenticated user.
   * Requires the current TOTP code. Atomically replaces all existing codes.
   *
   * @public
   * @param {ConfirmTwoFactorSetupReq} request Contains the 6-digit TOTP code
   * @param {Metadata} metadata Contains the access token
   * @returns {Promise<ConfirmTwoFactorSetupRes>} 10 new plain backup codes
   * @throws {RpcException} FAILED_PRECONDITION if 2FA is not enabled
   * @throws {RpcException} UNAUTHENTICATED if the TOTP code is invalid
   */
  @TokenMeta('access_token')
  @UseGuards(TokenGuard)
  regenerateBackupCodes(
    request: ConfirmTwoFactorSetupReq,
    metadata?: Metadata,
  ):
    | Promise<ConfirmTwoFactorSetupRes>
    | Observable<ConfirmTwoFactorSetupRes>
    | ConfirmTwoFactorSetupRes {
    const userMeta = (metadata as any).user;
    return this.authService.regenerateBackupCodes(userMeta.id, request);
  }

  /**
   * @description Schedule the authenticated user's account for permanent deletion.
   * Sessions are revoked immediately. Hard delete executes after a 30-day grace window.
   * Requires password verification (skipped for social-only accounts).
   * When 2FA is enabled, `otpCode` is required.
   *
   * @public
   * @param {DeleteAccountReq} request Optional password and OTP code
   * @param {Metadata} metadata Contains the access token
   * @returns {Promise<Empty> | Observable<Empty> | Empty}
   * @throws {RpcException} UNAUTHENTICATED if the password or TOTP code is invalid
   * @throws {RpcException} RESOURCE_EXHAUSTED if too many failed verification attempts
   */
  @TokenMeta('access_token')
  @UseGuards(TokenGuard)
  deleteAccount(
    request: DeleteAccountReq,
    metadata?: Metadata,
  ): Promise<Empty> | Observable<Empty> | Empty {
    const userMeta = (metadata as any).user;
    return this.authService.deleteAccount(userMeta.id, request);
  }
}
