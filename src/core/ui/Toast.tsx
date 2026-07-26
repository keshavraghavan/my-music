'use client';

import styles from './Toast.module.css';

/** A polite live region. Renders nothing visible until there is a message. */
export function Toast({ message }: { message: string | null }) {
  return (
    <div className={styles.region} role="status" aria-live="polite" aria-atomic="true">
      {message ? <div className={styles.toast}>{message}</div> : null}
    </div>
  );
}
