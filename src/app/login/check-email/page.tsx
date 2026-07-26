import Link from 'next/link';
import styles from '../login.module.css';

export default function CheckEmailPage() {
  return (
    <main className={styles.screen}>
      <section className={styles.card}>
        <h1 className={styles.wordmark}>Check your inbox.</h1>
        <p className={styles.copy}>
          Your one-time MyMusic link is on its way. It expires in 15 minutes.
        </p>
        <Link className={styles.back} href="/login">
          ← USE A DIFFERENT EMAIL
        </Link>
      </section>
    </main>
  );
}
