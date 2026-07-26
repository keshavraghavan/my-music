'use client';

import { ModuleCard } from '@/core/page-builder';
import { Button, EmptyState } from '@/core/ui';
import sx from '@/sx';
import { useAppActions, useAppState } from '@/state/store';
import { RECEIPT_META } from '../data/listening';
import styles from './modules.module.css';

const CARD_CSS = 'border:1px solid rgba(30,27,24,0.3)';
const EXPAND_CSS = 'top:47px;right:14px';
const HANDLE_CSS = 'color:rgba(242,236,223,0.4);z-index:1';

export function MonthlyModule() {
  const { monthlyTracks, editMode } = useAppState();
  const actions = useAppActions();
  const isFull = monthlyTracks.length >= 10;

  return (
    <ModuleCard
      moduleKey="monthly"
      label="This Month's Top 10"
      css={CARD_CSS}
      expandCss={EXPAND_CSS}
      handleCss={HANDLE_CSS}
    >
      <div
        style={sx(
          'background:#1E1B18;color:#F2ECDF;padding:12px 64px 12px 20px;display:flex;justify-content:space-between;align-items:baseline;gap:10px',
        )}
      >
        <h2 style={sx("font:700 12px 'JetBrains Mono';letter-spacing:0.06em;margin:0")}>
          MY TOP 10 — HAND-PICKED
        </h2>
        <span style={sx("font:400 10.5px 'JetBrains Mono';color:rgba(242,236,223,0.55)")}>
          {RECEIPT_META.month}
        </span>
      </div>
      <div style={sx("padding:8px 100px 0 20px;font:400 11px/1.5 'Arimo';color:#6b6156")}>
        Chosen by you — not pulled from Spotify or Apple Music.
      </div>
      {monthlyTracks.length === 0 ? (
        <EmptyState
          css="padding:22px 20px"
          message="You haven't picked your Top 10 yet."
          action={
            <Button variant="link" css="color:#3F6B4F" onClick={actions.openComposeForMonthly}>
              PICK YOUR TOP 10 →
            </Button>
          }
        />
      ) : (
        <div style={sx('padding:8px 20px 12px')}>
          <ol className={styles.list}>
            {monthlyTracks.map((track, i) => (
              <li
                key={track.id}
                style={sx(
                  'display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dotted rgba(30,27,24,0.3)',
                )}
              >
                <span
                  aria-hidden="true"
                  style={sx("width:18px;font:700 12px 'Arimo';color:#B7472A")}
                >
                  {i + 1}
                </span>
                <span
                  style={sx(
                    "flex:1;font:600 12.5px 'Tinos';white-space:nowrap;overflow:hidden;text-overflow:ellipsis",
                  )}
                >
                  {track.title}
                </span>
                <span style={sx("font:500 10.5px 'JetBrains Mono';color:#6b6156")}>
                  {track.artist}
                </span>
                {editMode && (
                  <Button
                    css="font:700 13px 'Arimo';color:#B7472A;padding:0 2px;line-height:1"
                    aria-label={`Remove ${track.title} from your Top 10`}
                    onClick={() => actions.removeMonthlyTrack(track.id)}
                  >
                    ×
                  </Button>
                )}
              </li>
            ))}
          </ol>
          {editMode && (
            <div style={sx('margin-top:10px;text-align:center')}>
              <Button
                variant="link"
                css="font:700 10.5px 'JetBrains Mono';color:#3F6B4F"
                onClick={actions.openComposeForMonthly}
              >
                {isFull ? 'TOP 10 FULL' : '+ ADD A TRACK'}
              </Button>
            </div>
          )}
        </div>
      )}
    </ModuleCard>
  );
}
