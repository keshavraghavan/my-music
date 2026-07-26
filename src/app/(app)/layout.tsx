'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { routes } from '@/core/routes';
import { Avatar, ConfirmDialog, TextLink, Toast, cx } from '@/core/ui';
import { ComposeModal } from '@/domains/music/compose/ComposeModal';
import { useAppActions, useAppState } from '@/state/client-store';
import styles from './shell.module.css';

// `match` is the URL prefix the tab owns; `href` is where clicking it lands.
const NAV = [
  { href: routes.home, match: routes.home, label: 'HOME' },
  { href: routes.friends, match: routes.friends, label: 'FRIENDS' },
  { href: routes.playlist, match: routes.playlist, label: 'PLAYLIST' },
  { href: routes.notifications, match: routes.notifications, label: 'NOTIFICATIONS' },
  { href: routes.settings(), match: '/settings', label: 'SETTINGS' },
];

function owns(match: string, pathname: string) {
  return pathname === match || pathname.startsWith(`${match}/`);
}

const DANGEROUS = ['block', 'delete-account', 'report-rec'];

/**
 * The signed-in shell: navigation, and the two dialogs plus the toast region
 * that any screen inside it can raise.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { notifications, compose, confirm, toast, me } = useAppState();
  const actions = useAppActions();

  const unread = notifications.filter((n) => !n.read).length;
  // Anything the nav does not name is somebody's profile, which lives under
  // the Friends tab.
  const onProfile = !NAV.some((item) => owns(item.match, pathname));

  // Edit mode belongs to the home page; leaving it ends it, as `goTo()` did.
  useEffect(() => {
    if (pathname !== routes.home) actions.setEditMode(false);
  }, [pathname, actions]);

  function isCurrent(match: string) {
    if (match === routes.friends) return owns(match, pathname) || onProfile;
    return owns(match, pathname);
  }

  return (
    <>
      <a className="skip-link" href="#main">
        SKIP TO CONTENT
      </a>

      <header className={styles.shell}>
        <div className={styles.bar}>
          <TextLink variant="bare" href={routes.home} className={styles.wordmark}>
            MyMusic.
          </TextLink>
          <nav className={styles.nav} aria-label="Main">
            {NAV.map((item) => {
              const current = isCurrent(item.match);
              return (
                <TextLink
                  key={item.href}
                  variant="bare"
                  href={item.href}
                  aria-current={current ? 'page' : undefined}
                  className={cx(styles.navLink, current && styles.navLinkActive)}
                >
                  {item.label}
                  {item.label === 'NOTIFICATIONS' && unread > 0 && (
                    <span className={styles.badge}>
                      {unread}
                      <span className="sr-only"> unread</span>
                    </span>
                  )}
                </TextLink>
              );
            })}
          </nav>
          <Avatar
            initials={me.initials}
            size={30}
            css="font-family:'Tinos'"
            decorative={false}
            aria-label={`Signed in as ${me.name}`}
          />
        </div>
      </header>

      {children}

      {compose.open && <ComposeModal />}

      {confirm.open && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          confirmLabel={confirm.confirmLabel}
          danger={DANGEROUS.includes(confirm.kind)}
          onCancel={actions.closeConfirm}
          onConfirm={() => {
            if (actions.confirmAction() === 'delete-account') router.push(routes.landing);
          }}
        />
      )}

      <Toast message={toast} />
    </>
  );
}
