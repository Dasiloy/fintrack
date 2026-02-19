import { lastValueFrom, timeout } from 'rxjs';

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

import {
  AUTH_PACKAGE_NAME,
  AUTH_SERVICE_NAME,
  AuthServiceClient,
  RegisterRes,
} from '@fintrack/types/protos/auth/auth';

import { RegisterUserDto } from './dto/auth.dto';

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
   * @throws {RequestTimeoutException} If the auth microservice times out (mapped from 5s timeout)
   */
  async register(data: RegisterUserDto): Promise<RegisterRes> {
    const user = await lastValueFrom(
      this.authService.register(data).pipe(timeout(5000)),
    );

    return user;
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
      const request: any = { token };
      // Call the microservice
      // return await lastValueFrom(
      //   this.authService.auth(request).pipe(timeout(5000)),
      return null; // Placeholder until implemented
    } catch (error) {
      // Don't throw - return undefined so TRPC context can handle it
      return null;
    }
  }
}
