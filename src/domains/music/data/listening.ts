import type { FeedItem, ReceiptLine, Track } from '@/types';

/*
 * Seeded listening data: the chart, the receipt, Now Playing and the feed.
 * Phase 6 computes all of this from stored plays; the shapes stay the same.
 */

// prettier-ignore
export const TOP_SONGS: Track[] = [
  { title: 'Amber Line', artist: 'Marigold Static' },
  { title: 'Slow Fade', artist: 'Hollow Coast' },
  { title: 'Rooftop Static', artist: 'The Nightbus' },
  { title: 'Terracotta', artist: 'Coral June' },
  { title: 'Last Train Home', artist: 'Wilder Sun' },
  { title: 'Honeycomb', artist: 'Peach Radio' },
  { title: 'Bodega Light', artist: 'Slow Salt' },
  { title: 'Copper & Rust', artist: 'Meridian Low' },
];

// prettier-ignore
export const TOP_ALBUMS: Track[] = [
  { title: 'Ridgewood Nights', artist: 'Marigold Static' },
  { title: 'Low Tide Radio', artist: 'Hollow Coast' },
  { title: 'Elevated', artist: 'The Nightbus' },
  { title: 'Sundial', artist: 'Coral June' },
  { title: 'Departures', artist: 'Wilder Sun' },
  { title: 'Honeycomb EP', artist: 'Peach Radio' },
];

/** This month's fare receipt: the top five, with time ridden on each. */
export function monthlyReceipt(): ReceiptLine[] {
  return TOP_SONGS.slice(0, 5).map((t, i) => ({
    ...t,
    stop: `0${i + 1}`,
    mins: `${14 - i * 2}m`,
  }));
}

export const NOW_PLAYING = {
  track: 'Terracotta',
  artist: 'Coral June',
  album: 'Sundial',
  progressPct: '43%',
  updated: 'UPDATED JUL 20, 8:57 PM',
} as const;

export const RECEIPT_META = {
  station: 'RIDGEWOOD, QNS',
  date: '07/20/26 8:57PM',
  totalRideTime: '47H 12M',
  month: 'JULY 2026',
} as const;

// prettier-ignore
export const FEED_ITEMS: FeedItem[] = [
  { text: 'Theo K. left you a recommendation — Low Tide Radio.', time: '2H AGO', color: '#3F6B4F' },
  { text: 'Marisol V. added Amber Line to their Top 10.', time: '5H AGO', color: '#B7472A' },
  { text: 'You and Priya D. became friends.', time: '1D AGO', color: '#C9A227' },
  { text: 'Your July chart updated — Terracotta jumped to #4.', time: '2D AGO', color: '#2F5673' },
];

export const PLAYLIST_NAME = 'Rooftop Party 2026';
