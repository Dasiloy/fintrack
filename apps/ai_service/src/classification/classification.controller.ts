import { Observable } from 'rxjs';

import { GrpcMethod, Payload } from '@nestjs/microservices';
import { Controller, UseGuards } from '@nestjs/common';

import {
  AI_SERVICE_NAME,
  ClassifyTransactionsReq,
  ClassifyTransactionsRes,
} from '@fintrack/types/protos/ai/ai';
import { RpcUser } from '@fintrack/common/decorators/rpc_user.decorator';
import { RpcAuthGuard } from '@fintrack/common/guards/rpc.guard';
import { User } from '@fintrack/database/types';

import { ClassificationService } from './classification.service';

/**
 * gRPC controller for the `AiService.ClassifyTransactions` method.
 *
 * Receives a batch of Mono bank transactions and a list of the user's
 * categories, then delegates to `ClassificationService` to produce a
 * one-to-one mapping of transaction IDs → category IDs + slugs.
 *
 * ## Auth
 * Protected by `RpcAuthGuard` — the guard reads the JWT from gRPC metadata,
 * validates it, and exposes the decoded user via `@RpcUser()`.
 *
 * ## gRPC surface
 * | Method               | Proto package | Request                   | Response                  |
 * |----------------------|---------------|---------------------------|---------------------------|
 * | ClassifyTransactions | ai            | ClassifyTransactionsReq   | ClassifyTransactionsRes   |
 *
 * @class ClassificationController
 */
@UseGuards(RpcAuthGuard)
@Controller()
export class ClassificationController {
  constructor(private readonly classificationService: ClassificationService) {}

  /**
   * @description Classify a batch of unclassified Mono bank transactions
   * against the user's categories. Returns a one-to-one mapping of transaction
   * IDs to category IDs and slugs.
   *
   * @async
   * @public
   * @param {ClassifyTransactionsReq} request Batch of transactions and the user's category list
   * @param {User} user Authenticated user injected by RpcAuthGuard
   * @returns {Promise<ClassifyTransactionsRes> | Observable<ClassifyTransactionsRes> | ClassifyTransactionsRes}
   * @throws {RpcException} OUT_OF_RANGE if the model returns truncated or null output
   * @throws {RpcException} INTERNAL for unexpected classification errors
   */
  @GrpcMethod(AI_SERVICE_NAME, 'ClassifyTransactions')
  classifyTransactions(
    @Payload() request: ClassifyTransactionsReq,
    @RpcUser() user: User,
  ):
    | Promise<ClassifyTransactionsRes>
    | Observable<ClassifyTransactionsRes>
    | ClassifyTransactionsRes {
    return this.classificationService.classifyTransaction(user.id, request);
  }
}
