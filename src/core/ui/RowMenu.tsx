'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { Button, type ButtonProps } from './Button';
import styles from './RowMenu.module.css';
import { cx } from './cx';

interface RowMenuContext {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  label: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  menuRef: RefObject<HTMLDivElement | null>;
}

const Context = createContext<RowMenuContext | null>(null);

function useRowMenu(): RowMenuContext {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('RowMenu parts must be used inside <RowMenu>');
  return ctx;
}

export interface RowMenuProps {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  /** Accessible name for the ⋮ trigger, e.g. "Options for Theo K." */
  label: string;
  children: ReactNode;
}

/**
 * The design's ⋮ row menus.
 *
 * Rendered as a context rather than a single element because the two menus in
 * the app sit in different places relative to their trigger — one floats over
 * the row, one opens underneath the card's content. Adds what a `<div onClick>`
 * could not have: an expanded state, arrow-key movement between items, Escape
 * to dismiss, and focus that lands in the menu on open and returns to the
 * trigger on close.
 */
export function RowMenu({ open, onToggle, onClose, label, children }: RowMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(open);

  useEffect(() => {
    if (open && !wasOpen.current) {
      menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    } else if (!open && wasOpen.current) {
      triggerRef.current?.focus();
    }
    wasOpen.current = open;
  }, [open]);

  return (
    <Context.Provider value={{ open, onToggle, onClose, label, triggerRef, menuRef }}>
      {children}
    </Context.Provider>
  );
}

export function RowMenuTrigger({ compact = false }: { compact?: boolean }) {
  const { open, onToggle, label, triggerRef } = useRowMenu();
  return (
    <Button
      ref={triggerRef}
      className={cx(styles.trigger, compact && styles.compact)}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-label={label}
      onClick={onToggle}
    >
      ⋮
    </Button>
  );
}

export interface RowMenuItemsProps {
  /** `panel` floats over the row; `inline` opens underneath it. */
  variant?: 'panel' | 'inline';
  children: ReactNode;
}

export function RowMenuItems({ variant = 'panel', children }: RowMenuItemsProps) {
  const { open, onClose, label, menuRef } = useRowMenu();
  if (!open) return null;

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    if (items.length === 0) return;
    event.preventDefault();
    const at = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === 'ArrowDown' ? at + 1 : at - 1;
    items[(next + items.length) % items.length]?.focus();
  }

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={label}
      className={styles[variant]}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
}

export interface RowMenuItemProps extends Omit<ButtonProps, 'variant' | 'role'> {
  tone?: 'default' | 'danger';
}

export function RowMenuItem({ tone = 'default', className, ...rest }: RowMenuItemProps) {
  return (
    <Button
      role="menuitem"
      className={cx(styles.item, tone === 'danger' && styles.danger, className)}
      {...rest}
    />
  );
}
