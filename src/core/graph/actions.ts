'use server';

import { revalidatePath } from 'next/cache';
import { requireOnboardedUser } from '@/core/auth/session';
import { getDatabase } from '@/core/db/client';
import { routes } from '@/core/routes';
import { GraphMutationError, GraphRepository, type FollowResult } from './repository';

export type GraphActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

function repository() {
  const database = getDatabase();
  if (!database) throw new Error('Social actions require DATABASE_URL.');
  return new GraphRepository(database);
}

function refreshSocialPages() {
  revalidatePath(routes.friends);
  revalidatePath(routes.home);
  revalidatePath(routes.notifications);
}

async function runGraphAction<T>(
  work: (userId: string) => Promise<T>,
): Promise<GraphActionResult<T>> {
  try {
    const user = await requireOnboardedUser();
    const data = await work(user.id);
    refreshSocialPages();
    return { ok: true, data };
  } catch (error) {
    if (error instanceof GraphMutationError) return { ok: false, error: error.message };
    console.error('Social graph action failed', error);
    return { ok: false, error: 'That change could not be saved. Please try again.' };
  }
}

export async function followUser(targetUserId: string): Promise<GraphActionResult<FollowResult>> {
  return runGraphAction((userId) => repository().follow(userId, targetUserId));
}

export async function cancelFollowRequest(targetUserId: string): Promise<GraphActionResult> {
  return runGraphAction((userId) => repository().cancelRequest(userId, targetUserId));
}

export async function acceptFollowRequest(requesterId: string): Promise<GraphActionResult> {
  return runGraphAction((userId) => repository().acceptRequest(userId, requesterId));
}

export async function declineFollowRequest(requesterId: string): Promise<GraphActionResult> {
  return runGraphAction((userId) => repository().declineRequest(userId, requesterId));
}

export async function unfollowUser(targetUserId: string): Promise<GraphActionResult> {
  return runGraphAction((userId) => repository().unfollow(userId, targetUserId));
}

export async function blockUser(targetUserId: string): Promise<GraphActionResult> {
  return runGraphAction((userId) => repository().block(userId, targetUserId));
}
