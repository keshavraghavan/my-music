import type { ProviderPlay } from './providers';

export interface RankedTrack {
  providerId: string;
  title: string;
  artist: string;
  album: string;
  playCount: number;
  msPlayed: number;
  rank: number;
  previousRank: number | null;
  movement: number | null;
}

function totals(plays: ProviderPlay[]) {
  const result = new Map<string, Omit<RankedTrack, 'rank' | 'previousRank' | 'movement'>>();
  for (const play of plays) {
    const current = result.get(play.track.providerId);
    result.set(play.track.providerId, {
      providerId: play.track.providerId,
      title: play.track.title,
      artist: play.track.artist,
      album: play.track.album,
      playCount: (current?.playCount ?? 0) + 1,
      msPlayed: (current?.msPlayed ?? 0) + play.msPlayed,
    });
  }
  return [...result.values()].sort(
    (a, b) =>
      b.playCount - a.playCount || b.msPlayed - a.msPlayed || a.title.localeCompare(b.title),
  );
}

export function rankTracks(current: ProviderPlay[], previous: ProviderPlay[] = []): RankedTrack[] {
  const priorRanks = new Map(
    totals(previous).map((item, index) => [item.providerId, index + 1] as const),
  );
  return totals(current).map((item, index) => {
    const rank = index + 1;
    const previousRank = priorRanks.get(item.providerId) ?? null;
    return {
      ...item,
      rank,
      previousRank,
      movement: previousRank === null ? null : previousRank - rank,
    };
  });
}

function dateKey(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}`;
}

export function aggregateMonthlyReceipt(plays: ProviderPlay[], timezone: string, month: string) {
  const matching = plays.filter((play) => dateKey(play.playedAt, timezone) === month);
  const tracks = totals(matching);
  return {
    month,
    timezone,
    playCount: matching.length,
    totalMs: matching.reduce((sum, play) => sum + play.msPlayed, 0),
    tracks: tracks.slice(0, 5),
  };
}
