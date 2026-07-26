import type { Person, PersonId } from '@/types';

/**
 * The seeded directory. Ported verbatim from the design source (Retro Music
 * Social); Phase 3 replaces it with a seed script over the real schema.
 *
 * Left unformatted on purpose: one person per line reads as the table it is.
 */
// prettier-ignore
export const PEOPLE: Record<PersonId, Person> = {
  theok: { id: 'theok', name: 'Theo K.', handle: 'theok_fm', initials: 'TK', color: '#3F6B4F', service: 'Apple Music', city: 'Bushwick, Brooklyn', private: false },
  samo: { id: 'samo', name: 'Sam O.', handle: 'sam_radio', initials: 'SO', color: '#2F5673', service: 'Spotify', city: 'Astoria, Queens', private: true },
  marisolv: { id: 'marisolv', name: 'Marisol V.', handle: 'marisolv', initials: 'MV', color: '#B7472A', service: 'Spotify', city: 'Sunset Park, Brooklyn', private: false },
  priyad: { id: 'priyad', name: 'Priya D.', handle: 'priyad', initials: 'PD', color: '#C9A227', service: 'Apple Music', city: 'Jackson Heights, Queens', private: false },
  devonp: { id: 'devonp', name: 'Devon P.', handle: 'devonp', initials: 'DP', color: '#3F6B4F', service: 'Spotify', city: 'Crown Heights, Brooklyn', private: false },
  wrenl: { id: 'wrenl', name: 'Wren L.', handle: 'wrenl', initials: 'WL', color: '#2F5673', service: 'Apple Music', city: 'Inwood, Manhattan', private: false },
  irisn: { id: 'irisn', name: 'Iris N.', handle: 'irisn', initials: 'IN', color: '#C9A227', service: 'Spotify', city: 'Greenpoint, Brooklyn', private: false },
  cassr: { id: 'cassr', name: 'Cass R.', handle: 'cassr', initials: 'CR', color: '#B7472A', service: 'Apple Music', city: 'Woodside, Queens', private: false },
};

/** The signed-in user, until Phase 4 makes accounts real. */
export const ME = {
  name: 'Juno Reyes',
  handle: 'junotapes',
  initials: 'JR',
  color: '#B7472A',
  city: 'Ridgewood, Queens',
  bio: 'Vinyl hoarder. Sunday soul. Currently on a slow-jam kick.',
} as const;

/** Handles that are already spoken for, including the signed-in user's own. */
export const DIRECTORY_HANDLES: string[] = Object.values(PEOPLE)
  .map((p) => p.handle)
  .concat(['junotapes']);

export const PEOPLE_LIST: Person[] = Object.values(PEOPLE);

/** True when `id` names someone in the directory — narrows a confirm payload. */
export function isPersonId(id: string): id is PersonId {
  return Object.prototype.hasOwnProperty.call(PEOPLE, id);
}

/**
 * True when the handle already belongs to someone. `ownHandle` is exempt, so
 * saving your profile without changing your handle is not a clash.
 */
export function isHandleTaken(handle: string, ownHandle?: string): boolean {
  return DIRECTORY_HANDLES.includes(handle) && handle !== ownHandle;
}

/** Resolves the `/[handle]` route segment to a person, or undefined. */
export function personByHandle(handle: string): Person | undefined {
  return PEOPLE_LIST.find((p) => p.handle === handle);
}
