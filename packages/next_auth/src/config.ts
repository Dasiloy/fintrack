import { jwtVerify } from 'jose';

import { type DefaultSession, type NextAuthConfig } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

import { type TokenPayload } from '@fintrack/types/interfaces/token_payload';

export interface AuthEnv {
  AUTH_SECRET: string;
  AUTH_GOOGLE_ID: string;
  AUTH_GOOGLE_SECRET: string;
  API_GATEWAY_URL: string;
  JWT_ACCESS_TOKEN_EXPIRATION: string;
}

export interface AuthHelpers {
  setRefreshTokenCookie: (token: string) => Promise<void> | void;
  parseJwtExpiration: (expiration: string) => number;
}

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession['user'];
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
    async encode({ token }) {
      return (token?.access_token as string) || '';
    },
    async decode({ token }) {
      if (!token) return null;

      try {
        const res = await jwtVerify(token, new TextEncoder().encode(env.AUTH_SECRET));
        const payload = res.payload as unknown as TokenPayload;

        return {
          access_token: token,
          id: payload.id as string,
          email: payload.email as string,
          image: payload.avatar as string,
          name: (payload.firstName as string).concat(' ', payload.lastName),
        };
      } catch (error) {
        console.error('JWT decode error:', error);
        return null;
      }
    },
  },
  providers: [
    GoogleProvider({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
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

          const data = await response.json();

          return {
            id: data.user.id,
            email: data.user.email,
            image: data.user.avatar,
            access_token: data.accessToken,
            refresh_token: data.refreshToken,
            name: data.user.firstName.concat(' ', data.user.lastName),
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
          user.name = data.user.firstName.concat(' ', data.user.lastName);

          return true;
        } catch (error) {
          console.error('OAuth sync failed:', error);
          return false;
        }
      }

      if (account?.provider === 'credentials') {
        // can we do direct redirect to /verifyEmail here??
        return true;
      }

      return false;
    },
    async jwt({ token, user }) {
      if (user?.access_token) {
        if (user.refresh_token) {
          await helpers.setRefreshTokenCookie(user.refresh_token);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          access_token: user.access_token,
        };
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
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
