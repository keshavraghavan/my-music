import type { Track } from '@/types';

/**
 * The catalogue the compose sheet searches. Phase 6 replaces this with
 * `MusicProvider.search()` — the mock adapter keeps returning exactly this.
 */
export const TRACK_POOL: Track[] = [
  { title: 'Terracotta', artist: 'Coral June' },
  { title: 'Amber Line', artist: 'Marigold Static' },
  { title: 'Honeycomb', artist: 'Peach Radio' },
  { title: 'Slow Fade', artist: 'Hollow Coast' },
  { title: 'Rooftop Static', artist: 'The Nightbus' },
  { title: 'Bodega Light', artist: 'Slow Salt' },
  { title: 'Copper & Rust', artist: 'Meridian Low' },
  { title: 'Last Train Home', artist: 'Wilder Sun' },
];

export function filterTracks(query: string, pool: Track[] = TRACK_POOL): Track[] {
  if (!query) return pool;
  const q = query.toLowerCase();
  return pool.filter(
    (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q),
  );
}
