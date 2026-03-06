import { jwtVerify, decodeJwt } from 'jose';

import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { type TokenPayload } from '@fintrack/types/interfaces/token_payload';
import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';
import { consoleLogger } from '@fintrack/common/console_logger/index';
import { type DefaultSession, type NextAuthConfig } from 'next-auth';

export interface AuthEnv {
  AUTH_SECRET: string;
  AUTH_GOOGLE_ID: string;
  AUTH_GOOGLE_SECRET: string;
  API_GATEWAY_URL: string;
  NEXT_PUBLIC_APP_URL: string;
  JWT_REFRESH_TOKEN_EXPIRATION: string;
}

export interface AuthHelpers {
  parseJwtExpiration: (expiration: string) => number;
}

declare module 'next-auth' {
  interface Session {
    accessToken: string;
    expires_at: number;
    user: {
      id: string;
      email: string;
      name: string;
      image: string;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    access_token: string;
    refresh_token: string;
  }
}

export const createAuthConfig = (env: AuthEnv, helpers: AuthHelpers): NextAuthConfig => ({
  secret: env.AUTH_SECRET,
  pages: {
    signIn: AUTH_ROUTES.LOGIN,
    error: AUTH_ROUTES.LOGIN,
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: helpers.parseJwtExpiration(env.JWT_REFRESH_TOKEN_EXPIRATION),
  },
  jwt: {
    maxAge: helpers.parseJwtExpiration(env.JWT_REFRESH_TOKEN_EXPIRATION),
  },
  providers: [
    GoogleProvider({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        accessToken: { label: 'Access Token', type: 'text' },
        refreshToken: { label: 'Refresh Token', type: 'text' },
      },
      async authorize(credentials) {
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
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        if (!account.id_token) {
          consoleLogger.error('Google sign-in missing id_token');
          return false;
        }
        try {
          const response = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/proxy-auth/oauth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken: account.id_token }),
          });

          if (!response.ok) {
            const error = await response.text();
            consoleLogger.error('Backend OAuth error:', error);
            return false;
          }

          const body = await response.json();
          const loginRes = body.data;

          user.id = loginRes.user.id;
          user.email = loginRes.user.email;
          user.image = loginRes.user.avatar;
          user.access_token = loginRes.accessToken;
          user.refresh_token = loginRes.refreshToken;
          user.name = `${loginRes.user.firstName} ${loginRes.user.lastName}`;

          return true;
        } catch (error) {
          consoleLogger.error('OAuth sync failed:', error);
          return false;
        }
      }

      if (account?.provider === 'credentials') {
        return true;
      }

      return false;
    },
    async jwt({ token, user }) {
      // First sign-in — store tokens + expiry
      if (user?.access_token) {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          access_token: user.access_token,
          refresh_token: user.refresh_token,
          expires_at: decodeJwt(user.access_token as string).exp! * 1000,
        };
      }
      // All subsequent calls — pass through unchanged; refresh is handled in middleware
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
        session.accessToken = token.access_token as string;
        session.expires_at = token.expires_at as number;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      const fullUrl = url.startsWith('/') ? `${baseUrl}${url}` : url;
      try {
        const parsed = new URL(fullUrl);
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        if (parsed.origin === baseUrl) return url;
      } catch {
        // Malformed URL — fall through to baseUrl
      }
      return baseUrl;
    },
  },
});
