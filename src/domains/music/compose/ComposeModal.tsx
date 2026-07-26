'use client';

import type { ReactNode } from 'react';
import { Button, Field, Modal } from '@/core/ui';
import sx from '@/sx';
import { useAppActions, useAppState } from '@/state/store';
import { PLAYLIST_NAME } from '../data/listening';
import { PEOPLE } from '../data/people';
import { filterTracks } from '../data/tracks';

const TITLES = {
  monthlyPick: 'Add to Your Top 10',
  addTrack: `Add Track → ${PLAYLIST_NAME}`,
} as const;

const SUBMIT_LABELS = {
  recommend: 'POST RECOMMENDATION →',
  monthlyPick: 'ADD TO TOP 10 →',
  addTrack: 'ADD TO PLAYLIST →',
} as const;

/**
 * Search a track, then send it somewhere: a friend's wall, the shared
 * playlist, or your own Top 10.
 */
export function ComposeModal() {
  const { compose, playlistTracks } = useAppState();
  const actions = useAppActions();

  const results = filterTracks(compose.query);
  const selected = compose.selectedIdx == null ? null : results[compose.selectedIdx];
  const duplicate = selected
    ? playlistTracks.find((t) => t.title.toLowerCase() === selected.title.toLowerCase())
    : undefined;
  const showDuplicateWarning = compose.target === 'playlist' && !!duplicate;
  const duplicateCredit = duplicate ? duplicate.addedBy[duplicate.addedBy.length - 1] : '';

  const recipient = compose.targetFriendId ? PEOPLE[compose.targetFriendId] : PEOPLE.theok;
  const title =
    compose.mode === 'recommend' ? `New Recommendation → ${recipient.name}` : TITLES[compose.mode];

  return (
    <Modal title={title} onClose={actions.closeCompose} size="lg" withHeader>
      <div style={sx('padding:22px 26px;display:flex;flex-direction:column;gap:14px')}>
        <Field
          label="SEARCH ANY TRACK, ANYWHERE"
          variant="boxed"
          labelCss="font:700 10.5px 'JetBrains Mono';margin-bottom:6px"
          placeholder="Search a track…"
          value={compose.query}
          onChange={actions.setComposeQuery}
        />

        <div
          role="group"
          aria-label="Search results"
          style={sx('border:1px solid rgba(30,27,24,0.25);max-height:180px;overflow-y:auto')}
        >
          {results.map((track, i) => (
            <Button
              key={track.title}
              aria-pressed={compose.selectedIdx === i}
              onClick={() => actions.selectTrack(i)}
              css={`
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 9px 12px;
                width: 100%;
                box-sizing: border-box;
                border-bottom: 1px solid rgba(30, 27, 24, 0.15);
                background: ${compose.selectedIdx === i ? 'rgba(63,107,79,0.08)' : 'transparent'};
              `}
            >
              <span
                aria-hidden="true"
                style={sx(
                  'width:36px;height:36px;border-radius:6px;background:linear-gradient(135deg,#C9A227,#B7472A);flex:none',
                )}
              />
              <span style={sx('flex:1;min-width:0;text-align:left')}>
                <span
                  style={sx(
                    "display:block;font:700 12.5px 'Tinos';white-space:nowrap;overflow:hidden;text-overflow:ellipsis",
                  )}
                >
                  {track.title}
                </span>
                <span style={sx("display:block;font:500 10px 'JetBrains Mono';color:#6b6156")}>
                  {track.artist}
                </span>
              </span>
              <span aria-hidden="true" style={sx("font:700 13px 'Arimo';color:#3F6B4F;flex:none")}>
                {compose.selectedIdx === i ? '✓' : ''}
              </span>
            </Button>
          ))}
        </div>

        {compose.mode === 'recommend' && (
          <>
            <Field
              label="NOTE (OPTIONAL)"
              variant="boxed"
              labelCss="font:700 10.5px 'JetBrains Mono';margin-bottom:6px"
              inputCss="padding:10px 12px"
              value={compose.note}
              onChange={actions.setComposeNote}
            />
            <div>
              <div
                id="compose-target-label"
                style={sx(
                  "font:700 10.5px 'JetBrains Mono';color:#6b6156;letter-spacing:0.06em;margin-bottom:6px",
                )}
              >
                POST TO
              </div>
              <div
                role="radiogroup"
                aria-labelledby="compose-target-label"
                style={sx('display:flex;flex-direction:column;gap:6px')}
              >
                <TargetOption
                  checked={compose.target === 'wall'}
                  onSelect={() => actions.setComposeTarget('wall')}
                >
                  Their Wall
                </TargetOption>
                <TargetOption
                  checked={compose.target === 'playlist'}
                  onSelect={() => actions.setComposeTarget('playlist')}
                >
                  {PLAYLIST_NAME}{' '}
                  <span style={sx('color:#6b6156;font-weight:400')}>｜ shared playlist</span>
                </TargetOption>
              </div>
            </div>
          </>
        )}

        {showDuplicateWarning && (
          <div
            style={sx(
              "border:1px solid #C9A227;background:rgba(201,162,39,0.1);padding:10px 12px;font:600 11.5px 'Arimo'",
            )}
          >
            {duplicateCredit} already added this to the playlist.
            <Button
              variant="link"
              aria-pressed={compose.addAnyway}
              css="margin-left:6px;font:700 11px 'JetBrains Mono'"
              onClick={actions.toggleAddAnyway}
            >
              {compose.addAnyway ? 'WILL ADD ANYWAY ✓' : 'ADD ANYWAY'}
            </Button>
          </div>
        )}

        <Button
          variant="solid"
          css="font-size:12px;text-align:center;padding:12px;letter-spacing:0.06em"
          onClick={actions.submitCompose}
        >
          {SUBMIT_LABELS[compose.mode]}
        </Button>
      </div>
    </Modal>
  );
}

function TargetOption({
  checked,
  onSelect,
  children,
}: {
  checked: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      css={`
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        box-sizing: border-box;
        border: 1px solid ${checked ? '#1E1B18' : 'rgba(30,27,24,0.35)'};
        padding: 9px 12px;
        font: 600 12px 'Arimo';
        text-align: left;
      `}
    >
      <span
        aria-hidden="true"
        style={sx(
          `width:14px;height:14px;border-radius:50%;border:1px solid #1E1B18;background:${checked ? '#1E1B18' : 'transparent'};box-shadow:${checked ? 'inset 0 0 0 3px #F2ECDF' : 'none'};flex:none`,
        )}
      />
      <span>{children}</span>
    </Button>
  );
}
