import { Metadata } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

import dayjs from '@fintrack/utils/date';
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
    if (action.kind === 'adjust_budget') {
      return this.adjustBudget(action, context);
    }

    if (action.kind === 'create_budget') {
      return this.createBudget(action, context);
    }

    if (action.kind === 'adjust_goal_contribution') {
      return this.adjustGoalContribution(action, context);
    }

    if (action.kind === 'suggest_recurring') {
      return this.suggestRecurring(action, context);
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
    try {
      await lastValueFrom(
        this.financeService.updateBudget(
          {
            id: action.budgetId,
            amount: action.proposedLimit,
            month: now.month() + 1,
            year: now.year(),
          },
          metadata,
        ),
      );

      return {
        status: 'executed',
        message: `${this.categoryLabel(action.categorySlug)} budget updated to ${this.formatNaira(action.proposedLimit)}.`,
      };
    } catch {
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
    const label = this.categoryLabel(action.categorySlug);

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
