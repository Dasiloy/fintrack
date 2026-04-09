'use client';

import { activityLogsSocket, analyticsSocket } from '@/lib/socket/sockets';
import { createContext, useContext, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';

interface SocketContextValue {
  analyticsSocket: Socket;
  activitySocket: Socket;
  analyticsConnected: boolean;
  activityConnected: boolean;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: React.PropsWithChildren) {
  const [analyticsConnected, setAnalyticsConnected] = useState(false);
  const [activityConnected, setActivityConnected] = useState(false);

  useEffect(() => {
    const onAnalyticsConnect = () => setAnalyticsConnected(true);
    const onAnalyticsDisconnect = () => setAnalyticsConnected(false);

    const onActivityConnect = () => setActivityConnected(true);

    const onActivityDisconnect = () => setActivityConnected(false);

    analyticsSocket.on('connect', onAnalyticsConnect);
    analyticsSocket.on('disconnect', onAnalyticsDisconnect);
    activityLogsSocket.on('connect', onActivityConnect);
    activityLogsSocket.on('disconnect', onActivityDisconnect);

    analyticsSocket.connect();
    activityLogsSocket.connect();

    return () => {
      analyticsSocket.off('connect', onAnalyticsConnect);
      analyticsSocket.off('disconnect', onAnalyticsDisconnect);
      activityLogsSocket.off('connect', onActivityConnect);
      activityLogsSocket.off('disconnect', onActivityDisconnect);

      analyticsSocket.disconnect();
      activityLogsSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        analyticsSocket,
        activitySocket: activityLogsSocket,
        analyticsConnected,
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
