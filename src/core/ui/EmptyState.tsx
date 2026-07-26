'use client';

import type { ReactNode } from 'react';
import sx from '@/sx';
import styles from './EmptyState.module.css';
import { cx } from './cx';

export interface EmptyStateProps {
  message: ReactNode;
  /** Usually a link-styled Button pointing at the way out of the empty state. */
  action?: ReactNode;
  /** The dashed-outline treatment used for "no search results". */
  outlined?: boolean;
  css?: string;
}

export function EmptyState({ message, action, outlined = false, css }: EmptyStateProps) {
  return (
    <div className={cx(styles.empty, outlined && styles.dashed)} style={sx(css)}>
      <p className={styles.message}>{message}</p>
      {action}
    </div>
  );
}
