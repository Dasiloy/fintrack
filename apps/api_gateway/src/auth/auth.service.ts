import { lastValueFrom, timeout } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

import {
  AUTH_PACKAGE_NAME,
  AUTH_SERVICE_NAME,
  AuthServiceClient,
  RegisterRes,
  VerifyEmailRes,
} from '@fintrack/types/protos/auth/auth';

import { RegisterUserDto, VerifyEmailDto } from './dto/auth.dto';

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
   * @throws {RequestTimeoutException} If the auth microservice times out (mapped from 8s timeout)
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
}
