import * as crypto from 'crypto';

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
  ResetPasswordRes,
  ValidateTokenRes,
  VerifyEmailReq,
  VerifyEmailRes,
  VerifyPasswordTokenReq,
  VerifyPasswordTokenRes,
} from '@fintrack/types/protos/auth/auth';
import {
  EMAIL_VERIFICATION_JOB,
  TOKEN_NOTIFICATION_QUEUE,
  WELCOME_EMAIL_JOB,
  FORGOT_PASSWORD_EMAIL_JOB,
  PASSWORD_CHANGE_JOB,
} from '@fintrack/types/constants/queus.constants';
import { parseJwtExpiration } from '@fintrack/utils/jwt';
import { getPeriodRange, getTimeFromNowInMinutes } from '@fintrack/utils/date';
import {
  DeviceInfo,
  CreateSessionOptions,
} from '@fintrack/types/interfaces/device';

/**
 * Service responsible for managing uer authentication
 * Interacts with the prsima
 * Manages User,Account,Session and VerificationToken
 *
 *
 * @class AuthService
 */

@Injectable()
export class AuthService {
  private readonly logger = new Logger();

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
    @InjectQueue(TOKEN_NOTIFICATION_QUEUE) private readonly tokenQueue: Queue,
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
    data.password = this.hashPassword(data.password);

    try {
      //  1. Database Operations (Atomic)
      const result = await this.prismaService.$transaction(
        async (tx) => {
          const user = await tx.user.upsert({
            where: { email: data.email },
            update: {
              password: data.password,
              accounts: {
                create: {
                  type: 'CREDENTIALS',
                  provider: 'LOCAL',
                  providerAccountId: data.email,
                },
              },
            },
            create: {
              ...data,
              loginAttempts: 0,
              accounts: {
                create: {
                  type: 'CREDENTIALS',
                  provider: 'LOCAL',
                  providerAccountId: data.email,
                },
              },
            },
            select: {
              id: true,
              email: true,
              avatar: true,
              firstName: true,
              lastName: true,
            },
          });

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

          const emailToken = this.jwtService.sign(
            this.createPayload(user as User, 'otp_token'),
            {
              secret: this.configService.get('JWT_OTP_SECRET'),
              expiresIn: this.configService.get('JWT_OTP_TOKEN_EXPIRATION'),
            },
          );

          // ==> Push Email Token to Queue and move on
          this.tokenQueue.add(EMAIL_VERIFICATION_JOB, {
            otp,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          });

          return { user, emailToken };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      return {
        emailToken: result.emailToken,
        user: {
          id: result.user.id,
          email: result.user.email,
          avatar: result.user.avatar!,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
        },
      };
    } catch (error: any) {
      this.logger.log(error);
      if (error.code === 'P2002') {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: 'User with this email already exists',
        });
      }
      throw new RpcException({
        code: status.INTERNAL,
        message: 'Unable to register, try again later',
      });
    }
  }

  /**
   * @description Verify Email of new User by Local Credentials
   *
   * @async
   * @public
   * @param {TokenPayload} payload of the user
   * @param {VerifyEmailReq} data containing otp
   * @returns {Promise<VerifyEmailRes></VerifyEmailRes>} response with accesstokens
   * @throws {RpcException} UNAUTHENTICATED - Auth checks
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
              code: status.UNAUTHENTICATED,
              message: 'User Already verfied',
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

          const tokens = await this.generateAuthTokens(tx, user, {
            mode: 'login',
            deviceInfo: {
              deviceId: data.deviceId,
              userAgent: data.userAgent,
              ipAddress: data.ipAddress,
              location: data.location,
            },
          });

          // ==> Push Welcome Email to Queue (Async)
          this.tokenQueue.add(WELCOME_EMAIL_JOB, {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          });

          return { user, tokens };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      return {
        user: {
          id: result.user.id,
          email: result.user.email,
          avatar: result.user.avatar!,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
        },
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
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

          const emailToken = this.jwtService.sign(
            this.createPayload(user as User, 'otp_token'),
            {
              secret: this.configService.get('JWT_OTP_SECRET'),
              expiresIn: this.configService.get('JWT_OTP_TOKEN_EXPIRATION'),
            },
          );

          // ==> Push Email Token to Queue
          this.tokenQueue.add(EMAIL_VERIFICATION_JOB, {
            otp,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          });

          return { user, emailToken };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      return {
        emailToken: result.emailToken,
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
      const result = await this.prismaService.$transaction(
        async (tx) => {
          const user = await tx.user.findUnique({
            where: { email: data.email },
          });
          if (!user) {
            throw new RpcException({
              code: status.UNAUTHENTICATED,
              message: 'Invalid Email/Password',
            });
          }

          const maxAttempts = this.configService.get<number>(
            'MAX_LOGIN_ATTEMPTS',
            3,
          );

          if (user.loginAttempts >= maxAttempts) {
            throw new RpcException({
              code: status.UNAUTHENTICATED,
              message:
                'You have attempted too many incorrect logins, Please reset your password',
            });
          }

          if (!this.comparedPassword(data.password, user)) {
            user.loginAttempts++;
            await tx.user.update({
              where: { email: user.email },
              data: {
                loginAttempts: user.loginAttempts,
              },
            });

            throw new RpcException({
              code: status.UNAUTHENTICATED,
              message: 'Invalid Email/Password',
            });
          }
          user.loginAttempts = 0;
          await tx.user.update({
            where: { email: user.email },
            data: {
              loginAttempts: user.loginAttempts,
              lastLoginAt: new Date(),
            },
          });

          if (!user.emailVerified) {
            throw new RpcException({
              code: status.UNAUTHENTICATED,
              message: 'Email not verified! Please verify your email.',
            });
          }

          const tokens = await this.generateAuthTokens(tx, user, {
            mode: 'login',
            deviceInfo: {
              deviceId: data.deviceId,
              userAgent: data.userAgent,
              ipAddress: data.ipAddress,
              location: data.location,
            },
          });

          return { user, tokens };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      return {
        user: {
          id: result.user.id,
          email: result.user.email,
          avatar: result.user.avatar || '',
          firstName: result.user.firstName,
          lastName: result.user.lastName,
        },
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      };
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
   * @description Validated payload is verified by geting user from DB
   *
   * @async
   * @public
   * @param {string} userId of the user
   * @returns {User}  user from prisma
   * @throws {RpcException} UNAUTHENTICATED - Auth checks
   */
  async validateToken(userId: string): Promise<ValidateTokenRes> {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      omit: {
        password: true,
      },
    });

    ///!!! WE WILL ADD MORE SECURITY CHECKS AS NEEDED HERE

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

    return {
      id: user.id,
      email: user.email,
      avatar: user.avatar!,
      lastName: user.lastName,
      firstName: user.firstName,
    };
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

          // ==> Push Email Token to Queue and move on (Async)
          this.tokenQueue.add(FORGOT_PASSWORD_EMAIL_JOB, {
            otp,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          });

          return {
            email: user.email,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

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

          // ==> Push Email Token to Queue and move on (Async)
          this.tokenQueue.add(FORGOT_PASSWORD_EMAIL_JOB, {
            otp,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          });

          return {
            email: user.email,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

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

          const passwordToken = this.jwtService.sign(
            this.createPayload(
              { email: user.email, id: user.id },
              'otp_token',
              undefined,
              token,
            ),
            {
              secret: this.configService.get('JWT_OTP_SECRET'),
              expiresIn: this.configService.get('JWT_OTP_TOKEN_EXPIRATION'),
            },
          );

          return {
            passwordToken,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      return {
        passwordToken: result.passwordToken,
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
   * @returns {Promise<ResetPasswordRes>} null on success (standard gRPC/internal pattern)
   * @throws {RpcException} UNAUTHENTICATED if token is invalid or expired
   * @throws {RpcException} ALREADY_EXISTS if the new password is the same as the old one
   */
  async resetPassword(
    payload: TokenPayload,
    data: ResetPasswordReq,
  ): Promise<ResetPasswordRes> {
    try {
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
              message: 'Invalid Toekn',
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
              password: this.hashPassword(data.newPassword),
            },
          });

          await tx.verificationToken.delete({
            where: {
              id: verificationToken.id,
            },
          });

          // Drop all active sessions for security
          await this.dropSession(tx, user.id);

          // ==> Push Password Change Email to Queue (Async)
          this.tokenQueue.add(PASSWORD_CHANGE_JOB, {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          });

          return null as any;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      return result;
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
      const result = await this.prismaService.$transaction(
        async (tx) => {
          if (!payload.sessionToken) {
            throw new RpcException({
              code: status.UNAUTHENTICATED,
              message: 'Unauthorized!',
            });
          }

          const user = await tx.user.findFirst({ where: { id: payload.id } });
          if (!user) {
            throw new RpcException({
              code: status.UNAUTHENTICATED,
              message: 'Unauthorized!',
            });
          }

          const tokens = await this.generateAuthTokens(tx, user, {
            mode: 'refresh',
            oldSessionToken: payload.sessionToken,
          });
          return { tokens };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      return {
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
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
            include: { accounts: true, subscription: true },
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

          if (!user.subscription) {
            await tx.subscription.create({
              data: { userId: user.id, plan: 'FREE', status: 'ACTIVE' },
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

            this.tokenQueue.add(WELCOME_EMAIL_JOB, {
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
            });
          }

          const tokens = await this.generateAuthTokens(tx, user, {
            mode: 'login',
            deviceInfo: {
              deviceId: data.deviceId,
              userAgent: data.userAgent,
              ipAddress: data.ipAddress,
              location: data.location,
            },
          });

          return { user, tokens };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      return {
        user: {
          id: result.user.id,
          email: result.user.email,
          avatar: result.user.avatar || '',
          firstName: result.user.firstName,
          lastName: result.user.lastName,
        },
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
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
   * @description Generate Auth tokens
   *
   * @async
   * @private
   * @param {Prisma.TransactionClient} tx Prisma Transaction client
   * @param {User} user information
   * @param {CreateSessionOptions} options discriminated union for login vs refresh paths
   * @returns {Promise<{accessToken:string;refreshToken:string}>} auth tokens
   */
  private async generateAuthTokens(
    tx: Prisma.TransactionClient,
    user: User,
    options: CreateSessionOptions,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const session = await this.createSession(tx, user.id, options);

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
   * @description Create or rotate a Session with device-aware logic.
   *
   * mode: 'login'   — upsert by (userId, deviceId); evict oldest if > 2 other-device sessions
   * mode: 'refresh' — rotate by oldSessionToken, preserving device info from the existing record
   *
   * @async
   * @private
   * @param {Prisma.TransactionClient} tx Prisma transaction client
   * @param {string} userId Id of user
   * @param {CreateSessionOptions} options
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

    if (options.mode === 'refresh') {
      const existing = await tx.session.findFirst({
        where: { sessionToken: options.oldSessionToken },
      });

      if (!existing) {
        throw new RpcException({
          code: status.UNAUTHENTICATED,
          message: 'Token Expired!',
        });
      }

      // Preserve device info from the existing session — client never re-submits it
      const { deviceId, userAgent, ipAddress, location } = existing;

      await tx.session.delete({
        where: { sessionToken: options.oldSessionToken },
      });

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

    // mode === 'login': upsert by (userId, deviceId)
    const { deviceId, userAgent, ipAddress, location } = options.deviceInfo;

    // Delete any existing session for this exact device (same-device re-login)
    await tx.session.deleteMany({ where: { userId, deviceId } });

    // Enforce max-2 concurrent sessions across OTHER devices
    const otherSessions = await tx.session.findMany({
      where: { userId, NOT: { deviceId } },
      orderBy: { createdAt: 'asc' }, // oldest first
    });

    if (otherSessions.length >= 2) {
      await tx.session.deleteMany({
        where: {
          id: {
            in: otherSessions
              .slice(0, otherSessions.length - 1)
              .map((s) => s.id),
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
   * @description. Drop Sessions after password change
   *
   * @async
   * @private
   * @param {Prisma.TransactionClient} tx Prisma transaction client
   * @param {string} userId Id of user
   * @returns {Promise<void>} created session
   */
  private async dropSession(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<any> {
    await tx.session.deleteMany({
      where: { userId },
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
}
