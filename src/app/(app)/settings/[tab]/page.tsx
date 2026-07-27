import { notFound } from 'next/navigation';
import type { SettingsTab } from '@/types';
import { SettingsScreen } from '../SettingsScreen';

const TABS: SettingsTab[] = ['account', 'services', 'privacy', 'notifs'];

export function generateStaticParams() {
  return TABS.map((tab) => ({ tab }));
}

export default async function SettingsTabPage({
  params,
  searchParams,
}: {
  params: Promise<{ tab: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ tab }, query] = await Promise.all([params, searchParams]);
  if (!TABS.includes(tab as SettingsTab)) notFound();
  // The connect and callback routes report failures by redirecting here with a
  // code. Without reading it back, a failed connect looked like nothing at all
  // had happened.
  const musicError = Array.isArray(query.music_error) ? query.music_error[0] : query.music_error;
  return <SettingsScreen tab={tab as SettingsTab} musicError={musicError} />;
}
