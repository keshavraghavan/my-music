export interface ServerEvent<T = unknown> {
  event: string;
  data: T;
  id?: string;
  retry?: number;
}

export function encodeServerEvent({ event, data, id, retry }: ServerEvent): string {
  const lines = [
    ...(id ? [`id: ${id}`] : []),
    ...(retry ? [`retry: ${retry}`] : []),
    `event: ${event}`,
    ...JSON.stringify(data)
      .split('\n')
      .map((line) => `data: ${line}`),
  ];
  return `${lines.join('\n')}\n\n`;
}

export function waitForNextTick(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(done, milliseconds);
    function done() {
      clearTimeout(timer);
      signal.removeEventListener('abort', done);
      resolve();
    }
    signal.addEventListener('abort', done, { once: true });
  });
}
