import * as crypto from 'crypto';

import { Queue } from 'bullmq';
import { status } from '@grpc/grpc-js';
import * as bcrypt from 'bcrypt';

import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

import { Prisma, User } from '@fintrack/database/types';
import { TokenPayload } from '@fintrack/types/interfaces/token_payload';
import { PrismaService } from '@fintrack/database/nest';
import { RegisterReq, RegisterRes } from '@fintrack/types/protos/auth/auth';
import {
  EMAIL_VERIFICATION_JOB,
  TOKEN_NOTIFICATION_QUEUE,
} from '@fintrack/types/constants/queus.constants';
import { EmailVerificationPayload } from '@fintrack/types/interfaces/mail.interface';

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
      const { user: finalUser, token: verificationToken } =
        await this.prismaService.$transaction(
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

            return { user: internalUser, token };
          },
          {
            maxWait: 5000,
            timeout: 10000,
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );

      const emailToken = this.jwtService.sign(
        this.createPayload(finalUser as User, 'email_otp'),
        {
          secret: this.configService.get('JWT_OTP_SECRET'),
          expiresIn: this.configService.get('JWT_OTP_TOKEN_EXPIRATION'),
        },
      );

      // ==> Push Email Token to Queue and move on
      const payload: EmailVerificationPayload = {
        email: finalUser.email,
        otp: verificationToken.token,
        firstName: finalUser.firstName,
        lastName: finalUser.lastName,
      };
      this.tokenQueue.add(EMAIL_VERIFICATION_JOB, payload);

      return {
        emailToken,
        user: {
          id: finalUser.id,
          email: finalUser.email,
          avatar: finalUser.avatar!,
          firstName: finalUser.firstName,
          lastName: finalUser.lastName,
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
  ): TokenPayload {
    return {
      id: user.id!,
      type: tokenType,
      email: user.email!,
      avatar: user.avatar ?? null,
      firstName: user.firstName!,
      lastName: user.lastName!,
    };
  }
}
