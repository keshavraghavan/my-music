import { and, ne, sql } from 'drizzle-orm';
import { profiles } from '@/core/db/schema';
import { getDatabase } from '@/core/db/client';

const HANDLE_RE = /^[a-z0-9_]{3,24}$/;
const COLORS = ['#3F6B4F', '#B7472A', '#315A72', '#C49A2E'] as const;

export function normalizeHandle(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9_]/g, '')
    .slice(0, 24);
}

export function isValidHandle(value: string): boolean {
  return HANDLE_RE.test(value);
}

export async function isHandleAvailable(handle: string, exceptUserId?: string): Promise<boolean> {
  const normalized = normalizeHandle(handle);
  if (!isValidHandle(normalized)) return false;
  const database = getDatabase();
  if (!database) return false;

  const condition = exceptUserId
    ? and(sql`lower(${profiles.handle}) = ${normalized}`, ne(profiles.userId, exceptUserId))
    : sql`lower(${profiles.handle}) = ${normalized}`;
  const [match] = await database
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(condition)
    .limit(1);
  return !match;
}

export function initialsFor(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
  return initials || '?';
}

export async function createInitialProfile(user: {
  id: string;
  name?: string | null;
  email?: string | null;
}) {
  const database = getDatabase();
  if (!database) return;

  const name = user.name?.trim() || user.email?.split('@')[0] || 'New Listener';
  const base = normalizeHandle(user.email?.split('@')[0] || name) || 'listener';
  let handle = base.length >= 3 ? base : `${base}music`;
  let suffix = 1;
  while (!(await isHandleAvailable(handle))) {
    suffix += 1;
    handle = `${base.slice(0, Math.max(3, 24 - String(suffix).length))}${suffix}`;
  }

  const colorIndex = [...user.id].reduce((total, character) => total + character.charCodeAt(0), 0);
  await database
    .insert(profiles)
    .values({
      userId: user.id,
      handle,
      displayName: name,
      initials: initialsFor(name),
      color: COLORS[colorIndex % COLORS.length] ?? COLORS[0],
    })
    .onConflictDoNothing();
}
