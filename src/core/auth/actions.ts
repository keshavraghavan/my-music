'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { signIn, signOut } from '@/auth';
import { assertRateLimit } from './rate-limit';

export async function requestMagicLink(formData: FormData) {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect('/login?error=email');

  const requestHeaders = await headers();
  const address = requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  assertRateLimit(`magic-link:${address}:${email}`, { limit: 5, windowMs: 15 * 60_000 });
  await signIn('email', { email, redirectTo: '/home' });
}

export async function signInWithSpotify() {
  assertRateLimit('oauth:spotify', { limit: 20, windowMs: 60_000 });
  await signIn('spotify', { redirectTo: '/home' });
}

export async function logout() {
  await signOut({ redirectTo: '/' });
}
