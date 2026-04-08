'use client';

import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { analyticsAtom } from '@/lib/jotai/analytics';
import { useSocket } from '@/app/providers/socket_provider';
import {
  ERROR_TYPE,
  GET_ANALYTICS_DATA,
  NOTIFY_ANALYTICS,
  TEMPš_EVENT,
} from '@fintrack/types/constants/socket.evenets';
import { toast } from '@ui/components';

export function useAnalytics() {
  const { analyticsSocket, analyticsConnected } = useSocket();
  const [state, setState] = useAtom(analyticsAtom);

  useEffect(() => {
    if (!analyticsConnected) return;

    setState((prev) => ({ ...prev, loading: true }));

    analyticsSocket
      .emitWithAck(GET_ANALYTICS_DATA, { filter: state.filter })
      .then((response) => {
        setState((prev) => ({ ...prev, data: response }));
      })
      .finally(() => {
        setState((prev) => ({ ...prev, loading: false }));
      });

    const onNotify = (payload: any) => {
      console.log(payload);
    };

    const onEphemeral = ({ type, message }: any) => {
      switch (type) {
        case ERROR_TYPE:
          toast.error('Analytics', {
            description: message,
          });
          break;

        default:
          break;
      }
    };

    analyticsSocket.on(NOTIFY_ANALYTICS, onNotify);
    analyticsSocket.on(TEMPš_EVENT, onEphemeral);
    return () => {
      analyticsSocket.off(NOTIFY_ANALYTICS, onNotify);
      analyticsSocket.off(TEMPš_EVENT, onEphemeral);
    };
  }, [analyticsConnected, state.filter.month, state.filter.year]);
}
