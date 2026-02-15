import { Metadata, status } from '@grpc/grpc-js';

import { Controller, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import {
  AuthReq,
  AuthRes,
  LoginReq,
  LoginRes,
  RegisterRes,
  AuthServiceController,
  AuthServiceControllerMethods,
} from '@fintrack/types/protos/auth/auth';

import { AuthService } from './auth.service';

@Controller()
@AuthServiceControllerMethods()
export class AuthController implements AuthServiceController {
  logger = new Logger(AuthController.name);
  constructor(private readonly appService: AuthService) {}

  async login(request: LoginReq, metadata: Metadata) {
    const res: LoginRes = { id: '1', token: 'bbcj fbbvdb' };
    return res;
  }

  async register(request: LoginReq) {
    const res: RegisterRes = { id: '1', userName: 'John Doe' };
    return res;
  }

  async auth(request: AuthReq) {
    if (!request.token) {
      throw new RpcException({
        code: status.UNAUTHENTICATED,
        message: 'No token provided',
      });
    }

    // dummy token verification for now
    // In real app: this.jwtService.verify(request.token);

    // dummy db check for now
    // const user = await prisma.user.findUnique(...)

    const res: AuthRes = { id: 'user-123', status: 'active' };
    return res;
  }
}
