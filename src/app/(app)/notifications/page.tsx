'use client';

import { useRouter } from 'next/navigation';
import { routes } from '@/core/routes';
import { Button, Page, cx } from '@/core/ui';
import { useAppActions, useAppState } from '@/state/store';
import type { NotificationKind } from '@/types';
import styles from './notifications.module.css';

/** Where a row lands. Phase 5 points these at the entity, not the screen. */
const DESTINATIONS: Record<NotificationKind, string> = {
  rec: routes.home,
  chart: routes.home,
  playlist: routes.playlist,
  friend: routes.friends,
};

export default function NotificationsPage() {
  const { notifications } = useAppState();
  const actions = useAppActions();
  const router = useRouter();

  return (
    <Page width="reading">
      <div className={styles.head}>
        <h1 className={styles.title}>Notifications</h1>
        <Button variant="link" css="color:#3F6B4F" onClick={actions.markAllRead}>
          MARK ALL READ
        </Button>
      </div>
      <ul className={styles.list}>
        {notifications.map((notification) => (
          <li key={notification.id}>
            <Button
              className={cx(styles.row, !notification.read && styles.unread)}
              onClick={() => {
                actions.readNotification(notification.id);
                router.push(DESTINATIONS[notification.type]);
              }}
            >
              <span className={styles.dot} aria-hidden="true" />
              <span style={{ flex: 1 }}>
                <span className={styles.text}>{notification.text}</span>
                <span className={styles.time} style={{ display: 'block' }}>
                  {notification.time}
                  {!notification.read && <span className="sr-only"> — unread</span>}
                </span>
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </Page>
  );
}
