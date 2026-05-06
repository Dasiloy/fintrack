import { Metadata } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { UsageService } from '../usage/usage.service';

import {
  FINANCE_PACKAGE_NAME,
  FINANCE_SERVICE_NAME,
  FinanceServiceClient,
} from '@fintrack/types/protos/finance/finance';
import {
  GetSplitAggregateRes,
  GetSplitsRes,
  Split as ProtoSplit,
  SplitParticipant as ProtoParticipant,
  SplitSettlement as ProtoSettlement,
} from '@fintrack/types/protos/finance/split';
import { Empty } from '@fintrack/types/protos/finance/transaction';
import { User } from '@fintrack/database/types';

import {
  AddParticipantDto,
  CreateSplitDto,
  GetSplitsQueryDto,
  PaySettlementDto,
  UpdateParticipantDto,
  UpdateSplitDto,
} from './dto/split.dto';

/**
 * API Gateway service for split expenses.
 * Proxies HTTP requests to the Finance microservice via gRPC.
 *
 * @class SplitService
 */
@Injectable()
export class SplitService implements OnModuleInit {
  private financeService: FinanceServiceClient;

  constructor(
    @Inject(FINANCE_PACKAGE_NAME) private readonly client: ClientGrpc,
    private readonly usageService: UsageService,
  ) {}

  /**
   * @description Initialise the gRPC Finance stub on module startup.
   *
   * @public
   */
  onModuleInit() {
    this.financeService =
      this.client.getService<FinanceServiceClient>(FINANCE_SERVICE_NAME);
  }

  /**
   * @description Creates a new split expense via the Finance microservice and invalidates the gated usage cache.
   *
   * @async
   * @public
   * @param {User} user Authenticated user
   * @param {CreateSplitDto} data Split creation payload
   * @returns {Promise<ProtoSplit>} The newly created split
   */
  async createSplit(user: User, data: CreateSplitDto): Promise<ProtoSplit> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    const result = await lastValueFrom(
      this.financeService.createSplit(data, metadata),
    );
    void this.usageService.invalidateGatedUsageCache(user.id);
    return result;
  }

  /**
   * @description Returns aggregate totals (owed, paid, pending) across all splits for the authenticated user.
   *
   * @async
   * @public
   * @param {User} user Authenticated user
   * @returns {Promise<GetSplitAggregateRes>} Aggregated split totals
   */
  async getSplitAggregate(user: User): Promise<GetSplitAggregateRes> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(this.financeService.getSplitAggregate({}, metadata));
  }

  /**
   * @description Returns a filtered list of splits for the authenticated user.
   *
   * @async
   * @public
   * @param {User} user Authenticated user
   * @param {GetSplitsQueryDto} query Optional status filter
   * @returns {Promise<GetSplitsRes>} List of matching splits
   */
  async getSplits(user: User, query: GetSplitsQueryDto): Promise<GetSplitsRes> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(
      this.financeService.getSplits(
        { ...query, status: query.status ?? [] },
        metadata,
      ),
    );
  }

  /**
   * @description Returns a single split by ID with participant and settlement details.
   *
   * @async
   * @public
   * @param {User} user Authenticated user
   * @param {string} id Split ID
   * @returns {Promise<ProtoSplit>} The matching split
   */
  async getSplit(user: User, id: string): Promise<ProtoSplit> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(this.financeService.getSplit({ id }, metadata));
  }

  /**
   * @description Updates an existing split's metadata via the Finance microservice.
   *
   * @async
   * @public
   * @param {User} user Authenticated user
   * @param {string} id Split ID to update
   * @param {UpdateSplitDto} data Fields to update
   * @returns {Promise<ProtoSplit>} The updated split
   */
  async updateSplit(
    user: User,
    id: string,
    data: UpdateSplitDto,
  ): Promise<ProtoSplit> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(
      this.financeService.updateSplit({ id, ...data }, metadata),
    );
  }

  /**
   * @description Deletes a split via the Finance microservice and invalidates the gated usage cache.
   *
   * @async
   * @public
   * @param {User} user Authenticated user
   * @param {string} id Split ID to delete
   * @returns {Promise<Empty>} Empty response on success
   */
  async deleteSplit(user: User, id: string): Promise<Empty> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    const result = await lastValueFrom(
      this.financeService.deleteSplit({ id }, metadata),
    );
    void this.usageService.invalidateGatedUsageCache(user.id);
    return result;
  }

  /**
   * @description Adds a participant to an existing split and invalidates the gated usage cache.
   *
   * @async
   * @public
   * @param {User} user Authenticated user
   * @param {string} splitId Split ID to add the participant to
   * @param {AddParticipantDto} data Participant creation payload
   * @returns {Promise<ProtoParticipant>} The newly created participant
   */
  async addParticipant(
    user: User,
    splitId: string,
    data: AddParticipantDto,
  ): Promise<ProtoParticipant> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    const result = lastValueFrom(
      this.financeService.addParticipant({ splitId, ...data }, metadata),
    );
    void this.usageService.invalidateGatedUsageCache(user.id);
    return result;
  }

  /**
   * @description Updates a participant's share or status within a split.
   *
   * @async
   * @public
   * @param {User} user Authenticated user
   * @param {string} splitId Split ID containing the participant
   * @param {string} participantId Participant ID to update
   * @param {UpdateParticipantDto} data Fields to update
   * @returns {Promise<ProtoParticipant>} The updated participant
   */
  async updateParticipant(
    user: User,
    splitId: string,
    participantId: string,
    data: UpdateParticipantDto,
  ): Promise<ProtoParticipant> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(
      this.financeService.updateParticipant(
        { splitId, participantId, ...data },
        metadata,
      ),
    );
  }

  /**
   * @description Removes a participant from a split and invalidates the gated usage cache.
   *
   * @async
   * @public
   * @param {User} user Authenticated user
   * @param {string} splitId Split ID containing the participant
   * @param {string} participantId Participant ID to remove
   * @returns {Promise<Empty>} Empty response on success
   */
  async deleteParticipant(
    user: User,
    splitId: string,
    participantId: string,
  ): Promise<Empty> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    const result = lastValueFrom(
      this.financeService.deleteParticipant(
        { splitId, participantId },
        metadata,
      ),
    );
    void this.usageService.invalidateGatedUsageCache(user.id);
    return result;
  }

  /**
   * @description Records a settlement payment for a participant in a split.
   *
   * @async
   * @public
   * @param {User} user Authenticated user
   * @param {string} splitId Split ID the settlement belongs to
   * @param {string} participantId Participant ID making the payment
   * @param {PaySettlementDto} data Settlement amount, date, and optional linked transaction
   * @returns {Promise<ProtoSettlement>} The created settlement record
   */
  async paySettlement(
    user: User,
    splitId: string,
    participantId: string,
    data: PaySettlementDto,
  ): Promise<ProtoSettlement> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(
      this.financeService.paySettlement(
        {
          splitId,
          participantId,
          paidAmount: data.paidAmount,
          paidAt: data.paidAt,
          transactionId: data.transactionId,
        },
        metadata,
      ),
    );
  }

  /**
   * @description Deletes a settlement record from a split.
   *
   * @async
   * @public
   * @param {User} user Authenticated user
   * @param {string} splitId Split ID containing the settlement
   * @param {string} settlementId Settlement ID to delete
   * @returns {Promise<Empty>} Empty response on success
   */
  async deleteSettlement(
    user: User,
    splitId: string,
    settlementId: string,
  ): Promise<Empty> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(
      this.financeService.deleteSettlement({ splitId, settlementId }, metadata),
    );
  }
}
