import { type DefaultSession, type NextAuthConfig } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { jwtVerify } from 'jose';
import { env } from '@/env';
import { setRefreshTokenCookie } from '@/helpers/cookies';
import { parseJwtExpiration } from '@/helpers/jwt';

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

export const authConfig: NextAuthConfig = {
  secret: env.AUTH_SECRET,
  session: {
    strategy: 'jwt' as const,
    maxAge: parseJwtExpiration(env.JWT_ACCESS_TOKEN_EXPIRATION),
  },
  jwt: {
    maxAge: parseJwtExpiration(env.JWT_ACCESS_TOKEN_EXPIRATION),
    async encode({ token }) {
      return (token?.access_token as string) || '';
    },
    async decode({ token }) {
      if (!token) return null;

      try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(env.AUTH_SECRET));

        // Extract user data from backend JWT payload
        return {
          access_token: token,
          id: payload.sub as string,
          email: payload.email as string,
          name: payload.name as string,
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
            name: data.user.name,
            access_token: data.access_token,
            refresh_token: data.refresh_token,
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
          user.access_token = data.access_token;
          user.refresh_token = data.refresh_token;

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
    async jwt({ token, user, trigger }) {
      if (user?.access_token) {
        if (user.refresh_token) {
          setRefreshTokenCookie(user.refresh_token);
        }

        return {
          access_token: user.access_token,
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
};
