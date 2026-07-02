import { Metadata } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

import dayjs from '@fintrack/utils/date';
import type {
  AdvisorAction,
  AdvisorActionExecutionContext,
  AdvisorWorkflowActionBatchResult,
  AdvisorWorkflowExecutableCandidate,
} from '@fintrack/types/interfaces/ai';
import {
  FINANCE_PACKAGE_NAME,
  FINANCE_SERVICE_NAME,
  FinanceServiceClient,
} from '@fintrack/types/protos/finance/finance';
import { PrismaService } from '@fintrack/database/service';
import { PLAN_LIMITS } from '@fintrack/types/constants/plan.constants';

import {
  ADVISOR_ENTITY_LIMITS,
  type AdvisorLimitConfig,
  type AdvisorLimitedEntity,
  type AdvisorWorkflowActionDomain,
} from './advisor.types';

/**
 * Executes workflow-approved action candidates with atomic-facing semantics.
 *
 * Multi-action execution is intentionally centralized here so LangGraph never
 * loops through workflow writes one-by-one. Domain batches are delegated to
 * finance_service, where they run inside the owning transaction boundary.
 */
@Injectable()
export class AdvisorWorkflowActionExecutor implements OnModuleInit {
  private financeService: FinanceServiceClient;

  /**
   * Creates the workflow batch executor.
   *
   * @param financeClient Nest microservice client for finance package writes.
   */
  constructor(
    private readonly prisma: PrismaService,
    @Inject(FINANCE_PACKAGE_NAME) private readonly financeClient: ClientGrpc,
  ) {}

  /**
   * Resolves the generated finance gRPC client after Nest initializes modules.
   */
  onModuleInit(): void {
    this.financeService =
      this.financeClient.getService<FinanceServiceClient>(FINANCE_SERVICE_NAME);
  }

  /**
   * Executes selected workflow candidates as one atomic batch.
   *
   * The batch must stay in one supported execution domain. Mixed-domain or
   * unsupported actions fail before any write reaches finance_service.
   *
   * @param candidates Selected executable workflow candidates.
   * @param context Authenticated execution context.
   * @returns Structured batch result for gateway/frontend card updates.
   */
  async executeAtomicBatch(
    candidates: AdvisorWorkflowExecutableCandidate[],
    context: AdvisorActionExecutionContext,
  ): Promise<AdvisorWorkflowActionBatchResult> {
    if (!context.userId) {
      return this.failedBatch(
        candidates,
        'I could not apply those workflow changes because the user context was missing. No financial changes were made.',
        'This selected change was not applied because the user context was missing.',
      );
    }

    const domain = this.resolveBatchDomain(candidates);
    if (!domain) {
      return this.failedBatch(
        candidates,
        'I could not apply those workflow changes because they span multiple execution areas. No financial changes were made.',
        'This selected change was not applied because the workflow batch must stay in one execution area.',
      );
    }

    const limitFailure = await this.guardBatchEntityCreationLimit(
      domain,
      candidates,
      context,
    );
    if (limitFailure) {
      return limitFailure;
    }

    return domain === 'budget'
      ? this.executeBudgetBatch(candidates, context)
      : this.executeRecurringBatch(candidates, context);
  }

  /**
   * Executes a budget-domain workflow batch.
   *
   * This delegates all writes to finance_service, where the selected operations
   * run inside one Serializable transaction.
   */
  private async executeBudgetBatch(
    candidates: AdvisorWorkflowExecutableCandidate[],
    context: AdvisorActionExecutionContext,
  ): Promise<AdvisorWorkflowActionBatchResult> {
    try {
      const result = await lastValueFrom(
        this.financeService.batchBudgetWorkflowActions(
          {
            operations: candidates.map((candidate) =>
              this.toBudgetOperation(candidate),
            ),
          },
          this.metadataFor(context),
        ),
      );
      return this.toBatchResult(result);
    } catch {
      return this.failedBatch(
        candidates,
        'I could not apply those budget changes. No financial changes were made.',
        'This budget change was not applied.',
      );
    }
  }

  /**
   * Executes a recurring-domain workflow batch.
   *
   * This delegates all writes to finance_service, where the selected operations
   * run inside one transaction.
   */
  private async executeRecurringBatch(
    candidates: AdvisorWorkflowExecutableCandidate[],
    context: AdvisorActionExecutionContext,
  ): Promise<AdvisorWorkflowActionBatchResult> {
    try {
      const result = await lastValueFrom(
        this.financeService.batchRecurringWorkflowActions(
          {
            operations: candidates.map((candidate) =>
              this.toRecurringOperation(candidate),
            ),
          },
          this.metadataFor(context),
        ),
      );
      return this.toBatchResult(result);
    } catch {
      return this.failedBatch(
        candidates,
        'I could not apply those recurring changes. No financial changes were made.',
        'This recurring change was not applied.',
      );
    }
  }

  /**
   * Normalizes finance-service batch responses into advisor stream payloads.
   */
  private toBatchResult(result: {
    status: string;
    atomic: boolean;
    message: string;
    candidateResults: Array<{
      candidateId: string;
      status: string;
      message: string;
    }>;
  }): AdvisorWorkflowActionBatchResult {
    return {
      status: result.status === 'executed' ? 'executed' : 'execution_failed',
      atomic: true,
      message: result.message,
      candidateResults: result.candidateResults.map((candidate) => ({
        candidateId: candidate.candidateId,
        status: candidate.status === 'approved' ? 'approved' : 'failed',
        message: candidate.message,
      })),
    };
  }

  /**
   * Converts a workflow candidate into the finance budget batch proto shape.
   */
  private toBudgetOperation(candidate: AdvisorWorkflowExecutableCandidate) {
    const { action } = candidate;
    const now = dayjs();

    if (action.kind === 'adjust_budget') {
      return {
        candidateId: candidate.candidateId,
        kind: action.kind,
        updateBudget: {
          id: action.budgetId,
          amount: action.proposedLimit,
          month: now.month(),
          year: now.year(),
        },
      };
    }

    if (action.kind === 'create_budget') {
      return {
        candidateId: candidate.candidateId,
        kind: action.kind,
        createBudget: {
          name: `${this.budgetCategoryLabel(action)} Budget`,
          amount: action.proposedLimit,
          categorySlug: this.normalizeCategorySlug(action.categorySlug),
          description: action.reason,
          month: now.month(),
          year: now.year(),
        },
      };
    }

    if (action.kind === 'delete_budget') {
      return {
        candidateId: candidate.candidateId,
        kind: action.kind,
        deleteBudget: {
          id: action.budgetId,
          hardDelete: false,
        },
      };
    }

    throw new Error('Unsupported budget workflow action');
  }

  /**
   * Converts a workflow candidate into the finance recurring batch proto shape.
   */
  private toRecurringOperation(candidate: AdvisorWorkflowExecutableCandidate) {
    const { action } = candidate;

    if (action.kind === 'suggest_recurring') {
      return {
        candidateId: candidate.candidateId,
        kind: action.kind,
        createRecurring: {
          name: action.name,
          amount: action.amount,
          frequency: this.normalizeRecurringFrequency(action.frequency),
          type: 'EXPENSE',
          startDate: dayjs().toISOString(),
          categorySlug: this.normalizeCategorySlug(action.categorySlug),
          description: action.reason,
        },
      };
    }

    if (action.kind === 'flag_subscription' && action.operation === 'adjust') {
      return {
        candidateId: candidate.candidateId,
        kind: 'flag_subscription_adjust',
        updateRecurring: {
          id: action.recurringId,
          amount: action.proposedAmount,
          description: action.reason,
        },
      };
    }

    if (action.kind === 'flag_subscription') {
      return {
        candidateId: candidate.candidateId,
        kind: 'flag_subscription_cancel',
        deleteRecurring: { id: action.recurringId },
      };
    }

    throw new Error('Unsupported recurring workflow action');
  }

  /**
   * Resolves the one execution domain shared by every candidate in the batch.
   */
  private resolveBatchDomain(
    candidates: AdvisorWorkflowExecutableCandidate[],
  ): AdvisorWorkflowActionDomain | null {
    const domains = candidates.map((candidate) =>
      this.actionDomain(candidate.action),
    );
    const uniqueDomains = new Set(domains.filter(Boolean));

    if (
      candidates.length === 0 ||
      domains.some((domain) => !domain) ||
      uniqueDomains.size !== 1
    ) {
      return null;
    }

    return [...uniqueDomains][0] ?? null;
  }

  /**
   * Maps supported workflow action kinds to their execution domain.
   */
  private actionDomain(
    action: AdvisorAction,
  ): AdvisorWorkflowActionDomain | null {
    if (
      action.kind === 'adjust_budget' ||
      action.kind === 'create_budget' ||
      action.kind === 'delete_budget'
    ) {
      return 'budget';
    }

    if (
      action.kind === 'suggest_recurring' ||
      action.kind === 'flag_subscription'
    ) {
      return 'recurring';
    }

    return null;
  }

  /**
   * Blocks workflow-approved creates when the user's plan cannot accept the
   * whole selected atomic batch. Updates and deletes do not consume entity slots.
   */
  private async guardBatchEntityCreationLimit(
    domain: AdvisorWorkflowActionDomain,
    candidates: AdvisorWorkflowExecutableCandidate[],
    context: AdvisorActionExecutionContext,
  ): Promise<AdvisorWorkflowActionBatchResult | null> {
    const entity = this.limitedEntityForDomain(domain);
    if (!entity) return null;

    const createsRequested = candidates.filter((candidate) =>
      this.consumesEntitySlot(candidate.action),
    ).length;
    if (createsRequested === 0) return null;

    const config = ADVISOR_ENTITY_LIMITS[entity];

    try {
      const userUsage = await this.prisma.user.findUnique({
        where: { id: context.userId },
        select: {
          subscription: {
            select: {
              plan: true,
              status: true,
            },
          },
          _count: {
            select: {
              [config.countKey]: true,
            },
          },
        },
      });

      if (!userUsage?.subscription) {
        return this.failedBatch(
          candidates,
          'Cannot carry out this workflow approval at this point in time. Please try again later.',
          'This selected change was not applied because your subscription could not be verified.',
        );
      }

      if (userUsage.subscription.status === 'CANCELLED') {
        return this.failedBatch(
          candidates,
          'Cannot carry out this workflow approval because your subscription is cancelled.',
          'This selected change was not applied because your subscription is cancelled.',
        );
      }

      const plan = userUsage.subscription.plan as keyof typeof PLAN_LIMITS;
      const limit = PLAN_LIMITS[plan]?.[config.limitKey];

      if (plan !== 'FREE' || typeof limit !== 'number') {
        return null;
      }

      const currentCount = (
        userUsage._count as Record<AdvisorLimitConfig['countKey'], number>
      )[config.countKey];

      if (currentCount + createsRequested > limit) {
        const available = Math.max(limit - currentCount, 0);
        const message =
          available === 0
            ? `You cannot approve these workflow changes because your Free plan ${config.limitLabel} limit has been reached. Please upgrade to Pro to add more.`
            : `You can only approve ${available} new ${config.entityLabel}${available === 1 ? '' : 's'} on your Free plan, but this workflow selected ${createsRequested}. Please reduce the selection or upgrade to Pro.`;

        return this.failedBatch(candidates, message, message);
      }

      return null;
    } catch {
      return this.failedBatch(
        candidates,
        'Cannot carry out this workflow approval at this point in time. Please try again later.',
        'This selected change was not applied because the plan limit check failed.',
      );
    }
  }

  /**
   * Returns the limited entity tracked by plan usage for a workflow domain.
   */
  private limitedEntityForDomain(
    domain: AdvisorWorkflowActionDomain,
  ): AdvisorLimitedEntity | null {
    if (domain === 'budget') return 'budget';
    if (domain === 'recurring') return 'recurringItem';
    return null;
  }

  /**
   * Indicates whether an approved workflow action creates a new limited entity.
   */
  private consumesEntitySlot(action: AdvisorAction): boolean {
    return (
      action.kind === 'create_budget' || action.kind === 'suggest_recurring'
    );
  }

  /**
   * Builds the request metadata used by finance guards to resolve the user.
   */
  private metadataFor(context: AdvisorActionExecutionContext): Metadata {
    const metadata = new Metadata();
    metadata.add('x-user-id', context.userId);
    return metadata;
  }

  /**
   * Converts model-friendly recurring frequency text to proto enum casing.
   */
  private normalizeRecurringFrequency(frequency: string): string {
    return frequency
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_');
  }

  /**
   * Normalizes common model category aliases to the system category slugs.
   */
  private normalizeCategorySlug(slug: string): string {
    const aliases: Record<string, string> = {
      food: 'cat-food',
      groceries: 'cat-food',
      bills: 'cat-bills-utilities',
      utilities: 'cat-bills-utilities',
      'bills-utilities': 'cat-bills-utilities',
      transport: 'cat-transport',
      shopping: 'cat-shopping',
      healthcare: 'cat-healthcare',
      entertainment: 'cat-entertainment',
      education: 'cat-education',
      savings: 'cat-savings',
      misc: 'cat-misc',
      miscellaneous: 'cat-misc',
    };
    const normalized = slug.trim().toLowerCase();
    return aliases[normalized] ?? slug;
  }

  /**
   * Builds a readable budget name from the action category metadata.
   */
  private budgetCategoryLabel(
    action: Extract<
      AdvisorAction,
      { kind: 'adjust_budget' | 'create_budget' | 'delete_budget' }
    >,
  ): string {
    return action.categoryName?.trim() || action.categorySlug;
  }

  /**
   * Builds an all-failed atomic result without executing any writes.
   */
  private failedBatch(
    candidates: AdvisorWorkflowExecutableCandidate[],
    message: string,
    candidateMessage: string,
  ): AdvisorWorkflowActionBatchResult {
    return {
      status: 'execution_failed',
      atomic: true,
      message,
      candidateResults: candidates.map((candidate) => ({
        candidateId: candidate.candidateId,
        status: 'failed',
        message: candidateMessage,
      })),
    };
  }
}
