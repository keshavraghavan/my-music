'use client';

import { SegmentedControl, SegmentedOption, Toggle } from '@/core/ui';
import { useAppActions, useAppState } from '@/state/store';
import type { Spacing } from '@/types';
import type { ModuleRegistry } from './registry';
import styles from './ModuleToggleList.module.css';

const DENSITIES: { key: Spacing; label: string }[] = [
  { key: 'compact', label: 'COMPACT' },
  { key: 'comfortable', label: 'COMFORTABLE' },
  { key: 'spacious', label: 'SPACIOUS' },
];

/** The "PAGE MODULES" panel: what is on the page, and how tightly it sits. */
export function ModuleToggleList({ registry }: { registry: ModuleRegistry }) {
  const { modules, spacing, editMode } = useAppState();
  const actions = useAppActions();

  return (
    <section className={styles.panel} aria-labelledby="page-modules-heading">
      <div className={styles.header}>
        <h2 id="page-modules-heading" className={styles.heading}>
          PAGE MODULES {editMode && <>｜ DRAG CARDS ABOVE TO REARRANGE</>}
        </h2>
        <SegmentedControl label="Grid density">
          {DENSITIES.map((d) => (
            <SegmentedOption
              key={d.key}
              size="xs"
              selected={spacing === d.key}
              onSelect={() => actions.setSpacing(d.key)}
            >
              {d.label}
            </SegmentedOption>
          ))}
        </SegmentedControl>
      </div>
      <ul className={styles.list}>
        {registry.all.map((m) => (
          <li key={m.key} className={styles.row}>
            <span className={styles.name}>{m.label}</span>
            <Toggle
              checked={modules[m.key]}
              onChange={() => actions.toggleModule(m.key)}
              label={`Show ${m.label} on your page`}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
