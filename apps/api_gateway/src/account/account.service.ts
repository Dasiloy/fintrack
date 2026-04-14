import type Redis from 'ioredis';
import { Queue } from 'bullmq';

import {
  BadRequestException,
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
  GetMonoAccountRealtimeDataRes,
} from '@fintrack/types/interfaces/mono';

import { LinkMonoAccountDto, ReLinkMonoAccountDto } from './dto/account.dto';
import {
  MONO_QUEUE,
  SYNC_ACCOUNT_JOB,
} from '@fintrack/types/constants/queus.constants';
import { InjectQueue } from '@nestjs/bullmq';

/**
 * Service responsible for Mono bank account linking, webhook handling,
 * and MonoBankAccount record lifecycle management
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
        accountId: true,
        accountName: true,
        accountNumber: true,
        accountType: true,
        accountBalance: true,
        accountCurrency: true,
        bankName: true,
        status: true,
        lastSyncedAt: true,
        createdAt: true,
        bankId: true,
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

      const realtime = await this.getAccountDataInRealtime(account.accountId);
      const mapped = this.mapRealtimeToAccountData(realtime);

      if (mapped.account.status === 'UNAVAILABLE') {
        throw new BadRequestException(
          'Please relink your account, or contact your account provider',
        );
      }

      await this.monoQueue.add(
        SYNC_ACCOUNT_JOB,
        {
          account: mapped.account,
          id: account.id,
          userId: user.id,
          startDate: account.lastSyncedAt!,
        },
        {
          attempts: 1,
          removeOnComplete: true,
          removeOnFail: true,
          jobId: account.lastSyncedAt?.toISOString(),
        },
      );
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

      const bufferedAccountJson = await this.redis
        .getdel(`mono:pending_account:${accountId}`)
        .catch((err) => this.logger.debug('err', err));

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

      const realtime = await this.getAccountDataInRealtime(account.accountId);
      const mapped = this.mapRealtimeToAccountData(realtime);

      await this.updateMonoBankAccount(mapped.account, account.id);

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
   * Fetches full account data from Mono in real-time and coordinates with
   * `linkAccount` via a bi-directional Redis buffer:
   *
   * - If `/link` has already buffered the userId  → create the record now.
   * - Otherwise → buffer the account data so `/link` can create it on arrival.
   *
   * This is the sole creation path for all account statuses. Mono only sends
   * `account_updated` for AVAILABLE accounts; PARTIAL and UNAVAILABLE never
   * receive that event, so creation must happen here for all cases.
   *
   * @param payload - Parsed account_connected payload
   */
  private async handleAccountConnected(
    payload: MonoAccountConnectedPayload,
  ): Promise<void> {
    const accountId = payload.data.id;
    this.logger.log(`Mono account connected: ${accountId}`);

    try {
      const realtime = await this.getAccountDataInRealtime(accountId);
      const { account } = this.mapRealtimeToAccountData(
        realtime,
        payload.data.meta.data_status,
      );

      const pendingUserId = await this.redis.getdel(
        `mono:pending_user:${accountId}`,
      );

      if (pendingUserId) {
        await this.createMonoBankAccount(account, pendingUserId);
      } else {
        await this.redis.setex(
          `mono:pending_account:${accountId}`,
          MONO_PENDING_TTL_SECONDS,
          JSON.stringify(account),
        );
      }
    } catch (error) {
      this.logger.error(
        `handleAccountConnected failed for ${accountId}: ${JSON.stringify(error)}`,
      );
    }
  }

  /**
   * Handles `mono.events.account_updated`.
   *
   * Mono only fires this for AVAILABLE accounts after `account_connected`.
   * Creation is handled by the `account_connected` + `linkAccount` flow, so
   * this handler simply updates the existing record when it arrives.
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

    const existing = await this.prisma.monoBankAccount.findUnique({
      where: { accountId: account._id },
    });

    if (existing) {
      if (account.status === 'UNAVAILABLE') return;

      await this.monoQueue.add(
        SYNC_ACCOUNT_JOB,
        {
          account: account,
          id: existing.id,
          userId: existing.userId,
          startDate: existing.lastSyncedAt!,
        },
        {
          attempts: 1,
          removeOnComplete: true,
          removeOnFail: true,
          jobId: existing.lastSyncedAt?.toISOString(),
        },
      );
    } else {
      this.logger.warn(
        `account_updated received for unknown account ${account._id} — skipping`,
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
   * @returns Raw realtime account data from Mono
   * @throws InternalServerErrorException if the fetch fails
   */
  private async getAccountDataInRealtime(
    id: string,
  ): Promise<GetMonoAccountRealtimeDataRes> {
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
      data: GetMonoAccountRealtimeDataRes;
    };

    if (!result.data) {
      throw new InternalServerErrorException(
        'Account details could not be retrieved',
      );
    }

    return result.data;
  }

  /**
   * Maps a raw Mono realtime account response to the shared
   * `MonoAccountUpdatedPayload['data']` shape used across the service.
   *
   * The realtime endpoint returns snake_case keys and no `meta` block.
   * `data_status` must be supplied by the caller — it is available in the
   * `account_connected` webhook payload and defaults to `AVAILABLE` for
   * relink/sync flows where the account is known to be active.
   *
   * @param data       - Raw response from `GET /v2/accounts/:id`
   * @param data_status - Account connectivity status
   */
  private mapRealtimeToAccountData(
    data: GetMonoAccountRealtimeDataRes,
    data_status?: 'AVAILABLE' | 'PARTIAL' | 'UNAVAILABLE',
  ): MonoAccountUpdatedPayload['data'] {
    const status = data_status ?? data.meta.data_status;
    return {
      account: {
        _id: data.account.id,
        name: data.account.name,
        accountNumber: data.account.account_number,
        currency: data.account.currency,
        balance: data.account.balance,
        type: data.account.type,
        status,
        institution: {
          name: data.account.institution.name,
          bankCode: data.account.institution.bank_code,
          type: data.account.institution.type,
        },
      },
      meta: {
        data_status: status,
        auth_method: data.meta.auth_method,
      },
    };
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
    await this.prisma.monoBankAccount
      .create({
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
      })
      .catch((err) => {
        this.logger.debug('err', err);
        throw new InternalServerErrorException('Account could not be created');
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
  async updateMonoBankAccount(
    account: MonoAccountData,
    id: string,
  ): Promise<void> {
    await this.prisma.monoBankAccount
      .update({
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
      })
      .catch((err) => {
        this.logger.debug('err', err);
        throw new InternalServerErrorException('Account could not be updated');
      });

    this.logger.log(`MonoBankAccount updated: ${id}`);
  }
}
