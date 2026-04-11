import { Controller } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';

import { FINANCE_SERVICE_NAME } from '@fintrack/types/protos/finance/finance';
import {
  Split as ProtoSplit,
  SplitParticipant as ProtoParticipant,
  SplitSettlement as ProtoSettlement,
  GetSplitAggregateRes,
  GetSplitsReq,
  GetSplitsRes,
  SplitReq,
  CreateSplitReq,
  UpdateSplitReq,
  AddParticipantReq,
  UpdateParticipantReq,
  ParticipantReq,
  PaySettlementReq,
  SettlementReq,
} from '@fintrack/types/protos/finance/split';
import { Empty } from '@fintrack/types/protos/finance/transaction';
import { RpcUser } from '@fintrack/common/decorators/rpc_user.decorator';
import { User } from '@fintrack/database/types';

import { SplitService } from './split.service';

/**
 * gRPC controller for all split-expense operations.
 * Auth is enforced at the module level via RpcAuthGuard.
 *
 * @class SplitController
 */
@Controller()
export class SplitController {
  constructor(private readonly splitService: SplitService) {}

  /**
   * Creates a new split expense for the authenticated user.
   *
   * @param {CreateSplitReq} request - Split payload (name, amount, optional transactionId)
   * @param {User} user - Authenticated user from gRPC metadata
   * @returns {Promise<ProtoSplit>} Newly created split
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'createSplit')
  createSplit(
    @Payload() request: CreateSplitReq,
    @RpcUser() user: User,
  ): Promise<ProtoSplit> {
    return this.splitService.createSplit(user.id, request);
  }

  /**
   * Returns split aggregates for the authenticated user.
   *
   * @param {User} user - Authenticated user from gRPC metadata
   * @returns {Promise<GetSplitAggregateRes>} Aggregate totals and status counts
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'getSplitAggregate')
  getSplitAggregate(@RpcUser() user: User): Promise<GetSplitAggregateRes> {
    return this.splitService.getSplitAggregate(user.id);
  }

  /**
   * Returns all splits for the authenticated user with optional status filters.
   *
   * @param {GetSplitsReq} request - Optional filter payload (status[])
   * @param {User} user - Authenticated user from gRPC metadata
   * @returns {Promise<GetSplitsRes>} List of splits
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'getSplits')
  getSplits(
    @Payload() request: GetSplitsReq,
    @RpcUser() user: User,
  ): Promise<GetSplitsRes> {
    return this.splitService.getSplits(user.id, request);
  }

  /**
   * Returns a single split by ID.
   *
   * @param {SplitReq} request - Contains split ID
   * @param {User} user - Authenticated user from gRPC metadata
   * @returns {Promise<ProtoSplit>} Split with participant and settlement details
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'getSplit')
  getSplit(
    @Payload() request: SplitReq,
    @RpcUser() user: User,
  ): Promise<ProtoSplit> {
    return this.splitService.getSplit(user.id, request);
  }

  /**
   * Updates an existing split.
   *
   * @param {UpdateSplitReq} request - Fields to update (id, optional name, optional amount)
   * @param {User} user - Authenticated user from gRPC metadata
   * @returns {Promise<ProtoSplit>} Updated split
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'updateSplit')
  updateSplit(
    @Payload() request: UpdateSplitReq,
    @RpcUser() user: User,
  ): Promise<ProtoSplit> {
    return this.splitService.updateSplit(user.id, request);
  }

  /**
   * Deletes a split by ID.
   *
   * @param {SplitReq} request - Contains split ID
   * @param {User} user - Authenticated user from gRPC metadata
   * @returns {Promise<Empty>} Empty response on success
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'deleteSplit')
  deleteSplit(
    @Payload() request: SplitReq,
    @RpcUser() user: User,
  ): Promise<Empty> {
    return this.splitService.deleteSplit(user.id, request);
  }

  /**
   * Adds a participant to a split.
   *
   * @param {AddParticipantReq} request - Participant payload (splitId, name, email, amount)
   * @param {User} user - Authenticated user from gRPC metadata
   * @returns {Promise<ProtoParticipant>} Newly created participant
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'addParticipant')
  addParticipant(
    @Payload() request: AddParticipantReq,
    @RpcUser() user: User,
  ): Promise<ProtoParticipant> {
    return this.splitService.addParticipant(user.id, request);
  }

  /**
   * Updates an existing participant in a split.
   *
   * @param {UpdateParticipantReq} request - Fields to update (splitId, participantId, optional fields)
   * @param {User} user - Authenticated user from gRPC metadata
   * @returns {Promise<ProtoParticipant>} Updated participant
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'updateParticipant')
  updateParticipant(
    @Payload() request: UpdateParticipantReq,
    @RpcUser() user: User,
  ): Promise<ProtoParticipant> {
    return this.splitService.updateParticipant(user.id, request);
  }

  /**
   * Deletes a participant from a split.
   *
   * @param {ParticipantReq} request - Contains splitId and participantId
   * @param {User} user - Authenticated user from gRPC metadata
   * @returns {Promise<Empty>} Empty response on success
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'deleteParticipant')
  deleteParticipant(
    @Payload() request: ParticipantReq,
    @RpcUser() user: User,
  ): Promise<Empty> {
    return this.splitService.deleteParticipant(user.id, request);
  }

  /**
   * Records a settlement payment for a participant.
   *
   * @param {PaySettlementReq} request - Settlement payload (splitId, participantId, paidAmount, paidAt, optional transactionId)
   * @param {User} user - Authenticated user from gRPC metadata
   * @returns {Promise<ProtoSettlement>} Newly created settlement
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'paySettlement')
  paySettlement(
    @Payload() request: PaySettlementReq,
    @RpcUser() user: User,
  ): Promise<ProtoSettlement> {
    return this.splitService.paySettlement(user.id, request);
  }

  /**
   * Deletes a settlement from a split.
   *
   * @param {SettlementReq} request - Contains splitId and settlementId
   * @param {User} user - Authenticated user from gRPC metadata
   * @returns {Promise<Empty>} Empty response on success
   */
  @GrpcMethod(FINANCE_SERVICE_NAME, 'deleteSettlement')
  deleteSettlement(
    @Payload() request: SettlementReq,
    @RpcUser() user: User,
  ): Promise<Empty> {
    return this.splitService.deleteSettlement(user.id, request);
  }
}
