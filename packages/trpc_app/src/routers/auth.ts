import { z } from 'zod';
import { type StandardResponse } from '@fintrack/types/interfaces/server_response';
import type {
  Empty,
  InitiateTwoFactorSetupRes,
  ConfirmTwoFactorSetupRes,
  InitiateEmailChangeRes,
} from '@fintrack/types/protos/auth/auth';

import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../setup';
import { GATEWAY_URL, gatewayHeaders, throwGatewayError } from '../lib/gateway';

export const authrouter = createTRPCRouter({
  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  /**
   * Fetch the current user's 2FA status and remaining backup code count.
   *
   * Also returns `hasPassword` so the frontend can conditionally show or hide
   * 2FA controls for social-only users who have not yet set a password.
   *
   * @returns `twoFactorEnabled` — whether TOTP is active
   * @returns `codeLeft` — number of unused backup codes remaining
   * @returns `hasPassword` — false for social-only accounts
   * @throws INTERNAL_SERVER_ERROR on unexpected database failure
   */
  get2fa: protectedProcedure.query(async ({ ctx }) => {
    try {
      const { twoFactorEnabled, password } = await ctx.db.user.findUniqueOrThrow({
        where: { email: ctx.session.user.email },
        select: {
          twoFactorEnabled: true,
          password: true,
        },
      });

      const codeLeft = await ctx.db.backupCodes.count({
        where: { userId: ctx.session.user.id, usedAt: null },
      });

      const data: StandardResponse<{
        codeLeft: number;
        twoFactorEnabled: boolean;
        hasPassword: boolean;
      }> = {
        message: 'Count fetched successfully',
        data: { codeLeft, twoFactorEnabled, hasPassword: !!password },
        statusCode: 200,
        success: true,
      };
      return data;
    } catch {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'an error occured',
      });
    }
  }),

  /**
   * List all active sessions for the current user.
   *
   * Returns device metadata (user-agent, IP, location, last-used timestamp)
   * so the frontend can render a session list and identify the current device
   * via the `deviceId` field.
   *
   * @returns `sessions` — array of active session records
   * @throws INTERNAL_SERVER_ERROR on unexpected database failure
   */
  getSessions: protectedProcedure.query(async ({ ctx }) => {
    try {
      const query = await ctx.db.session.findMany({
        where: { userId: ctx.session.user.id },
        select: {
          id: true,
          deviceId: true,
          ipAddress: true,
          location: true,
          lastUsedAt: true,
          userAgent: true,
        },
        orderBy: { lastUsedAt: 'desc' },
      });
      const data: StandardResponse<{
        sessions: typeof query;
      }> = {
        message: 'Count fetched successfully',
        data: { sessions: query },
        statusCode: 200,
        success: true,
      };
      return data;
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'an error occured',
      });
    }
  }),

  /**
   * Fetch the 10 most recent login activity records for the current user,
   * ordered most-recent-first.
   *
   * Each record carries the login type (PASSWORD or MFA), outcome
   * (SUCCESS or FALED), device metadata, and timestamp — used to render the
   * login history panel on the Security settings page.
   *
   * @returns `activities` — up to 10 recent login activity entries
   * @throws INTERNAL_SERVER_ERROR on unexpected database failure
   */
  getLoginActivity: protectedProcedure.query(async ({ ctx }) => {
    try {
      const query = await ctx.db.loginActivity.findMany({
        where: { userId: ctx.session.user.id },
        select: {
          id: true,
          deviceId: true,
          ipAddress: true,
          location: true,
          userAgent: true,
          status: true,
          type: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      const data: StandardResponse<{
        activities: typeof query;
      }> = {
        message: 'Count fetched successfully',
        data: { activities: query },
        statusCode: 200,
        success: true,
      };
      return data;
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'an error occured',
      });
    }
  }),

  // ---------------------------------------------------------------------------
  // Session management mutations
  // ---------------------------------------------------------------------------

  /**
   * Revoke a single session by its ID.
   *
   * Ownership is enforced — the session must belong to the requesting user.
   * Returns `wasCurrentSession: true` when the deleted session's `deviceId`
   * matches the `x-device-id` header supplied by the client, so the caller
   * knows it should sign the user out on the frontend immediately.
   *
   * @param sessionId - ID of the session to delete
   * @returns `wasCurrentSession` — true if the revoked session was the caller's own
   * @throws NOT_FOUND if the session does not exist or belongs to another user
   */
  deleteSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.session.findFirst({
        where: { id: input.sessionId, userId: ctx.session.user.id },
        select: { id: true, deviceId: true },
      });

      if (!session) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
      }

      await ctx.db.session.delete({ where: { id: session.id } });

      const currentDeviceId = ctx.headers.get('x-device-id') ?? '';
      const wasCurrentSession = !!currentDeviceId && session.deviceId === currentDeviceId;

      const data: StandardResponse<{ wasCurrentSession: boolean }> = {
        message: 'Session revoked successfully',
        data: { wasCurrentSession },
        statusCode: 200,
        success: true,
      };
      return data;
    }),

  /**
   * Revoke all sessions except the one belonging to the current device.
   *
   * The current device is identified via the `x-device-id` request header.
   * If the header is absent all sessions are deleted (including the caller's).
   * Returns the number of sessions that were removed.
   *
   * @returns `count` — number of sessions deleted
   */
  revokeAllOtherSessions: protectedProcedure.mutation(async ({ ctx }) => {
    const currentDeviceId = ctx.headers.get('x-device-id') ?? '';

    const { count } = await ctx.db.session.deleteMany({
      where: {
        userId: ctx.session.user.id,
        ...(currentDeviceId ? { NOT: { deviceId: currentDeviceId } } : {}),
      },
    });

    const data: StandardResponse<{ count: number }> = {
      message: `${count} session(s) revoked`,
      data: { count },
      statusCode: 200,
      success: true,
    };
    return data;
  }),

  // ---------------------------------------------------------------------------
  // Two-factor authentication mutations
  // ---------------------------------------------------------------------------

  /**
   * Begin TOTP 2FA setup for the authenticated user.
   *
   * Generates a new TOTP secret, stores it encrypted on the user record, and
   * returns the raw base32 secret plus an `otpauth://` URI ready to be rendered
   * as a QR code in an authenticator app. Setup is not activated until
   * `confirm2fa` is called with a valid code.
   *
   * @returns `secret` — base32 secret for manual entry
   * @returns `otpauthUri` — full otpauth URI for QR code rendering
   * @throws FAILED_PRECONDITION if the user has no LOCAL account (social-only)
   * @throws UNAUTHENTICATED if the access token is invalid
   */
  init2fa: protectedProcedure.mutation(async ({ ctx }) => {
    const response = await fetch(`${GATEWAY_URL}/api/auth/2fa/init`, {
      method: 'POST',
      headers: gatewayHeaders(ctx.headers),
    });

    if (!response.ok) await throwGatewayError(response);

    const data: StandardResponse<InitiateTwoFactorSetupRes> = await response.json();
    return data;
  }),

  /**
   * Confirm TOTP 2FA setup by verifying the first code from the authenticator app.
   *
   * Activates 2FA on the account and returns 10 single-use backup codes that
   * should be shown to the user exactly once and stored securely offline.
   *
   * @param code - 6-digit TOTP code from the authenticator app
   * @returns `backupCodes` — 10 plain-text backup codes (shown once, never stored plain)
   * @throws UNAUTHENTICATED if the TOTP code is invalid
   * @throws FAILED_PRECONDITION if the user has no LOCAL account (social-only)
   */
  confirm2fa: protectedProcedure
    .input(
      z.object({
        code: z
          .string()
          .min(6, 'Code must be 6 characters long')
          .max(6, 'code must be 6 characters long'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/auth/2fa/confirm`, {
        method: 'POST',
        body: JSON.stringify({ code: input.code }),
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<ConfirmTwoFactorSetupRes> = await response.json();
      return data;
    }),

  /**
   * Disable TOTP 2FA on the authenticated user's account.
   *
   * Requires the current TOTP code to prevent unauthorised disablement.
   * Clears the stored secret and all backup codes on success.
   *
   * @param code - 6-digit TOTP code proving the user still controls the authenticator
   * @throws UNAUTHENTICATED if the access token or TOTP code is invalid
   * @throws FAILED_PRECONDITION if 2FA is not currently enabled
   */
  disable2fa: protectedProcedure
    .input(
      z.object({
        code: z
          .string()
          .min(6, 'Code must be 6 characters long')
          .max(6, 'Code must be 6 characters long'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/auth/2fa`, {
        method: 'DELETE',
        body: JSON.stringify({ code: input.code }),
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Empty> = await response.json();
      return data;
    }),

  /**
   * Atomically replace all existing backup codes with a fresh set of 10.
   *
   * Requires the current TOTP code to prevent unauthorised regeneration.
   * All previously issued codes are invalidated immediately, even if unused.
   *
   * @param code - 6-digit TOTP code from the authenticator app
   * @returns `backupCodes` — 10 new plain-text backup codes (shown once)
   * @throws FAILED_PRECONDITION if 2FA is not currently enabled
   * @throws UNAUTHENTICATED if the TOTP code is invalid
   */
  regenerateBackupCodes: protectedProcedure
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/auth/2fa/backup-codes/regenerate`, {
        method: 'POST',
        body: JSON.stringify({ code: input.code }),
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<ConfirmTwoFactorSetupRes> = await response.json();
      return data;
    }),

  // ---------------------------------------------------------------------------
  // Credential mutations
  // ---------------------------------------------------------------------------

  /**
   * Change the authenticated user's password, or set an initial password for
   * social-only accounts that have never had one.
   *
   * - **Setting a password** (social users): `currentPassword` is omitted.
   *   A LOCAL account record is created and sessions are preserved.
   * - **Changing a password**: `currentPassword` is required. All existing
   *   sessions are invalidated after the update — the user must re-login.
   * - When 2FA is enabled `otpCode` is required and enforced server-side.
   *
   * @param currentPassword - existing password; omit when creating for the first time
   * @param newPassword - the new password to set (min 8 chars enforced server-side)
   * @param otpCode - current TOTP code; required when 2FA is active
   * @throws UNAUTHENTICATED if the current password or TOTP code is wrong
   * @throws ALREADY_EXISTS if the new password is identical to the current one
   * @throws RESOURCE_EXHAUSTED if too many failed attempts have been made
   */
  chnagePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().optional(),
        newPassword: z.string(),
        /** Sent when the user has 2FA enabled — the auth service enforces it server-side. */
        otpCode: z.string().length(6).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/auth/change-password`, {
        method: 'POST',
        body: JSON.stringify(input),
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Empty> = await response.json();
      return data;
    }),

  /**
   * Begin an in-app email change by verifying the current password and
   * dispatching a 6-digit OTP to the requested new address.
   *
   * The new email is not applied until `verifyEmailChange` is called with
   * the correct OTP. When 2FA is enabled `otpCode` is required.
   *
   * @param newEmail - the target email address
   * @param currentPassword - current password verifying account ownership
   * @param otpCode - current TOTP code; required when 2FA is active
   * @returns `newEmail` — the address the OTP was dispatched to
   * @throws UNAUTHENTICATED if the current password or TOTP code is wrong
   * @throws ALREADY_EXISTS if the target email is already registered
   * @throws RESOURCE_EXHAUSTED if too many failed password attempts have been made
   */
  initiateEmailChange: protectedProcedure
    .input(
      z.object({
        newEmail: z.string().email(),
        currentPassword: z.string().min(1),
        /** Sent when the user has 2FA enabled — the auth service enforces it server-side. */
        otpCode: z.string().length(6).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/auth/email/initiate`, {
        method: 'POST',
        body: JSON.stringify(input),
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<InitiateEmailChangeRes> = await response.json();
      return data;
    }),

  /**
   * Complete an in-app email change by verifying the OTP sent to the new address.
   *
   * On success the user's email is updated, the pending verification token is
   * consumed, and all sessions are invalidated — the user must re-login with
   * the new address.
   *
   * @param otp - 6-digit code sent to the new email address
   * @throws UNAUTHENTICATED if the OTP is invalid or expired
   * @throws ALREADY_EXISTS if the target email was claimed since initiation
   */
  verifyEmailChange: protectedProcedure
    .input(z.object({ otp: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/auth/email/verify`, {
        method: 'POST',
        body: JSON.stringify(input),
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Empty> = await response.json();
      return data;
    }),

  /**
   * Schedule the authenticated user's account for permanent deletion.
   *
   * Sessions are revoked immediately — the user is locked out at once.
   * The account and all associated data are hard-deleted after a 30-day grace window.
   * Ownership is verified via password (or skipped for social-only accounts).
   * When 2FA is enabled `otpCode` is required and enforced server-side.
   *
   * @param password - current password; omit for social-only accounts
   * @param otpCode - current TOTP code; required when 2FA is active
   * @throws UNAUTHENTICATED if the password or TOTP code is wrong
   * @throws RESOURCE_EXHAUSTED if too many failed verification attempts
   */
  deleteAccount: protectedProcedure
    .input(
      z.object({
        password: z.string().optional(),
        otpCode: z.string().length(6).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`${GATEWAY_URL}/api/auth/account`, {
        method: 'DELETE',
        body: JSON.stringify(input),
        headers: gatewayHeaders(ctx.headers),
      });

      if (!response.ok) await throwGatewayError(response);

      const data: StandardResponse<Empty> = await response.json();
      return data;
    }),
});
