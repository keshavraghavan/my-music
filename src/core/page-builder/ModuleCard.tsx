'use client';

import type { KeyboardEvent, ReactNode } from 'react';
import { Button } from '@/core/ui';
import sx from '@/sx';
import { useAppActions, useAppState } from '@/state/store';
import type { ModuleKey } from '@/types';
import styles from './ModuleCard.module.css';

export interface ModuleCardProps {
  moduleKey: ModuleKey;
  label: string;
  /** Card chrome — border, padding, background — in the inline dialect. */
  css?: string | undefined;
  /** Position overrides for the edit controls on the odd-shaped cards. */
  expandCss?: string | undefined;
  handleCss?: string | undefined;
  children: ReactNode;
}

/**
 * A card on the page: draggable, expandable, reorderable.
 *
 * Reordering works from the keyboard as well as the mouse. The design's ✥
 * glyph was decoration on a mouse-only drag target; here it is a real button
 * that moves the card with the arrow keys, which is the only way this feature
 * exists at all for anyone not using a pointer.
 */
export function ModuleCard({
  moduleKey,
  label,
  css,
  expandCss,
  handleCss,
  children,
}: ModuleCardProps) {
  const { expanded, editMode, order } = useAppState();
  const actions = useAppActions();
  const isExpanded = expanded[moduleKey];
  const position = order.indexOf(moduleKey);

  function onHandleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const delta = event.key === 'ArrowUp' || event.key === 'ArrowLeft' ? -1 : 1;
    if (!['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    actions.moveModule(moduleKey, delta);
  }

  return (
    // The drag handlers are a pointer-only enhancement: the same reorder is
    // available from the keyboard on the handle button below, which is what
    // the rule is protecting against.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className={styles.card}
      draggable={editMode}
      onDragStart={() => actions.setDragKey(moduleKey)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        actions.dropOn(moduleKey);
      }}
      onDragEnd={() => actions.setDragKey(null)}
      style={sx(
        `--span:${isExpanded ? 'span 2' : 'span 1'};--card-cursor:${editMode ? 'grab' : 'default'};${css ?? ''}`,
      )}
    >
      {editMode && (
        <>
          <Button
            className={styles.control}
            css={expandCss}
            aria-pressed={isExpanded}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${label}`}
            onClick={() => actions.toggleExpand(moduleKey)}
          >
            {isExpanded ? '⤡ COLLAPSE' : '⤢ EXPAND'}
          </Button>
          <Button
            className={styles.handle}
            css={handleCss}
            aria-label={`Move ${label}, position ${position + 1} of ${order.length}. Use the arrow keys.`}
            onKeyDown={onHandleKeyDown}
          >
            ✥
          </Button>
        </>
      )}
      {children}
    </div>
  );
}
