// lib/socket/socket-manager.ts
import { env } from '@/env';
import { Manager } from 'socket.io-client';

const manager = new Manager(env.NEXT_PUBLIC_API_GATEWAY_URL, {
  autoConnect: false,
});

export { manager };
