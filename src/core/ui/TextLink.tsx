'use client';

import Link from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';
import sx from '@/sx';
import styles from './Button.module.css';
import type { ButtonVariant } from './Button';
import { cx } from './cx';

export interface TextLinkProps extends Omit<
  ComponentPropsWithoutRef<typeof Link>,
  'style' | 'className'
> {
  /** Shares the Button variants, because half of these used to be buttons. */
  variant?: ButtonVariant | undefined;
  css?: string | undefined;
  className?: string | undefined;
}

/** Navigation that looks like the design's inline "→" affordances. */
export function TextLink({ variant = 'link', css, className, ...rest }: TextLinkProps) {
  return (
    <Link
      className={cx(variant !== 'bare' && styles[variant], className)}
      style={sx(css)}
      {...rest}
    />
  );
}
