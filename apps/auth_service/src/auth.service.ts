import * as crypto from 'crypto';

import { Queue } from 'bullmq';
import { status } from '@grpc/grpc-js';
import * as bcrypt from 'bcrypt';

import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

import { Prisma, Session, User } from '@fintrack/database/types';
import { TokenPayload } from '@fintrack/types/interfaces/token_payload';
import { PrismaService } from '@fintrack/database/nest';
import {
  RegisterReq,
  RegisterRes,
  ValidateTokenRes,
  VerifyEmailReq,
  VerifyEmailRes,
} from '@fintrack/types/protos/auth/auth';
import {
  EMAIL_VERIFICATION_JOB,
  TOKEN_NOTIFICATION_QUEUE,
  WELCOME_EMAIL_JOB,
} from '@fintrack/types/constants/queus.constants';
import { EmailVerificationPayload } from '@fintrack/types/interfaces/mail.interface';
import { parseJwtExpiration } from '@fintrack/utils/jwt';

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
    data.password = this.hasPassword(data.password);

    try {
      //  1. Database Operations (Atomic)
      const result = await this.prismaService.$transaction(
        async (tx) => {
          const internalUser = await tx.user.upsert({
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

          const token = await tx.verificationToken.create({
            data: {
              identifier: 'EMAIL',
              email: internalUser.email,
              token: this.generateToken(),
              expires: this.generateExpiryDate(
                this.configService.get<number>('OTP_EXPIRY_MINUTES', 5),
              ),
            },
          });

          const emailToken = this.jwtService.sign(
            this.createPayload(internalUser as User, 'otp_token'),
            {
              secret: this.configService.get('JWT_OTP_SECRET'),
              expiresIn: this.configService.get('JWT_OTP_TOKEN_EXPIRATION'),
            },
          );

          // ==> Push Email Token to Queue and move on
          const payload: EmailVerificationPayload = {
            email: internalUser.email,
            otp: token.token,
            firstName: internalUser.firstName,
            lastName: internalUser.lastName,
          };

          this.tokenQueue.add(EMAIL_VERIFICATION_JOB, payload);

          return { user: internalUser, verificationToken: token, emailToken };
        },
        {
          maxWait: 5000,
          timeout: 10000,
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
      if (error.code === 'P2002') {
        throw new RpcException({
          code: status.ALREADY_EXISTS,
          message: 'User with this email already exists',
        });
      }
      throw error;
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
      return this.prismaService.$transaction(async (tx) => {
        const verificationToken =
          await this.prismaService.verificationToken.findFirst({
            where: {
              email: payload.email,
              token: data.otp,
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

        await tx.verificationToken.delete({
          where: {
            id: verificationToken.id,
          },
        });

        await tx.user.update({
          where: {
            id: user.id,
          },
          data: {
            emailVerified: true,
            emailVerifiedAt: new Date(),
          },
        });

        const tokens = await this.generateAuthTokens(tx, user);

        // ==> Push Welcome Email to Queue (Async)
        this.tokenQueue.add(WELCOME_EMAIL_JOB, {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        });

        return {
          user: {
            id: user.id,
            email: user.email,
            avatar: user.avatar!,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        };
      });
    } catch (error) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'Invalid Token',
      });
    }
  }

  /**
   * @description Validated payload is verified by geting user from DB
   *
   * @async
   * @public
   * @param {string} id of the user
   * @returns {User}  user from prisma
   * @throws {RpcException} UNAUTHENTICATED - Auth checks
   */
  async validateToken(id: string): Promise<ValidateTokenRes> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
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
   * @description Generate Auth tokens`
   *
   * @async
   * @private
   * @param {Prisma.TransactionClient} tx Prisma Transaction client
   * @param {User} user information
   * @returns {Promise<{accessToekn:string;refreshToken:string}>} auth tokens
   */
  private async generateAuthTokens(
    tx: Prisma.TransactionClient,
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const session = await this.createSession(tx, user.id);

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
   * @description. Rotate Session
   *
   * @async
   * @private
   * @param {Prisma.TransactionClient} tx Prisma transaction client
   * @param {string} userId Id of user
   * @returns {Promise<Session>} cureent session
   */
  private async createSession(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<Session> {
    const sessions = await tx.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }, // newest first => bigger dates
    });

    if (sessions.length >= 2) {
      const oldestSessions = sessions.slice(1);
      await tx.session.deleteMany({
        where: { id: { in: oldestSessions.map((s) => s.id) } },
      });
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    return await tx.session.create({
      data: {
        userId,
        sessionToken,
        expires: new Date(
          Date.now() +
            parseJwtExpiration(
              this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION')!,
            ) *
              1000,
        ),
      },
    });
  }

  /**
   * @description Generate an expiry date for tokens
   *
   * @private
   * @param {number} minutes Minutes from now
   * @returns {Date} Expiry date
   */
  generateExpiryDate(minutes: number): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  /**
   * @description Generates a cryptographically secure 6-digit OTP (100,000 to 1,000,000)
   *
   * @private
   * @returns {string} 6-digit OTP token
   */
  generateToken(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * @description Hashes a plain text password using bcrypt
   *
   * @private
   * @param {string} password Plain text password
   * @returns {string} Hashed password
   */
  hasPassword(password: string): string {
    const hashed: string = bcrypt.hashSync(password, 10);
    return hashed;
  }

  /**
   * @description Creates a JWT payload for various token types
   *
   * @private
   * @param {Partial<User>} user User information
   * @param {TokenPayload['type']} tokenType Type of token (e.g., 'email_otp')
   * @returns {TokenPayload} The token payload
   */
  createPayload(
    user: Partial<User>,
    tokenType: TokenPayload['type'],
    sessionToken?: string,
  ): TokenPayload {
    return {
      id: user.id!,
      type: tokenType,
      email: user.email!,
      avatar: user.avatar ?? null,
      firstName: user.firstName!,
      lastName: user.lastName!,
      sessionToken,
    };
  }
}
