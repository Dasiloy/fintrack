// lib/socket/socket-manager.ts
import { env } from '@/env';
import { Manager } from 'socket.io-client';

let manager = new Manager(env.NEXT_PUBLIC_API_GATEWAY_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket'],
});

export { manager };
