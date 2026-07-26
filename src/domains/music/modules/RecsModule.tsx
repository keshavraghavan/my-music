'use client';

import { ModuleCard } from '@/core/page-builder';
import { routes } from '@/core/routes';
import {
  Avatar,
  EmptyState,
  RowMenu,
  RowMenuItem,
  RowMenuItems,
  RowMenuTrigger,
  TextLink,
} from '@/core/ui';
import sx from '@/sx';
import { useAppActions, useAppState } from '@/state/store';
import { PEOPLE } from '../data/people';
import styles from './modules.module.css';

const CARD_CSS = 'border:1px solid rgba(30,27,24,0.3);padding:22px 24px';

export function RecsModule() {
  const { recs, openRecMenu } = useAppState();
  const actions = useAppActions();
  const active = recs.filter((r) => r.status === 'active');

  return (
    <ModuleCard moduleKey="recs" label="Friend Recommendations" css={CARD_CSS}>
      <h2 className={styles.title}>Friend Recommendations</h2>
      {active.length > 0 ? (
        <ul className={styles.list}>
          {active.map((rec) => {
            const person = PEOPLE[rec.personId];
            return (
              <li
                key={rec.id}
                style={sx(
                  'display:flex;gap:12px;padding:14px 0;border-bottom:1px dotted rgba(30,27,24,0.3)',
                )}
              >
                <Avatar initials={person.initials} size={36} color={person.color} />
                <RowMenu
                  open={openRecMenu === rec.id}
                  onToggle={() => actions.toggleRecMenu(rec.id)}
                  onClose={actions.closeRecMenu}
                  label={`Options for the recommendation from ${person.name}`}
                >
                  <div style={sx('flex:1;min-width:0')}>
                    <div
                      style={sx(
                        'display:flex;justify-content:space-between;align-items:baseline;gap:8px',
                      )}
                    >
                      <div style={sx("font:600 12px 'JetBrains Mono';letter-spacing:0.02em")}>
                        {person.name.toUpperCase()}{' '}
                        <span style={sx('color:#6b6156;font-weight:400')}>left a rec</span>
                      </div>
                      <RowMenuTrigger compact />
                    </div>
                    <div
                      style={sx("font:400 13.5px/1.5 'Tinos';font-style:italic;margin:4px 0 8px")}
                    >
                      “{rec.text}”
                    </div>
                    <div
                      style={sx(
                        'display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(30,27,24,0.3);padding:5px 10px',
                      )}
                    >
                      <span style={sx("font:700 11.5px 'Arimo'")}>{rec.track}</span>
                      <span className={styles.byline}>· {rec.artist}</span>
                    </div>
                    <RowMenuItems variant="inline">
                      <RowMenuItem onClick={() => actions.hideRec(rec.id)}>HIDE</RowMenuItem>
                      <RowMenuItem tone="danger" onClick={() => actions.askReportRec(rec.id)}>
                        REPORT
                      </RowMenuItem>
                    </RowMenuItems>
                  </div>
                </RowMenu>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          message="No recommendations yet."
          action={
            <TextLink href={routes.friends} css="color:#3F6B4F">
              FIND FRIENDS TO GET RECS →
            </TextLink>
          }
        />
      )}
    </ModuleCard>
  );
}
