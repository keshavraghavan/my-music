import { routes } from '@/core/routes';
import { TextLink } from '@/core/ui';
import styles from './landing.module.css';

/** The landing screen. Static, and the only route a signed-out arrival sees. */
export default function LandingPage() {
  return (
    <main className={styles.screen}>
      <div className={styles.card}>
        <h1 className={styles.wordmark}>MyMusic.</h1>
        <p className={styles.tagline}>YOUR PAGE ｜ YOUR CHARTS ｜ YOUR FRIENDS&apos; PICKS</p>
        <TextLink variant="bare" href={routes.onboarding(1)} className={styles.cta}>
          GET STARTED →
        </TextLink>
      </div>
    </main>
  );
}
