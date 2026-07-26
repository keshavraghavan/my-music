'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from './Button';
import styles from './SegmentedControl.module.css';
import { cx } from './cx';

export interface SegmentedControlProps {
  /** Names the set for assistive tech — "Chart view", "Grid density". */
  label: string;
  /** Stretches the options to fill the row, as the settings tabs do. */
  fill?: boolean;
  children: ReactNode;
}

export function SegmentedControl({ label, fill = false, children }: SegmentedControlProps) {
  return (
    <div role="group" aria-label={label} className={cx(styles.group, fill && styles.fill)}>
      {children}
    </div>
  );
}

export interface SegmentedOptionProps {
  selected: boolean;
  onSelect: () => void;
  size?: 'md' | 'xs';
  children: ReactNode;
}

/** An in-page choice: pressed state rather than navigation. */
export function SegmentedOption({
  selected,
  onSelect,
  size = 'md',
  children,
}: SegmentedOptionProps) {
  return (
    <Button
      aria-pressed={selected}
      onClick={onSelect}
      className={cx(styles.option, size === 'xs' && styles.xs, selected && styles.selected)}
    >
      {children}
    </Button>
  );
}

export interface SegmentedLinkProps {
  href: string;
  current: boolean;
  children: ReactNode;
}

/** A choice that is really a destination — the settings tabs are URLs now. */
export function SegmentedLink({ href, current, children }: SegmentedLinkProps) {
  return (
    <Link
      href={href}
      aria-current={current ? 'page' : undefined}
      className={cx(styles.option, current && styles.selected)}
    >
      {children}
    </Link>
  );
}
