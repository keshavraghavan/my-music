import { DrizzleAdapter } from '@auth/drizzle-adapter';
import NextAuth from 'next-auth';
import Spotify from 'next-auth/providers/spotify';
import { getDatabase } from '@/core/db/client';
import { createInitialProfile } from '@/core/auth/profile';
import { magicLinkProvider } from '@/core/auth/email-provider';
import { withEncryptedOAuthTokens } from '@/core/auth/encrypted-adapter';
import { shouldTrustAuthHost } from '@/core/auth/trusted-host';

const database = getDatabase();
const providers = [];

if (database) providers.push(magicLinkProvider());
if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
  if (!process.env.TOKEN_ENCRYPTION_KEY) {
    throw new Error('TOKEN_ENCRYPTION_KEY is required when Spotify OAuth is configured');
  }
  providers.push(
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      // Identity access stays intentionally narrow. Listening permissions use
      // the separate PKCE flow under /api/music/connect/spotify.
      authorization: { params: { scope: 'user-read-email' } },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...(database ? { adapter: withEncryptedOAuthTokens(DrizzleAdapter(database)) } : {}),
  providers,
  pages: { signIn: '/login', verifyRequest: '/login/check-email' },
  session: { strategy: database ? 'database' : 'jwt' },
  trustHost: shouldTrustAuthHost({
    nodeEnv: process.env.NODE_ENV,
    authTrustHost: process.env.AUTH_TRUST_HOST,
    authUrl: process.env.AUTH_URL,
    e2e: process.env.MYMUSIC_E2E,
  }),
  callbacks: {
    session({ session, user }) {
      if (session.user && user) session.user.id = user.id;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id) {
        await createInitialProfile({
          id: user.id,
          name: user.name ?? null,
          email: user.email ?? null,
        });
      }
    },
  },
});
