export const REALTIME_POLL_INTERVAL_MS = 60_000;

export function realtimePollingEnabled(visibilityState: string) {
  return visibilityState === 'visible';
}
