import { Queue } from 'bullmq';
import { status } from '@grpc/grpc-js';

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { RpcException } from '@nestjs/microservices';

import { PrismaService } from '@fintrack/database/service';
import {
  ACTIVITY_NOTIFICATION_JOB,
  ACTIVITY_NOTIFICATION_QUEUE,
} from '@fintrack/types/constants/queus.constants';
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
import {
  ActivityLogs,
  Prisma,
  Split,
  SplitParticipant,
  SplitSettlement,
  SplitStatus,
} from '@fintrack/database/types';
import { PaginateService } from '@fintrack/common/services/paginate.service';

import {
  TransactionService,
  TransactionWithOptionalJoins,
} from '../transaction/transaction.service';

type SplitSettlementWithTransaction = SplitSettlement & {
  transaction?: TransactionWithOptionalJoins | null;
};

type SplitParticipantWithSettlements = SplitParticipant & {
  settlements?: SplitSettlementWithTransaction[];
  paid?: number;
  balance?: number;
};

type SplitWithOptionalJoins = Split & {
  transaction?: TransactionWithOptionalJoins | null;
  participants?: SplitParticipantWithSettlements[];
  totalPaid?: number;
  totalOwed?: number;
};

/**
 * Service responsible for all split-expense operations.
 * Handles split creation, listing, updates, participant management,
 * and settlement lifecycle including split status transitions.
 *
 * @class SplitService
 */
@Injectable()
export class SplitService {
  private readonly Logger = new Logger(SplitService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginateService: PaginateService,
    private readonly transactionService: TransactionService,
    @InjectQueue(ACTIVITY_NOTIFICATION_QUEUE)
    private readonly activityQueue: Queue,
  ) {}

  /**
   * Creates a new split for a user.
   * Optionally validates and links an existing EXPENSE transaction.
   *
   * @async
   * @param {string} userId
   * @param {CreateSplitReq} data
   * @returns {Promise<ProtoSplit>}
   * @throws {RpcException} NOT_FOUND when linked transaction is missing
   * @throws {RpcException} ALREADY_EXISTS when linked transaction is already attached to a split
   * @throws {RpcException} FAILED_PRECONDITION when linked transaction amount is lower than split amount
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async createSplit(userId: string, data: CreateSplitReq): Promise<ProtoSplit> {
    try {
      if (data.transactionId) {
        const transaction = await this.prisma.transaction.findFirst({
          where: { id: data.transactionId, userId, type: 'EXPENSE' },
          select: {
            id: true,
            type: true,
            split: { select: { id: true } },
            amount: true,
          },
        });

        if (!transaction) {
          throw new RpcException({
            code: status.NOT_FOUND,
            message: 'Transaction not found',
          });
        }

        if (transaction.split) {
          throw new RpcException({
            code: status.ALREADY_EXISTS,
            message: 'This transaction is already linked to another split',
          });
        }

        if (transaction.amount < data.amount) {
          throw new RpcException({
            code: status.FAILED_PRECONDITION,
            message: 'Trnsaction amount is less than proviuded split amount',
          });
        }
      }

      const split = await this.prisma.split.create({
        data: {
          userId,
          name: data.name,
          amount: data.amount,
          ...(data.transactionId && { transactionId: data.transactionId }),
        },
      });

      this.callEvents(userId, split, 'Split Created');
      return this.formatSplit(split);
    } catch (error: unknown) {
      if (error instanceof RpcException) throw error;
      const err = error instanceof Error ? error : new Error(String(error));
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error ocuured',
        details: err.message,
      });
    }
  }

  /**
   * Returns aggregate split metrics for a user:
   * - owed and paid totals
   * - counts by status
   * - total settled amount
   *
   * @async
   * @param {string} userId
   * @returns {Promise<GetSplitAggregateRes>}
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async getSplitAggregate(userId: string): Promise<GetSplitAggregateRes> {
    try {
      const [statusGroups, owedPaid] = await Promise.all([
        // counts + amount sums per status in one round-trip, avoids 3 separate count/aggregate calls
        this.prisma.split.groupBy({
          by: ['status'],
          where: { userId },
          _count: { id: true },
          _sum: { amount: true },
        }),
        // OPEN splits have zero settlements by definition (first payment transitions them to PARTIALLY_SETTLED)
        // so we only need settlements on PARTIALLY_SETTLED to compute totalOwed
        this.prisma.splitSettlement.aggregate({
          where: { split: { userId, status: SplitStatus.PARTIALLY_SETTLED } },
          _sum: { paidAmount: true },
        }),
      ]);

      const openGroup = statusGroups.find((g) => g.status === SplitStatus.OPEN);
      const partialGroup = statusGroups.find(
        (g) => g.status === SplitStatus.PARTIALLY_SETTLED,
      );
      const settledGroup = statusGroups.find(
        (g) => g.status === SplitStatus.SETTLED,
      );

      const owedAmount =
        (openGroup?._sum.amount ?? 0) + (partialGroup?._sum.amount ?? 0);
      const owedPaidAmount = owedPaid._sum.paidAmount ?? 0;

      return {
        totalOwed: Math.max(0, owedAmount - owedPaidAmount),
        totalPaid: owedPaidAmount,
        openCount: openGroup?._count.id ?? 0,
        partialCount: partialGroup?._count.id ?? 0,
        settledCount: settledGroup?._count.id ?? 0,
        settledAmount: settledGroup?._sum?.amount ?? 0,
      };
    } catch (error: unknown) {
      if (error instanceof RpcException) throw error;
      const err = error instanceof Error ? error : new Error(String(error));
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
        details: err.message,
      });
    }
  }

  /**
   * Returns paginated splits for a user, optionally filtered by status.
   * Includes computed participant balances and split totals.
   *
   * @async
   * @param {string} userId
   * @param {GetSplitsReq} data
   * @returns {Promise<GetSplitsRes>}
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async getSplits(userId: string, data: GetSplitsReq): Promise<GetSplitsRes> {
    try {
      const { page, limit, status } = data;
      const query: Prisma.SplitWhereInput = {
        userId,
      };

      if (status?.length) {
        query.status = { in: status as SplitStatus[] };
      }

      const [splits, count] = await Promise.all([
        this.prisma.split.findMany({
          where: query,
          include: {
            participants: true,
          },
          orderBy: { createdAt: 'desc' },
          skip: (data.page - 1) * data.limit,
          take: data.limit,
        }),
        this.prisma.split.count({
          where: query,
        }),
      ]);

      const meta = this.paginateService.paginate({
        page,
        limit,
        total: count,
        pageSize: splits.length,
      });

      if (splits.length === 0) {
        // early return for improved performance
        return {
          splits: [],
          meta,
        };
      }

      // streamline data
      const splitIds = splits.map((s) => s.id);
      const participants = splits.flatMap((s) => s.participants);

      // fetch aggregates groups
      const [splitTotal, participantTotal] = await Promise.all([
        this.prisma.splitSettlement.groupBy({
          by: ['splitId'],
          where: { split: { id: { in: splitIds }, userId } },
          _sum: {
            paidAmount: true,
          },
        }),
        this.prisma.splitSettlement.groupBy({
          by: ['participantId'],
          where: { split: { id: { in: splitIds }, userId } },
          _sum: {
            paidAmount: true,
          },
        }),
      ]);

      // sum maps
      const splitTotalMap = new Map(
        splitTotal.map((s) => [s.splitId, s._sum.paidAmount ?? 0]),
      );
      const participantTotalMap = new Map(
        participantTotal.map((s) => [s.participantId, s._sum.paidAmount ?? 0]),
      );
      const participantswithTotals: SplitParticipantWithSettlements[] = [];
      for (const participant of participants) {
        const paid = participantTotalMap.get(participant.id) ?? 0;
        participantswithTotals.push({
          ...participant,
          paid,
          balance: Math.max(0, participant.amount - paid),
        });
      }

      const participantswithTotalsMap = new Map<
        string,
        SplitParticipantWithSettlements[]
      >();
      for (const participantWithTotal of participantswithTotals) {
        const list =
          participantswithTotalsMap.get(participantWithTotal.splitId) ?? [];
        participantswithTotalsMap.set(participantWithTotal.splitId, [
          ...list,
          participantWithTotal,
        ]);
      }

      return {
        splits: splits.map((split) =>
          this.formatSplit({
            ...split,
            participants: participantswithTotalsMap.get(split.id) ?? [],
            totalPaid: splitTotalMap.get(split.id) ?? 0,
            totalOwed: split.amount - (splitTotalMap.get(split.id) ?? 0),
          }),
        ),
        meta,
      };
    } catch (error) {
      if (error instanceof RpcException) throw error;
      const err = error instanceof Error ? error : new Error(String(error));
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
        details: err.message,
      });
    }
  }

  /**
   * Returns a single split by ID with participants, settlements,
   * optional linked transaction, and computed totals.
   *
   * @async
   * @param {string} userId
   * @param {SplitReq} data
   * @returns {Promise<ProtoSplit>}
   * @throws {RpcException} NOT_FOUND when split does not exist for the user
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async getSplit(userId: string, data: SplitReq): Promise<ProtoSplit> {
    try {
      const split = await this.prisma.split.findFirst({
        where: {
          id: data.id,
          userId,
        },
        include: {
          participants: {
            include: {
              settlements: {
                include: {
                  transaction: {
                    include: {
                      category: true,
                    },
                  },
                },
              },
            },
          },
          transaction: {
            include: {
              category: true,
            },
          },
        },
      });

      if (!split) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Split not found',
        });
      }

      // fetch aggregates groups
      const [splitTotal, participantTotal] = await Promise.all([
        this.prisma.splitSettlement.aggregate({
          where: { split: { id: split.id, userId } },
          _sum: {
            paidAmount: true,
          },
        }),
        this.prisma.splitSettlement.groupBy({
          by: ['participantId'],
          where: { split: { id: split.id, userId } },
          _sum: {
            paidAmount: true,
          },
        }),
      ]);

      const participantTotalMap = new Map(
        participantTotal.map((s) => [s.participantId, s._sum.paidAmount ?? 0]),
      );
      const participantswithTotals: SplitParticipantWithSettlements[] = [];
      for (const participant of split.participants) {
        const paid = participantTotalMap.get(participant.id) ?? 0;
        participantswithTotals.push({
          ...participant,
          paid,
          balance: Math.max(0, participant.amount - paid),
        });
      }

      return this.formatSplit({
        ...split,
        participants: participantswithTotals,
        totalPaid: splitTotal._sum.paidAmount ?? 0,
        totalOwed: split.amount - (splitTotal._sum.paidAmount ?? 0),
      });
    } catch (error) {
      if (error instanceof RpcException) throw error;
      const err = error instanceof Error ? error : new Error(String(error));
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
        details: err.message,
      });
    }
  }

  /**
   * Updates split metadata (name and/or amount).
   * Amount updates are guarded by both:
   * - total settled amount
   * - total participant allocation
   * so split amount can never move below existing obligations.
   *
   * @async
   * @param {string} userId
   * @param {UpdateSplitReq} data
   * @returns {Promise<ProtoSplit>}
   * @throws {RpcException} NOT_FOUND when split does not exist for the user
   * @throws {RpcException} INVALID_ARGUMENT when provided amount is invalid
   * @throws {RpcException} FAILED_PRECONDITION when updated amount violates settled/allocation constraints
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async updateSplit(userId: string, data: UpdateSplitReq): Promise<ProtoSplit> {
    try {
      const split = await this.prisma.split.findFirst({
        where: { id: data.id, userId },
        select: {
          id: true,
          status: true,
        },
      });

      if (!split) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Split not found',
        });
      }

      const updateData: Prisma.SplitUpdateInput = {
        ...(data.name && { name: data.name }),
      };

      if (data.amount !== undefined) {
        const [settledAgg, allocatedAgg] = await Promise.all([
          this.prisma.splitSettlement.aggregate({
            where: { splitId: split.id },
            _sum: { paidAmount: true },
          }),
          this.prisma.splitParticipant.aggregate({
            where: { splitId: split.id },
            _sum: { amount: true },
          }),
        ]);

        const epsilon = 0.000001;
        const totalSettled = settledAgg._sum.paidAmount ?? 0;
        const totalAllocated = allocatedAgg._sum.amount ?? 0;

        // Cannot reduce split amount below already settled payments.
        if (totalSettled > data.amount + epsilon) {
          throw new RpcException({
            code: status.FAILED_PRECONDITION,
            message: 'Settled amount exceeds the updated split amount',
          });
        }

        // Cannot reduce split amount below already allocated participant shares.
        if (totalAllocated > data.amount + epsilon) {
          throw new RpcException({
            code: status.FAILED_PRECONDITION,
            message:
              'Allocated participant amount exceeds the updated split amount',
          });
        }

        let nextStatus: SplitStatus = SplitStatus.OPEN;
        if (totalSettled > epsilon) {
          nextStatus =
            Math.abs(totalSettled - data.amount) <= epsilon
              ? SplitStatus.SETTLED
              : SplitStatus.PARTIALLY_SETTLED;
        }

        updateData.amount = data.amount;
        updateData.status = nextStatus;
      }

      const updatedSplit = await this.prisma.split.update({
        where: { id: split.id },
        data: updateData,
      });

      this.callEvents(userId, updatedSplit, 'Split Updated');
      return this.formatSplit(updatedSplit);
    } catch (error) {
      if (error instanceof RpcException) throw error;
      const err = error instanceof Error ? error : new Error(String(error));
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
        details: err.message,
      });
    }
  }

  /**
   * Deletes a split by ID.
   *
   * @async
   * @param {string} userId
   * @param {SplitReq} data
   * @returns {Promise<Empty>}
   * @throws {RpcException} NOT_FOUND when split does not exist for the user
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async deleteSplit(userId: string, data: SplitReq): Promise<Empty> {
    try {
      const split = await this.prisma.split.findFirst({
        where: { id: data.id, userId },
        select: { id: true },
      });

      if (!split) {
        throw new RpcException({
          code: status.NOT_FOUND,
          message: 'Split not found',
        });
      }

      const deletedsplit = await this.prisma.split.delete({
        where: { id: split.id },
      });

      this.callEvents(userId, deletedsplit, 'Split Deleted');

      return {};
    } catch (error) {
      if (error instanceof RpcException) throw error;
      const err = error instanceof Error ? error : new Error(String(error));
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
        details: err.message,
      });
    }
  }

  /**
   * Adds a participant to a split.
   * Guards against:
   * - settled split mutations
   * - duplicate participant email in same split
   * - participant allocation overflow beyond split amount
   *
   * @async
   * @param {string} userId
   * @param {AddParticipantReq} data
   * @returns {Promise<ProtoParticipant>}
   * @throws {RpcException} NOT_FOUND when split does not exist for the user
   * @throws {RpcException} INVALID_ARGUMENT for missing/invalid inputs
   * @throws {RpcException} ALREADY_EXISTS when participant email already exists in split
   * @throws {RpcException} FAILED_PRECONDITION when split is settled or allocation would overflow
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async addParticipant(
    userId: string,
    data: AddParticipantReq,
  ): Promise<ProtoParticipant> {
    try {
      const { name, email, amount } = data;

      const epsilon = 0.000001;

      const participant = await this.prisma.$transaction(
        async (tx) => {
          const split = await tx.split.findFirst({
            where: { id: data.splitId, userId },
            select: {
              id: true,
              amount: true,
              status: true,
            },
          });

          if (!split) {
            throw new RpcException({
              code: status.NOT_FOUND,
              message: 'Split not found',
            });
          }

          if (split.status === SplitStatus.SETTLED) {
            throw new RpcException({
              code: status.FAILED_PRECONDITION,
              message: 'Cannot add participant to a settled split',
            });
          }

          const existingParticipant = await tx.splitParticipant.findFirst({
            where: {
              splitId: split.id,
              email: { equals: email, mode: 'insensitive' },
            },
            select: { id: true },
          });

          if (existingParticipant) {
            throw new RpcException({
              code: status.ALREADY_EXISTS,
              message:
                'Participant with this email already exists in this split',
            });
          }

          const allocation = await tx.splitParticipant.aggregate({
            where: { splitId: split.id },
            _sum: { amount: true },
          });

          const currentAllocated = allocation._sum.amount ?? 0;

          // Edge case: split already fully allocated due to earlier participants.
          if (currentAllocated >= split.amount - epsilon) {
            throw new RpcException({
              code: status.FAILED_PRECONDITION,
              message:
                'Cannot add participant: split allocation already matches total split amount',
            });
          }

          const nextAllocated = currentAllocated + amount;

          // Edge case: floating-point arithmetic can introduce tiny precision noise.
          if (nextAllocated > split.amount + epsilon) {
            throw new RpcException({
              code: status.FAILED_PRECONDITION,
              message:
                'Cannot add participant: allocated participant amount exceeds split amount',
            });
          }

          return tx.splitParticipant.create({
            data: {
              splitId: split.id,
              name,
              email,
              amount,
            },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 10_000,
          timeout: 30_000,
        },
      );

      this.callParticipantEvents(
        userId,
        participant,
        data.splitId,
        'Split Participant Added',
      );
      return this.formatParticipant(participant);
    } catch (error: unknown) {
      if (error instanceof RpcException) throw error;
      const err = error instanceof Error ? error : new Error(String(error));
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
        details: err.message,
      });
    }
  }

  /**
   * Updates participant fields (name, email, amount) for a split.
   * Enforces split ownership, settled-split immutability, email uniqueness,
   * and participant allocation cap.
   *
   * @async
   * @param {string} userId
   * @param {UpdateParticipantReq} data
   * @returns {Promise<ProtoParticipant>}
   * @throws {RpcException} NOT_FOUND when participant does not exist for the split/user
   * @throws {RpcException} INVALID_ARGUMENT for missing/invalid update payload
   * @throws {RpcException} ALREADY_EXISTS when email conflicts with another participant in split
   * @throws {RpcException} FAILED_PRECONDITION when split is settled or amount overflow occurs
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async updateParticipant(
    userId: string,
    data: UpdateParticipantReq,
  ): Promise<ProtoParticipant> {
    try {
      const epsilon = 0.000001;

      const participant = await this.prisma.$transaction(
        async (tx) => {
          const foundParticipant = await tx.splitParticipant.findFirst({
            where: {
              id: data.participantId,
              splitId: data.splitId,
              split: { userId },
            },
            include: {
              split: {
                select: {
                  id: true,
                  amount: true,
                  status: true,
                },
              },
            },
          });

          if (!foundParticipant) {
            throw new RpcException({
              code: status.NOT_FOUND,
              message: 'Participant not found',
            });
          }

          if (foundParticipant.split.status === SplitStatus.SETTLED) {
            throw new RpcException({
              code: status.FAILED_PRECONDITION,
              message: 'Cannot update participant on a settled split',
            });
          }

          const updateData: Prisma.SplitParticipantUpdateInput = {};

          if (data.name) {
            updateData.name = data.name;
          }

          if (data.email) {
            const existingParticipant = await tx.splitParticipant.findFirst({
              where: {
                splitId: foundParticipant.splitId,
                id: { not: foundParticipant.id },
                email: { equals: data.email, mode: 'insensitive' },
              },
              select: { id: true },
            });

            if (existingParticipant) {
              throw new RpcException({
                code: status.ALREADY_EXISTS,
                message:
                  'Participant with this email already exists in this split',
              });
            }

            updateData.email = data.email;
          }

          if (
            data.amount &&
            Math.abs(data.amount - foundParticipant.amount) > epsilon
          ) {
            const allocatedAgg = await tx.splitParticipant.aggregate({
              where: {
                splitId: foundParticipant.splitId,
                id: { not: foundParticipant.id },
              },
              _sum: { amount: true },
            });

            const allocatedWithoutCurrent = allocatedAgg._sum.amount ?? 0;
            const nextAllocated = allocatedWithoutCurrent + data.amount;

            if (nextAllocated > foundParticipant.split.amount + epsilon) {
              throw new RpcException({
                code: status.FAILED_PRECONDITION,
                message:
                  'Allocated participant amount exceeds the split amount',
              });
            }

            updateData.amount = data.amount;
          }

          if (Object.keys(updateData).length === 0) {
            return foundParticipant;
          }

          return tx.splitParticipant.update({
            where: { id: foundParticipant.id },
            data: updateData,
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 10_000,
          timeout: 30_000,
        },
      );

      this.callParticipantEvents(
        userId,
        participant,
        data.splitId,
        'Split Participant Updated',
      );
      return this.formatParticipant(participant);
    } catch (error) {
      if (error instanceof RpcException) throw error;
      const err = error instanceof Error ? error : new Error(String(error));
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
        details: err.message,
      });
    }
  }

  /**
   * Deletes a participant from a split.
   * Recomputes split status after participant removal and cascading settlement deletion.
   *
   * @async
   * @param {string} userId
   * @param {ParticipantReq} data
   * @returns {Promise<Empty>}
   * @throws {RpcException} NOT_FOUND when participant does not exist for split/user
   * @throws {RpcException} FAILED_PRECONDITION when split is already settled
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async deleteParticipant(
    userId: string,
    data: ParticipantReq,
  ): Promise<Empty> {
    try {
      const participant = await this.prisma.$transaction(
        async (tx) => {
          const foundParticipant = await tx.splitParticipant.findFirst({
            where: {
              id: data.participantId,
              splitId: data.splitId,
              split: { userId },
            },
            include: {
              split: {
                select: {
                  id: true,
                  amount: true,
                  status: true,
                },
              },
            },
          });

          if (!foundParticipant) {
            throw new RpcException({
              code: status.NOT_FOUND,
              message: 'Participant not found',
            });
          }

          if (foundParticipant.split.status === SplitStatus.SETTLED) {
            throw new RpcException({
              code: status.FAILED_PRECONDITION,
              message: 'Cannot delete participant from a settled split',
            });
          }

          const epsilon = 0.000001;

          await tx.splitParticipant.delete({
            where: { id: foundParticipant.id },
          });

          // Recompute status after cascading settlement deletions for this participant.
          const settledAgg = await tx.splitSettlement.aggregate({
            where: { splitId: foundParticipant.split.id },
            _sum: { paidAmount: true },
          });

          const totalSettled = settledAgg._sum.paidAmount ?? 0;
          const nextStatus =
            totalSettled <= epsilon
              ? SplitStatus.OPEN
              : Math.abs(totalSettled - foundParticipant.split.amount) <=
                  epsilon
                ? SplitStatus.SETTLED
                : SplitStatus.PARTIALLY_SETTLED;

          await tx.split.update({
            where: { id: foundParticipant.split.id },
            data: { status: nextStatus },
          });

          return foundParticipant;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 10_000,
          timeout: 30_000,
        },
      );

      this.callParticipantEvents(
        userId,
        participant,
        participant.split.id,
        'Split Participant Deleted',
      );
      return {};
    } catch (error) {
      if (error instanceof RpcException) throw error;
      const err = error instanceof Error ? error : new Error(String(error));
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
        details: err.message,
      });
    }
  }

  /**
   * Records a participant settlement payment for a split.
   * Validates participant/split ownership, settlement bounds, optional transaction linkage,
   * then recalculates split status.
   *
   * @async
   * @param {string} userId
   * @param {PaySettlementReq} data
   * @returns {Promise<ProtoSettlement>}
   * @throws {RpcException} NOT_FOUND when participant or optional transaction does not exist
   * @throws {RpcException} INVALID_ARGUMENT when amount/date input is invalid
   * @throws {RpcException} ALREADY_EXISTS when linked transaction is already attached to another settlement
   * @throws {RpcException} FAILED_PRECONDITION when split is settled or payment exceeds participant/split bounds
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async paySettlement(
    userId: string,
    data: PaySettlementReq,
  ): Promise<ProtoSettlement> {
    try {
      const epsilon = 0.000001;

      const settlement = await this.prisma.$transaction(
        async (tx) => {
          const participant = await tx.splitParticipant.findFirst({
            where: {
              id: data.participantId,
              splitId: data.splitId,
              split: { userId },
            },
            include: {
              split: {
                select: {
                  id: true,
                  amount: true,
                  status: true,
                },
              },
            },
          });

          if (!participant) {
            throw new RpcException({
              code: status.NOT_FOUND,
              message: 'Participant not found',
            });
          }

          if (participant.split.status === SplitStatus.SETTLED) {
            throw new RpcException({
              code: status.FAILED_PRECONDITION,
              message: 'Cannot pay settlement for a settled split',
            });
          }

          if (data.transactionId) {
            const transaction = await tx.transaction.findFirst({
              where: {
                id: data.transactionId,
                userId,
                type: 'INCOME',
              },
              select: {
                id: true,
                amount: true,
                settlements: { select: { id: true } },
              },
            });

            if (!transaction) {
              throw new RpcException({
                code: status.NOT_FOUND,
                message: 'Transaction not found',
              });
            }

            if (transaction.settlements.length > 0) {
              throw new RpcException({
                code: status.ALREADY_EXISTS,
                message: 'This transaction is already linked to a settlement',
              });
            }

            if (transaction.amount + epsilon < data.paidAmount) {
              throw new RpcException({
                code: status.FAILED_PRECONDITION,
                message: 'Transaction amount is less than settlement amount',
              });
            }
          }

          const [participantPaidAgg, splitPaidAgg] = await Promise.all([
            tx.splitSettlement.aggregate({
              where: {
                splitId: participant.splitId,
                participantId: participant.id,
              },
              _sum: { paidAmount: true },
            }),
            tx.splitSettlement.aggregate({
              where: { splitId: participant.splitId },
              _sum: { paidAmount: true },
            }),
          ]);

          const participantPaid = participantPaidAgg._sum.paidAmount ?? 0;
          const splitPaid = splitPaidAgg._sum.paidAmount ?? 0;

          if (
            participantPaid + data.paidAmount >
            participant.amount + epsilon
          ) {
            throw new RpcException({
              code: status.FAILED_PRECONDITION,
              message: 'Settlement exceeds participant outstanding balance',
            });
          }

          if (
            splitPaid + data.paidAmount >
            participant.split.amount + epsilon
          ) {
            throw new RpcException({
              code: status.FAILED_PRECONDITION,
              message: 'Settlement exceeds split outstanding balance',
            });
          }

          const createdSettlement = await tx.splitSettlement.create({
            data: {
              splitId: participant.splitId,
              participantId: participant.id,
              paidAmount: data.paidAmount,
              paidAt: new Date(data.paidAt),
              ...(data.transactionId && { transactionId: data.transactionId }),
            },
            include: {
              transaction: {
                include: {
                  category: true,
                },
              },
            },
          });

          const nextSplitPaid = splitPaid + data.paidAmount;
          const nextStatus =
            Math.abs(nextSplitPaid - participant.split.amount) <= epsilon
              ? SplitStatus.SETTLED
              : SplitStatus.PARTIALLY_SETTLED;

          if (nextStatus !== participant.split.status) {
            await tx.split.update({
              where: { id: participant.split.id },
              data: { status: nextStatus },
            });
          }

          return createdSettlement;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 10_000,
          timeout: 30_000,
        },
      );

      this.callSettlementEvents(
        userId,
        settlement,
        data.splitId,
        'Split Settlement Added',
      );
      return this.formatSettlement(settlement);
    } catch (error) {
      if (error instanceof RpcException) throw error;
      const err = error instanceof Error ? error : new Error(String(error));
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
        details: err.message,
      });
    }
  }

  /**
   * Deletes a settlement from a split and recalculates split status.
   *
   * @async
   * @param {string} userId
   * @param {SettlementReq} data
   * @returns {Promise<Empty>}
   * @throws {RpcException} NOT_FOUND when settlement does not exist for split/user
   * @throws {RpcException} INTERNAL on unexpected errors
   */
  async deleteSettlement(userId: string, data: SettlementReq): Promise<Empty> {
    try {
      const deletedSettlement = await this.prisma.$transaction(
        async (tx) => {
          const settlement = await tx.splitSettlement.findFirst({
            where: {
              id: data.settlementId,
              splitId: data.splitId,
              split: { userId },
            },
            include: {
              split: {
                select: {
                  id: true,
                  amount: true,
                  status: true,
                },
              },
            },
          });

          if (!settlement) {
            throw new RpcException({
              code: status.NOT_FOUND,
              message: 'Settlement not found',
            });
          }

          await tx.splitSettlement.delete({
            where: { id: settlement.id },
          });

          const epsilon = 0.000001;
          const splitPaidAgg = await tx.splitSettlement.aggregate({
            where: { splitId: settlement.split.id },
            _sum: { paidAmount: true },
          });

          const splitPaid = splitPaidAgg._sum.paidAmount ?? 0;
          const nextStatus =
            splitPaid <= epsilon
              ? SplitStatus.OPEN
              : Math.abs(splitPaid - settlement.split.amount) <= epsilon
                ? SplitStatus.SETTLED
                : SplitStatus.PARTIALLY_SETTLED;

          if (nextStatus !== settlement.split.status) {
            await tx.split.update({
              where: { id: settlement.split.id },
              data: { status: nextStatus },
            });
          }

          return settlement;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 10_000,
          timeout: 30_000,
        },
      );

      this.callSettlementEvents(
        userId,
        deletedSettlement,
        data.splitId,
        'Split Settlement Deleted',
      );
      return {};
    } catch (error) {
      if (error instanceof RpcException) throw error;
      const err = error instanceof Error ? error : new Error(String(error));
      throw new RpcException({
        code: status.INTERNAL,
        message: 'An error occurred',
        details: err.message,
      });
    }
  }

  // ----------------------------------------------------------------
  // Private — event callers
  // ----------------------------------------------------------------

  private callEvents(
    userId: string,
    split: SplitWithOptionalJoins,
    event: string,
  ): void {
    const activityData: ActivityLogs = {
      userId,
      id: split.id,
      createdAt: split.createdAt,
      event: event.split(' ').join('_').toLowerCase(),
      entityId: split.id,
      entityType: 'split',
      data: {
        type: 'split',
        splitId: split.id,
        splitName: split.name,
        splitAmount: split.amount.toString(),
        splitStatus: split.status,
      },
    };

    this.activityQueue.add(ACTIVITY_NOTIFICATION_JOB, activityData);
  }

  private callParticipantEvents(
    userId: string,
    participant: SplitParticipant,
    splitId: string,
    event: string,
  ): void {
    const activityData: ActivityLogs = {
      userId,
      id: participant.id,
      createdAt: participant.createdAt,
      event: event.split(' ').join('_').toLowerCase(),
      entityId: participant.id,
      entityType: 'split_participant',
      data: {
        type: 'split_participant',
        participantId: participant.id,
        splitId,
        participantName: participant.name,
        participantAmount: participant.amount.toString(),
      },
    };

    this.activityQueue.add(ACTIVITY_NOTIFICATION_JOB, activityData);
  }

  private callSettlementEvents(
    userId: string,
    settlement: SplitSettlement,
    splitId: string,
    event: string,
  ): void {
    const activityData: ActivityLogs = {
      userId,
      id: settlement.id,
      createdAt: settlement.createdAt,
      event: event.split(' ').join('_').toLowerCase(),
      entityId: settlement.id,
      entityType: 'split_settlement',
      data: {
        type: 'split_settlement',
        settlementId: settlement.id,
        splitId,
        participantId: settlement.participantId,
        paidAmount: settlement.paidAmount.toString(),
        paidAt: settlement.paidAt.toISOString(),
      },
    };

    this.activityQueue.add(ACTIVITY_NOTIFICATION_JOB, activityData);
  }

  // ----------------------------------------------------------------
  // Private — formatters
  // ----------------------------------------------------------------

  private formatSettlement(
    settlement: SplitSettlementWithTransaction,
  ): ProtoSettlement {
    return {
      id: settlement.id,
      paidAt: settlement.paidAt.toISOString(),
      paidAmount: settlement.paidAmount,
      createdAt: settlement.createdAt.toISOString(),
      transaction: settlement.transaction
        ? this.transactionService.formatTransaction(settlement.transaction)
        : undefined,
    };
  }

  private formatParticipant(
    participant: SplitParticipantWithSettlements,
  ): ProtoParticipant {
    return {
      id: participant.id,
      name: participant.name,
      email: participant.email,
      amount: participant.amount,
      createdAt: participant.createdAt.toISOString(),
      updatedAt: participant.updatedAt.toISOString(),
      settlements: (participant.settlements ?? []).map((s) =>
        this.formatSettlement(s),
      ),
      paid: participant.paid ?? undefined,
      balance: participant.balance ?? undefined,
    };
  }

  private formatSplit(split: SplitWithOptionalJoins): ProtoSplit {
    return {
      id: split.id,
      name: split.name,
      amount: split.amount,
      status: split.status,
      createdAt: split.createdAt.toISOString(),
      updatedAt: split.updatedAt.toISOString(),
      transaction: split.transaction
        ? this.transactionService.formatTransaction(split.transaction)
        : undefined,
      participants: (split.participants ?? []).map((p) =>
        this.formatParticipant(p),
      ),
      totalPaid: split.totalPaid ?? undefined,
      totalOwed: split.totalOwed ?? undefined,
    };
  }
}
