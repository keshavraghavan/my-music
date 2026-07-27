import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireOnboardedUser } from '@/core/auth/session';
import { loadPersonByHandle } from '@/core/db/read-model';
import { canUserAccessProfileShell } from '@/core/graph/authorization';
import { ProfileScreen } from './ProfileScreen';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const person = await loadPersonByHandle(handle);
  if (!person) return { title: 'Profile not found' };
  const description = person.private
    ? `@${person.handle} has a private MyMusic page.`
    : `${person.name}'s listening page — charts, current plays, and recommendations.`;
  return {
    title: person.name,
    description,
    alternates: { canonical: `/${person.handle}` },
    openGraph: {
      title: `${person.name} on MyMusic`,
      description,
      type: 'profile',
      url: `/${person.handle}`,
    },
  };
}

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
  if (!person || !(await canUserAccessProfileShell(viewer.id, person.id))) notFound();
  return <ProfileScreen person={person} />;
}
