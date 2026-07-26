'use client';

import { useId, type ComponentPropsWithoutRef } from 'react';
import sx from '@/sx';
import styles from './Field.module.css';
import { cx } from './cx';

export interface FieldProps extends Omit<
  ComponentPropsWithoutRef<'input'>,
  'onChange' | 'value' | 'style' | 'id' | 'className'
> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Message shown under the field, wired up as the input's description. */
  error?: string | undefined;
  /** Keeps the error line's height reserved even when there is no error. */
  reserveErrorSpace?: boolean;
  /** Hides the label visually but keeps it for assistive tech. */
  hideLabel?: boolean;
  variant?: 'underline' | 'boxed';
  /** Per-instance type/spacing declarations, in the design's inline dialect. */
  inputCss?: string;
  labelCss?: string;
}

/** A labelled text input. The design drew the label as an unassociated div. */
export function Field({
  label,
  value,
  onChange,
  error,
  reserveErrorSpace = false,
  hideLabel = false,
  variant = 'underline',
  inputCss,
  labelCss,
  ...rest
}: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : styles.label} style={sx(labelCss)}>
        {label}
      </label>
      <input
        id={id}
        className={cx(styles.input, variant === 'boxed' && styles.boxed)}
        style={sx(inputCss)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      />
      {error ? (
        <div id={errorId} className={cx(styles.error, reserveErrorSpace && styles.errorSlot)}>
          {error}
        </div>
      ) : (
        reserveErrorSpace && <div className={styles.errorSlot} aria-hidden="true" />
      )}
    </div>
  );
}
