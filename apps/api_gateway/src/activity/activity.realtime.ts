import { Server, Socket } from 'socket.io';

import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ConnectedSocket, SubscribeMessage } from '@nestjs/websockets';

import {
  ACTIVITY_LOGS_NAMESPACE,
  NOTIFY_ACTIVITY,
  GET_ACTIVITY_DATA,
} from '@fintrack/types/constants/socket.evenets';

import { WsGuard } from '../guards/ws.guard';
import { AuthService } from '../auth/auth.service';
import { ActivityLogs } from '@fintrack/database/types';
import { ActivityService } from './activity.service';
import { WsExceptionFilter } from '../filters/ws_exception';

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
    origin: process.env.NEXT_PUBLIC_APP_URL,
  },
  namespace: ACTIVITY_LOGS_NAMESPACE,
})
@UseFilters(WsExceptionFilter)
@Injectable()
export class ActivityLogsRealtimeService
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;

  private logger = new Logger(ActivityLogsRealtimeService.name);

  constructor(
    private readonly authService: AuthService,
    @Inject(forwardRef(() => ActivityService))
    private readonly activityService: ActivityService,
  ) {}

  /**
   * @description Runs after Server initiation
   */
  afterInit() {
    this.logger.log('Activity gateway initialized');
  }

  /**
   * @description Runs on fisrt socket connection and reconnection
   *
   * @param {Socket} client
   */
  async handleConnection(client: Socket) {
    const token: string | undefined = client.handshake.auth?.token;

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const user = await this.authService.validateToken(token);
      this.logger.log('user', user);

      if (user === 'TOKEN_EXPIRED' || user === null) {
        client.disconnect();
        return;
      }

      client.data.user = user;
      client.join(user.id);
      this.logger.log(`Client connected: ${client.id}`);
    } catch (err) {
      this.logger.error(
        `WS auth failed for client ${client.id}: ${err.message}`,
      );
      client.disconnect();
    }
  }

  /**
   * @description Runs on socket disconnection
   *
   * @param {Socket} client
   */
  async handleDisconnect(client: Socket) {
    const userId: string | undefined = client.data.user?.id;
    if (!userId) return;

    this.logger.log(
      `Client disconnected: ${client.id} (user: ${userId}) from analytics gateway`,
    );

    // Mark offline + clean up socket key
    await client.leave(userId);
  }

  @UseGuards(WsGuard)
  @SubscribeMessage(GET_ACTIVITY_DATA)
  async getActivityData(@ConnectedSocket() client: Socket): Promise<any[]> {
    const user = client.data.user;
    return this.activityService.getActivityLogs(user.id);
  }

  /**
   * @description Notifies the activity to the user
   *
   * @param {ActivityNotificationPayload} payload - The activity payload
   * @returns {Promise<void>}
   */
  async notifyActivity(payload: ActivityLogs): Promise<void> {
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
}
