'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './Button';
import styles from './Modal.module.css';
import { cx } from './cx';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
}

export interface ModalProps {
  title: string;
  onClose: () => void;
  /** `lg` is the compose sheet; `sm` is a confirmation. */
  size?: 'sm' | 'lg';
  /** Raises the dialog above another one that is already open. */
  layer?: 'base' | 'top';
  /** Renders the title in a bordered header bar with a close control. */
  withHeader?: boolean;
  children: ReactNode;
}

/**
 * A dialog that behaves like one: `role="dialog"` with an accessible name,
 * focus moved in on open and restored on close, Tab cycling kept inside, and
 * Escape to dismiss. None of that was reachable while the modals were plain
 * `<div>`s.
 */
export function Modal({
  title,
  onClose,
  size = 'sm',
  layer = 'base',
  withHeader = false,
  children,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  // Read through a ref so an inline `onClose` arrow does not re-run the effect
  // (and re-steal focus) on every render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const panel = panelRef.current;
    const restoreTo = document.activeElement as HTMLElement | null;
    if (panel) (focusable(panel)[0] ?? panel).focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;

      const stops = focusable(panel);
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      restoreTo?.focus?.();
    };
  }, []);

  return (
    <div className={cx(styles.overlay, layer === 'top' && styles.top)}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(styles.panel, styles[size])}
      >
        {withHeader ? (
          <div className={styles.header}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <Button className={styles.close} onClick={onClose} aria-label="Close dialog">
              ×
            </Button>
          </div>
        ) : (
          <h2 id={titleId} className={styles.plainTitle}>
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
