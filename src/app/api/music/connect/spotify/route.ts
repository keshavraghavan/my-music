import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { canonicalUrl } from '@/core/auth/canonical-url';
import { currentUser } from '@/core/auth/session';

const SCOPES = [
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-read-recently-played',
  'user-top-read',
];

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId || !process.env.SPOTIFY_CLIENT_SECRET || !process.env.TOKEN_ENCRYPTION_KEY) {
    return NextResponse.redirect(
      new URL('/settings/services?music_error=spotify_unavailable', request.url),
    );
  }

  const verifier = randomBytes(48).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const state = randomBytes(24).toString('base64url');
  const callback = canonicalUrl('/api/music/callback/spotify', request.url);
  const authorize = new URL('https://accounts.spotify.com/authorize');
  authorize.search = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: callback,
    scope: SCOPES.join(' '),
    state,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  }).toString();

  const response = NextResponse.redirect(authorize);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api/music/callback/spotify',
    maxAge: 600,
  };
  response.cookies.set('music_spotify_state', state, cookieOptions);
  response.cookies.set('music_spotify_verifier', verifier, cookieOptions);
  return response;
}
