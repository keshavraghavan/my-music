'use client';

import { ModuleGrid, ModuleToggleList } from '@/core/page-builder';
import { routes } from '@/core/routes';
import { Avatar, Button, Page, TextLink } from '@/core/ui';
import { musicModules } from '@/domains/music/modules';
import { useAppActions, useAppState } from '@/state/client-store';
import type { PersonId } from '@/types';
import styles from './home.module.css';

/** Your page: the modules you chose, in the order you put them. */
export default function HomePage() {
  const { connected, isPrivateProfile, relations, editMode, me } = useAppState();
  const actions = useAppActions();

  const noService = !connected.mock && !connected.spotify && !connected.apple;
  const friendCount = (Object.keys(relations) as PersonId[]).filter(
    (id) => relations[id] === 'friend',
  ).length;

  return (
    <Page width="wide">
      {noService && (
        <div className={styles.banner}>
          <span>No music service connected — Now Playing and charts are paused.</span>
          <TextLink href={routes.settings('services')} css="color:#B7472A">
            CONNECT A SERVICE →
          </TextLink>
        </div>
      )}

      <div className={styles.frame}>
        <div className={styles.profile}>
          <Avatar
            initials={me.initials}
            src={me.avatarUrl}
            size={76}
            css="font-family:'Tinos';font-size:26px"
          />
          <div className={styles.identity}>
            <h1 className={styles.name}>{me.name}</h1>
            <div className={styles.meta}>
              @{me.handle.toUpperCase()} ｜ {me.city.toUpperCase()}
              {isPrivateProfile && <> ｜ 🔒 PRIVATE</>}
            </div>
          </div>
          <p className={styles.bio}>“{me.bio}”</p>
          <Button
            variant="outline"
            aria-pressed={editMode}
            css={`
              padding: 8px 14px;
              flex: none;
              background: ${editMode ? '#1E1B18' : 'transparent'};
              color: ${editMode ? '#F2ECDF' : '#1E1B18'};
            `}
            onClick={actions.toggleEditMode}
          >
            {editMode ? 'DONE EDITING' : 'EDIT PAGE'}
          </Button>
        </div>

        <div className={styles.quickLinks}>
          <TextLink variant="bare" href={routes.friends} className={styles.quickLink}>
            FRIENDS ｜ {friendCount} →
          </TextLink>
          <TextLink variant="bare" href={routes.playlist} className={styles.quickLink}>
            SHARED PLAYLIST →
          </TextLink>
        </div>

        <ModuleGrid registry={musicModules} />
        <ModuleToggleList registry={musicModules} />
      </div>

      <div className={styles.footer}>
        <span>© 2026 MYMUSIC</span>
        <span>SET IN TINOS, JETBRAINS MONO &amp; ARIMO</span>
        <span>RUN ON THE {me.handle.toUpperCase()} LINE</span>
      </div>
    </Page>
  );
}
