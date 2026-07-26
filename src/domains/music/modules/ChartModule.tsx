'use client';

import { ModuleCard } from '@/core/page-builder';
import { accent } from '@/core/styles/accents';
import { SegmentedControl, SegmentedOption } from '@/core/ui';
import sx from '@/sx';
import { useAppActions, useAppState } from '@/state/client-store';
import styles from './modules.module.css';

const CARD_CSS = 'border:1px solid rgba(30,27,24,0.3);padding:22px 24px';

export function ChartModule() {
  const { connected, chartTab, topSongs, topAlbums } = useAppState();
  const actions = useAppActions();
  const noService = !connected.spotify && !connected.apple;
  const items = chartTab === 'songs' ? topSongs : topAlbums;

  return (
    <ModuleCard moduleKey="chart" label="Top 50 chart" css={CARD_CSS}>
      {noService ? (
        <>
          <h2 className={styles.title}>Top 50 — The Chart</h2>
          <div
            style={sx("padding:26px 0;text-align:center;font:400 13px/1.6 'Arimo';color:#6b6156")}
          >
            No listening data yet. Charts build once a service is connected.
          </div>
        </>
      ) : (
        <>
          <div
            style={sx(
              'display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:10px;flex-wrap:wrap',
            )}
          >
            <h2 className={styles.title}>Top 50 — The Chart</h2>
            <SegmentedControl label="Chart view">
              <SegmentedOption
                selected={chartTab === 'songs'}
                onSelect={() => actions.setChartTab('songs')}
              >
                SONGS
              </SegmentedOption>
              <SegmentedOption
                selected={chartTab === 'albums'}
                onSelect={() => actions.setChartTab('albums')}
              >
                ALBUMS
              </SegmentedOption>
            </SegmentedControl>
          </div>
          <ol className={styles.list}>
            {items.map((item, i) => (
              <li key={item.title} className={styles.row}>
                <span
                  aria-hidden="true"
                  style={sx(
                    `width:26px;height:26px;border-radius:50%;background:${accent(i)};color:#F2ECDF;display:flex;align-items:center;justify-content:center;font:700 12px 'Arimo';flex:none`,
                  )}
                >
                  {i + 1}
                </span>
                <span className={styles.trackName}>{item.title}</span>
                <span className={styles.byline}>{item.artist}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </ModuleCard>
  );
}
