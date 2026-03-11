import * as crypto from 'crypto';

import { OTP } from 'otplib';
import { OAuth2Client } from 'google-auth-library';
import { Queue } from 'bullmq';
import { status } from '@grpc/grpc-js';
import * as bcrypt from 'bcrypt';

import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

import {
  Prisma,
  Session,
  User,
  VerificationToken,
} from '@fintrack/database/types';
import { TokenPayload } from '@fintrack/types/interfaces/token_payload';
import { PrismaService } from '@fintrack/database/nest';
import {
  ForgotPasswordReq,
  ForgotPasswordRes,
  LoginReq,
  LoginRes,
  LoginwithGoggleReq,
  RefreshTokenRes,
  RegisterReq,
  RegisterRes,
  ResendForgotPasswordTokenReq,
  ResendForgotPasswordTokenRes,
  ResendVerifyEmailTokenReq,
  ResendVerifyEmailTokenRes,
  ResetPasswordReq,
  Empty,
  VerifyEmailReq,
  VerifyEmailRes,
  VerifyPasswordTokenReq,
  VerifyPasswordTokenRes,
  InitiateTwoFactorSetupRes,
  ConfirmTwoFactorSetupReq,
  ConfirmTwoFactorSetupRes,
  VerifyTwoFactorReq,
  DisableTwoFactorReq,
  ChangePasswordReq,
  ChangeEmailReq,
  InitiateEmailChangeRes,
  VerifyEmailChangeReq,
  DeleteAccountReq,
} from '@fintrack/types/protos/auth/auth';
import {
  EMAIL_VERIFICATION_JOB,
  TOKEN_NOTIFICATION_QUEUE,
  WELCOME_EMAIL_JOB,
  FORGOT_PASSWORD_EMAIL_JOB,
  PASSWORD_CHANGE_JOB,
  EMAIL_CHANGE_JOB,
  EMAIL_CHANGED_JOB,
  ACCOUNT_CLEANUP_QUEUE,
  CANCEL_STRIPE_SUBSCRIPTION_JOB,
  ACCOUNT_DELETION_EMAIL_JOB,
} from '@fintrack/types/constants/queus.constants';
import { parseJwtExpiration } from '@fintrack/utils/jwt';
import dayjs from '@fintrack/utils/date';
import { getPeriodRange, getTimeFromNowInMinutes } from '@fintrack/utils/date';
import {
  DeviceInfo,
  CreateSessionOptions,
} from '@fintrack/types/interfaces/device';

/**
 * Service responsible for managing user authentication.
 * Interacts with Prisma.
 * Manages User, Account, Session, and VerificationToken.
 *
 * @class AuthService
 */

@Injectable()
export class AuthService {
  // 2fa otp generator / lib
  private readonly otp = new OTP({
    strategy: 'totp',
  });
  private readonly logger = new Logger();

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
    @InjectQueue(TOKEN_NOTIFICATION_QUEUE) private readonly tokenQueue: Queue,
    @InjectQueue(ACCOUNT_CLEANUP_QUEUE) private readonly cleanupQueue: Queue,
  ) {}

  /**
   * @description Register a new user locally,
   *
   * @async
   * @public
   * @param {RegisterReq} data payload from register request
   * @returns {Promise<RegisterRes>} Contains User base info and EmailToken
   * @throws {RpcException} ALREADY_EXISTS if user with email already has local account
   */
  async register(data: RegisterReq): Promise<RegisterRes> {
    try {
      const result = await this.prismaService.$transaction(
        async (tx) => {
          const existingUser = await tx.user.findUnique({
            where: { email: data.email },
            select: {
              id: true,
              scheduledDeletionAt: true,
              accounts: { select: { provider: true } },
            },
          });

          if (existingUser) {
            // Pending-deletion account — use a generic message so the registrant
            // never learns the original account is scheduled for deletion.
            if (existingUser.scheduledDeletionAt) {
              throw new RpcException({
                code: status.ALREADY_EXISTS,
                message: 'An account with this email already exists.',
              });
            }

            const hasSocialAccount = existingUser.accounts.some(
              (acc) => acc.provider !== 'LOCAL',
            );
            throw new RpcException({
              code: status.ALREADY_EXISTS,
              message: hasSocialAccount
                ? 'Please login via your social provider'
                : 'User with this email already exists',
            });
          }

          // Hash only after confirming no duplicate — bcrypt is expensive
          const hashedPassword = this.hashPassword(data.password);

          // Two-step: create user first so we know the ID, then create the LOCAL
          // account using that ID as providerAccountId (stable across email changes)
          const user = await tx.user.create({
            data: {
              ...data,
              password: hashedPassword,
              loginAttempts: 0,
            },
            select: {
              id: true,
              email: true,
              avatar: true,
              firstName: true,
              lastName: true,
            },
          });

          await tx.account.create({
            data: {
              userId: user.id,
              type: 'CREDENTIALS',
              provider: 'LOCAL',
              providerAccountId: user.id,
            },
          });

          await tx.notificationSetting.create({
            data: {
              userId: user.id,
            },
          });

          const otp = this.generateToken();
          await tx.verificationToken.create({
            data: {
              identifier: 'EMAIL',
              email: user.email,
              token: this.hashOtp(otp),
              expires: this.generateExpiryDate(
                this.configService.get<number>('OTP_EXPIRY_MINUTES', 5),
              ),
            },
          });

          return { user, otp };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );

      // ==> After successful commit: sign JWT and dispatch email
      const emailToken = this.jwtService.sign(
        this.createPayload(result.user as User, 'otp_token'),
        {
          secret: this.configService.get('JWT_OTP_SECRET'),
          expiresIn: this.configService.get('JWT_OTP_TOKEN_EXPIRATION'),
        },
      );

      this.tokenQueue.add(EMAIL_VERIFICATION_JOB, {
        otp: result.otp,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      });

      return {
        emailToken,
        user: {
          id: result.user.id,
          email: result.user.email,
          avatar: result.user.avatar!,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
        },
      };
    } catch (error: any) {
      this.logger.error('Register error in AuthService:', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Unable to register, try again later',
      });
    }
  }

  /**
   * @description Verifies a new user's email address using the OTP from their verification email.
   * On success marks the email as verified, provisions a FREE subscription and usage trackers,
   * deletes the consumed verification token, creates a session, and issues auth tokens.
   *
   * @async
   * @public
   * @param {TokenPayload} payload - Decoded OTP JWT payload containing the user's email
   * @param {VerifyEmailReq} data - OTP entered by the user and device info for session creation
   * @returns {Promise<VerifyEmailRes>} Base user info plus access and refresh tokens
   * @throws {RpcException} UNAUTHENTICATED if the OTP token is invalid, expired, or user not found
   * @throws {RpcException} FAILED_PRECONDITION if the email is already verified
   */
  async verifyEmail(
    payload: TokenPayload,
    data: VerifyEmailReq,
  ): Promise<VerifyEmailRes> {
    try {
      const result = await this.prismaService.$transaction(
        async (tx) => {
          const verificationToken = await tx.verificationToken.findFirst({
            where: {
              email: payload.email,
              identifier: 'EMAIL',
              expires: {
                gt: new Date(),
              },
            },
          });

          if (!verificationToken) {
            throw new RpcException({
              code: status.UNAUTHENTICATED,
              message: 'Invalid Token',
            });
          }

          if (!this.comparedOtp(data.otp, verificationToken)) {
            throw new RpcException({
              code: status.UNAUTHENTICATED,
              message: 'Invalid Token',
            });
          }

          const user = await tx.user.findUnique({
            where: {
              email: verificationToken.email,
            },
          });

          if (!user) {
            throw new RpcException({
              code: status.UNAUTHENTICATED,
              message: 'Invalid Token',
            });
          }

          if (user.emailVerified) {
            throw new RpcException({
              code: status.FAILED_PRECONDITION,
              message: 'User already verified',
            });
          }

          await tx.user.update({
            where: {
              id: user.id,
            },
            data: {
              emailVerified: true,
              emailVerifiedAt: new Date(),
              lastLoginAt: new Date(),
            },
          });

          await tx.subscription.create({
            data: {
              userId: user.id,
              plan: 'FREE',
              status: 'ACTIVE',
            },
          });

          const [periodStart, periodEnd] = getPeriodRange();
          await tx.usageTracker.createMany({
            data: [
              {
                userId: user.id,
                feature: 'AI_INSIGHTS_QUERIES',
                count: 0,
                periodStart,
                periodEnd,
              },
              {
                userId: user.id,
                feature: 'AI_CHAT_MESSAGES',
                count: 0,
                periodStart,
                periodEnd,
              },
              {
                userId: user.id,
                feature: 'RECEIPT_UPLOADS',
                count: 0,
                periodStart,
                periodEnd,
              },
            ],
            skipDuplicates: true,
          });

          await tx.verificationToken.delete({
            where: {
              id: verificationToken.id,
            },
          });

          const session = await this.createSession(tx, user.id, {
            deviceInfo: {
              deviceId: data.deviceId,
              userAgent: data.userAgent,
              ipAddress: data.ipAddress,
              location: data.location,
            },
          });

          return { user, session };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      // ==> After successful commit: sign tokens and dispatch welcome email
      const tokens = this.generateAuthTokens(
        result.user as User,
        result.session,
      );

      this.tokenQueue.add(WELCOME_EMAIL_JOB, {
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      });

      return {
        user: {
          id: result.user.id,
          email: result.user.email,
          avatar: result.user.avatar!,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      this.logger.error('VerifyEmail error in AuthService:', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid Token',
      });
    }
  }

  /**
   * @description Resend Verifcation Otp
   *
   *
   * @async
   * @public
   * @param {ResendVerifyEmailTokenReq} data contains the email of user
   * @returns {Promise<ResendVerifyEmailTokenRes>} response with token and user data or null to prevent hackers
   * @throws {RpcException} ALREADY EXISTS for unexpired tokens to prevent abuse of resources
   */
  async resendVerificationEmail(
    data: ResendVerifyEmailTokenReq,
  ): Promise<ResendVerifyEmailTokenRes> {
    try {
      const result = await this.prismaService.$transaction(
        async (tx) => {
          const user = await tx.user.findUnique({
            where: { email: data.email },
          });

          if (!user) {
            return null as any;
          }

          const verificationToken = await tx.verificationToken.findFirst({
            where: {
              email: data.email,
              identifier: 'EMAIL',
              expires: { gte: new Date() },
            },
          });

          if (verificationToken) {
            throw new RpcException({
              code: status.ALREADY_EXISTS,
              message: `Please retry in ${getTimeFromNowInMinutes(verificationToken.expires)} minutes`,
            });
          }

          await tx.verificationToken.deleteMany({
            where: {
              email: data.email,
              identifier: 'EMAIL',
            },
          });

          const otp = this.generateToken();
          await tx.verificationToken.create({
            data: {
              identifier: 'EMAIL',
              email: user.email,
              token: this.hashOtp(otp),
              expires: this.generateExpiryDate(
                this.configService.get<number>('OTP_EXPIRY_MINUTES', 5),
              ),
            },
          });

          return { user, otp };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      // User not found — return silently to prevent email enumeration
      if (!result) return {} as any;

      // ==> After successful commit: sign JWT and dispatch email
      const emailToken = this.jwtService.sign(
        this.createPayload(result.user as User, 'otp_token'),
        {
          secret: this.configService.get('JWT_OTP_SECRET'),
          expiresIn: this.configService.get('JWT_OTP_TOKEN_EXPIRATION'),
        },
      );

      this.tokenQueue.add(EMAIL_VERIFICATION_JOB, {
        otp: result.otp,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      });

      return {
        emailToken,
        user: {
          id: result.user.id,
          email: result.user.email,
          avatar: result.user.avatar!,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
        },
      };
    } catch (error) {
      this.logger.error('ResendVerificationEmail error in AuthService:', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occured!',
      });
    }
  }

  /**
   * @description Login Route for verified user using local credentials
   *
   * @async
   * @public
   * @param {LoginReq} data containing email and password for local user login
   * @returns {Promise<LoginRes>} base user info and tokens
   * @throws {RpcException} UNAUTHENTICATED catches incorrect email/password, maxed out login requests
   */
  async login(data: LoginReq): Promise<LoginRes> {
    try {
      // ── Step 1: Load user ────────────────────────────────────────────────────
      // All checks run outside a transaction so that any writes (e.g. the
      // loginAttempts increment) commit immediately and are not rolled back
      // when we throw a RpcException.
      const user = await this.prismaService.user.findUnique({
        where: { email: data.email },
      });

      if (!user) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Invalid Email/Password',
        });
      }

      // ── Deletion guard — treat pending-deletion accounts as non-existent ─────
      if (user.scheduledDeletionAt) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Invalid Email/Password.',
        });
      }

      // ── Step 2: Rate-limit ───────────────────────────────────────────────────
      const maxAttempts = this.configService.get<number>(
        'MAX_LOGIN_ATTEMPTS',
        3,
      );

      if (
        user.loginAttempts >= maxAttempts ||
        user.twoFactorAttempts >= maxAttempts
      ) {
        throw new RpcException({
          code: status.RESOURCE_EXHAUSTED,
          message:
            'Too many failed login attempts. Reset your password to regain access.',
        });
      }

      // ── Step 3: Password check ───────────────────────────────────────────────
      if (!this.comparedPassword(data.password, user)) {
        // Increment OUTSIDE any transaction so the counter always persists
        const failedUser = await this.prismaService.user.update({
          where: { email: user.email },
          data: { loginAttempts: { increment: 1 } },
        });

        this.recordLoginActivity(user.id, 'PASSWORD', 'FALED', {
          deviceId: data.deviceId,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
          location: data.location,
        });

        const hasMaxedOut = failedUser.loginAttempts >= maxAttempts;

        throw new RpcException({
          code: hasMaxedOut
            ? status.RESOURCE_EXHAUSTED
            : status.UNAUTHENTICATED,
          message: hasMaxedOut
            ? 'Too many failed login attempts. Reset your password to regain access.'
            : 'Invalid Email/Password',
        });
      }

      // ── Step 4: Email verification ───────────────────────────────────────────
      if (!user.emailVerified) {
        throw new RpcException({
          code: status.FAILED_PRECONDITION,
          message: 'Email not verified. Please verify your email to continue.',
        });
      }

      // ── Step 5: 2FA challenge ────────────────────────────────────────────────
      if (user.twoFactorEnabled) {
        const twoFactorToken = this.generate2faToken(user);

        await this.prismaService.user.update({
          where: { email: user.email },
          data: { twoFactorAttempts: 0 },
        });

        return {
          requiresTwoFactor: true,
          twoFactorToken,
        } as unknown as LoginRes;
      }

      this.recordLoginActivity(user.id, 'PASSWORD', 'SUCCESS', {
        deviceId: data.deviceId,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        location: data.location,
      });

      return this.completeLogin(user as User, {
        deviceId: data.deviceId,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        location: data.location,
      });
    } catch (error) {
      this.logger.error('Login error in AuthService:', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Login Failed!, Please try again later',
      });
    }
  }

  /**
   * @description Completes a 2FA login challenge.
   * Validates the short-lived 2FA JWT, then accepts either a current TOTP code
   * or an unused backup code. On success marks the backup code as used (if
   * applicable) and calls completeLogin to issue real auth tokens.
   *
   * @async
   * @public
   * @param {VerifyTwoFactorReq} data - twoFactorToken (challenge JWT), code (TOTP or backup), and device info
   * @returns {Promise<LoginRes>} base user info plus access and refresh tokens
   * @throws {RpcException} UNAUTHENTICATED if the challenge token is invalid or expired
   * @throws {RpcException} FAILED_PRECONDITION if 2FA is not active on the account
   * @throws {RpcException} INVALID_ARGUMENT if neither TOTP nor any backup code matches
   * @throws {RpcException} INTERNAL on unexpected failure
   */
  async verify2faCodes(data: VerifyTwoFactorReq): Promise<LoginRes> {
    try {
      // Step 1: Validate the challenge JWT
      const id = this.verify2faToken(data.twoFactorToken);

      // Step 2: Load the user
      const user = await this.prismaService.user.findUniqueOrThrow({
        where: { id },
      });

      // Step 3: Try TOTP verification first (validate2fa handles replay prevention)
      let totpValid = false;
      try {
        await this.validate2fa(user, data.code);
        totpValid = true;
      } catch {
        // TOTP failed — fall through to backup code check below
      }

      // Step 4: Backup code fallback (only when TOTP did not pass)
      if (!totpValid) {
        const unusedBackupCodes = await this.prismaService.backupCodes.findMany(
          { where: { userId: user.id, usedAt: null } },
        );

        const matchResults = await Promise.all(
          unusedBackupCodes.map(async (bc) => ({
            id: bc.id,
            valid: await bcrypt.compare(data.code, bc.code),
          })),
        );
        const matched = matchResults.find((r) => r.valid);

        if (!matched) {
          this.recordLoginActivity(user.id, 'MFA', 'FALED', {
            deviceId: data.deviceId,
            userAgent: data.userAgent,
            ipAddress: data.ipAddress,
            location: data.location,
          });
          throw new RpcException({
            code: status.INVALID_ARGUMENT,
            message: 'Invalid authentication code',
          });
        }

        // Mark backup code as used (single-use — can never be reused)
        await this.prismaService.backupCodes.update({
          where: { id: matched.id },
          data: { usedAt: new Date() },
        });
      }

      // Step 5: 2FA passed — complete the login (create session, issue real tokens)
      this.recordLoginActivity(user.id, 'MFA', 'SUCCESS', {
        deviceId: data.deviceId,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        location: data.location,
      });

      return this.completeLogin(user, {
        deviceId: data.deviceId,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        location: data.location,
      });
    } catch (error) {
      this.logger.error('Verify2fa error in AuthService', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Unathorized',
      });
    }
  }

  /**
   * @description Loads a user by ID and asserts they exist and have a verified email.
   * Used as an auth guard by protected service methods.
   *
   * @async
   * @public
   * @param {string} userId - ID of the user to validate
   * @returns {Promise<Omit<User, 'password'>>} The user record without the password field
   * @throws {RpcException} UNAUTHENTICATED if no user exists for the given ID
   * @throws {RpcException} UNAUTHENTICATED if the user's email has not been verified
   */
  async validateUser(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      omit: {
        password: true,
      },
    });

    // TODO: add further security checks (e.g. account suspension, IP allow-list) as needed

    // 1 NO USER
    if (!user) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Unauthorized!',
      });
    }

    // 2 USER NOT VERIFIED
    if (!user.emailVerified) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Please verify your email!',
      });
    }

    return user;
  }

  /**
   * @description Initiates the password reset process by generating an OTP and sending a forgot password email.
   *
   * @async
   * @public
   * @param {ForgotPasswordReq} data Contains the email of the user
   * @returns {Promise<ForgotPasswordRes>} The user's email and a forgot password token for OTP verification
   */
  async forgotPassword(data: ForgotPasswordReq): Promise<ForgotPasswordRes> {
    try {
      const result = await this.prismaService.$transaction(
        async (tx) => {
          const user = await tx.user.findUnique({
            where: { email: data.email },
          });

          if (!user) {
            return null as any;
          }

          await tx.verificationToken.deleteMany({
            where: {
              email: data.email,
              identifier: 'PASSWORD',
            },
          });

          const otp = this.generateToken();
          await tx.verificationToken.create({
            data: {
              identifier: 'PASSWORD',
              email: user.email,
              token: this.hashOtp(otp),
              expires: this.generateExpiryDate(
                this.configService.get<number>('OTP_EXPIRY_MINUTES', 5),
              ),
            },
          });

          return {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            otp,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );

      // User not found — return silently to prevent email enumeration
      if (!result) return { email: '' };

      // ==> After successful commit: dispatch email
      this.tokenQueue.add(FORGOT_PASSWORD_EMAIL_JOB, {
        otp: result.otp,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
      });

      return {
        email: result.email,
      };
    } catch (error) {
      this.logger.error('ForgotPassword error in AuthService:', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occured!',
      });
    }
  }

  /**
   * @description Resends the forgot password OTP email if the previous one has expired.
   *
   * @async
   * @public
   * @param {ResendForgotPasswordTokenReq} data Contains the email of the user
   * @returns {Promise<ResendForgotPasswordTokenRes>} The user's email and a forgot password token
   * @throws {RpcException} ALREADY_EXISTS if a valid token still exists
   */
  async resendForgotPassword(
    data: ResendForgotPasswordTokenReq,
  ): Promise<ResendForgotPasswordTokenRes> {
    try {
      const result = await this.prismaService.$transaction(
        async (tx) => {
          const user = await tx.user.findUnique({
            where: { email: data.email },
          });

          if (!user) {
            return null as any;
          }

          const verificationToken = await tx.verificationToken.findFirst({
            where: {
              email: data.email,
              identifier: 'PASSWORD',
              expires: { gte: new Date() },
            },
          });

          if (verificationToken) {
            throw new RpcException({
              code: status.ALREADY_EXISTS,
              message: `Please retry in ${getTimeFromNowInMinutes(verificationToken.expires)} minutes`,
            });
          }

          await tx.verificationToken.deleteMany({
            where: {
              email: data.email,
              identifier: 'PASSWORD',
            },
          });

          const otp = this.generateToken();
          await tx.verificationToken.create({
            data: {
              identifier: 'PASSWORD',
              email: user.email,
              token: this.hashOtp(otp),
              expires: this.generateExpiryDate(
                this.configService.get<number>('OTP_EXPIRY_MINUTES', 5),
              ),
            },
          });

          return {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            otp,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      // User not found — return silently to prevent email enumeration
      if (!result) return { email: '' };

      // ==> After successful commit: dispatch email
      this.tokenQueue.add(FORGOT_PASSWORD_EMAIL_JOB, {
        otp: result.otp,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
      });

      return {
        email: result.email,
      };
    } catch (error) {
      this.logger.error('ResendForgotPassword error in AuthService:', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occured!',
      });
    }
  }

  /**
   * @description Verifies the password reset token and returns a password token
   *
   * @async
   * @public
   * @param {VerifyPasswordTokenReq} data Contains the email and otp token
   * @returns {Promise<VerifyPasswordTokenRes>} The password token
   * @throws {RpcException} UNAUTHENTICATED if the token is invalid or expired
   * @throws {RpcException} ALREADY_EXISTS if the new password is the same as the old one
   */
  async verifyPasswordToken(
    data: VerifyPasswordTokenReq,
  ): Promise<VerifyPasswordTokenRes> {
    try {
      const result = await this.prismaService.$transaction(
        async (tx) => {
          const verificationToken = await tx.verificationToken.findFirst({
            where: {
              email: data.email,
              identifier: 'PASSWORD',
              expires: {
                gt: new Date(),
              },
            },
          });

          if (!verificationToken) {
            throw new RpcException({
              code: status.UNAUTHENTICATED,
              message: 'Invalid or expired otp',
            });
          }

          if (!this.comparedOtp(data.otp, verificationToken)) {
            throw new RpcException({
              code: status.UNAUTHENTICATED,
              message: 'Invalid or expired otp',
            });
          }

          const user = await tx.user.findUnique({
            where: {
              email: verificationToken.email,
            },
          });

          if (!user) {
            throw new RpcException({
              code: status.UNAUTHENTICATED,
              message: 'Invalid or expired otp',
            });
          }

          await tx.verificationToken.delete({
            where: {
              id: verificationToken.id,
            },
          });

          const token = this.generateHash();
          await tx.verificationToken.create({
            data: {
              identifier: 'RESET',
              email: user.email,
              token,
              expires: this.generateExpiryDate(
                this.configService.get<number>('OTP_EXPIRY_MINUTES', 5),
              ),
            },
          });

          return {
            userId: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            token,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      // ==> After successful commit: sign password reset JWT
      const passwordToken = this.jwtService.sign(
        this.createPayload(
          {
            id: result.userId,
            email: result.email,
            firstName: result.firstName,
            lastName: result.lastName,
            avatar: result.avatar,
          },
          'otp_token',
          undefined,
          result.token,
        ),
        {
          secret: this.configService.get('JWT_OTP_SECRET'),
          expiresIn: this.configService.get('JWT_OTP_TOKEN_EXPIRATION'),
        },
      );

      return {
        passwordToken,
      };
    } catch (error) {
      this.logger.error('VerifyPasswordToken error in AuthService:', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occured!',
      });
    }
  }

  /**
   * @description Resets the user's password using the provided OTP and new password.
   *
   * @async
   * @public
   * @param {TokenPayload} payload Decoded OTP token payload
   * @param {ResetPasswordReq} data OTP and the new password
   * @returns {Promise<Empty>} null on success (standard gRPC/internal pattern)
   * @throws {RpcException} UNAUTHENTICATED if token is invalid or expired
   * @throws {RpcException} ALREADY_EXISTS if the new password is the same as the old one
   */
  async resetPassword(
    payload: TokenPayload,
    data: ResetPasswordReq,
  ): Promise<Empty> {
    try {
      const hashedNewPassword = this.hashPassword(data.newPassword);

      const result = await this.prismaService.$transaction(
        async (tx) => {
          const verificationToken = await tx.verificationToken.findFirst({
            where: {
              email: payload.email,
              identifier: 'RESET',
              token: payload.identifyer,
              expires: {
                gt: new Date(),
              },
            },
          });

          if (!verificationToken) {
            throw new RpcException({
              code: status.UNAUTHENTICATED,
              message: 'Invalid Token',
            });
          }

          const user = await tx.user.findUnique({
            where: {
              email: verificationToken.email,
            },
          });

          if (!user) {
            throw new RpcException({
              code: status.UNAUTHENTICATED,
              message: 'Invalid Token',
            });
          }

          if (this.comparedPassword(data.newPassword, user)) {
            throw new RpcException({
              code: status.ALREADY_EXISTS,
              message: 'New password cannot be the same as old password',
            });
          }

          await tx.user.update({
            where: {
              id: user.id,
            },
            data: {
              password: hashedNewPassword,
              loginAttempts: 0,
              twoFactorAttempts: 0,
            },
          });

          await tx.verificationToken.delete({
            where: {
              id: verificationToken.id,
            },
          });

          // Drop all active sessions for security
          await this.dropSession(tx, user.id);

          return {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      // ==> After successful commit: dispatch password change notification
      this.tokenQueue.add(PASSWORD_CHANGE_JOB, {
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
      });

      return null as any;
    } catch (error) {
      this.logger.error('ResetPassword error in AuthService:', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid token',
      });
    }
  }

  /**
   * @description Refresh Access token
   *
   * @async
   * @public
   * @param {TokenPayload} payload containing jwt payload from verified token
   * @returns {Promise<RefreshTokenRes>} conatining new auth tokens
   */
  async refreshAuthTokens(payload: TokenPayload): Promise<RefreshTokenRes> {
    try {
      if (!payload.sessionToken) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Unauthorized!',
        });
      }

      const user = await this.prismaService.user.findUnique({
        where: { id: payload.id },
      });
      if (!user) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Unauthorized!',
        });
      }

      const session = await this.rotateSession(payload.sessionToken);
      const tokens = this.generateAuthTokens(user, session);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      this.logger.error('RefreshAuthTokens error in AuthService:', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid token',
      });
    }
  }

  /**
   * @description Login With Google
   *
   * @async
   * @public
   * @param {LoginwithGoggleReq} data oauth google callback url data
   * @returns {Promise<LoginRes>} containing user data and auth tokens
   */
  async loginWithGoogle(data: LoginwithGoggleReq): Promise<LoginRes> {
    const clientId = this.configService.getOrThrow<string>('AUTH_GOOGLE_ID');
    const oauthClient = new OAuth2Client(clientId);

    let googleSub: string;
    let googleEmail: string;
    let googleName: string;
    let googlePicture: string | undefined;

    try {
      const ticket = await oauthClient.verifyIdToken({
        idToken: data.idToken,
        audience: clientId,
      });
      const payload = ticket.getPayload();

      if (!payload?.sub || !payload.email) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Invalid token',
        });
      }

      googleSub = payload.sub;
      googleEmail = payload.email;
      googleName = payload.name ?? payload.email;
      googlePicture = payload.picture;
    } catch (err) {
      this.logger.error('Google id_token verification failed:', err);
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid or expired Google token',
      });
    }

    try {
      const nameParts = googleName.split(' ');
      const firstName = nameParts[0] ?? '';
      const lastName = nameParts.slice(1).join(' ') || firstName;

      const result = await this.prismaService.$transaction(
        async (tx) => {
          // Guard: prevent a pending-deletion account from being re-activated via
          // Google OAuth upsert. The upsert would silently undelete it otherwise.
          const existingUser = await tx.user.findUnique({
            where: { email: googleEmail },
            select: { scheduledDeletionAt: true },
          });
          if (existingUser?.scheduledDeletionAt) {
            throw new RpcException({
              code: status.UNAUTHENTICATED,
              message: 'Invalid credentials.',
            });
          }

          const user = await tx.user.upsert({
            where: { email: googleEmail },
            create: {
              firstName,
              lastName,
              email: googleEmail,
              loginAttempts: 0,
              emailVerified: true,
              emailVerifiedAt: new Date(),
              avatar: googlePicture,
            },
            update: {
              emailVerified: true,
              avatar: googlePicture,
              lastLoginAt: new Date(),
            },
            include: { accounts: true, subscription: true, setting: true },
          });

          const hasGoogleAccount = user.accounts.some(
            (acc) => acc.provider === 'GOOGLE',
          );
          if (!hasGoogleAccount) {
            await tx.account.create({
              data: {
                provider: 'GOOGLE',
                type: 'OAUTH',
                providerAccountId: googleSub,
                userId: user.id,
              },
            });
          }

          const hasNotificationSettings = !!user.setting;
          if (!hasNotificationSettings) {
            await tx.notificationSetting.create({
              data: {
                userId: user.id,
              },
            });
          }

          const isNewUser = !user.subscription;
          if (isNewUser) {
            await tx.subscription.upsert({
              where: { userId: user.id },
              create: { userId: user.id, plan: 'FREE', status: 'ACTIVE' },
              update: {},
            });

            const [periodStart, periodEnd] = getPeriodRange();
            await tx.usageTracker.createMany({
              data: [
                {
                  userId: user.id,
                  feature: 'AI_INSIGHTS_QUERIES',
                  count: 0,
                  periodStart,
                  periodEnd,
                },
                {
                  userId: user.id,
                  feature: 'AI_CHAT_MESSAGES',
                  count: 0,
                  periodStart,
                  periodEnd,
                },
                {
                  userId: user.id,
                  feature: 'RECEIPT_UPLOADS',
                  count: 0,
                  periodStart,
                  periodEnd,
                },
              ],
              skipDuplicates: true,
            });
          }

          const session = await this.createSession(tx, user.id, {
            deviceInfo: {
              deviceId: data.deviceId,
              userAgent: data.userAgent,
              ipAddress: data.ipAddress,
              location: data.location,
            },
          });

          return { user, session, isNewUser };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        },
      );

      // ==> After successful commit: dispatch welcome email for new users, sign tokens
      if (result.isNewUser) {
        this.tokenQueue.add(WELCOME_EMAIL_JOB, {
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
        });
      }

      this.recordLoginActivity(result.user.id, 'PASSWORD', 'SUCCESS', {
        deviceId: data.deviceId,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
        location: data.location,
      });

      const tokens = this.generateAuthTokens(
        result.user as User,
        result.session,
      );

      return {
        user: {
          id: result.user.id,
          email: result.user.email,
          avatar: result.user.avatar || '',
          firstName: result.user.firstName,
          lastName: result.user.lastName,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      this.logger.error('LoginWithGoogle error in AuthService', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Login failed, please try again later',
      });
    }
  }

  /**
   * @description Begins the TOTP 2FA setup flow for a user.
   * Generates a new TOTP secret, stores it encrypted on the user record,
   * and returns the raw secret plus an otpauth URI ready to be rendered
   * as a QR code in the client's authenticator app.
   * Setup is not active until the user completes confirm2faSetup.
   *
   * @async
   * @public
   * @param {string} userId - ID of the authenticated user initiating setup
   * @returns {Promise<InitiateTwoFactorSetupRes>} otpauthUri for QR rendering and plain secret for manual entry
   * @throws {RpcException} UNAUTHENTICATED if user not found or not email-verified
   * @throws {RpcException} INTERNAL on unexpected failure
   */
  async init2fa(userId: string): Promise<InitiateTwoFactorSetupRes> {
    try {
      // fetch user and do auth check
      const user = await this.validateUser(userId);

      // 2FA is only meaningful for local (email/password) accounts
      const localAccount = await this.prismaService.account.findFirst({
        where: { userId: user.id, provider: 'LOCAL' },
      });

      if (!localAccount) {
        throw new RpcException({
          code: status.FAILED_PRECONDITION,
          message:
            '2FA is only available for email/password accounts. Your account is secured by your social login provider.',
        });
      }

      // Block re-initialization once 2FA is already active — user must disable first
      if (user.twoFactorEnabled) {
        throw new RpcException({
          code: status.FAILED_PRECONDITION,
          message: '2FA is already enabled. Disable it before re-initializing.',
        });
      }

      const secret = this.otp.generateSecret();
      console.log('secret', secret);

      const otpauthUri = this.otp.generateURI({
        issuer: 'Fintrack',
        label: user.email,
        secret,
      });

      await this.prismaService.user.update({
        where: { id: user.id },
        data: { twoFactorSecret: this.encrypt(secret) },
      });

      return { otpauthUri, secret };
    } catch (error) {
      this.logger.error('Init2fa error in AuthService', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Initialization failed',
      });
    }
  }

  /**
   * @description Confirms and activates 2FA for a user.
   * Verifies the TOTP code supplied by the user against the pending secret,
   * then atomically enables 2FA and persists 10 single-use bcrypt-hashed
   * backup codes. Returns the plain backup codes — this is the ONLY time
   * they will be shown.
   *
   * @async
   * @public
   * @param {string} userId - ID of the authenticated user completing setup
   * @param {ConfirmTwoFactorSetupReq} data - contains the 6-digit TOTP code from the authenticator app
   * @returns {Promise<ConfirmTwoFactorSetupRes>} plain-text backup codes (shown once, never retrievable again)
   * @throws {RpcException} UNAUTHENTICATED if TOTP verification fails or no pending secret exists
   * @throws {RpcException} INTERNAL on unexpected failure
   */
  async confirm2faSetup(
    userId: string,
    data: ConfirmTwoFactorSetupReq,
  ): Promise<ConfirmTwoFactorSetupRes> {
    try {
      // get the user
      const user = await this.validateUser(userId);

      // Belt-and-suspenders: confirm2fa requires a LOCAL account (password must exist)
      const localAccount = await this.prismaService.account.findFirst({
        where: { userId, provider: 'LOCAL' },
      });
      if (!localAccount) {
        throw new RpcException({
          code: status.FAILED_PRECONDITION,
          message: 'A password is required to enable 2FA',
        });
      }

      // no secret? =>  throw error
      if (!user.twoFactorSecret) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Unathorized',
        });
      }

      // decrypt the secret here
      const secret = this.decrypt(user.twoFactorSecret);

      const verify = await this.otp.verify({
        secret,
        token: data.code,
      });

      if (!verify.valid) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Unathorized',
        });
      }

      // Generate 10 single-use backup codes (shown once, never stored plain)
      const plainCodes = Array.from({ length: 10 }, () =>
        this.generateBackupCode(),
      );
      const hashedCodes = await Promise.all(
        plainCodes.map((code) => bcrypt.hash(code, 5)),
      );

      // Atomically: enable 2FA + store hashed backup codes
      await this.prismaService.$transaction([
        this.prismaService.user.update({
          where: { id: user.id },
          data: { twoFactorEnabled: true },
        }),
        this.prismaService.backupCodes.createMany({
          data: hashedCodes.map((codeHash: string) => ({
            userId: user.id,
            code: codeHash,
          })),
        }),
      ]);

      // Return PLAIN codes — this is the only time they will ever be visible
      return { backupCodes: plainCodes };
    } catch (error) {
      this.logger.error('Confirm2fa error in AuthService', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Unathorized',
      });
    }
  }

  /**
   * @description Disables 2FA for a user after re-verifying their current TOTP code.
   * Atomically clears twoFactorEnabled, removes the encrypted secret,
   * and deletes all backup codes.
   *
   * @async
   * @public
   * @param {string} userId - ID of the authenticated user disabling 2FA
   * @param {DisableTwoFactorReq} data - contains the 6-digit TOTP code confirming intent
   * @returns {Promise<void>}
   * @throws {RpcException} FAILED_PRECONDITION if 2FA is not currently enabled
   * @throws {RpcException} UNAUTHENTICATED if TOTP verification fails
   * @throws {RpcException} INTERNAL on unexpected failure
   */
  async disable2fa(userId: string, data: DisableTwoFactorReq): Promise<any> {
    try {
      // Step 1: Load the user
      const user = await this.prismaService.user.findUniqueOrThrow({
        where: { id: userId },
      });

      if (!user.twoFactorSecret || !user.twoFactorEnabled) {
        throw new RpcException({
          code: status.FAILED_PRECONDITION,
          message: 'Unuthorized',
        });
      }

      // Step 2: Rate limit — block further attempts if threshold exceeded
      const maxOtpAttempts = this.configService.get<number>(
        'MAX_LOGIN_ATTEMPTS',
        3,
      );
      if (user.twoFactorAttempts >= maxOtpAttempts) {
        this.forceSessionReset(user.id);
      }

      // Step 3: Verify TOTP + replay prevention
      try {
        await this.validate2fa(user, data.code);
      } catch (error) {
        const failedUser = await this.prismaService.user.update({
          where: { id: userId },
          data: { twoFactorAttempts: { increment: 1 } },
        });
        if (failedUser.twoFactorAttempts > maxOtpAttempts) {
          this.forceSessionReset(user.id);
        }
        throw error;
      }

      // Step 4: atomically disable 2FA and wipe all secrets, backup codes, and attempt counter
      await this.prismaService.$transaction([
        this.prismaService.user.update({
          where: { id: user.id },
          data: {
            twoFactorEnabled: false,
            twoFactorSecret: null,
            twoFactorAttempts: 0,
          },
        }),
        this.prismaService.backupCodes.deleteMany({
          where: { user: { id: user.id } },
        }),
      ]);
    } catch (error) {
      this.logger.error('Disable2fa error in AuthService', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Unathorized',
      });
    }
  }

  /**
   * @description Regenerates backup codes for a user with 2FA enabled.
   * Requires current TOTP code for authorisation. Atomically deletes the
   * old codes and creates 10 fresh ones so there is no window with zero valid codes.
   *
   * @async
   * @public
   * @param {string} userId - ID of the authenticated user
   * @param {ConfirmTwoFactorSetupReq} data - contains the 6-digit TOTP code
   * @returns {Promise<ConfirmTwoFactorSetupRes>} The 10 new plain backup codes (shown once)
   * @throws {RpcException} FAILED_PRECONDITION if 2FA is not enabled
   * @throws {RpcException} UNAUTHENTICATED if TOTP verification fails
   * @throws {RpcException} INTERNAL on unexpected failure
   */
  async regenerateBackupCodes(
    userId: string,
    data: ConfirmTwoFactorSetupReq,
  ): Promise<ConfirmTwoFactorSetupRes> {
    try {
      const user = await this.validateUser(userId);

      if (!user.twoFactorSecret || !user.twoFactorEnabled) {
        throw new RpcException({
          code: status.FAILED_PRECONDITION,
          message: '2FA is not enabled',
        });
      }

      const maxOtpAttempts = this.configService.get<number>(
        'MAX_LOGIN_ATTEMPTS',
        3,
      );
      if (user.twoFactorAttempts >= maxOtpAttempts) {
        this.forceSessionReset(user.id);
      }

      try {
        await this.validate2fa(user as User, data.code);
      } catch (error) {
        const failedUser = await this.prismaService.user.update({
          where: { id: userId },
          data: { twoFactorAttempts: { increment: 1 } },
        });
        if (failedUser.twoFactorAttempts > maxOtpAttempts) {
          this.forceSessionReset(user.id);
        }
        throw error;
      }

      const plainCodes = Array.from({ length: 10 }, () =>
        this.generateBackupCode(),
      );
      const hashedCodes = await Promise.all(
        plainCodes.map((code) => bcrypt.hash(code, 5)),
      );

      await this.prismaService.$transaction([
        this.prismaService.backupCodes.deleteMany({ where: { userId } }),
        this.prismaService.backupCodes.createMany({
          data: hashedCodes.map((codeHash: string) => ({
            userId,
            code: codeHash,
          })),
        }),
        this.prismaService.user.update({
          where: { id: userId },
          data: { twoFactorAttempts: 0 },
        }),
      ]);

      return { backupCodes: plainCodes };
    } catch (error) {
      this.logger.error('RegenerateBackupCodes error in AuthService', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
      });
    }
  }

  /**
   * @description Changes the authenticated user's password.
   * Verifies the current password before updating, then drops all active
   * sessions so every device must re-authenticate with the new credentials.
   *
   * @async
   * @public
   * @param {string} userId ID of the authenticated user
   * @param {ChangePasswordReq} data Current and new passwords
   * @returns {Promise<Empty>} Empty response on success
   * @throws {RpcException} UNAUTHENTICATED if the user is not found or the current password is wrong
   * @throws {RpcException} ALREADY_EXISTS if the new password is the same as the current one
   * @throws {RpcException} INTERNAL on unexpected failure
   */
  async changePassword(
    userId: string,
    data: ChangePasswordReq,
  ): Promise<Empty> {
    try {
      // Hash before the transaction to keep the critical section short
      const hashedNewPassword = this.hashPassword(data.newPassword);

      // ─── Phase 1: OTP pre-validation ────────────────────────────────────────
      if (data.otpCode !== undefined) {
        const user = await this.prismaService.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new RpcException({
            code: status.UNAUTHENTICATED,
            message: 'Invalid credentials',
          });
        }

        // Rate limit — block further attempts if threshold exceeded
        const maxOtpAttempts = this.configService.get<number>(
          'MAX_LOGIN_ATTEMPTS',
          3,
        );
        if (user.twoFactorAttempts >= maxOtpAttempts) {
          this.forceSessionReset(user.id);
        }

        // validate2fa handles: decrypt → verify → replay check → consume window
        try {
          await this.validate2fa(user, data.otpCode);
        } catch (error) {
          const failedUser = await this.prismaService.user.update({
            where: { id: userId },
            data: { twoFactorAttempts: { increment: 1 } },
          });

          const hasMaxedOut = failedUser.twoFactorAttempts >= maxOtpAttempts;
          if (hasMaxedOut) {
            this.forceSessionReset(user.id);
          }
          throw error;
        }

        // Reset attempt counter on successful verification
        await this.prismaService.user.update({
          where: { id: userId },
          data: { twoFactorAttempts: 0 },
        });
      }

      // ─── Phase 2: Pre-checks (outside tx so writes survive a throw) ─────────
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Invalid credentials',
        });
      }

      // Guard: if 2FA is enabled the OTP phase above must have run
      if (user.twoFactorEnabled && data.otpCode === undefined) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Invalid credentials',
        });
      }

      const isCreatingPassword = !user.password;

      if (isCreatingPassword) {
        // Social user with no password yet — skip current-password verification
      } else {
        // ── Existing-password path: verify current password ───────────────────
        if (!data.currentPassword) {
          throw new RpcException({
            code: status.UNAUTHENTICATED,
            message: 'Invalid credentials',
          });
        }

        // Rate limit on current-password failures (reuses the login counter)
        const maxLoginAttempts = this.configService.get<number>(
          'MAX_LOGIN_ATTEMPTS',
          3,
        );
        if (user.loginAttempts >= maxLoginAttempts) {
          this.forceSessionReset(user.id);
        }

        if (!this.comparedPassword(data.currentPassword, user)) {
          const failedUser = await this.prismaService.user.update({
            where: { id: userId },
            data: { loginAttempts: { increment: 1 } },
          });

          const hasMaxedOut = failedUser.loginAttempts >= maxLoginAttempts;
          if (hasMaxedOut) {
            this.forceSessionReset(user.id);
          }
          throw new RpcException({
            code: status.UNAUTHENTICATED,
            message: 'Invalid credentials',
          });
        }

        // Guard: prevent change if new === current
        if (this.comparedPassword(data.newPassword, user)) {
          throw new RpcException({
            code: status.ALREADY_EXISTS,
            message: 'New password cannot be the same as current password',
          });
        }
      }

      // ─── Phase 3: Commit ─────────────────────────────────────────────────────
      if (isCreatingPassword) {
        // Create path: set password + upsert LOCAL account; sessions remain active
        await this.prismaService.$transaction([
          this.prismaService.user.update({
            where: { id: user.id },
            data: { password: hashedNewPassword },
          }),
          this.prismaService.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: 'LOCAL',
                providerAccountId: userId,
              },
            },
            create: {
              userId,
              provider: 'LOCAL',
              type: 'CREDENTIALS',
              providerAccountId: userId,
            },
            update: {},
          }),
        ]);
      } else {
        // Change path: update password + drop all sessions
        await this.prismaService.$transaction(
          async (tx) => {
            await tx.user.update({
              where: { id: user.id },
              data: { password: hashedNewPassword, loginAttempts: 0 },
            });

            await this.dropSession(tx, user.id);
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      }

      // After successful commit: notify user
      this.tokenQueue.add(PASSWORD_CHANGE_JOB, {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });

      return null as any;
    } catch (error) {
      this.logger.error('ChangePassword error in AuthService:', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred!',
      });
    }
  }

  /**
   * @description Initiates an in-app email change by verifying the current
   * password and sending a 6-digit OTP to the requested new email address.
   * Only one pending request is allowed at a time — any previous one is
   * deleted before the new token is created.
   *
   * @async
   * @public
   * @param {string} userId ID of the authenticated user
   * @param {ChangeEmailReq} data New email and current password
   * @returns {Promise<InitiateEmailChangeRes>} The address the OTP was dispatched to
   * @throws {RpcException} UNAUTHENTICATED if the user is not found or the current password is wrong
   * @throws {RpcException} ALREADY_EXISTS if the new email is already registered
   * @throws {RpcException} INTERNAL on unexpected failure
   */
  async initiateEmailChange(
    userId: string,
    data: ChangeEmailReq,
  ): Promise<InitiateEmailChangeRes> {
    try {
      // Pre-flight: load user for password + 2FA checks (outside transaction
      // because validate2fa needs to write attempt counter updates)
      const preUser = await this.prismaService.user.findUnique({
        where: { id: userId },
      });
      if (!preUser) {
        throw new RpcException({
          code: status.FAILED_PRECONDITION,
          message: 'email Chnage is not available!',
        });
      }

      // ensure that only users with local account only can change their email,
      // once a user has logged in with a socila ccount they cant chnage their email
      const hasSocial = await this.prismaService.account.findFirst({
        where: { userId: preUser.id, NOT: { provider: 'LOCAL' } },
      });

      if (hasSocial) {
        throw new RpcException({
          code: status.FAILED_PRECONDITION,
          message: 'email Chnage is not available!',
        });
      }

      // Rate limit on password failures (same counter as login)
      const maxLoginAttempts = this.configService.get<number>(
        'MAX_LOGIN_ATTEMPTS',
        3,
      );
      if (preUser.loginAttempts >= maxLoginAttempts) {
        this.forceSessionReset(preUser.id);
      }

      if (!this.comparedPassword(data.currentPassword, preUser)) {
        const failedUser = await this.prismaService.user.update({
          where: { id: userId },
          data: { loginAttempts: { increment: 1 } },
        });
        const hasMaxedOut = failedUser.loginAttempts >= maxLoginAttempts;
        if (hasMaxedOut) {
          this.forceSessionReset(preUser.id);
        }
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Current password is incorrect',
        });
      }

      // 2FA enforcement — same pattern as changePassword
      if (preUser.twoFactorEnabled) {
        if (!data.otpCode) {
          throw new RpcException({
            code: status.UNAUTHENTICATED,
            message: 'TOTP code required',
          });
        }
        const maxOtpAttempts = this.configService.get<number>(
          'MAX_LOGIN_ATTEMPTS',
          3,
        );
        if (preUser.twoFactorAttempts >= maxOtpAttempts) {
          this.forceSessionReset(preUser.id);
        }
        try {
          await this.validate2fa(preUser, data.otpCode);
        } catch (error) {
          const failedUser = await this.prismaService.user.update({
            where: { id: userId },
            data: { twoFactorAttempts: { increment: 1 } },
          });
          if (failedUser.twoFactorAttempts > maxOtpAttempts) {
            this.forceSessionReset(preUser.id);
          }
          throw error;
        }
        await this.prismaService.user.update({
          where: { id: userId },
          data: { twoFactorAttempts: 0 },
        });
      }

      const result = await this.prismaService.$transaction(
        async (tx) => {
          const user = await tx.user.findUnique({ where: { id: userId } });

          if (!user) {
            throw new RpcException({
              code: status.UNAUTHENTICATED,
              message: 'Unauthorized!',
            });
          }

          const emailTaken = await tx.user.findUnique({
            where: { email: data.newEmail },
          });
          if (emailTaken) {
            throw new RpcException({
              code: status.ALREADY_EXISTS,
              message: 'Email already in use',
            });
          }

          // Clear password-attempt counter on successful verification
          await tx.user.update({
            where: { id: userId },
            data: { loginAttempts: 0 },
          });

          // Remove any previous pending request for this user
          await tx.verificationToken.deleteMany({
            where: { email: user.email, identifier: 'EMAIL_CHANGE' },
          });

          const otp = this.generateToken();
          await tx.verificationToken.create({
            data: {
              identifier: 'EMAIL_CHANGE',
              email: user.email,
              newEmail: data.newEmail,
              token: this.hashOtp(otp),
              expires: this.generateExpiryDate(
                this.configService.get<number>('OTP_EXPIRY_MINUTES', 5),
              ),
            },
          });

          return {
            otp,
            newEmail: data.newEmail,
            firstName: user.firstName,
            lastName: user.lastName,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      // ==> After successful commit: send OTP to the NEW address
      this.tokenQueue.add(EMAIL_CHANGE_JOB, {
        otp: result.otp,
        email: result.newEmail,
        firstName: result.firstName,
        lastName: result.lastName,
      });

      return { newEmail: result.newEmail };
    } catch (error) {
      this.logger.error('InitiateEmailChange error in AuthService:', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred!',
      });
    }
  }

  /**
   * @description Completes an in-app email change by verifying the OTP that
   * was sent to the new address. On success the user's email is updated, all
   * sessions are dropped (forcing re-login with the new address), and the
   * pending verification token is deleted.
   *
   * @async
   * @public
   * @param {string} userId ID of the authenticated user
   * @param {VerifyEmailChangeReq} data 6-digit OTP from the new email address
   * @returns {Promise<Empty>} Empty response on success
   * @throws {RpcException} UNAUTHENTICATED if no valid pending request exists or OTP is wrong
   * @throws {RpcException} ALREADY_EXISTS if the target email was claimed between initiate and verify
   * @throws {RpcException} INTERNAL on unexpected failure
   */
  async verifyEmailChange(
    userId: string,
    data: VerifyEmailChangeReq,
  ): Promise<Empty> {
    try {
      const result = await this.prismaService.$transaction(
        async (tx) => {
          const user = await tx.user.findUnique({ where: { id: userId } });

          if (!user) {
            throw new RpcException({
              code: status.UNAUTHENTICATED,
              message: 'Unauthorized!',
            });
          }

          const verificationToken = await tx.verificationToken.findFirst({
            where: {
              email: user.email,
              identifier: 'EMAIL_CHANGE',
              expires: { gt: new Date() },
            },
          });

          if (!verificationToken?.newEmail) {
            throw new RpcException({
              code: status.UNAUTHENTICATED,
              message: 'Invalid or expired token',
            });
          }

          if (!this.comparedOtp(data.otp, verificationToken)) {
            throw new RpcException({
              code: status.UNAUTHENTICATED,
              message: 'Invalid OTP',
            });
          }

          // Guard against race: new email may have been registered since initiate
          const emailTaken = await tx.user.findUnique({
            where: { email: verificationToken.newEmail },
          });
          if (emailTaken) {
            throw new RpcException({
              code: status.ALREADY_EXISTS,
              message: 'Email already in use',
            });
          }

          await tx.user.update({
            where: { id: userId },
            data: { email: verificationToken.newEmail },
          });

          await tx.verificationToken.delete({
            where: { id: verificationToken.id },
          });

          // Drop all sessions — user must re-login with the new email
          await this.dropSession(tx, userId);

          return {
            oldEmail: user.email,
            newEmail: verificationToken.newEmail,
            firstName: user.firstName,
            lastName: user.lastName,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      // ==> After successful commit: alert the old address about the change
      this.tokenQueue.add(EMAIL_CHANGED_JOB, {
        oldEmail: result.oldEmail,
        newEmail: result.newEmail,
        firstName: result.firstName,
        lastName: result.lastName,
      });

      return null as any;
    } catch (error) {
      this.logger.error('VerifyEmailChange error in AuthService:', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred!',
      });
    }
  }

  /**
   * @description Schedule the authenticated user's account for permanent deletion.
   *
   * Immediately revokes all active sessions (locks the user out), then sets
   * `scheduledDeletionAt` to 30 days from now. A daily cron job performs the
   * actual hard delete after that window expires.
   *
   * Ownership is verified via password (skipped for social-only accounts that
   * have no password). When 2FA is enabled `otpCode` is required.
   *
   * Queues a Stripe subscription cancellation job (stub — wired end-to-end,
   * actual SDK call deferred) and an account-deletion confirmation email.
   *
   * @async
   * @public
   * @param {string} userId ID of the authenticated user requesting deletion
   * @param {DeleteAccountReq} data Optional password and OTP code for verification
   * @returns {Promise<Empty>}
   * @throws {RpcException} UNAUTHENTICATED if the password or TOTP code is wrong
   * @throws {RpcException} RESOURCE_EXHAUSTED if too many failed verification attempts
   */
  async deleteAccount(userId: string, data: DeleteAccountReq): Promise<Empty> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Invalid credentials',
        });
      }

      // ── OTP pre-validation (when 2FA is enabled) ──────────────────────────
      if (data.otpCode !== undefined) {
        const maxOtpAttempts = this.configService.get<number>(
          'MAX_LOGIN_ATTEMPTS',
          3,
        );
        if (user.twoFactorAttempts >= maxOtpAttempts) {
          this.forceSessionReset(user.id);
        }

        try {
          await this.validate2fa(user, data.otpCode);
        } catch (error) {
          const failedUser = await this.prismaService.user.update({
            where: { id: userId },
            data: { twoFactorAttempts: { increment: 1 } },
          });
          if (failedUser.twoFactorAttempts >= maxOtpAttempts) {
            this.forceSessionReset(user.id);
          }
          throw error;
        }

        await this.prismaService.user.update({
          where: { id: userId },
          data: { twoFactorAttempts: 0 },
        });
      }

      // ── Password verification (for accounts that have a password) ─────────
      if (user.password) {
        if (!data.password) {
          throw new RpcException({
            code: status.UNAUTHENTICATED,
            message: 'Invalid credentials',
          });
        }

        const maxLoginAttempts = this.configService.get<number>(
          'MAX_LOGIN_ATTEMPTS',
          3,
        );
        if (user.loginAttempts >= maxLoginAttempts) {
          this.forceSessionReset(user.id);
        }

        if (!this.comparedPassword(data.password, user)) {
          const failedUser = await this.prismaService.user.update({
            where: { id: userId },
            data: { loginAttempts: { increment: 1 } },
          });

          const hasMaxedOut = failedUser.loginAttempts >= maxLoginAttempts;
          if (hasMaxedOut) this.forceSessionReset(user.id);

          throw new RpcException({
            code: hasMaxedOut
              ? status.RESOURCE_EXHAUSTED
              : status.UNAUTHENTICATED,
            message: hasMaxedOut
              ? 'Too many failed attempts. Reset your password to regain access.'
              : 'Invalid credentials',
          });
        }
      }

      // ── Guard: 2FA enabled but no OTP provided ────────────────────────────
      if (user.twoFactorEnabled && data.otpCode === undefined) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Invalid credentials',
        });
      }

      // ── Fetch active Stripe subscription for async cancellation ───────────
      const subscription = await this.prismaService.subscription.findUnique({
        where: { userId },
        select: { stripeSubscriptionId: true, status: true },
      });

      // ── Atomic: schedule deletion + revoke all sessions ───────────────────
      const scheduledDeletionAt = dayjs().add(30, 'day').toDate();

      await this.prismaService.$transaction([
        this.prismaService.user.update({
          where: { id: userId },
          data: { scheduledDeletionAt },
        }),
        this.prismaService.session.deleteMany({
          where: { user: { id: user.id } },
        }),
      ]);

      // ── Fire-and-forget: cancel Stripe subscription (stub) ────────────────
      if (
        subscription?.stripeSubscriptionId &&
        subscription.status === 'ACTIVE'
      ) {
        void this.cleanupQueue
          .add(CANCEL_STRIPE_SUBSCRIPTION_JOB, {
            stripeSubscriptionId: subscription.stripeSubscriptionId,
          })
          .catch((err) =>
            this.logger.error('Failed to queue Stripe cancellation:', err),
          );
      }

      // ── Fire-and-forget: deletion confirmation email ───────────────────────
      void this.tokenQueue
        .add(ACCOUNT_DELETION_EMAIL_JOB, {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          scheduledDeletionAt: scheduledDeletionAt.toISOString(),
        })
        .catch((err) =>
          this.logger.error('Failed to queue deletion email:', err),
        );

      return {};
    } catch (error) {
      this.logger.error('DeleteAccount error in AuthService:', error);
      if (error instanceof RpcException) throw error;
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred. Please try again later.',
      });
    }
  }

  /**
   * @description Complete login after credentials/2FA have been verified.
   * Updates login metadata, creates a session, and returns auth tokens.
   *
   * @async
   * @private
   * @param {User} user authenticated user
   * @param {DeviceInfo} deviceInfo device context for the session
   * @returns {Promise<LoginRes>} base user info and auth tokens
   */
  private async completeLogin(
    user: User,
    deviceInfo: DeviceInfo,
  ): Promise<LoginRes> {
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lastLoginAt: new Date() },
    });

    const session = await this.createSession(
      this.prismaService as unknown as Prisma.TransactionClient,
      user.id,
      { deviceInfo },
    );

    const tokens = this.generateAuthTokens(user, session);

    return {
      user: {
        id: user.id,
        email: user.email,
        avatar: user.avatar || '',
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * @description Generates an 8-character hex code formatted as XXXX-XXXX
   *
   * @returns {string} e.g. "3A9F-C042"
   */
  private generateBackupCode(): string {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  }

  /**
   * @description Signs a short-lived JWT used as the 2FA login challenge.
   * The token carries the user id and type='2fa_token', signed with JWT_2FA_SECRET.
   * Returned to the client after successful credential login when 2FA is enabled;
   * must be presented back during verify2faCodes.
   *
   * @private
   * @param {User} user - the authenticated user awaiting 2FA verification
   * @returns {string} signed 2FA challenge JWT
   */
  private generate2faToken(user: User): string {
    return this.jwtService.sign(this.createPayload(user, '2fa_token'), {
      secret: this.configService.get<string>('JWT_2FA_SECRET'),
      expiresIn: this.configService.get('JWT_2FA_TOKEN_EXPIRATION'),
    });
  }

  /**
   * @description Verifies and decodes a 2FA challenge JWT.
   * Validates signature (JWT_2FA_SECRET), expiry, and that the token type is
   * '2fa_token'. Returns the user id embedded in the payload.
   *
   * @private
   * @param {string} token - the 2FA challenge JWT issued by generate2faToken
   * @returns {string} userId extracted from the verified payload
   * @throws {RpcException} UNAUTHENTICATED if the token is invalid, expired, or wrong type
   */
  private verify2faToken(token: string): string {
    let payload: { id: string; type: string };
    try {
      const tokenPayload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_2FA_SECRET'),
      });

      payload = tokenPayload.payload;

      if (payload.type !== '2fa_token') {
        throw new Error('Invalid Token');
      }

      return payload.id;
    } catch (error) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid or expired challenge token',
      });
    }
  }

  /**
   * @description Generates a signed access token and refresh token for a user's session.
   *
   * @private
   * @param {User} user - The authenticated user
   * @param {Session} session - The active session providing the sessionToken for the refresh token
   * @returns {{ accessToken: string; refreshToken: string }} Signed JWT pair
   */
  private generateAuthTokens(
    user: User,
    session: Session,
  ): { accessToken: string; refreshToken: string } {
    const accessToken = this.jwtService.sign(
      this.createPayload(user, 'access_token'),
      { secret: this.configService.get('JWT_SECRET') },
    );

    const refreshToken = this.jwtService.sign(
      this.createPayload(user, 'refresh_token', session.sessionToken),
      {
        expiresIn: this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION'),
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      },
    );

    return { accessToken, refreshToken };
  }

  /**
   * @description Create a new Session for a user on login.
   * Upserts by (userId, deviceId) and evicts oldest if > 2 other-device sessions.
   *
   * @async
   * @private
   * @param {Prisma.TransactionClient} tx Prisma transaction client
   * @param {string} userId Id of user
   * @param {CreateSessionOptions} options device info for the new session
   * @returns {Promise<Session>} new session
   */
  private async createSession(
    tx: Prisma.TransactionClient,
    userId: string,
    options: CreateSessionOptions,
  ): Promise<Session> {
    const expiresAt = new Date(
      Date.now() +
        parseJwtExpiration(
          this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION')!,
        ) *
          1000,
    );

    const { deviceId, userAgent, ipAddress, location } = options.deviceInfo;

    // Delete any existing session for this exact device (same-device re-login)
    await tx.session.deleteMany({ where: { userId, deviceId } });

    // Enforce max-2 concurrent sessions across OTHER devices
    const otherSessions = await tx.session.findMany({
      where: { userId, NOT: { deviceId } },
      orderBy: { createdAt: 'asc' }, // oldest first
    });

    if (otherSessions.length >= 2) {
      const oldSessionIds = otherSessions
        .slice(0, otherSessions.length - 1)
        .map((s) => s.id);
      await tx.session.deleteMany({
        where: {
          id: {
            in: oldSessionIds,
          },
        },
      });
    }

    const sessionToken = this.generateHash();
    return tx.session.create({
      data: {
        userId,
        sessionToken,
        expires: expiresAt,
        lastUsedAt: new Date(),
        deviceId,
        userAgent,
        ipAddress,
        location,
      },
    });
  }

  /**
   * @description Atomically rotate a session token in a single UPDATE.
   * No transaction needed — Postgres row-level locking on the unique sessionToken
   * guarantees only one concurrent caller can consume a given token.
   * If the token is already consumed or expired, Prisma throws P2025 → 401.
   *
   * @private
   * @param {string} oldSessionToken The current session token to rotate
   * @returns {Promise<Session>} The updated session with the new token
   */
  private async rotateSession(oldSessionToken: string): Promise<Session> {
    const expiresAt = new Date(
      Date.now() +
        parseJwtExpiration(
          this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION')!,
        ) *
          1000,
    );

    try {
      return await this.prismaService.session.update({
        where: { sessionToken: oldSessionToken },
        data: {
          sessionToken: this.generateHash(),
          lastUsedAt: new Date(),
          expires: expiresAt,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Token Expired!',
        });
      }
      throw error;
    }
  }

  /**
   * @description Deletes all active sessions for a user.
   * Called inside a transaction after a password reset to invalidate every existing login.
   *
   * @async
   * @private
   * @param {Prisma.TransactionClient} tx - Prisma transaction client
   * @param {string} userId - ID of the user whose sessions should be dropped
   * @returns {Promise<void>}
   */
  private async dropSession(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<any> {
    await tx.session.deleteMany({
      where: { user: { id: userId } },
    });
  }

  /**
   * @description Deletes all active sessions for a user.
   * Called when suspected user account compromise.
   * Called when login attempts maxes out
   * Called when 2fa attempts maxes out
   *
   *
   * @async
   * @private
   * @param {string} userId - ID of the user whose sessions should be dropped
   * @returns {Promise<number>} Number of user sessiuons removed
   */
  private async forceSessionReset(userId: string): Promise<void> {
    const res = await this.prismaService.session.deleteMany({
      where: { user: { id: userId } },
    });
    this.logger.debug(
      `Session Reset: Removed ${res.count} sessions for ${userId}`,
    );
    throw new RpcException({
      code: status.RESOURCE_EXHAUSTED,
      message:
        'Too many failed attempts. Reset your password to regain access.',
    });
  }

  /**
   * @description Generate an expiry date for tokens
   *
   * @private
   * @param {number} minutes Minutes from now
   * @returns {Date} Expiry date
   */
  private generateExpiryDate(minutes: number): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  /**
   * @description Generate a hash
   *
   * @private
   * @returns {string} Hash
   */
  private generateHash(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * @description Generates a cryptographically secure 6-digit OTP (100,000 to 1,000,000)
   *
   * @private
   * @returns {string} 6-digit OTP token
   */
  private generateToken(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * @description Creates a JWT payload for various token types
   *
   * @private
   * @param {Partial<User>} user User information
   * @param {TokenPayload['type']} tokenType Type of token (e.g., 'email_otp')
   * @returns {TokenPayload} The token payload
   */
  private createPayload(
    user: Partial<User>,
    tokenType: TokenPayload['type'],
    sessionToken?: string,
    identifyer?: string,
  ): TokenPayload {
    switch (tokenType) {
      case '2fa_token':
        return {
          id: user.id!,
          type: tokenType,
        } as TokenPayload;

      default:
        return {
          id: user.id!,
          type: tokenType,
          email: user.email!,
          avatar: user.avatar ?? null,
          firstName: user.firstName!,
          lastName: user.lastName!,
          sessionToken,
          identifyer,
        };
    }
  }

  /**
   * @description Hashes a plain text password using bcrypt
   *
   * @private
   * @param {string} password Plain text password
   * @returns {string} Hashed password
   */
  private hashPassword(password: string): string {
    const hashed: string = bcrypt.hashSync(password, 10);
    return hashed;
  }

  /**
   * @description Compares plain Password and user password hash
   *
   * @private
   * @param {string} password Plain text password
   * @param {User} user trying to login
   * @returns {boolean} Password match indication
   */
  private recordLoginActivity(
    userId: string,
    type: 'PASSWORD' | 'MFA',
    activityStatus: 'SUCCESS' | 'FALED',
    deviceInfo: {
      deviceId: string;
      userAgent?: string;
      ipAddress?: string;
      location?: string;
    },
  ): void {
    void this.prismaService.loginActivity
      .create({
        data: {
          userId,
          type,
          status: activityStatus,
          deviceId: deviceInfo.deviceId,
          userAgent: deviceInfo.userAgent,
          ipAddress: deviceInfo.ipAddress,
          location: deviceInfo.location,
        },
      })
      .catch((err) =>
        this.logger.error('Failed to record login activity:', err),
      );
  }

  private comparedPassword(password: string, user: User): boolean {
    if (!user.password) {
      this.logger.warn(
        `User ${user.email} attempted login but has no password (OAuth user?)`,
      );
      return false;
    }
    try {
      return bcrypt.compareSync(password, user.password);
    } catch (error) {
      this.logger.error(
        `Error comparing password for user ${user.email}:`,
        error,
      );
      return false;
    }
  }

  /**
   * @description Hashes a plain text otp using bcrypt
   *
   * @private
   * @param {string} otp text otp code
   * @returns {string} Hashed otp code
   */
  private hashOtp(otp: string): string {
    const hashed: string = bcrypt.hashSync(otp, 5);
    return hashed;
  }

  /**
   * @description Compares otp code with hashed otp
   *
   * @private
   * @param {string} otp Plain otp code
   * @param {VerificationToken} token with hashed otp
   * @returns {boolean} otp code  match indication
   */
  private comparedOtp(otp: string, token: VerificationToken): boolean {
    if (!token.token) {
      this.logger.warn(
        `Token Compared attempeted for otp:${otp} with missing token otp hash`,
      );
      return false;
    }
    try {
      return bcrypt.compareSync(otp, token.token);
    } catch (error) {
      this.logger.error(`Error comparing otp code:`, error);
      return false;
    }
  }

  /**
   * @description Validates a TOTP code against the user's 2FA secret and enforces
   * replay prevention. Safe to call from any flow that requires 2FA verification.
   *
   * Replay prevention: divides the current Unix timestamp by 30 000 ms to get the
   * active TOTP window bucket. If that bucket matches `twoFactorLastUsedAt`, the
   * code was already consumed in this window and is rejected. On success the window
   * is stamped so subsequent calls within the same 30-second period are blocked.
   *
   * NOTE: Rate limiting (twoFactorAttempts) is intentionally left to callers —
   * different operations have different thresholds and reset strategies.
   *
   * @param user - Fully loaded User record (must include twoFactorSecret/LastUsedAt)
   * @param token - The 6-digit TOTP code supplied by the client
   * @throws {RpcException} FAILED_PRECONDITION  if 2FA is not enabled on the account
   * @throws {RpcException} UNAUTHENTICATED      if the code is invalid or replayed
   */
  private async validate2fa(user: User, token: string): Promise<void> {
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Two-factor authentication is not enabled on this account',
      });
    }

    const secret = this.decrypt(user.twoFactorSecret);
    const result = await this.otp.verify({ secret, token, epochTolerance: 30 });

    if (!result.valid) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid credentials',
      });
    }

    // Replay prevention: each 30-second window may only be consumed once
    const T_now = Math.floor(Date.now() / 30_000);
    if (user.twoFactorLastUsedAt) {
      const T_last = Math.floor(user.twoFactorLastUsedAt.getTime() / 30_000);
      if (T_now === T_last) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Invalid credentials',
        });
      }
    }

    // Consume the window so the same code cannot be replayed
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { twoFactorLastUsedAt: new Date() },
    });
  }

  /**
   * @description Encrypt text using AES
   *
   * @private
   * @param {string} text Plain text string to encrypt => Symmetrically using AES
   * @returns {string} encrypted text and the iv text: encrypted:iv
   */
  private encrypt(text: string): string {
    // secrets
    const secretStr = this.configService.getOrThrow('AES_KEY');
    const secretBuffer = Buffer.from(secretStr, 'hex');

    // random init vector
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-cbc', secretBuffer, iv);
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf-8'),
      cipher.final(),
    ]);

    return `${encrypted.toString('hex')}:${iv.toString('hex')}`;
  }

  /**
   * @description Dencrypt encrypted text using AES
   *
   * @private
   * @param {string} text encrypted text containing text:iv
   * @returns {string} plains text
   */
  private decrypt(text: string): string {
    // secrets
    const secretStr = this.configService.getOrThrow('AES_KEY');
    const secretBuffer = Buffer.from(secretStr, 'hex');

    // random init vector
    const [encrypt, iv] = text.split(':');

    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      secretBuffer,
      Buffer.from(iv, 'hex'),
    );
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypt, 'hex')),
      decipher.final(),
    ]);

    return decrypted.toString('utf-8');
  }
}
