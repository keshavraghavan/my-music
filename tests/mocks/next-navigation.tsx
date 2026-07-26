import { useSyncExternalStore } from 'react';

/*
 * A minimal in-memory router, standing in for next/navigation and next/link.
 *
 * The app's screens are real routes now, so unit tests need somewhere to
 * navigate. This keeps a single mutable path and republishes it through
 * useSyncExternalStore, which is enough for `usePathname()`, `router.push()`
 * and clicking a `<Link>`.
 */

let path = '/';
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const testRouter = {
  get path() {
    return path;
  },
  push(next: string) {
    path = next;
    emit();
  },
  reset(next = '/') {
    path = next;
    emit();
  },
};

export function usePathname(): string {
  return useSyncExternalStore(
    subscribe,
    () => path,
    () => path,
  );
}

export function useRouter() {
  return {
    push: testRouter.push,
    replace: testRouter.push,
    back: () => {},
    forward: () => {},
    refresh: () => {},
    prefetch: () => {},
  };
}

export function notFound(): never {
  throw new Error('notFound() called in a test');
}
