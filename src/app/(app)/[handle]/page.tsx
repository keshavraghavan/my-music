import { notFound } from 'next/navigation';
import { loadPersonByHandle } from '@/core/db/read-model';
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
  const person = await loadPersonByHandle(handle);
  if (!person) notFound();
  return <ProfileScreen person={person} />;
}
