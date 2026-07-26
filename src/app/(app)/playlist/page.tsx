'use client';

import { Button, Page } from '@/core/ui';
import { PLAYLIST_NAME } from '@/domains/music/data/listening';
import { useAppActions, useAppState } from '@/state/store';
import styles from './playlist.module.css';

/** The shared playlist. Collaboration becomes invite-only in Phase 5. */
export default function PlaylistPage() {
  const { playlistTracks } = useAppState();
  const actions = useAppActions();
  const contributors = new Set(playlistTracks.flatMap((t) => t.addedBy)).size;

  return (
    <Page width="reading">
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>{PLAYLIST_NAME}</h1>
          <p className={styles.subtitle}>SHARED PLAYLIST ｜ {contributors} CONTRIBUTORS</p>
        </div>
        <Button
          variant="solid"
          css="padding:10px 18px;white-space:nowrap"
          onClick={actions.openComposeForPlaylist}
        >
          + ADD TRACK
        </Button>
      </div>

      <ul className={styles.list}>
        {playlistTracks.map((track) => (
          <li key={track.id} className={styles.row}>
            <div className={styles.art} aria-hidden="true" />
            <div className={styles.track}>
              <div className={styles.trackTitle}>{track.title}</div>
              <div className={styles.trackArtist}>{track.artist}</div>
            </div>
            <div className={styles.credit}>
              <span>ADDED BY {track.addedBy.join(' + ').toUpperCase()}</span>
              {track.addedBy.length > 1 && (
                <div className={styles.conflict}>2 PEOPLE ADDED THIS</div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Page>
  );
}
