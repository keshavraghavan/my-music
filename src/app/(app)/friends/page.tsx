'use client';

import { routes } from '@/core/routes';
import {
  Avatar,
  Button,
  EmptyState,
  Field,
  Page,
  RowMenu,
  RowMenuItem,
  RowMenuItems,
  RowMenuTrigger,
  TextLink,
} from '@/core/ui';
import { useAppActions, useAppState } from '@/state/client-store';
import type { Person, PersonId } from '@/types';
import styles from './friends.module.css';

/** Search the directory, follow people, and manage who you already follow. */
export default function FriendsPage() {
  const { relations, friendSearch, openFriendMenu, people } = useAppState();
  const actions = useAppActions();

  const query = friendSearch.trim().toLowerCase();
  const pool = Object.values(people).filter(
    (p) => relations[p.id] !== 'friend' && relations[p.id] !== 'blocked',
  );
  const matches = query
    ? pool.filter(
        (p) => p.name.toLowerCase().includes(query) || p.handle.toLowerCase().includes(query),
      )
    : pool.slice(0, 3);

  const friends = (Object.keys(relations) as PersonId[])
    .filter((id) => relations[id] === 'friend')
    .map((id) => people[id]);

  return (
    <Page width="medium">
      <h1 className={styles.title}>Friends</h1>

      <div className={styles.search}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1E1B18"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <div className={styles.searchField}>
          <Field
            hideLabel
            label="Search people by name or handle"
            placeholder="Search by name or handle…"
            type="search"
            value={friendSearch}
            onChange={actions.setFriendSearch}
            inputCss="border:none;padding:0;font:400 13px 'Tinos';font-style:italic"
          />
        </div>
      </div>

      {query === '' ? (
        <h2 className={styles.sectionLabel}>SUGGESTED</h2>
      ) : matches.length > 0 ? (
        <h2 className={styles.sectionLabel}>RESULTS FOR “{friendSearch}”</h2>
      ) : (
        <EmptyState
          outlined
          css="margin:24px 0 30px"
          message={
            <>
              No one found for “{friendSearch}”.
              <br />
              <span style={{ fontSize: 12 }}>Invite them by sharing your page link instead.</span>
            </>
          }
        />
      )}

      <ul className={styles.list}>
        {matches.map((person) => (
          <li key={person.id} className={styles.row}>
            <Avatar initials={person.initials} size={38} color={person.color} />
            <div className={styles.person}>
              <TextLink
                variant="bare"
                href={routes.profile(person.handle)}
                className={styles.personLink}
              >
                {person.name} {person.private && <span aria-label="Private profile">🔒</span>}
              </TextLink>
              <div className={styles.handle}>
                @{person.handle} ｜ {person.service}
              </div>
            </div>
            <DirectoryAction person={person} />
          </li>
        ))}
      </ul>

      <h2 className={styles.friendsLabel}>MY FRIENDS ｜ {friends.length}</h2>
      {friends.length > 0 ? (
        <ul className={styles.list}>
          {friends.map((friend) => (
            <li key={friend.id} className={styles.row}>
              <Avatar initials={friend.initials} size={38} color={friend.color} />
              <div className={styles.person}>
                <TextLink
                  variant="bare"
                  href={routes.profile(friend.handle)}
                  className={styles.personLink}
                >
                  {friend.name}
                </TextLink>
                <div className={styles.handle}>
                  @{friend.handle} ｜ {friend.service}
                </div>
              </div>
              <RowMenu
                open={openFriendMenu === friend.id}
                onToggle={() => actions.toggleFriendMenu(friend.id)}
                onClose={actions.closeFriendMenu}
                label={`Options for ${friend.name}`}
              >
                <RowMenuTrigger />
                <RowMenuItems>
                  <RowMenuItem onClick={() => actions.askRemoveFriend(friend.id)}>
                    REMOVE FRIEND
                  </RowMenuItem>
                  <RowMenuItem tone="danger" onClick={() => actions.askBlockFriend(friend.id)}>
                    BLOCK
                  </RowMenuItem>
                </RowMenuItems>
              </RowMenu>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          outlined
          css="padding:26px 0"
          message="No friends yet. Search above to add some."
        />
      )}
    </Page>
  );
}

/** Follow outright, or ask — whichever the target's privacy calls for. */
function DirectoryAction({ person }: { person: Person }) {
  const { relations } = useAppState();
  const actions = useAppActions();
  const relation = relations[person.id];
  const requested = relation === 'requested';
  const needsRequest = person.private && relation !== 'friend';

  const label = needsRequest ? (requested ? 'REQUESTED' : 'REQUEST') : '+ ADD';
  const css = requested
    ? 'padding:8px 14px;letter-spacing:0.04em;border:1px solid #1E1B18;background:#1E1B18;color:#F2ECDF'
    : 'padding:8px 14px;letter-spacing:0.04em;border:1px solid rgba(30,27,24,0.4)';

  return (
    <Button
      variant="outline"
      css={css}
      disabled={requested}
      aria-label={
        needsRequest
          ? requested
            ? `Follow request sent to ${person.name}`
            : `Request to follow ${person.name}`
          : `Add ${person.name}`
      }
      onClick={() =>
        needsRequest ? actions.requestFollow(person.id) : actions.addFriend(person.id)
      }
    >
      {label}
    </Button>
  );
}
