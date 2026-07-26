import { notFound } from 'next/navigation';
import type { SettingsTab } from '@/types';
import { SettingsScreen } from '../SettingsScreen';

const TABS: SettingsTab[] = ['account', 'services', 'privacy', 'notifs'];

export function generateStaticParams() {
  return TABS.map((tab) => ({ tab }));
}

export default async function SettingsTabPage({ params }: { params: Promise<{ tab: string }> }) {
  const { tab } = await params;
  if (!TABS.includes(tab as SettingsTab)) notFound();
  return <SettingsScreen tab={tab as SettingsTab} />;
}
