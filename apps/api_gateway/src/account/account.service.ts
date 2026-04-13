import type Redis from 'ioredis';
import { Queue } from 'bullmq';

import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MonoBankAccount, User } from '@fintrack/database/types';
import { PrismaService } from '@fintrack/database/service';
import { REDIS_CLIENT } from '@fintrack/types/constants/redis.costants';
import { MONO_PENDING_TTL_SECONDS } from '@fintrack/types/constants/mono.contants';
import {
  MonoAccountConnectedPayload,
  MonoAccountData,
  MonoAccountUpdatedPayload,
  MonoWebhookPayload,
  MonoAccountSybJobPayload,
} from '@fintrack/types/interfaces/mono';

import { LinkMonoAccountDto, ReLinkMonoAccountDto } from './dto/account.dto';
import {
  MONO_QUEUE,
  SYNC_ACCOUNT_JOB,
} from '@fintrack/types/constants/queus.constants';
import { InjectQueue } from '@nestjs/bullmq';

/**
 * Service responsible for Mono bank account linking, webhook handling,
 * and MonoBankAccount record lifecycle management.
 *
 * @class AccountService
 */
@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectQueue(MONO_QUEUE) private readonly monoQueue: Queue,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  // ---------------------------------------------------------------------------
  // Linked accounts
  // ---------------------------------------------------------------------------

  /**
   * Returns all bank accounts linked to the authenticated user.
   * Only safe, non-sensitive fields are selected — no internal IDs (Mono
   * accountId, bankId) or raw credentials are exposed.
   *
   * @param user - Authenticated user
   * @returns Array of linked accounts with display-safe fields
   */
  async getLinkedAccounts(user: User): Promise<Partial<MonoBankAccount>[]> {
    return await this.prisma.monoBankAccount.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        accountName: true,
        accountNumber: true,
        accountType: true,
        accountBalance: true,
        accountCurrency: true,
        bankName: true,
        status: true,
        lastSyncedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---------------------------------------------------------------------------
  // Sync Account
  // ---------------------------------------------------------------------------

  /**
   * Syncs user account information, it will fetch the user account details realtime info
   * This will trigger the update event
   *
   * @param user - Authenticated user
   * @returns Array of linked accounts with display-safe fields
   */
  async syncAccount(user: User, accountId: string) {
    try {
      const account = await this.prisma.monoBankAccount.findFirst({
        where: { userId: user.id, id: accountId },
      });

      if (!account) {
        throw new NotFoundException('Account not found');
      }

      const updatedAccount = await this.getAccountDataInRealtime(
        account.accountId,
      );

      await this.updateMonoBankAccount(
        {
          ...updatedAccount.account,
          status: updatedAccount.meta.data_status,
        },
        account.id,
      );

      this.monoQueue.add(SYNC_ACCOUNT_JOB, {
        accountId: account.accountId,
        id: account.id,
        userId: user.id,
        startDate: account.lastSyncedAt!,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      throw new InternalServerErrorException(message);
    }
  }

  // ---------------------------------------------------------------------------
  // Webhook
  // ---------------------------------------------------------------------------

  /**
   * Routes an incoming Mono webhook event to the appropriate private handler.
   * Unrecognised events are logged and silently ignored so Mono never
   * receives a 5xx for unknown future event types.
   *
   * @param body - Raw webhook payload from Mono
   */
  async handleWebhook(body: MonoWebhookPayload): Promise<void> {
    this.logger.log(`Mono webhook received: ${body.event}`);

    switch (body.event) {
      case 'mono.events.account_connected':
        await this.handleAccountConnected(body);
        break;
      case 'mono.events.account_updated':
        await this.handleAccountUpdated(body);
        break;
      default:
        this.logger.warn(`Unhandled Mono event: ${(body as any).event}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Account linking
  // ---------------------------------------------------------------------------

  /**
   * Links a Mono bank account to the authenticated user.
   *
   * Exchanges the short-lived one-time `code` from the Mono Connect widget
   * for the permanent accountId via a direct HTTP fetch. After obtaining the
   * accountId, checks the pending account buffer:
   *
   * - If `account_updated` has already arrived, the MonoBankAccount record
   *   is created immediately.
   * - Otherwise, the userId is stored in Redis so the webhook handler can
   *   flush it when the data arrives.
   *
   * @param data - Contains the one-time code from Mono Connect
   * @param user - Authenticated user to link the account to
   * @returns Resolves null on success
   * @throws InternalServerErrorException on unexpected failures
   */
  async linkAccount(data: LinkMonoAccountDto, user: User): Promise<null> {
    try {
      const accountId = await this.exchangeMonoCode(data.code);

      const existing = await this.prisma.monoBankAccount.findUnique({
        where: { accountId, userId: user.id },
      });

      if (existing) {
        return null; // idempotent
      }

      const bufferedAccountJson = await this.redis.getdel(
        `mono:pending_account:${accountId}`,
      );

      if (bufferedAccountJson) {
        // Webhook arrived first — create the record now
        await this.createMonoBankAccount(
          JSON.parse(bufferedAccountJson) as MonoAccountData,
          user.id,
        );
      } else {
        // Webhook hasn't arrived yet — buffer the userId
        await this.redis.setex(
          `mono:pending_user:${accountId}`,
          MONO_PENDING_TTL_SECONDS,
          user.id,
        );
      }

      return null;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`linkAccount error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('An error occurred');
    }
  }

  /**
   * Re-links a previously connected Mono bank account whose session has expired.
   *
   * Exchanges the reauth code to confirm its validity, fetches fresh account
   * data from Mono in realtime, and updates the MonoBankAccount record.
   *
   * @param data - Contains the one-time reauth code and the Mono accountId
   * @param user - Authenticated user
   * @returns Resolves null on success
   * @throws UnauthorizedException if the exchanged accountId does not match
   * @throws NotFoundException if no MonoBankAccount exists for the given accountId
   * @throws InternalServerErrorException on unexpected failures
   */
  async relinkAccount(data: ReLinkMonoAccountDto, user: User): Promise<null> {
    try {
      const id = await this.exchangeMonoCode(data.code);

      if (id !== data.accountId) {
        throw new UnauthorizedException('Unauthorized');
      }

      const account = await this.prisma.monoBankAccount.findFirst({
        where: { accountId: data.accountId, userId: user.id },
      });

      if (!account) {
        throw new NotFoundException('Bank account not found');
      }

      const updatedAccount = await this.getAccountDataInRealtime(
        account.accountId,
      );

      await this.updateMonoBankAccount(
        {
          ...updatedAccount.account,
          status: updatedAccount.meta.data_status,
        },
        account.id,
      );

      return null;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`relinkAccount error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('An error occurred');
    }
  }

  // ---------------------------------------------------------------------------
  // Private webhook handlers
  // ---------------------------------------------------------------------------

  /**
   * Handles `mono.events.account_connected`.
   *
   * Mono fires this at the moment the user completes the Connect widget flow.
   * No account data is available in this payload — the full snapshot arrives
   * on `account_updated` shortly after, so this handler only logs receipt.
   *
   * @param payload - Parsed account_connected payload
   */
  private async handleAccountConnected(
    payload: MonoAccountConnectedPayload,
  ): Promise<void> {
    this.logger.log(`Mono account connected: ${payload.data.id}`);
  }

  /**
   * Handles `mono.events.account_updated`.
   *
   * Primary data source for MonoBankAccount creation and refresh. Checks the
   * bi-directional Redis buffer:
   *
   * - If account already exists in DB → update it in-place.
   * - If `/link` has already been called (userId buffered) → create the record.
   * - Otherwise → buffer the account data until `/link` arrives.
   *
   * @param payload - Parsed account_updated payload
   */
  private async handleAccountUpdated(
    payload: MonoAccountUpdatedPayload,
  ): Promise<void> {
    const account: MonoAccountData = {
      ...payload.data.account,
      status: payload.data.meta.data_status,
    };
    const accountId = account._id;

    const existing = await this.prisma.monoBankAccount.findUnique({
      where: { accountId },
    });

    if (existing) {
      await this.updateMonoBankAccount(account, existing.id);
      return;
    }

    const pendingUserId = await this.redis.getdel(
      `mono:pending_user:${accountId}`,
    );

    if (pendingUserId) {
      // /link arrived first — create the record now
      await this.createMonoBankAccount(account, pendingUserId);
    } else {
      // /link hasn't arrived yet — buffer the account data
      await this.redis.setex(
        `mono:pending_account:${accountId}`,
        MONO_PENDING_TTL_SECONDS,
        JSON.stringify(account),
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Exchanges a Mono one-time code for the permanent accountId via direct fetch.
   *
   * Uses fetch instead of the Mono SDK to avoid a 404 that occurs when the
   * webhook has already consumed the session on Mono's servers before the FE
   * code reaches BE.
   *
   * @param code - One-time code from the Mono Connect widget
   * @returns The permanent Mono accountId
   * @throws InternalServerErrorException if the exchange fails
   */
  private async exchangeMonoCode(code: string): Promise<string> {
    const secretKey = this.config.getOrThrow<string>('MONO_SECRET_KEY');

    const response = await fetch('https://api.withmono.com/v2/accounts/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'mono-sec-key': secretKey,
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(
        `Mono code exchange failed (${response.status}): ${text}`,
      );
      throw new InternalServerErrorException('Failed to exchange Mono code');
    }

    const result = (await response.json()) as { data: { id: string } };

    if (!result.data?.id) {
      throw new InternalServerErrorException(
        'Mono code exchange returned no account ID',
      );
    }

    return result.data.id;
  }

  /**
   * Fetches a real-time account snapshot from Mono.
   *
   * @param id - Mono accountId
   * @returns Full account data and meta from Mono
   * @throws InternalServerErrorException if the fetch fails
   */
  private async getAccountDataInRealtime(
    id: string,
  ): Promise<MonoAccountUpdatedPayload['data']> {
    const secretKey = this.config.getOrThrow<string>('MONO_SECRET_KEY');

    const response = await fetch(`https://api.withmono.com/v2/accounts/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'mono-sec-key': secretKey,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(
        `Mono account fetch failed (${response.status}): ${text}`,
      );
      throw new InternalServerErrorException(
        'Failed to fetch Mono account details',
      );
    }

    const result = (await response.json()) as {
      data: MonoAccountUpdatedPayload['data'];
    };

    if (!result.data) {
      throw new InternalServerErrorException(
        'Account details could not be retrieved',
      );
    }

    return result.data;
  }

  /**
   * Creates a MonoBankAccount record from a Mono account snapshot.
   *
   * @param account - Raw account data from a Mono webhook or realtime fetch
   * @param userId - ID of the user to associate the account with
   */
  private async createMonoBankAccount(
    account: MonoAccountData,
    userId: string,
  ): Promise<void> {
    await this.prisma.monoBankAccount.create({
      data: {
        accountId: account._id,
        accountName: account.name,
        accountNumber: account.accountNumber,
        accountCurrency: account.currency as any,
        accountBalance: account.balance,
        accountType: account.type,
        bankName: account.institution.name,
        bankId: account.institution.bankCode,
        status: account.status,
        userId,
        lastSyncedAt: new Date(),
      },
    });

    this.logger.log(
      `MonoBankAccount created: ${account._id} for user ${userId}`,
    );
  }

  /**
   * Updates an existing MonoBankAccount record with a fresh Mono snapshot.
   *
   * @param account - Raw account data from a Mono webhook or realtime fetch
   * @param id - Primary key of the existing MonoBankAccount record
   */
  private async updateMonoBankAccount(
    account: MonoAccountData,
    id: string,
  ): Promise<void> {
    await this.prisma.monoBankAccount.update({
      where: { id },
      data: {
        accountName: account.name,
        accountNumber: account.accountNumber,
        accountBalance: account.balance,
        accountType: account.type,
        accountCurrency: account.currency as any,
        bankName: account.institution.name,
        bankId: account.institution.bankCode,
        status: account.status,
        lastSyncedAt: new Date(),
      },
    });

    this.logger.log(`MonoBankAccount updated: ${id}`);
  }
}
