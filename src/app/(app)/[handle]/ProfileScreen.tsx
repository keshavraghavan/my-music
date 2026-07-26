'use client';

import { routes } from '@/core/routes';
import { Avatar, Button, Page, TextLink } from '@/core/ui';
import sx from '@/sx';
import { useAppActions, useAppState } from '@/state/client-store';
import type { Person } from '@/types';
import styles from './profile.module.css';

/**
 * Somebody's page — public, or locked behind a follow request.
 *
 * The design routed these as two screens; they are one URL with two states,
 * which is what a real profile is.
 */
export function ProfileScreen({ person }: { person: Person }) {
  const { relations, theoWall, me, people } = useAppState();
  const actions = useAppActions();
  const relation = relations[person.id];

  if (person.private && relation !== 'friend') {
    return <LockedProfile person={person} requested={relation === 'requested'} />;
  }

  // Only Theo has a seeded wall; Phase 5 gives everyone a real one.
  const wall = person.id === 'theok' ? theoWall : [];

  return (
    <Page width="reading">
      <TextLink variant="bare" href={routes.friends} className={styles.back}>
        ← FRIENDS
      </TextLink>
      <div className={styles.frame}>
        <div className={styles.chrome}>mymusic.page/{person.handle}</div>
        <div className={styles.body}>
          <div className={styles.header}>
            <Avatar
              initials={person.initials}
              size={52}
              color={person.color}
              css="font-family:'Tinos';font-size:18px"
            />
            <div className={styles.identity}>
              <h1 className={styles.name}>{person.name}</h1>
              <div className={styles.meta}>
                @{person.handle} ｜ {person.city} ｜{' '}
                <span className={styles.service}>{person.service}</span>
              </div>
            </div>
            <Button
              variant="solid"
              css="border:1px solid #1E1B18;padding:9px 14px;letter-spacing:0.04em;white-space:nowrap"
              onClick={() => actions.openComposeForFriend(person.id)}
            >
              + LEAVE A REC
            </Button>
          </div>

          <h2 className={styles.wallLabel}>{person.id === 'theok' ? 'HIS WALL' : 'THEIR WALL'}</h2>
          <ul className={styles.list}>
            {wall.map((post) => {
              const author =
                post.personId === 'me'
                  ? { name: me.name.toUpperCase(), color: me.color, initials: me.initials }
                  : {
                      name: people[post.personId].name.toUpperCase(),
                      color: people[post.personId].color,
                      initials: people[post.personId].initials,
                    };
              const fresh = post.time === 'JUST NOW';
              return (
                <li
                  key={post.id}
                  style={sx(
                    `display:flex;gap:10px;padding:12px;border:1px solid ${fresh ? '#3F6B4F' : 'rgba(30,27,24,0.3)'};background:${fresh ? 'rgba(63,107,79,0.06)' : 'transparent'};margin-bottom:8px`,
                  )}
                >
                  <Avatar
                    initials={author.initials}
                    size={30}
                    color={author.color}
                    css="font-size:10.5px"
                  />
                  <div style={sx('flex:1;min-width:0')}>
                    <div style={sx('display:flex;justify-content:space-between;gap:8px')}>
                      <span style={sx("font:600 11px 'JetBrains Mono'")}>{author.name}</span>
                      <span style={sx("font:700 9.5px 'JetBrains Mono';color:#6b6156")}>
                        {post.time}
                      </span>
                    </div>
                    <div style={sx("font:400 12.5px/1.4 'Tinos';font-style:italic")}>
                      “{post.text}”
                    </div>
                    <div
                      style={sx(
                        'display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(30,27,24,0.3);padding:5px 10px;margin-top:6px',
                      )}
                    >
                      <span style={sx("font:700 11.5px 'Arimo'")}>{post.track}</span>
                      <span style={sx("font:500 11px 'JetBrains Mono';color:#6b6156")}>
                        · {post.artist}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Page>
  );
}

function LockedProfile({ person, requested }: { person: Person; requested: boolean }) {
  const actions = useAppActions();

  return (
    <Page width="narrow">
      <TextLink variant="bare" href={routes.friends} className={styles.back}>
        ← FRIENDS
      </TextLink>
      <div className={styles.frame}>
        <div className={styles.chrome}>mymusic.page/{person.handle}</div>
        <div className={styles.locked}>
          <Avatar
            initials={person.initials}
            size={64}
            color={person.color}
            css="font-family:'Tinos';font-size:22px;margin:0 auto 16px"
          />
          <h1 className={styles.lockedName}>{person.name}</h1>
          <p style={sx("font:500 11px 'JetBrains Mono';color:#6b6156;margin:0 0 20px")}>
            @{person.handle}
          </p>
          <div
            aria-hidden="true"
            style={sx("font:700 40px 'Arimo';color:#6b6156;margin-bottom:12px")}
          >
            🔒
          </div>
          <p
            style={sx("font:400 13px/1.6 'Arimo';color:#6b6156;max-width:340px;margin:0 auto 18px")}
          >
            This page is private. Follow to see their charts, Now Playing and wall.
          </p>
          <Button
            css={`
              display: inline-block;
              border: 1px solid #1e1b18;
              font: 700 11px 'JetBrains Mono';
              padding: 11px 20px;
              letter-spacing: 0.05em;
              background: ${requested ? '#1E1B18' : 'transparent'};
              color: ${requested ? '#F2ECDF' : '#1E1B18'};
            `}
            disabled={requested}
            onClick={() => actions.requestFollow(person.id)}
          >
            {requested ? 'REQUEST SENT' : 'REQUEST TO FOLLOW'}
          </Button>
        </div>
      </div>
    </Page>
  );
}
