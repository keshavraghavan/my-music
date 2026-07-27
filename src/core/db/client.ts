import 'server-only';

import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema>;

declare global {
  var myMusicDatabase: Database | undefined;
  var myMusicSqlClient: ReturnType<typeof postgres> | undefined;
}

export function databasePoolSize(nodeEnv: string | undefined) {
  return nodeEnv === 'production' ? 1 : 10;
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

  // A Fluid Compute instance can serve many requests over its lifetime. Keep
  // one client per instance so repeated calls do not accumulate connection
  // pools, and let the external serverless pooler multiplex production work.
  const client = postgres(process.env.DATABASE_URL, {
    max: databasePoolSize(process.env.NODE_ENV),
  });
  const database = drizzle(client, { schema });

  globalThis.myMusicSqlClient = client;
  globalThis.myMusicDatabase = database;
  return database;
}
