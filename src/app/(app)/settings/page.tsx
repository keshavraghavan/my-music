import { SettingsScreen } from './SettingsScreen';

/** `/settings` is the account tab, so the bare URL resolves to something. */
export default function SettingsPage() {
  return <SettingsScreen tab="account" />;
}
