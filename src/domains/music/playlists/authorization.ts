export interface PlaylistMembership {
  role: 'owner' | 'collaborator';
  status: 'invited' | 'accepted' | 'declined';
}

export function canMutatePlaylist({
  userId,
  ownerId,
  membership,
}: {
  userId: string;
  ownerId: string;
  membership?: PlaylistMembership | null;
}) {
  if (userId === ownerId) return true;
  return membership?.role === 'collaborator' && membership.status === 'accepted';
}
