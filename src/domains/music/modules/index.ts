import { createModuleRegistry } from '@/core/page-builder';
import { accent } from '@/core/styles/accents';
import { ChartModule } from './ChartModule';
import { FeedModule } from './FeedModule';
import { FriendsListModule } from './FriendsListModule';
import { MonthlyModule } from './MonthlyModule';
import { NowPlayingModule } from './NowPlayingModule';
import { ReceiptModule } from './ReceiptModule';
import { RecsModule } from './RecsModule';

/**
 * The music domain's page modules, registered into core/page-builder.
 *
 * This list is the whole of what makes MyMusic a *music* site's home page —
 * a fork swaps it for its own and inherits drag, toggle, expand and density
 * unchanged. See docs/ROADMAP.md — Part 2, seam 2.
 */
export const musicModules = createModuleRegistry([
  { key: 'feed', label: 'Line Updates (Feed)', accent: accent(0), Component: FeedModule },
  { key: 'nowPlaying', label: 'Now Playing', accent: accent(1), Component: NowPlayingModule },
  { key: 'chart', label: 'Top 50/100 Chart', accent: accent(2), Component: ChartModule },
  { key: 'monthly', label: "This Month's Top 10", accent: accent(3), Component: MonthlyModule },
  { key: 'receipt', label: 'Transit Receipt', accent: accent(4), Component: ReceiptModule },
  { key: 'recs', label: 'Friend Recommendations', accent: accent(5), Component: RecsModule },
  { key: 'friendsList', label: 'Friends List', accent: accent(6), Component: FriendsListModule },
]);
