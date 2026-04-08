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
  Logger,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
} from '@nestjs/websockets';

import {
  ANALYTICS_NAMESPACE,
  NOTIFY_ANALYTICS,
  GET_ANALYTICS_DATA,
} from '@fintrack/types/constants/socket.evenets';
import {
  AnalyticsNotificationPayload,
  JoinAnalyticsRoomPayload,
} from '@fintrack/types/interfaces/finance';

import { AuthService } from '../auth/auth.service';
import { WsGuard } from '../guards/ws.guard';
import { WsExceptionFilter } from '../filters/ws_exception';
import { AnalyticsService } from './analytics.service';

/**
 * @description Analytics Realtime Service
 * This is a native socket.io gateway that handles the analytics realtime data
 * It is used to send the analytics data to the client in realtime
 *
 * @class AnalyticsRealtimeService
 * @implements {OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect}
 */
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: ANALYTICS_NAMESPACE,
})
@UseFilters(WsExceptionFilter)
export class AnalyticsRealtimeService
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;

  private logger = new Logger(AnalyticsRealtimeService.name);

  constructor(
    private readonly authService: AuthService,
    @Inject(forwardRef(() => AnalyticsService))
    private readonly analyticsService: AnalyticsService,
  ) {}

  /**
   * @description Runs after Server initiation
   */
  afterInit() {
    this.logger.log('Analytics gateway initialized');
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
    client.leave(userId);
  }

  @UseGuards(WsGuard)
  @SubscribeMessage(GET_ANALYTICS_DATA)
  async getAnalyticsData(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinAnalyticsRoomPayload,
  ): Promise<any> {
    const user = client.data.user;
    return this.analyticsService.getAnalytics(user.id, payload);
  }

  /**
   * @description Notifies the analytics to the user
   *
   * @param {AnalyticsNotificationPayload} payload - The analytics payload
   * @returns {Promise<void>}
   */
  async notifyAnalytics(payload: AnalyticsNotificationPayload): Promise<void> {
    const isOnline = await this.getUserOnlineStatus(payload.userId);
    if (!isOnline) {
      this.logger.log(`User ${payload.userId} is not online, aborted!!!`);
      return;
    }
    this.logger.log(`Notifying analytics to user ${payload.userId}`);
    this.server.to(payload.userId).emit(NOTIFY_ANALYTICS, payload);
  }

  /**
   * @description Notifies the analytics to the user
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
