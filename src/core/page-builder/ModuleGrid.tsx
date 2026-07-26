'use client';

import { useAppState } from '@/state/client-store';
import type { ModuleRegistry } from './registry';
import styles from './ModuleGrid.module.css';

const GAP_PX: Record<string, number> = { compact: 16, comfortable: 28, spacious: 44 };

/** Renders the enabled modules, in the user's order, at the chosen density. */
export function ModuleGrid({ registry }: { registry: ModuleRegistry }) {
  const { order, modules, spacing } = useAppState();
  const visible = registry.visible(order, modules);

  return (
    <div className={styles.grid} style={{ gap: GAP_PX[spacing] ?? 28 }}>
      {visible.map(({ key, Component }) => (
        <Component key={key} />
      ))}
    </div>
  );
}
