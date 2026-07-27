'use client';

import { useState } from 'react';
import { routes } from '@/core/routes';
import { Avatar, Button, Field, Page, SegmentedControl, SegmentedLink, Toggle } from '@/core/ui';
import { isHandleTaken } from '@/domains/music/data/people';
import { AvatarUpload } from '@/core/identity/AvatarUpload';
import { useAppActions, useAppState } from '@/state/client-store';
import type { NotifPrefKey, ServiceKey, SettingsTab } from '@/types';
import styles from './settings.module.css';

const TABS: { key: SettingsTab; label: string }[] = [
  { key: 'account', label: 'ACCOUNT' },
  { key: 'services', label: 'SERVICES' },
  { key: 'privacy', label: 'PRIVACY' },
  { key: 'notifs', label: 'NOTIFICATIONS' },
];

const SERVICES: { key: ServiceKey; name: string; badge: string; color: string }[] = [
  { key: 'spotify', name: 'Spotify', badge: 'S', color: '#3F6B4F' },
  { key: 'apple', name: 'Apple Music', badge: 'A', color: '#B7472A' },
];

/**
 * The connect and callback routes redirect back here with a `music_error`
 * code. Anything not listed falls back to the generic line rather than showing
 * a raw code — but every code the routes can emit is spelled out.
 */
const MUSIC_ERRORS: Record<string, string> = {
  spotify_unavailable:
    'Spotify is not configured for this site yet, so there is nothing to connect to.',
  connection_cancelled: 'You cancelled before granting access, so nothing was connected.',
  invalid_oauth_state: 'That connection attempt expired or did not match. Start it again.',
  spotify_token_exchange: 'Spotify rejected the connection. Start it again.',
};

const GENERIC_MUSIC_ERROR = 'The music service could not be connected. Try again.';

const NOTIF_PREFS: { key: NotifPrefKey; label: string }[] = [
  { key: 'recs', label: 'New recommendations' },
  { key: 'friendActivity', label: 'Friend activity' },
  { key: 'chart', label: 'Chart updates' },
  { key: 'emailDigest', label: 'Weekly email digest' },
];

/** Settings, one tab per URL — so "send me the privacy tab" is a link. */
export function SettingsScreen({
  tab,
  musicError,
}: {
  tab: SettingsTab;
  musicError?: string | undefined;
}) {
  const { accountForm, connected, needsReconnect, isPrivateProfile, notifPrefs, me, people } =
    useAppState();
  const actions = useAppActions();
  const [syncing, setSyncing] = useState(false);
  const handleTaken = isHandleTaken(
    accountForm.handle,
    me.handle,
    Object.values(people).map((person) => person.handle),
  );

  async function syncNow() {
    setSyncing(true);
    try {
      const response = await fetch('/api/music/sync', { method: 'POST' });
      const body = (await response.json()) as { inserted?: number; error?: string };
      if (!response.ok) {
        actions.showToast(body.error ?? 'Sync failed. Try again.');
      } else if (body.inserted) {
        actions.showToast(`Imported ${body.inserted} new play${body.inserted === 1 ? '' : 's'}.`);
      } else {
        actions.showToast('Already up to date.');
      }
    } catch {
      actions.showToast('Sync failed. Try again.');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Page width="reading">
      <h1 className={styles.title}>Settings</h1>

      <div className={styles.tabs}>
        <SegmentedControl fill label="Settings sections">
          {TABS.map((t) => (
            <SegmentedLink key={t.key} href={routes.settings(t.key)} current={tab === t.key}>
              {t.label}
            </SegmentedLink>
          ))}
        </SegmentedControl>
      </div>

      {tab === 'account' && (
        <>
          <div className={styles.avatarEditor}>
            <Avatar
              initials={me.initials}
              src={me.avatarUrl}
              size={64}
              color={me.color}
              decorative={false}
              aria-label={`${me.name}'s avatar`}
            />
            <div>
              <div className={styles.rowTitle}>Profile photo</div>
              <p className={styles.avatarNote}>JPEG, PNG, or WebP. Maximum 5 MB.</p>
              <AvatarUpload />
            </div>
          </div>
          <Field
            label="NAME"
            value={accountForm.name}
            onChange={(value) => actions.setAccountField('name', value)}
            inputCss="font:700 15px 'Tinos';margin-bottom:14px"
          />
          <Field
            label="HANDLE"
            value={accountForm.handle}
            onChange={(value) => actions.setAccountField('handle', value)}
            inputCss="font:500 13px 'JetBrains Mono'"
            error={handleTaken ? `@${accountForm.handle} is already taken.` : undefined}
            reserveErrorSpace
          />
          <Field
            label="BIO"
            value={accountForm.bio}
            onChange={(value) => actions.setAccountField('bio', value)}
            inputCss="margin-bottom:18px"
          />
          <Button
            variant="solid"
            css="display:inline-block;padding:10px 20px;margin-bottom:30px"
            onClick={actions.saveAccount}
          >
            SAVE CHANGES
          </Button>
          <p className={styles.dangerCopy}>
            <a href="/api/account/export" download>
              DOWNLOAD MY DATA →
            </a>
          </p>

          <section className={styles.danger} aria-labelledby="danger-zone">
            <h2 id="danger-zone" className={styles.dangerHeading}>
              DANGER ZONE
            </h2>
            <p className={styles.dangerCopy}>
              Deleting your account removes your page, charts and recommendations for everyone. This
              can&apos;t be undone.
            </p>
            <Button
              variant="outline"
              css="display:inline-block;border-color:#B7472A;color:#B7472A;padding:9px 16px"
              onClick={actions.askDeleteAccount}
            >
              DELETE ACCOUNT
            </Button>
          </section>
        </>
      )}

      {tab === 'services' && (
        <>
          {musicError && (
            <p className={styles.serviceError} role="alert">
              {MUSIC_ERRORS[musicError] ?? GENERIC_MUSIC_ERROR}
            </p>
          )}

          {SERVICES.map((service) => {
            const isConnected = connected[service.key];
            const isStale = needsReconnect[service.key];
            const action = isConnected ? 'Disconnect' : isStale ? 'Reconnect' : 'Connect';
            return (
              <div key={service.key} className={styles.row}>
                <Avatar initials={service.badge} size={32} color={service.color} />
                <div className={styles.rowBody}>
                  <div className={styles.rowTitle}>{service.name}</div>
                  <div className={`${styles.rowNote} ${isStale ? styles.rowNoteAlert : ''}`}>
                    {isConnected
                      ? 'CONNECTED'
                      : isStale
                        ? 'RECONNECT REQUIRED — ACCESS EXPIRED'
                        : 'NOT CONNECTED'}
                  </div>
                </div>
                <Button
                  css={`
                    border: 1px solid ${isStale ? '#B7472A' : '#1e1b18'};
                    font: 700 11px 'JetBrains Mono';
                    padding: 9px 16px;
                    letter-spacing: 0.05em;
                    background: ${isConnected ? 'transparent' : isStale ? '#B7472A' : '#1E1B18'};
                    color: ${isConnected ? '#1E1B18' : '#F2ECDF'};
                  `}
                  aria-label={`${action} ${service.name}`}
                  onClick={() =>
                    isConnected
                      ? actions.askDisconnect(service.key)
                      : actions.connectService(service.key)
                  }
                >
                  {action.toUpperCase()}
                </Button>
              </div>
            );
          })}

          {(connected.spotify || connected.apple) && (
            <>
              <Button
                variant="outline"
                css="display:inline-block;padding:9px 16px"
                disabled={syncing}
                onClick={() => void syncNow()}
              >
                {syncing ? 'SYNCING…' : 'SYNC NOW'}
              </Button>
              <p className={styles.syncNote}>
                Plays import automatically every hour. Use this to pull the last few in now.
              </p>
            </>
          )}
        </>
      )}

      {tab === 'privacy' && (
        <div className={styles.row} style={{ padding: 18 }}>
          <div className={styles.rowBody}>
            <div className={styles.rowTitle}>Private profile</div>
            <p className={styles.privacyNote}>
              Only friends can see your charts, Now Playing and wall. Others must request to follow.
            </p>
          </div>
          <Toggle
            size="md"
            checked={isPrivateProfile}
            onChange={actions.togglePrivate}
            label="Private profile"
          />
        </div>
      )}

      {tab === 'notifs' && (
        <ul className={styles.list}>
          {NOTIF_PREFS.map((pref) => (
            <li key={pref.key} className={styles.row}>
              <span className={styles.rowBody} style={{ font: "700 13px 'Arimo'" }}>
                {pref.label}
              </span>
              <Toggle
                checked={notifPrefs[pref.key]}
                onChange={() => actions.toggleNotifPref(pref.key)}
                label={pref.label}
              />
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
