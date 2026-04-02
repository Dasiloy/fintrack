import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, Logger, UseGuards } from '@nestjs/common';

import {
  ACTIVITY_LOGS_NAMESPACE,
  NOTIFY_ACTIVITY,
} from '@fintrack/types/constants/socket.evenets';

import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { ActivityNotificationPayload } from '@fintrack/types/interfaces/finance';

/**
 * @description Activity Logs Realtime Service
 * This is a native socket.io gateway that handles the activity logs realtime data
 * It is used to send the activity logs data to the client in realtime
 *
 * @class ActivityLogsRealtimeService
 * @implements {OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect}
 */
@WebSocketGateway({
  cors: {
    credentials: true,
    origin: process.env.NEXT_PUBLIC_APP_URL,
  },
  namespace: ACTIVITY_LOGS_NAMESPACE,
})
/**
 * ActivityLogsRealtimeService.
 */
@Injectable()
export class ActivityLogsRealtimeService
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;

  private logger = new Logger(ActivityLogsRealtimeService.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * @description After the server is initialized, we will authenticate the user
   * This is a native socket.io middleware, not a custom guard
   * Attaches the user to the socket.data object
   *
   * @param {Server} server - The server instance
   * @returns {void}
   */
  afterInit(server: Server): void {
    this.logger.log(
      `WebSocket server initialized on ${ACTIVITY_LOGS_NAMESPACE} namespace`,
    );
    //  lets authenticate the user
    server.use(async (socket, next) => {
      const token = this.extractToken(socket);
      this.logger.debug('token', token);

      if (!token) {
        this.logger.warn('Unauthorized: No token provided');
        return next(new Error('Unauthorized'));
      }

      try {
        const result = await this.authService.validateToken(token);

        if (!result) {
          this.logger.warn('Unauthorized: Invalid token');
          return next(new Error('Unauthorized'));
        }

        if (result === 'TOKEN_EXPIRED') {
          this.logger.warn('Unauthorized: Token expired');
          return next(new Error('TOKEN_EXPIRED')); // ← specific error FE listens for
        }

        socket.data.user = result;
        return next();
      } catch (error) {
        this.logger.error('Error validating token:', error);
        return next(new Error('Unauthorized'));
      }
    });
  }

  /**
   * @description Handles the connection of a client to the analytics realtime server
   * This is a native socket.io middleware, not a custom guard
   * Joins the user to the room => UserId;
   *
   * @param {Socket} socket - The socket instance
   * @returns {Promise<void>}
   */
  async handleConnection(socket: Socket): Promise<void> {
    const user = socket.data.user;

    if (!user) {
      this.logger.warn('Unauthorized: No user found');
      socket.disconnect();
      return;
    }

    /**
     * This is really polar.
     * The idea is to disburse messages to all devices the user logged in with/connected to.
     * In cases where at least one device is in the room, user is actually online => no need for offline FCM notification in such cases.
     * FCM notifications are only sent when the user is offline.
     */
    await socket.join(user.id);

    this.logger.log(
      `Client connected on Activity Logs Realtime: ${socket.id} and user: ${user.id}`,
    );
  }

  /**
   * @description Handles the disconnection of a client from the activity logs realtime server
   * This is a native socket.io middleware, not a custom guard
   * Leaves the user from the room => UserId;
   *
   * @param {Socket} socket - The socket instance
   * @returns {Promise<void>}
   */
  async handleDisconnect(socket: Socket): Promise<void> {
    const user = socket.data.user;

    if (!user) {
      this.logger.warn('Unauthorized: No user found');
      socket.disconnect();
      return;
    }

    await socket.leave(user.id);
  }

  /**
   * @description Notifies the activity to the user
   *
   * @param {ActivityNotificationPayload} payload - The activity payload
   * @returns {Promise<void>}
   */
  async notifyActivity(payload: ActivityNotificationPayload): Promise<void> {
    const isOnline = await this.getUserOnlineStatus(payload.userId);
    if (!isOnline) {
      this.logger.log(`User ${payload.userId} is not online, aborted!!!`);
      return;
    }
    this.logger.log(`Notifying activity to user ${payload.userId}`);
    this.server.to(payload.userId).emit(NOTIFY_ACTIVITY, payload);
  }

  /**
   * @description Checks if the user is online
   *
   * @private
   * @param {string} userId - The user ID
   * @returns {Promise<boolean>} True if the user is online, false otherwise
   */
  private async getUserOnlineStatus(userId: string): Promise<boolean> {
    const sockets = await this.server.in(userId).fetchSockets();
    return sockets.length > 0;
  }

  /**
   * @description Extracts the token from the socket handshake
   *
   * @private
   * @param {Socket} socket - The socket instance
   * @returns {Promise<string | undefined>} The token or undefined if not found
   */
  private extractToken(socket: Socket): string | undefined {
    const rawToken =
      socket.handshake.auth.token || socket.handshake.headers.authorization;
    const token =
      typeof rawToken === 'string' && rawToken.startsWith('Bearer ')
        ? rawToken.slice(7)
        : rawToken;
    return token;
  }
}
