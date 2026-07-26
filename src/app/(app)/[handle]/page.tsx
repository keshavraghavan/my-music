import { notFound } from 'next/navigation';
import { requireOnboardedUser } from '@/core/auth/session';
import { loadPersonByHandle } from '@/core/db/read-model';
import { canUserViewProfile } from '@/core/graph/authorization';
import { ProfileScreen } from './ProfileScreen';

/**
 * `/[handle]` — a shareable page per person, which is what the design's
 * `viewingFriendId` in state could never be.
 *
 * Phase 3 resolves this route from Postgres on the server. The no-env fallback
 * resolves the same seeded handles so a fresh clone still works.
 */
export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const viewer = await requireOnboardedUser();
  const person = await loadPersonByHandle(handle);
  if (!person || !(await canUserViewProfile(viewer.id, person.id))) notFound();
  return <ProfileScreen person={person} />;
}
