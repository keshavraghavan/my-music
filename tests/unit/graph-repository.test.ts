// @vitest-environment node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { and, eq, or } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { beforeEach, describe, expect, it } from 'vitest';
import { blocks, follows, notifications, profiles, users } from '@/core/db/schema';
import * as schema from '@/core/db/schema';
import { GraphMutationError, GraphRepository } from '@/core/graph/repository';

type TestDatabase = ReturnType<typeof drizzle<typeof schema>>;

let database: TestDatabase;
let repository: GraphRepository;

beforeEach(async () => {
  const client = new PGlite();
  const migration = await readFile(
    resolve(process.cwd(), 'drizzle/0000_good_invisible_woman.sql'),
    'utf8',
  );
  await client.exec(migration.replaceAll('--> statement-breakpoint', ''));
  const digestMigration = await readFile(
    resolve(process.cwd(), 'drizzle/0002_clean_mindworm.sql'),
    'utf8',
  );
  await client.exec(digestMigration.replaceAll('--> statement-breakpoint', ''));
  database = drizzle(client, { schema });

  await database.insert(users).values([
    { id: 'viewer', name: 'Viewer' },
    { id: 'public', name: 'Public Person' },
    { id: 'private', name: 'Private Person' },
  ]);
  await database.insert(profiles).values([
    {
      userId: 'viewer',
      handle: 'viewer',
      displayName: 'Viewer',
      initials: 'VW',
      color: '#000000',
    },
    {
      userId: 'public',
      handle: 'public',
      displayName: 'Public Person',
      initials: 'PP',
      color: '#000000',
    },
    {
      userId: 'private',
      handle: 'private',
      displayName: 'Private Person',
      initials: 'PV',
      color: '#000000',
      isPrivate: true,
    },
  ]);

  repository = new GraphRepository(database as unknown as PostgresJsDatabase<typeof schema>);
});

async function relation(followerId: string, followeeId: string) {
  const [row] = await database
    .select({ status: follows.status })
    .from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followeeId, followeeId)));
  return row?.status;
}

describe('GraphRepository', () => {
  it('follows a public profile immediately and emits a notification', async () => {
    await expect(repository.follow('viewer', 'public')).resolves.toBe('accepted');
    await expect(relation('viewer', 'public')).resolves.toBe('accepted');

    const [notification] = await database
      .select()
      .from(notifications)
      .where(eq(notifications.userId, 'public'));
    expect(notification?.text).toBe('Viewer followed you.');
  });

  it('creates, cancels, accepts, and declines private follow requests', async () => {
    await expect(repository.follow('viewer', 'private')).resolves.toBe('pending');
    await repository.cancelRequest('viewer', 'private');
    await expect(relation('viewer', 'private')).resolves.toBeUndefined();

    await repository.follow('viewer', 'private');
    await repository.acceptRequest('private', 'viewer');
    await expect(relation('viewer', 'private')).resolves.toBe('accepted');

    await repository.unfollow('viewer', 'private');
    await repository.follow('viewer', 'private');
    await repository.declineRequest('private', 'viewer');
    await expect(relation('viewer', 'private')).resolves.toBeUndefined();
  });

  it('keeps follows asymmetric and unfollow removes only the actor edge', async () => {
    await repository.follow('viewer', 'public');
    await repository.follow('public', 'viewer');
    await repository.unfollow('viewer', 'public');

    await expect(relation('viewer', 'public')).resolves.toBeUndefined();
    await expect(relation('public', 'viewer')).resolves.toBe('accepted');
  });

  it('rejects request actions unless the actor owns the pending edge', async () => {
    await expect(repository.acceptRequest('private', 'viewer')).rejects.toMatchObject({
      code: 'not-pending',
    } satisfies Partial<GraphMutationError>);
  });

  it('blocks both directions and removes existing follow edges', async () => {
    await repository.follow('viewer', 'public');
    await repository.follow('public', 'viewer');
    await repository.block('viewer', 'public');

    const remaining = await database
      .select()
      .from(follows)
      .where(
        or(
          and(eq(follows.followerId, 'viewer'), eq(follows.followeeId, 'public')),
          and(eq(follows.followerId, 'public'), eq(follows.followeeId, 'viewer')),
        ),
      );
    expect(remaining).toHaveLength(0);
    await expect(
      database
        .select()
        .from(blocks)
        .where(and(eq(blocks.blockerId, 'viewer'), eq(blocks.blockedId, 'public'))),
    ).resolves.toHaveLength(1);
    await expect(repository.follow('public', 'viewer')).rejects.toMatchObject({
      code: 'blocked',
    } satisfies Partial<GraphMutationError>);
  });
});
