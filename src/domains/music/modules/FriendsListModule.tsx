'use client';

import { ModuleCard } from '@/core/page-builder';
import { routes } from '@/core/routes';
import { Avatar, EmptyState, TextLink } from '@/core/ui';
import sx from '@/sx';
import { useAppState } from '@/state/store';
import { PEOPLE } from '../data/people';
import styles from './modules.module.css';
import type { PersonId } from '@/types';

const CARD_CSS = 'border:1px solid rgba(30,27,24,0.3);padding:22px 24px';

export function FriendsListModule() {
  const { relations } = useAppState();
  const friends = (Object.keys(relations) as PersonId[])
    .filter((id) => relations[id] === 'friend')
    .map((id) => PEOPLE[id]);

  return (
    <ModuleCard moduleKey="friendsList" label="Friends List" css={CARD_CSS}>
      <h2 style={sx("font:700 12px 'JetBrains Mono';letter-spacing:0.06em;margin:0")}>
        FRIENDS ｜ {friends.length}
      </h2>
      {friends.length > 0 ? (
        <ul className={`${styles.list} ${styles.friendsGrid}`}>
          {friends.map((friend) => (
            <li key={friend.id}>
              <TextLink
                variant="bare"
                href={routes.profile(friend.handle)}
                className={styles.friendLink}
              >
                <Avatar initials={friend.initials} size={42} color={friend.color} />
                {friend.name}
              </TextLink>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          css="padding:20px 0"
          message="No friends yet."
          action={
            <TextLink href={routes.friends} css="color:#3F6B4F">
              SEARCH FOR FRIENDS →
            </TextLink>
          }
        />
      )}
    </ModuleCard>
  );
}
