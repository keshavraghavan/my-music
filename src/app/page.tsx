import { redirect } from 'next/navigation';
import { authenticatedDestination, isLocalE2E } from '@/core/auth/session';
import { routes } from '@/core/routes';
import { TextLink } from '@/core/ui';
import styles from './landing.module.css';

/** The landing screen. Static, and the only route a signed-out arrival sees. */
export default async function LandingPage() {
  const destination = await authenticatedDestination();
  if (destination) redirect(destination);
  return <LandingScreen />;
}

export function LandingScreen() {
  return (
    <main className={styles.screen}>
      <div className={styles.card}>
        <h1 className={styles.wordmark}>MyMusic.</h1>
        <p className={styles.tagline}>YOUR PAGE ｜ YOUR CHARTS ｜ YOUR FRIENDS&apos; PICKS</p>
        <TextLink
          variant="bare"
          href={isLocalE2E() ? routes.onboarding(1) : '/login'}
          className={styles.cta}
        >
          GET STARTED →
        </TextLink>
      </div>
    </main>
  );
}
