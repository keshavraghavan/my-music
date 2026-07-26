import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requestMagicLink, signInWithSpotify } from '@/core/auth/actions';
import { authenticatedDestination } from '@/core/auth/session';
import styles from './login.module.css';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const destination = await authenticatedDestination();
  if (destination) redirect(destination);
  const { error } = await searchParams;
  const emailEnabled = Boolean(process.env.DATABASE_URL);
  const spotifyEnabled = Boolean(
    process.env.DATABASE_URL && process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET,
  );

  return (
    <main className={styles.screen}>
      <section className={styles.card} aria-labelledby="login-heading">
        <h1 id="login-heading" className={styles.wordmark}>
          Sign in to MyMusic.
        </h1>
        <p className={styles.copy}>
          We&apos;ll email you a one-time link. No password to remember.
        </p>

        {emailEnabled ? (
          <form action={requestMagicLink}>
            <label className={styles.label} htmlFor="email">
              EMAIL
            </label>
            <input
              className={styles.input}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
            <button className={styles.button} type="submit">
              EMAIL ME A SIGN-IN LINK →
            </button>
          </form>
        ) : (
          <p className={styles.notice}>
            Authentication needs Postgres. Set DATABASE_URL and run the migrations to sign in.
          </p>
        )}

        {spotifyEnabled && (
          <>
            <div className={styles.divider}>OR</div>
            <form action={signInWithSpotify}>
              <button className={`${styles.button} ${styles.secondary}`} type="submit">
                CONTINUE WITH SPOTIFY
              </button>
            </form>
          </>
        )}

        {error === 'email' && (
          <p className={styles.notice} role="alert">
            Enter a valid email address.
          </p>
        )}
        <Link className={styles.back} href="/">
          ← BACK HOME
        </Link>
      </section>
    </main>
  );
}
