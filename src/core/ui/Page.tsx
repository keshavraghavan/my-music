'use client';

import type { ReactNode } from 'react';
import styles from './Page.module.css';
import { cx } from './cx';

export interface PageProps {
  width?: 'wide' | 'medium' | 'reading' | 'narrow';
  children: ReactNode;
}

export function Page({ width = 'reading', children }: PageProps) {
  return (
    <main id="main" className={cx(styles.page, styles[width])}>
      {children}
    </main>
  );
}

/** The onboarding screen, which fills the viewport instead. */
export function CenteredPage({ children }: { children: ReactNode }) {
  return (
    <main id="main" className={styles.centered}>
      {children}
    </main>
  );
}
