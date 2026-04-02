'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getAnalyticsSocket } from '@/lib/socket/sockets';
import { consoleLogger } from '@fintrack/common/console_logger/index';
import type { Socket } from 'socket.io-client';

/**
 * @description Hook to get the analytics data
 *
 * @param {number} month - 0-indexed month (0 = January)
 * @param {number} year  - Cannot exceed current year
 *
 * @example
 * const { socketRef } = useAnalytics(month, year);
 * socketRef.current?.emit(GET_ANALYTICS_DATA, { type: 'spending_by_category', month, year });
 */
export function useAnalytics(month: number, year: number) {
  const pathname = usePathname();

  // const analyticsSocket = useRef<Socket>(getAnalyticsSocket());

  useEffect(() => {
    // console.log('analyticsSocket', analyticsSocket.current);
    // analyticsSocket.current.connect();
    // analyticsSocket.current.on('connect', () => {
    //   consoleLogger.log('Connected to analytics socket');
    //   analyticsSocket.current.emit(GET_ANALYTICS_DATA, {
    //     type: 'monthly_summary',
    //     month,
    //     year,
    //     pathname,
    //   });
    // });
    // analyticsSocket.current.on(GET_ANALYTICS_DATA, ({ type, data }) => {
    //   // update your state/store
    // });
    // analyticsSocket.current.on('connect_error', (err) => {
    //   if (err.message === 'TOKEN_EXPIRED') {
    //     analyticsSocket.current.connect();
    //   }
    // });
    // analyticsSocket.current.on('disconnect', () => {
    //   consoleLogger.log('Disconnected from analytics socket event');
    // });
    // return () => {
    //   analyticsSocket.current.disconnect();
    // };
  }, []);
}
