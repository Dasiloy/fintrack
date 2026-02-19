import { env } from '@/env';
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

/**
 * Helper to get a cookie value by name on the client side.
 */
function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
}

/**
 * Robust Axios client for the Web application.
 * Configured with base URL and automatic token attachment.
 */
export const axiosClient: AxiosInstance = axios.create({
  baseURL: `${env.NEXT_PUBLIC_API_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor: Attach Bearer token from cookies if available.
 */
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getCookie('next-auth.session-token');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

/**
 * Response Interceptor: Handle global error cases (e.g., 401 unauthorized).
 * Implementation: Automatic Token Refresh & Retry.
 */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    /**
     * IF ERROR IS 401 (UNAUTHORIZED)
     * AND this isn't already a retry attempt.
     */
    if (error.response?.status === 401 && !originalRequest._retry) {
      // CASE A: Someone else is already fetching a new token.
      if (isRefreshing) {
        /**
         * Creating a "Waiting Room":
         * We return a new Promise that doesn't resolve yet.
         * We store the 'resolve' function in our queue so we can wake it up later.
         */
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            // Once the leading request wakes us up with a token, we retry!
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // CASE B: We are the first ones to fail! We lead the refresh.
      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getCookie('refresh-token');

      try {
        /**
         * REFRESH CALL: We use NATIVE FETCH here.
         * Why? To bypass Axios interceptors and prevent infinite loops
         * if the refresh call itself fails with a 401.
         */
        const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) throw new Error('Refresh failed');
        const { access_token: accessToken } = await response.json();

        // 1. Tell everyone in the "Waiting Room" (queue) to proceed with the new token.
        processQueue(null, accessToken);

        // 2. Update our own failed request and retry it.
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return axiosClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, tell everyone in the queue to fail too.
        processQueue(refreshError, null);

        // Redirect to login (Client-side only check)
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
