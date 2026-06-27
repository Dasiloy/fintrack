import { Metadata } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';

import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

import dayjs from '@fintrack/utils/date';
import { genTransactionSourceId } from '@fintrack/utils/format';
import type {
  AdvisorAction,
  AdvisorActionExecutionContext,
  AdvisorActionExecutionResult,
} from '@fintrack/types/interfaces/ai';
import {
  FINANCE_PACKAGE_NAME,
  FINANCE_SERVICE_NAME,
  FinanceServiceClient,
} from '@fintrack/types/protos/finance/finance';
import type {
  TransactionSource,
  TransactionType,
} from '@fintrack/types/protos/finance/transaction';

const MANUAL_TRANSACTION_SOURCE = 0 as TransactionSource;
const TRANSACTION_TYPES = {
  INCOME: 0,
  EXPENSE: 1,
} as const satisfies Record<'INCOME' | 'EXPENSE', TransactionType>;

/**
 * Executes human-approved advisor actions against the Finance service.
 *
 * The advisor graph only calls this service after a user approves an
 * `AdvisorAction`. Each handler maps the structured action payload to the
 * matching finance gRPC write, attaches the authenticated user metadata, and
 * converts failures into user-safe execution results so the graph can continue
 * with a ToolMessage instead of throwing.
 * @class AdvisorActionExecutor
 */
@Injectable()
export class AdvisorActionExecutor implements OnModuleInit {
  private readonly logger = new Logger(AdvisorActionExecutor.name);
  private financeService: FinanceServiceClient;

  /**
   * Creates the executor with the Finance gRPC client registered by Nest.
   *
   * @param financeClient Nest microservice client for the finance package.
   */
  constructor(
    @Inject(FINANCE_PACKAGE_NAME) private readonly financeClient: ClientGrpc,
  ) {}

  /**
   * Resolves the generated FinanceService gRPC stub once Nest has initialized
   * the injected client.
   */
  onModuleInit() {
    this.financeService =
      this.financeClient.getService<FinanceServiceClient>(FINANCE_SERVICE_NAME);
  }

  /**
   * Dispatches a user-approved advisor action to its concrete finance write.
   *
   * @param action Structured action proposed by the advisor and approved by the user.
   * @param context Execution context containing the authenticated user id.
   * @returns A graph-friendly execution result for the follow-up ToolMessage.
   */
  async execute(
    action: AdvisorAction,
    context: AdvisorActionExecutionContext,
  ): Promise<AdvisorActionExecutionResult> {
    if (action.kind === 'create_transaction') {
      return this.createTransaction(action, context);
    }

    if (action.kind === 'update_transaction') {
      return this.updateTransaction(action, context);
    }

    if (action.kind === 'delete_transaction') {
      return this.deleteTransaction(action, context);
    }

    if (action.kind === 'adjust_budget') {
      return this.adjustBudget(action, context);
    }

    if (action.kind === 'create_budget') {
      return this.createBudget(action, context);
    }

    if (action.kind === 'delete_budget') {
      return this.deleteBudget(action, context);
    }

    if (action.kind === 'create_goal') {
      return this.createGoal(action, context);
    }

    if (action.kind === 'update_goal') {
      return this.updateGoal(action, context);
    }

    if (action.kind === 'delete_goal') {
      return this.deleteGoal(action, context);
    }

    if (action.kind === 'adjust_goal_contribution') {
      return this.adjustGoalContribution(action, context);
    }

    if (action.kind === 'goal_contributions_batch') {
      return this.applyGoalContributionBatch(action, context);
    }

    if (action.kind === 'suggest_recurring') {
      return this.suggestRecurring(action, context);
    }

    if (action.kind === 'create_split') {
      return this.createSplit(action, context);
    }

    if (action.kind === 'update_split') {
      return this.updateSplit(action, context);
    }

    if (action.kind === 'delete_split') {
      return this.deleteSplit(action, context);
    }

    if (action.kind === 'split_participants_batch') {
      return this.applySplitParticipantBatch(action, context);
    }

    if (action.kind === 'split_settlements_batch') {
      return this.applySplitSettlementBatch(action, context);
    }

    if (action.kind === 'flag_subscription') {
      return this.flagSubscription(action, context);
    }

    return {
      status: 'execution_failed',
      message:
        'The user approved this action, but execution is not wired yet. No financial changes were made.',
    };
  }

  /**
   * Creates a manual transaction from an approved advisor action.
   *
   * @param action Approved transaction creation request.
   * @param context Execution context used to scope the finance write.
   * @returns Success or failure text for the advisor response.
   */
  private async createTransaction(
    action: Extract<AdvisorAction, { kind: 'create_transaction' }>,
    context: AdvisorActionExecutionContext,
  ): Promise<AdvisorActionExecutionResult> {
    const metadata = this.metadataFor(context);

    try {
      await lastValueFrom(
        this.financeService.createTransaction(
          {
            amount: String(action.amount),
            date: action.date,
            type: this.transactionType(action.type),
            categorySlug: action.categorySlug,
            source: MANUAL_TRANSACTION_SOURCE,
            sourceId: genTransactionSourceId(new Date(action.date)),
            description: action.description ?? action.reason,
            merchant: action.merchant,
          },
          metadata,
        ),
      );

      return {
        status: 'executed',
        message: `${action.type === 'INCOME' ? 'Income' : 'Expense'} transaction created for ${this.formatNaira(action.amount)} in Fintrack. This is a manual Fintrack record, so it does not change your bank account.`,
      };
    } catch (err) {
      this.logger.error(
        `[ADV-ACTION] create_transaction failed user=${context.userId} category=${action.categorySlug}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      return {
        status: 'execution_failed',
        message:
          'I could not create that transaction just now. No financial changes were made.',
      };
    }
  }

  /**
   * Updates an existing transaction with only the approved changed fields.
   *
   * @param action Approved transaction update request.
   * @param context Execution context used to scope the finance write.
   * @returns Success or failure text for the advisor response.
   */
  private async updateTransaction(
    action: Extract<AdvisorAction, { kind: 'update_transaction' }>,
    context: AdvisorActionExecutionContext,
  ): Promise<AdvisorActionExecutionResult> {
    const metadata = this.metadataFor(context);

    try {
      await lastValueFrom(
        this.financeService.updateTransaction(
          {
            id: action.transactionId,
            amount:
              action.amount === undefined ? undefined : String(action.amount),
            date: action.date,
            type: action.type ? this.transactionType(action.type) : undefined,
            categorySlug: action.categorySlug,
            description: action.description,
            merchant: action.merchant,
            notes: action.notes,
          },
          metadata,
        ),
      );

      return {
        status: 'executed',
        message: `${action.label} transaction updated in Fintrack. This is a manual Fintrack change, so confirm your bank account records separately if they also need correcting.`,
      };
    } catch (err) {
      this.logger.error(
        `[ADV-ACTION] update_transaction failed user=${context.userId} transaction=${action.transactionId}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      return {
        status: 'execution_failed',
        message:
          'I could not update that transaction just now. No financial changes were made.',
      };
    }
  }

  /**
   * Deletes an existing transaction after user approval.
   *
   * @param action Approved transaction deletion request.
   * @param context Execution context used to scope the finance write.
   * @returns Success or failure text for the advisor response.
   */
  private async deleteTransaction(
    action: Extract<AdvisorAction, { kind: 'delete_transaction' }>,
    context: AdvisorActionExecutionContext,
  ): Promise<AdvisorActionExecutionResult> {
    const metadata = this.metadataFor(context);

    try {
      await lastValueFrom(
        this.financeService.deleteTransaction(
          { id: action.transactionId },
          metadata,
        ),
      );

      return {
        status: 'executed',
        message: `${action.label} transaction deleted from Fintrack. This does not remove or reverse anything on your bank account.`,
      };
    } catch (err) {
      this.logger.error(
        `[ADV-ACTION] delete_transaction failed user=${context.userId} transaction=${action.transactionId}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      return {
        status: 'execution_failed',
        message:
          'I could not delete that transaction just now. No financial changes were made.',
      };
    }
  }

  /**
   * Updates an existing budget amount for the current period.
   *
   * `UpdateBudgetReq` requires month/year. This preserves the existing local
   * update behavior by supplying the current period values along with the
   * approved limit.
   *
   * @param action Approved budget adjustment.
   * @param context Execution context used to scope the finance write.
   * @returns Success or failure text for the advisor response.
   */
  private async adjustBudget(
    action: Extract<AdvisorAction, { kind: 'adjust_budget' }>,
    context: AdvisorActionExecutionContext,
  ): Promise<AdvisorActionExecutionResult> {
    const metadata = this.metadataFor(context);

    const now = dayjs();
    const request = {
      id: action.budgetId,
      amount: action.proposedLimit,
      month: now.month(),
      year: now.year(),
    };

    this.logger.debug(
      `[ADV-ACTION] adjust_budget request user=${context.userId} budget=${action.budgetId} category=${action.categorySlug} amount=${action.proposedLimit} month=${request.month} year=${request.year}`,
    );

    try {
      await lastValueFrom(this.financeService.updateBudget(request, metadata));

      this.logger.log(
        `[ADV-ACTION] adjust_budget executed user=${context.userId} budget=${action.budgetId} category=${action.categorySlug}`,
      );

      return {
        status: 'executed',
        message: `${this.budgetCategoryLabel(action)} budget updated to ${this.formatNaira(action.proposedLimit)}.`,
      };
    } catch (err) {
      this.logger.error(
        `[ADV-ACTION] adjust_budget failed user=${context.userId} budget=${action.budgetId} category=${action.categorySlug}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      return {
        status: 'execution_failed',
        message:
          'I could not update that budget just now. No financial changes were made.',
      };
    }
  }

  /**
   * Creates a new monthly budget for the approved category and limit.
   *
   * Finance budget creation expects a category slug and optional 0-indexed
   * month/year anchor. The generated name is intentionally simple because the
   * category is the source of truth for display details elsewhere.
   *
   * @param action Approved budget creation request.
   * @param context Execution context used to scope the finance write.
   * @returns Success or failure text for the advisor response.
   */
  private async createBudget(
    action: Extract<AdvisorAction, { kind: 'create_budget' }>,
    context: AdvisorActionExecutionContext,
  ): Promise<AdvisorActionExecutionResult> {
    const metadata = this.metadataFor(context);
    const now = dayjs();
    const label = this.budgetCategoryLabel(action);

    try {
      await lastValueFrom(
        this.financeService.createBudget(
          {
            name: `${label} Budget`,
            amount: action.proposedLimit,
            categorySlug: action.categorySlug,
            description: action.reason,
            month: now.month(),
            year: now.year(),
          },
          metadata,
        ),
      );

      return {
        status: 'executed',
        message: `${label} budget created at ${this.formatNaira(action.proposedLimit)}.`,
      };
    } catch {
      return {
        status: 'execution_failed',
        message:
          'I could not create that budget just now. No financial changes were made.',
      };
    }
  }

  /**
   * Deletes or archives an approved budget depending on the action payload.
   *
   * @param action Approved budget deletion request.
   * @param context Execution context used to scope the finance write.
   * @returns Success or failure text for the advisor response.
   */
  private async deleteBudget(
    action: Extract<AdvisorAction, { kind: 'delete_budget' }>,
    context: AdvisorActionExecutionContext,
  ): Promise<AdvisorActionExecutionResult> {
    const metadata = this.metadataFor(context);
    const label = this.budgetCategoryLabel(action);

    try {
      await lastValueFrom(
        this.financeService.deleteBudget(
          { id: action.budgetId, hardDelete: action.hardDelete ?? false },
          metadata,
        ),
      );

      return {
        status: 'executed',
        message: `${label} budget removed.`,
      };
    } catch (err) {
      this.logger.error(
        `[ADV-ACTION] delete_budget failed user=${context.userId} budget=${action.budgetId}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      return {
        status: 'execution_failed',
        message:
          'I could not remove that budget just now. No financial changes were made.',
      };
    }
  }

  /**
   * Creates a new savings goal from an approved proposal.
   *
   * @param action Approved goal creation request.
   * @param context Execution context used to scope the finance write.
   * @returns Success or failure text for the advisor response.
   */
  private async createGoal(
    action: Extract<AdvisorAction, { kind: 'create_goal' }>,
    context: AdvisorActionExecutionContext,
  ): Promise<AdvisorActionExecutionResult> {
    const metadata = this.metadataFor(context);

    try {
      await lastValueFrom(
        this.financeService.createGoal(
          {
            name: action.name,
            targetDate: action.targetDate,
            targetAmount: action.targetAmount,
            priority: action.priority,
            description: action.description ?? action.reason,
          },
          metadata,
        ),
      );

      return {
        status: 'executed',
        message: `${action.name} goal created with a ${this.formatNaira(action.targetAmount)} target.`,
      };
    } catch (err) {
      this.logger.error(
        `[ADV-ACTION] create_goal failed user=${context.userId} goal=${action.name}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      return {
        status: 'execution_failed',
        message:
          'I could not create that goal just now. No financial changes were made.',
      };
    }
  }

  /**
   * Updates goal details and, when requested, its active/on-hold status.
   *
   * @param action Approved goal update request.
   * @param context Execution context used to scope the finance write.
   * @returns Success or failure text for the advisor response.
   */
  private async updateGoal(
    action: Extract<AdvisorAction, { kind: 'update_goal' }>,
    context: AdvisorActionExecutionContext,
  ): Promise<AdvisorActionExecutionResult> {
    const metadata = this.metadataFor(context);

    try {
      if (
        action.name ||
        action.targetDate ||
        action.targetAmount !== undefined ||
        action.priority ||
        action.description
      ) {
        await lastValueFrom(
          this.financeService.updateGoal(
            {
              id: action.goalId,
              name: action.name,
              targetDate: action.targetDate,
              targetAmount: action.targetAmount,
              priority: action.priority,
              description: action.description,
            },
            metadata,
          ),
        );
      }

      if (action.status) {
        await lastValueFrom(
          this.financeService.updateGoalStatus(
            { id: action.goalId, status: action.status },
            metadata,
          ),
        );
      }

      return {
        status: 'executed',
        message: `${action.goalName} goal updated.`,
      };
    } catch (err) {
      this.logger.error(
        `[ADV-ACTION] update_goal failed user=${context.userId} goal=${action.goalId}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      return {
        status: 'execution_failed',
        message:
          'I could not update that goal just now. No financial changes were made.',
      };
    }
  }

  /**
   * Deletes an approved savings goal.
   *
   * @param action Approved goal deletion request.
   * @param context Execution context used to scope the finance write.
   * @returns Success or failure text for the advisor response.
   */
  private async deleteGoal(
    action: Extract<AdvisorAction, { kind: 'delete_goal' }>,
    context: AdvisorActionExecutionContext,
  ): Promise<AdvisorActionExecutionResult> {
    const metadata = this.metadataFor(context);

    try {
      await lastValueFrom(
        this.financeService.deleteGoal({ id: action.goalId }, metadata),
      );

      return {
        status: 'executed',
        message: `${action.goalName} goal deleted.`,
      };
    } catch (err) {
      this.logger.error(
        `[ADV-ACTION] delete_goal failed user=${context.userId} goal=${action.goalId}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      return {
        status: 'execution_failed',
        message:
          'I could not delete that goal just now. No financial changes were made.',
      };
    }
  }

  /**
   * Updates the latest contribution on an existing savings goal.
   *
   * Advisor actions do not carry a contribution id, so the executor reads the
   * goal detail first and chooses the most recent contribution by date before
   * applying the approved amount.
   *
   * @param action Approved goal-contribution adjustment.
   * @param context Execution context used to scope the finance read/write.
   * @returns Success or failure text for the advisor response.
   */
  private async adjustGoalContribution(
    action: Extract<AdvisorAction, { kind: 'adjust_goal_contribution' }>,
    context: AdvisorActionExecutionContext,
  ): Promise<AdvisorActionExecutionResult> {
    const metadata = this.metadataFor(context);

    try {
      const goal = await lastValueFrom(
        this.financeService.getGoal({ id: action.goalId }, metadata),
      );
      const contribution = this.latestContribution(goal.contributions ?? []);

      if (!contribution) {
        return {
          status: 'execution_failed',
          message:
            'I could not find a contribution to update for that goal. No financial changes were made.',
        };
      }

      await lastValueFrom(
        this.financeService.updateGoalContribution(
          {
            goalId: action.goalId,
            goalContributionId: contribution.id,
            amount: action.proposedAmount,
            description: action.reason,
          },
          metadata,
        ),
      );

      return {
        status: 'executed',
        message: `${action.goalName} contribution updated to ${this.formatNaira(action.proposedAmount)}.`,
      };
    } catch {
      return {
        status: 'execution_failed',
        message:
          'I could not update that goal contribution just now. No financial changes were made.',
      };
    }
  }

  /**
   * Applies a batch of approved contribution changes to one goal.
   *
   * Each operation is sent through the Finance service in order. If any item
   * fails, already-completed items are kept and the advisor receives a partial
   * failure message instead of retrying the whole batch blindly.
   *
   * @param action Approved goal contribution batch.
   * @param context Execution context used to scope the finance writes.
   * @returns Success, partial failure, or failure text for the advisor response.
   */
  private async applyGoalContributionBatch(
    action: Extract<AdvisorAction, { kind: 'goal_contributions_batch' }>,
    context: AdvisorActionExecutionContext,
  ): Promise<AdvisorActionExecutionResult> {
    const metadata = this.metadataFor(context);
    let completed = 0;

    try {
      for (const operation of action.operations) {
        if (operation.operation === 'add') {
          await lastValueFrom(
            this.financeService.contributeToGoal(
              {
                goalId: action.goalId,
                amount: operation.amount,
                date: operation.date,
                description: operation.description,
                transactionId: operation.transactionId,
              },
              metadata,
            ),
          );
        }

        if (operation.operation === 'update') {
          await lastValueFrom(
            this.financeService.updateGoalContribution(
              {
                goalId: action.goalId,
                goalContributionId: operation.contributionId,
                amount: operation.amount,
                date: operation.date,
                description: operation.description,
                transactionId: operation.transactionId,
              },
              metadata,
            ),
          );
        }

        if (operation.operation === 'delete') {
          await lastValueFrom(
            this.financeService.deleteContribution(
              {
                goalId: action.goalId,
                goalContributionId: operation.contributionId,
              },
              metadata,
            ),
          );
        }

        completed += 1;
      }

      return {
        status: 'executed',
        message: `${action.goalName} goal contributions updated (${completed} change${completed === 1 ? '' : 's'}).`,
      };
    } catch (err) {
      this.logger.error(
        `[ADV-ACTION] goal_contributions_batch failed user=${context.userId} goal=${action.goalId} completed=${completed}/${action.operations.length}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      return {
        status: completed > 0 ? 'executed' : 'execution_failed',
        message:
          completed > 0
            ? `${action.goalName} was partly updated: ${completed} of ${action.operations.length} contribution changes completed.`
            : 'I could not update those goal contributions just now. No financial changes were made.',
      };
    }
  }

  /**
   * Creates a new recurring expense item from an advisor suggestion.
   *
   * Suggested recurring items default to `EXPENSE` and start today; the finance
   * service handles schedule computation from the supplied start date and
   * frequency.
   *
   * @param action Approved recurring-item suggestion.
   * @param context Execution context used to scope the finance write.
   * @returns Success or failure text for the advisor response.
   */
  private async suggestRecurring(
    action: Extract<AdvisorAction, { kind: 'suggest_recurring' }>,
    context: AdvisorActionExecutionContext,
  ): Promise<AdvisorActionExecutionResult> {
    const metadata = this.metadataFor(context);

    try {
      await lastValueFrom(
        this.financeService.createRecurring(
          {
            name: action.name,
            amount: action.amount,
            frequency: action.frequency,
            type: 'EXPENSE',
            startDate: dayjs().toISOString(),
            categorySlug: action.categorySlug,
            description: action.reason,
          },
          metadata,
        ),
      );

      return {
        status: 'executed',
        message: `${action.name} recurring expense created at ${this.formatNaira(action.amount)}.`,
      };
    } catch {
      return {
        status: 'execution_failed',
        message:
          'I could not create that recurring item just now. No financial changes were made.',
      };
    }
  }

  /**
   * Creates a split and optionally adds the approved participant list.
   *
   * @param action Approved split creation request.
   * @param context Execution context used to scope the finance writes.
   * @returns Success or failure text for the advisor response.
   */
  private async createSplit(
    action: Extract<AdvisorAction, { kind: 'create_split' }>,
    context: AdvisorActionExecutionContext,
  ): Promise<AdvisorActionExecutionResult> {
    const metadata = this.metadataFor(context);

    try {
      const split = await lastValueFrom(
        this.financeService.createSplit(
          {
            name: action.name,
            amount: action.amount,
            transactionId: action.transactionId,
          },
          metadata,
        ),
      );

      for (const participant of action.participants ?? []) {
        await lastValueFrom(
          this.financeService.addParticipant(
            {
              splitId: split.id,
              name: participant.name,
              email: participant.email,
              amount: participant.amount,
            },
            metadata,
          ),
        );
      }

      return {
        status: 'executed',
        message: `${action.name} split created${action.participants?.length ? ` with ${action.participants.length} participant${action.participants.length === 1 ? '' : 's'}` : ''}.`,
      };
    } catch (err) {
      this.logger.error(
        `[ADV-ACTION] create_split failed user=${context.userId} split=${action.name}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      return {
        status: 'execution_failed',
        message:
          'I could not create that split just now. No financial changes were made.',
      };
    }
  }

  /**
   * Updates split-level fields such as name, amount, or linked transaction.
   *
   * @param action Approved split update request.
   * @param context Execution context used to scope the finance write.
   * @returns Success or failure text for the advisor response.
   */
  private async updateSplit(
    action: Extract<AdvisorAction, { kind: 'update_split' }>,
    context: AdvisorActionExecutionContext,
  ): Promise<AdvisorActionExecutionResult> {
    const metadata = this.metadataFor(context);

    try {
      await lastValueFrom(
        this.financeService.updateSplit(
          {
            id: action.splitId,
            name: action.name,
            amount: action.amount,
            transactionId: action.transactionId,
            unlinkTransaction: action.unlinkTransaction,
          },
          metadata,
        ),
      );

      return {
        status: 'executed',
        message: `${action.splitName} split updated.`,
      };
    } catch (err) {
      this.logger.error(
        `[ADV-ACTION] update_split failed user=${context.userId} split=${action.splitId}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      return {
        status: 'execution_failed',
        message:
          'I could not update that split just now. No financial changes were made.',
      };
    }
  }

  /**
   * Deletes an approved split.
   *
   * @param action Approved split deletion request.
   * @param context Execution context used to scope the finance write.
   * @returns Success or failure text for the advisor response.
   */
  private async deleteSplit(
    action: Extract<AdvisorAction, { kind: 'delete_split' }>,
    context: AdvisorActionExecutionContext,
  ): Promise<AdvisorActionExecutionResult> {
    const metadata = this.metadataFor(context);

    try {
      await lastValueFrom(
        this.financeService.deleteSplit({ id: action.splitId }, metadata),
      );

      return {
        status: 'executed',
        message: `${action.splitName} split deleted.`,
      };
    } catch (err) {
      this.logger.error(
        `[ADV-ACTION] delete_split failed user=${context.userId} split=${action.splitId}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      return {
        status: 'execution_failed',
        message:
          'I could not delete that split just now. No financial changes were made.',
      };
    }
  }

  /**
   * Applies approved participant additions, updates, and deletions to a split.
   *
   * @param action Approved participant batch for one split.
   * @param context Execution context used to scope the finance writes.
   * @returns Success, partial failure, or failure text for the advisor response.
   */
  private async applySplitParticipantBatch(
    action: Extract<AdvisorAction, { kind: 'split_participants_batch' }>,
    context: AdvisorActionExecutionContext,
  ): Promise<AdvisorActionExecutionResult> {
    const metadata = this.metadataFor(context);
    let completed = 0;

    try {
      for (const operation of action.operations) {
        if (operation.operation === 'add') {
          await lastValueFrom(
            this.financeService.addParticipant(
              {
                splitId: action.splitId,
                name: operation.name,
                email: operation.email,
                amount: operation.amount,
              },
              metadata,
            ),
          );
        }

        if (operation.operation === 'update') {
          await lastValueFrom(
            this.financeService.updateParticipant(
              {
                splitId: action.splitId,
                participantId: operation.participantId,
                name: operation.name,
                email: operation.email,
                amount: operation.amount,
              },
              metadata,
            ),
          );
        }

        if (operation.operation === 'delete') {
          await lastValueFrom(
            this.financeService.deleteParticipant(
              {
                splitId: action.splitId,
                participantId: operation.participantId,
              },
              metadata,
            ),
          );
        }

        completed += 1;
      }

      return {
        status: 'executed',
        message: `${action.splitName} participants updated (${completed} change${completed === 1 ? '' : 's'}).`,
      };
    } catch (err) {
      this.logger.error(
        `[ADV-ACTION] split_participants_batch failed user=${context.userId} split=${action.splitId} completed=${completed}/${action.operations.length}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      return {
        status: completed > 0 ? 'executed' : 'execution_failed',
        message:
          completed > 0
            ? `${action.splitName} was partly updated: ${completed} of ${action.operations.length} participant changes completed.`
            : 'I could not update those split participants just now. No financial changes were made.',
      };
    }
  }

  /**
   * Applies approved settlement additions or deletions to a split.
   *
   * @param action Approved settlement batch for one split.
   * @param context Execution context used to scope the finance writes.
   * @returns Success, partial failure, or failure text for the advisor response.
   */
  private async applySplitSettlementBatch(
    action: Extract<AdvisorAction, { kind: 'split_settlements_batch' }>,
    context: AdvisorActionExecutionContext,
  ): Promise<AdvisorActionExecutionResult> {
    const metadata = this.metadataFor(context);
    let completed = 0;

    try {
      for (const operation of action.operations) {
        if (operation.operation === 'add') {
          await lastValueFrom(
            this.financeService.paySettlement(
              {
                splitId: action.splitId,
                participantId: operation.participantId,
                paidAmount: operation.paidAmount,
                paidAt: operation.paidAt,
                transactionId: operation.transactionId,
              },
              metadata,
            ),
          );
        }

        if (operation.operation === 'delete') {
          await lastValueFrom(
            this.financeService.deleteSettlement(
              {
                splitId: action.splitId,
                settlementId: operation.settlementId,
              },
              metadata,
            ),
          );
        }

        completed += 1;
      }

      return {
        status: 'executed',
        message: `${action.splitName} settlements updated (${completed} change${completed === 1 ? '' : 's'}).`,
      };
    } catch (err) {
      this.logger.error(
        `[ADV-ACTION] split_settlements_batch failed user=${context.userId} split=${action.splitId} completed=${completed}/${action.operations.length}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      return {
        status: completed > 0 ? 'executed' : 'execution_failed',
        message:
          completed > 0
            ? `${action.splitName} was partly updated: ${completed} of ${action.operations.length} settlement changes completed.`
            : 'I could not update those split settlements just now. No financial changes were made.',
      };
    }
  }

  /**
   * Applies an approved subscription action to an existing recurring item.
   *
   * The executor first verifies the recurring id still resolves for the user,
   * because the model can only target ids it previously saw from read tools and
   * those ids may become stale before approval.
   *
   * @param action Approved subscription adjustment or cancellation.
   * @param context Execution context used to scope the finance read/write.
   * @returns Success or failure text for the advisor response.
   */
  private async flagSubscription(
    action: Extract<AdvisorAction, { kind: 'flag_subscription' }>,
    context: AdvisorActionExecutionContext,
  ): Promise<AdvisorActionExecutionResult> {
    const metadata = this.metadataFor(context);

    try {
      await lastValueFrom(
        this.financeService.getRecurring({ id: action.recurringId }, metadata),
      );
    } catch {
      return {
        status: 'execution_failed',
        message:
          'I could not find that recurring item anymore. No financial changes were made.',
      };
    }

    if (action.operation === 'cancel') {
      return this.cancelSubscription(action, metadata);
    }

    return this.adjustSubscription(action, metadata);
  }

  /**
   * Updates the amount for an existing recurring subscription.
   *
   * @param action Approved subscription action with a proposed amount.
   * @param metadata Finance gRPC metadata already scoped to the user.
   * @returns Success or failure text for the advisor response.
   */
  private async adjustSubscription(
    action: Extract<AdvisorAction, { kind: 'flag_subscription' }>,
    metadata: Metadata,
  ): Promise<AdvisorActionExecutionResult> {
    if (action.proposedAmount === undefined) {
      return {
        status: 'execution_failed',
        message:
          'I need the new subscription amount before I can update it. No financial changes were made.',
      };
    }

    try {
      await lastValueFrom(
        this.financeService.updateRecurring(
          {
            id: action.recurringId,
            amount: action.proposedAmount,
            description: action.reason,
          },
          metadata,
        ),
      );

      return {
        status: 'executed',
        message: `${action.name} subscription updated to ${this.formatNaira(action.proposedAmount)}.`,
      };
    } catch {
      return {
        status: 'execution_failed',
        message:
          'I could not update that subscription just now. No financial changes were made.',
      };
    }
  }

  /**
   * Cancels an existing recurring subscription by deleting the recurring item.
   *
   * @param action Approved subscription cancellation.
   * @param metadata Finance gRPC metadata already scoped to the user.
   * @returns Success or failure text for the advisor response.
   */
  private async cancelSubscription(
    action: Extract<AdvisorAction, { kind: 'flag_subscription' }>,
    metadata: Metadata,
  ): Promise<AdvisorActionExecutionResult> {
    try {
      await lastValueFrom(
        this.financeService.deleteRecurring(
          { id: action.recurringId },
          metadata,
        ),
      );

      return {
        status: 'executed',
        message: `${action.name} subscription cancelled.`,
      };
    } catch {
      return {
        status: 'execution_failed',
        message:
          'I could not cancel that subscription just now. No financial changes were made.',
      };
    }
  }

  /**
   * Maps advisor transaction type strings to generated gRPC enum values.
   *
   * @param type User-facing transaction type from an approved action.
   * @returns Finance proto transaction type enum value.
   */
  private transactionType(type: 'INCOME' | 'EXPENSE'): TransactionType {
    return TRANSACTION_TYPES[type];
  }

  /**
   * Builds Finance gRPC metadata for an authenticated user-scoped write.
   *
   * @param context Execution context containing the authenticated user id.
   * @returns Metadata containing the `x-user-id` header expected by finance.
   */
  private metadataFor(context: AdvisorActionExecutionContext): Metadata {
    const metadata = new Metadata();
    metadata.add('x-user-id', context.userId);
    return metadata;
  }

  /**
   * Selects the most recent goal contribution from a contribution list.
   *
   * @param contributions Contributions returned by `getGoal`.
   * @returns The contribution with the newest date, or undefined if none exist.
   */
  private latestContribution<T extends { date: string; id: string }>(
    contributions: T[],
  ): T | undefined {
    return [...contributions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )[0];
  }

  /**
   * Converts a category slug into a compact display label.
   *
   * @param slug Category slug from advisor action payloads.
   * @returns Title-cased label suitable for confirmation messages.
   */
  private categoryLabel(slug: string): string {
    return slug
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
      .join(' ');
  }

  /**
   * Picks the user-facing category label from an advisor budget action.
   *
   * @param action Budget action carrying both display and execution category fields.
   * @returns Human-readable category name for user-facing confirmations.
   */
  private budgetCategoryLabel(
    action: Extract<
      AdvisorAction,
      { kind: 'adjust_budget' | 'create_budget' | 'delete_budget' }
    >,
  ): string {
    return (
      action.categoryName?.trim() || this.categoryLabel(action.categorySlug)
    );
  }

  /**
   * Formats a numeric amount as Nigerian naira without fractional digits.
   *
   * @param amount Raw currency amount.
   * @returns User-facing naira string.
   */
  private formatNaira(amount: number): string {
    return `₦${Intl.NumberFormat('en-NG', {
      maximumFractionDigits: 0,
    }).format(amount)}`;
  }
}
