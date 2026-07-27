'use client';

import Image from 'next/image';
import sx from '@/sx';
import styles from './Avatar.module.css';
import { cx } from './cx';

export interface AvatarProps {
  initials: string;
  src?: string | null | undefined;
  /** Diameter in pixels. */
  size: number;
  color?: string | undefined;
  /** Type overrides — the design sets some avatars in Tinos, some in Arimo. */
  css?: string | undefined;
  className?: string | undefined;
  /**
   * Decorative when a name sits next to it: the initials would only be read
   * out twice. Left readable when the avatar stands alone.
   */
  decorative?: boolean;
  'aria-label'?: string;
}

export function Avatar({
  initials,
  src,
  size,
  color,
  css,
  className,
  decorative = true,
  'aria-label': ariaLabel,
}: AvatarProps) {
  return (
    <span
      className={cx(styles.avatar, className)}
      aria-hidden={decorative || undefined}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.34),
        ...(color ? { background: color } : {}),
        ...sx(css),
      }}
    >
      {src ? (
        <Image
          className={styles.image}
          src={src}
          alt=""
          width={size}
          height={size}
          sizes={`${size}px`}
          loading="lazy"
          unoptimized
        />
      ) : (
        initials
      )}
    </span>
  );
}
