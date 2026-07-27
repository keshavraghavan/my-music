import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { currentUser } from '@/core/auth/session';
import { encryptToken } from '@/core/auth/token-crypto';
import { getDatabase } from '@/core/db/client';
import { serviceConnections } from '@/domains/music/db/schema/music';
import { syncListeningHistory } from '@/domains/music/provider-service';

function destination(request: Request, value?: string) {
  const url = new URL('/settings/services', request.url);
  if (value) url.searchParams.set('music_error', value);
  return url;
}

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));
  const url = new URL(request.url);
  const jar = await cookies();
  const expectedState = jar.get('music_spotify_state')?.value;
  const verifier = jar.get('music_spotify_verifier')?.value;
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  if (!code || !state || state !== expectedState || !verifier) {
    return NextResponse.redirect(destination(request, 'invalid_oauth_state'));
  }
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const database = getDatabase();
  if (!clientId || !clientSecret || !database) {
    return NextResponse.redirect(destination(request, 'spotify_unavailable'));
  }

  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: new URL('/api/music/callback/spotify', request.url).toString(),
      code_verifier: verifier,
    }),
    cache: 'no-store',
  });
  if (!tokenResponse.ok) {
    return NextResponse.redirect(destination(request, 'spotify_token_exchange'));
  }
  const token = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
  };
  await database
    .insert(serviceConnections)
    .values({
      userId: user.id,
      provider: 'spotify',
      accessTokenEncrypted: encryptToken(token.access_token),
      refreshTokenEncrypted: token.refresh_token ? encryptToken(token.refresh_token) : null,
      expiresAt: new Date(Date.now() + token.expires_in * 1000),
      scopes: token.scope?.split(' ') ?? [],
      reconnectRequired: false,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [serviceConnections.userId, serviceConnections.provider],
      set: {
        accessTokenEncrypted: encryptToken(token.access_token),
        ...(token.refresh_token
          ? { refreshTokenEncrypted: encryptToken(token.refresh_token) }
          : {}),
        expiresAt: new Date(Date.now() + token.expires_in * 1000),
        scopes: token.scope?.split(' ') ?? [],
        reconnectRequired: false,
        updatedAt: new Date(),
      },
    });

  try {
    await syncListeningHistory(user.id, true);
  } catch {
    // The connection is still useful if Spotify history is temporarily down;
    // the next sync will retry and auth failures mark it for reconnection.
  }
  const response = NextResponse.redirect(destination(request));
  const expired = { path: '/api/music/callback/spotify', maxAge: 0 };
  response.cookies.set('music_spotify_state', '', expired);
  response.cookies.set('music_spotify_verifier', '', expired);
  return response;
}
