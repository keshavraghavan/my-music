'use client';

import { ModuleCard } from '@/core/page-builder';
import { Button, TextLink } from '@/core/ui';
import { routes } from '@/core/routes';
import sx from '@/sx';
import { useAppActions, useAppState } from '@/state/client-store';
import styles from './modules.module.css';

const CARD_CSS = 'border:1px solid rgba(30,27,24,0.3);padding:22px 24px 18px';

export function NowPlayingModule() {
  const { connected, nowPlayingSource, nowPlaying } = useAppState();
  const actions = useAppActions();
  const noService = !connected.mock && !connected.spotify && !connected.apple;
  const bothConnected = connected.spotify && connected.apple;

  return (
    <ModuleCard moduleKey="nowPlaying" label="Now Playing" css={CARD_CSS}>
      {noService ? (
        <>
          <h2 className={styles.title}>Now Playing</h2>
          <div style={sx('padding:30px 0;text-align:center')}>
            <div style={sx("font:400 13px/1.6 'Arimo';color:#6b6156;margin-bottom:10px")}>
              Connect Spotify or Apple Music to show what you&apos;re listening to.
            </div>
            <TextLink href={routes.settings('services')} css="color:#3F6B4F">
              CONNECT A SERVICE →
            </TextLink>
          </div>
        </>
      ) : (
        <>
          <h2 className="sr-only">Now Playing</h2>
          <div
            style={sx(
              'display:flex;align-items:center;justify-content:space-between;margin-bottom:2px',
            )}
          >
            <div style={sx('display:flex;align-items:center;gap:7px')}>
              <span style={sx("font:700 12px 'Arimo'")}>
                {nowPlayingSource === 'spotify'
                  ? 'Spotify'
                  : nowPlayingSource === 'apple'
                    ? 'Apple Music'
                    : 'Demo Library'}
              </span>
              <span
                aria-hidden="true"
                style={sx(
                  'width:6px;height:6px;border-radius:50%;background:#3F6B4F;display:inline-block;box-shadow:0 0 0 3px rgba(63,107,79,0.18);margin-left:4px',
                )}
              />
              <span
                style={sx("font:700 10.5px 'JetBrains Mono';color:#3F6B4F;letter-spacing:0.06em")}
              >
                PLAYING NOW
              </span>
            </div>
          </div>
          {bothConnected && (
            <div
              style={sx(
                "border:1px solid #C9A227;background:rgba(201,162,39,0.1);padding:8px 12px;margin:10px 0;font:600 11px 'Arimo'",
              )}
            >
              Spotify and Apple Music disagree on what&apos;s playing — showing:
              <Button
                variant="link"
                css="margin-left:4px;font:700 11px 'JetBrains Mono'"
                onClick={() => actions.setNowPlayingSource('spotify')}
              >
                SPOTIFY
              </Button>{' '}
              /
              <Button
                variant="link"
                css="font:700 11px 'JetBrains Mono'"
                onClick={() => actions.setNowPlayingSource('apple')}
              >
                APPLE
              </Button>
            </div>
          )}
          <div style={sx('height:1px;background:rgba(30,27,24,0.3);margin:12px 0 18px')} />
          <div style={sx('display:flex;gap:18px;align-items:flex-start')}>
            <div
              aria-hidden="true"
              style={sx(
                'width:76px;height:76px;border-radius:8px;background:linear-gradient(135deg,#C9A227,#B7472A);flex:none',
              )}
            />
            <div style={sx('flex:1;min-width:0;padding-top:2px')}>
              <div
                style={sx(
                  "font:400 22px/1.2 'Tinos';white-space:nowrap;overflow:hidden;text-overflow:ellipsis",
                )}
              >
                {nowPlaying.track}
              </div>
              <div
                style={sx(
                  "font:600 11.5px 'JetBrains Mono';color:#6b6156;letter-spacing:0.03em;margin-top:6px;text-transform:uppercase",
                )}
              >
                {nowPlaying.artist}
              </div>
              <div style={sx("font:400 11.5px 'JetBrains Mono';color:#6b6156;font-style:italic")}>
                {nowPlaying.album}
              </div>
            </div>
          </div>
          <div style={sx('margin-top:16px')}>
            <div
              role="progressbar"
              aria-label={`${nowPlaying.track} progress`}
              aria-valuenow={parseInt(nowPlaying.progressPct, 10)}
              style={sx('height:3px;background:rgba(30,27,24,0.12)')}
            >
              <div style={sx(`height:100%;width:${nowPlaying.progressPct};background:#3F6B4F`)} />
            </div>
          </div>
          <div
            style={sx(
              'height:1px;background:repeating-linear-gradient(90deg,rgba(30,27,24,0.3) 0 3px,transparent 3px 7px);margin:16px 0 12px',
            )}
          />
          <div style={sx('display:flex;justify-content:space-between;align-items:center')}>
            <span style={sx("font:500 10.5px 'JetBrains Mono';color:#6b6156")}>
              {nowPlaying.updated}
            </span>
          </div>
        </>
      )}
    </ModuleCard>
  );
}
