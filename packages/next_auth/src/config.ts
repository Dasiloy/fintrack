import { jwtVerify } from 'jose';

import { type DefaultSession, type NextAuthConfig } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { StandardResponse } from '@fintrack/types/interfaces/server_response';
import type { LoginRes, RefreshTokenRes } from '@fintrack/types/protos/auth/auth';
import { type TokenPayload } from '@fintrack/types/interfaces/token_payload';

export interface AuthEnv {
  AUTH_SECRET: string;
  AUTH_GOOGLE_ID: string;
  AUTH_GOOGLE_SECRET: string;
  API_GATEWAY_URL: string;
  JWT_ACCESS_TOKEN_EXPIRATION: string;
}

export interface AuthHelpers {
  parseJwtExpiration: (expiration: string) => number;
}

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession['user'];
    accessToken: string;
    error?: 'RefreshTokenError';
  }

  interface User {
    id?: string;
    access_token?: string;
    refresh_token?: string;
  }
}

export const createAuthConfig = (env: AuthEnv, helpers: AuthHelpers): NextAuthConfig => ({
  secret: env.AUTH_SECRET,
  session: {
    strategy: 'jwt' as const,
    maxAge: helpers.parseJwtExpiration(env.JWT_ACCESS_TOKEN_EXPIRATION),
  },
  jwt: {
    maxAge: helpers.parseJwtExpiration(env.JWT_ACCESS_TOKEN_EXPIRATION),
  },
  providers: [
    GoogleProvider({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        flow: { label: 'Flow', type: 'text' },
        accessToken: { label: 'Access Token', type: 'text' },
        refreshToken: { label: 'Refresh Token', type: 'text' },
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (credentials.flow === 'post-verify' || credentials.flow === 'post-login') {
          try {
            const res = await jwtVerify(
              credentials.accessToken as string,
              new TextEncoder().encode(env.AUTH_SECRET),
            );
            const payload = res.payload as unknown as TokenPayload;
            return {
              id: payload.id,
              email: payload.email,
              image: payload.avatar,
              access_token: credentials.accessToken as string,
              refresh_token: credentials.refreshToken as string,
              name: `${payload.firstName} ${payload.lastName}`,
            };
          } catch {
            return null;
          }
        }

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch(`${env.API_GATEWAY_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const data: StandardResponse<LoginRes> = await response.json();

          return {
            id: data.data?.user?.id,
            email: data.data?.user?.email,
            image: data.data?.user?.avatar,
            access_token: data.data?.accessToken,
            refresh_token: data.data?.refreshToken,
            name: `${data.data?.user?.firstName} ${data.data?.user?.lastName}`,
          };
        } catch (error) {
          console.error('Login error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const response = await fetch(`${env.API_GATEWAY_URL}/auth/oauth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              image: user.image,
              google_id: account.providerAccountId,
            }),
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Unknown error' }));
            console.error('Backend OAuth error:', error);
            return false;
          }

          const data = await response.json();

          user.id = data.user.id;
          user.email = data.user.eamil;
          user.image = data.user.avatar;
          user.access_token = data.accessToken;
          user.refresh_token = data.refreshToken;
          user.name = `${data.user.firstName} ${data.user.lastName}`;

          return true;
        } catch (error) {
          console.error('OAuth sync failed:', error);
          return false;
        }
      }

      if (account?.provider === 'credentials') {
        return true;
      }

      return false;
    },
    async jwt({ token, user }) {
      // First sign-in — store both tokens + expiry timestamp
      if (user?.access_token) {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          access_token: user.access_token,
          refresh_token: user.refresh_token,
          expires_at:
            Date.now() + helpers.parseJwtExpiration(env.JWT_ACCESS_TOKEN_EXPIRATION) * 1000,
        };
      }

      // Token still valid — pass through unchanged
      if (token.expires_at && Date.now() < (token.expires_at as number)) {
        return token;
      }

      // Access token expired — use refresh_token to get a new one  ← READ here
      try {
        const response = await fetch(`${env.API_GATEWAY_URL}/auth/refresh`, {
          method: 'POST',
          body: JSON.stringify({
            refreshToken: token.refresh_token,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) throw new Error('Refresh failed');

        const data: StandardResponse<RefreshTokenRes> = await response.json();

        return {
          ...token,
          access_token: data.data?.accessToken,
          refresh_token: data.data?.refreshToken,
          expires_at:
            Date.now() + helpers.parseJwtExpiration(env.JWT_ACCESS_TOKEN_EXPIRATION) * 1000,
          error: undefined,
        };
      } catch {
        return { ...token, error: 'RefreshTokenError' };
      }
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
        session.accessToken = token.access_token as string;
        if (token.error === 'RefreshTokenError') {
          session.error = 'RefreshTokenError';
        }
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
});
