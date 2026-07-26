'use client';

import styles from './Toggle.module.css';
import { cx } from './cx';

export interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  /** Accessible name. The visible label sits beside the switch, not inside it. */
  label: string;
  size?: 'sm' | 'md';
}

export function Toggle({ checked, onChange, label, size = 'sm' }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cx(styles.track, styles[size], checked && styles.on)}
    >
      <span className={styles.knob} aria-hidden="true" />
    </button>
  );
}
