'use client';

import type { ComponentPropsWithRef } from 'react';
import sx from '@/sx';
import styles from './Button.module.css';
import { cx } from './cx';

export type ButtonVariant = 'solid' | 'outline' | 'link' | 'bare';

export interface ButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'style'> {
  variant?: ButtonVariant | undefined;
  /**
   * Per-instance declarations in the design's inline-style dialect, for what a
   * variant cannot carry: padding, exact type size, a computed colour. Parsed
   * by sx(), so it beats the variant class.
   */
  css?: string | undefined;
}

/**
 * Every control in the design was a styled `<div onClick>`. This keeps the
 * pixels and replaces the semantics.
 */
export function Button({
  variant = 'bare',
  css,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(styles.button, variant !== 'bare' && styles[variant], className)}
      style={sx(css)}
      {...rest}
    />
  );
}
