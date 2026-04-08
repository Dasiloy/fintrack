'use client';

import { useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { activityAtom } from '@/lib/jotai/activity';
import { useSocket } from '@/app/providers/socket_provider';
import {
  TEMPš_EVENT,
  ERROR_TYPE,
  GET_ACTIVITY_DATA,
  NOTIFY_ACTIVITY,
} from '@fintrack/types/constants/socket.evenets';
import { toast } from '@ui/components';
import type { ActivityLogs } from '@fintrack/database/types';

export function useActivity() {
  const { activitySocket, activityConnected } = useSocket();
  const setData = useSetAtom(activityAtom);

  useEffect(() => {
    if (!activityConnected) return;

    setData((prev) => ({
      ...prev,
      loading: true,
    }));
    activitySocket
      .emitWithAck(GET_ACTIVITY_DATA)
      .then((response) => {
        console.log(response);
        setData({
          loading: false,
          logs: response,
        });
      })
      .finally(() => {
        setData((prev) => ({
          ...prev,
          loading: false,
        }));
      });

    const onNotify = (payload: ActivityLogs) => {
      console.log(payload);
      setData((prev) => ({
        ...prev,
        logs: [payload, ...prev.logs],
      }));
    };

    const onEphemeral = ({ type, message }: any) => {
      switch (type) {
        case ERROR_TYPE:
          toast.error('Activity Logs', {
            description: message,
          });
          break;

        default:
          break;
      }
    };

    activitySocket.on(NOTIFY_ACTIVITY, onNotify);
    activitySocket.on(TEMPš_EVENT, onEphemeral);
    return () => {
      activitySocket.off(NOTIFY_ACTIVITY, onNotify);
      activitySocket.off(TEMPš_EVENT, onEphemeral);
    };
  }, [activityConnected]);
}
