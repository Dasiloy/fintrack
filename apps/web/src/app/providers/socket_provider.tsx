'use client';

import { activityLogsSocket } from '@/lib/socket/sockets';
import { createContext, useContext, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';

interface SocketContextValue {
  activitySocket: Socket;
  activityConnected: boolean;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: React.PropsWithChildren) {
  const [activityConnected, setActivityConnected] = useState(false);

  useEffect(() => {
    const onActivityConnect = () => setActivityConnected(true);
    const onActivityDisconnect = () => setActivityConnected(false);

    activityLogsSocket.on('connect', onActivityConnect);
    activityLogsSocket.on('disconnect', onActivityDisconnect);

    activityLogsSocket.connect();

    return () => {
      activityLogsSocket.off('connect', onActivityConnect);
      activityLogsSocket.off('disconnect', onActivityDisconnect);

      activityLogsSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        activitySocket: activityLogsSocket,
        activityConnected,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
