import isOnline from 'is-online';
import { getSession } from 'next-auth/react';
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import { env } from '@/env';
import { INTERNET_CONNECTION_ERROR } from '@fintrack/types/constants/network.constants';
import { AUTH_ROUTES, STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';

const PUBLIC_PATHS = new Set([...Object.values(AUTH_ROUTES), ...Object.values(STATIC_ROUTES)]);

function isPublicPage(): boolean {
  if (typeof window === 'undefined') return false;
  const { pathname } = window.location;
  return (
    PUBLIC_PATHS.has(pathname) || Array.from(PUBLIC_PATHS).some((p) => pathname.startsWith(p + '/'))
  );
}

export const axiosClient: AxiosInstance = axios.create({
  baseURL: `${env.NEXT_PUBLIC_APP_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const online = await isOnline();
    if (!online) {
      return Promise.reject(new Error(INTERNET_CONNECTION_ERROR));
    }

    // Pre-auth proxy routes use cookie-based auth — no Bearer token needed
    // Public/auth pages don't need a session — skip getSession() entirely
    if (config.url?.startsWith('/proxy-auth/') || isPublicPage()) {
      return config;
    }

    const session = await getSession();
    if (session?.accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// On 401, only refresh when the error is a TOKEN_EXPIRED response from the
// API gateway guard. Any other 401 (wrong credentials, invalid token, auth
// failures) is passed through without a refresh to avoid redundant calls.
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Pre-auth proxy routes use cookie-based auth — never refresh on 401
    const isPreAuthRoute = originalRequest.url?.startsWith('/proxy-auth/');
    const isExpiredToken = error.response?.data?.message === 'TOKEN_EXPIRED';

    if (
      error.response?.status === 401 &&
      isExpiredToken &&
      !originalRequest._retry &&
      !isPreAuthRoute
    ) {
      originalRequest._retry = true;

      const refreshRes = await fetch('/api/proxy-auth/refresh', { method: 'POST' });
      if (!refreshRes.ok) {
        if (typeof window !== 'undefined') {
          window.location.href = AUTH_ROUTES.LOGIN;
        }
        return Promise.reject(error);
      }

      const { accessToken } = await refreshRes.json();
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return axiosClient(originalRequest);
    }

    return Promise.reject(error);
  },
);
