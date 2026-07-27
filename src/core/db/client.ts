import 'server-only';

import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema>;

declare global {
  var myMusicDatabase: Database | undefined;
  var myMusicSqlClient: ReturnType<typeof postgres> | undefined;
}

/**
 * Returns the shared database client, or `null` when DATABASE_URL is absent.
 *
 * The null case is intentional: a fresh template still renders the exact
 * fixtures with no configuration. Once DATABASE_URL is set, every server read
 * goes through Postgres.
 */
export function getDatabase(): Database | null {
  if (!process.env.DATABASE_URL) return null;
  if (globalThis.myMusicDatabase) return globalThis.myMusicDatabase;

  const client = postgres(process.env.DATABASE_URL, { max: 10 });
  const database = drizzle(client, { schema });

  if (process.env.NODE_ENV !== 'production') {
    globalThis.myMusicSqlClient = client;
    globalThis.myMusicDatabase = database;
  }
  return database;
}
