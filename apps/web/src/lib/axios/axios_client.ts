import isOnline from 'is-online';
import { getSession } from 'next-auth/react';
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import { env } from '@/env';
import { INTERNET_CONNECTION_ERROR } from '@fintrack/types/constants/network.constants';

export const axiosClient: AxiosInstance = axios.create({
  baseURL: `${env.NEXT_PUBLIC_APP_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor: Attach Bearer token from NextAuth session.
 * getSession() triggers the NextAuth jwt callback which auto-refreshes
 * the access token if expired — no manual refresh needed here.
 */
axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const online = await isOnline();
    if (!online) {
      return Promise.reject(new Error(INTERNET_CONNECTION_ERROR));
    }

    // Pre-auth proxy routes use cookie-based auth — no Bearer token needed
    if (config.url?.startsWith('/proxy-auth/')) {
      return config;
    }

    const session = await getSession();

    if (session?.error === 'RefreshTokenError') {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(new Error('Session expired'));
    }

    if (session?.accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response Interceptor: On 401, retry once with a fresh session.
 * This handles the rare race where the token expired between the request
 * interceptor running and the backend processing the request.
 */
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Pre-auth proxy routes use cookie-based auth — don't redirect to login on 401
    const isPreAuthRoute = originalRequest.url?.startsWith('/proxy-auth/');

    if (error.response?.status === 401 && !originalRequest._retry && !isPreAuthRoute) {
      originalRequest._retry = true;

      const session = await getSession();

      if (!session?.accessToken || session.error === 'RefreshTokenError') {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
      return axiosClient(originalRequest);
    }

    return Promise.reject(error);
  },
);
