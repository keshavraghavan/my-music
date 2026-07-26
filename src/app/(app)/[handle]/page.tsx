import { notFound } from 'next/navigation';
import { PEOPLE_LIST, personByHandle } from '@/domains/music/data/people';
import { ProfileScreen } from './ProfileScreen';

/**
 * `/[handle]` — a shareable page per person, which is what the design's
 * `viewingFriendId` in state could never be.
 *
 * The static export builds one page per seeded handle; Phase 3 makes this a
 * lookup against the database.
 */
export function generateStaticParams() {
  return PEOPLE_LIST.map((person) => ({ handle: person.handle }));
}

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const person = personByHandle(handle);
  if (!person) notFound();
  return <ProfileScreen person={person} />;
}
