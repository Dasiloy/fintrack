import { Metadata } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

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
  ) {}

  onModuleInit() {
    this.financeService =
      this.client.getService<FinanceServiceClient>(FINANCE_SERVICE_NAME);
  }

  async createSplit(user: User, data: CreateSplitDto): Promise<ProtoSplit> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(this.financeService.createSplit(data, metadata));
  }

  async getSplitAggregate(user: User): Promise<GetSplitAggregateRes> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(this.financeService.getSplitAggregate({}, metadata));
  }

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

  async getSplit(user: User, id: string): Promise<ProtoSplit> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(this.financeService.getSplit({ id }, metadata));
  }

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

  async deleteSplit(user: User, id: string): Promise<Empty> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(this.financeService.deleteSplit({ id }, metadata));
  }

  async addParticipant(
    user: User,
    splitId: string,
    data: AddParticipantDto,
  ): Promise<ProtoParticipant> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(
      this.financeService.addParticipant({ splitId, ...data }, metadata),
    );
  }

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

  async deleteParticipant(
    user: User,
    splitId: string,
    participantId: string,
  ): Promise<Empty> {
    const metadata = new Metadata();
    metadata.add('x-user-id', user.id);
    return lastValueFrom(
      this.financeService.deleteParticipant(
        { splitId, participantId },
        metadata,
      ),
    );
  }

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
