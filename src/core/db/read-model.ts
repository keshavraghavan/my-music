import 'server-only';

import type { AppState, Person } from '@/types';
import { getDatabase } from './client';
import { DemoRepository, fallbackSnapshot } from './repositories/demo';

export async function loadAppSnapshot(viewerId = 'juno'): Promise<AppState> {
  const database = getDatabase();
  if (!database) return fallbackSnapshot();
  return new DemoRepository(database).getAppSnapshot(viewerId);
}

export async function loadPersonByHandle(handle: string): Promise<Person | undefined> {
  const database = getDatabase();
  if (!database) {
    return Object.values(fallbackSnapshot().people).find(
      (person) => person.handle.toLowerCase() === handle.toLowerCase(),
    );
  }
  return new DemoRepository(database).findPersonByHandle(handle);
}
