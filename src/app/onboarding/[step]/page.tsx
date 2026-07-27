import { notFound } from 'next/navigation';
import { ONBOARDING_STEPS } from '@/core/routes';
import { isLocalE2E } from '@/core/auth/session';
import { OnboardingScreen } from './OnboardingScreen';

/** One URL per stop, so the flow is resumable and the back button works. */
export function generateStaticParams() {
  return Array.from({ length: ONBOARDING_STEPS }, (_, i) => ({ step: String(i + 1) }));
}

export default async function OnboardingStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  const n = Number(step);
  if (!Number.isInteger(n) || n < 1 || n > ONBOARDING_STEPS) notFound();
  return <OnboardingScreen step={n} bypassPersistence={isLocalE2E()} />;
}
