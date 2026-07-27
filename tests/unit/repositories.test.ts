// @vitest-environment node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { beforeAll, describe, expect, it } from 'vitest';
import { follows, profiles, users } from '@/core/db/schema';
import { DemoRepository, type DemoDatabase } from '@/core/db/repositories/demo';

let repository: DemoRepository;

beforeAll(async () => {
  const client = new PGlite();
  const migration = await readFile(
    resolve(process.cwd(), 'drizzle/0000_good_invisible_woman.sql'),
    'utf8',
  );
  await client.exec(migration.replaceAll('--> statement-breakpoint', ''));
  const phaseSixMigration = await readFile(
    resolve(process.cwd(), 'drizzle/0001_misty_doctor_strange.sql'),
    'utf8',
  );
  await client.exec(phaseSixMigration.replaceAll('--> statement-breakpoint', ''));
  const phaseSevenMigration = await readFile(
    resolve(process.cwd(), 'drizzle/0002_clean_mindworm.sql'),
    'utf8',
  );
  await client.exec(phaseSevenMigration.replaceAll('--> statement-breakpoint', ''));

  const database = drizzle(client);
  await database.insert(users).values([
    { id: 'juno', name: 'Juno Reyes' },
    { id: 'theok', name: 'Theo K.' },
    { id: 'generated-user-id', name: 'Alice Listener' },
  ]);
  await database.insert(profiles).values([
    {
      userId: 'juno',
      handle: 'junotapes',
      displayName: 'Juno Reyes',
      bio: 'Vinyl hoarder.',
      initials: 'JR',
      color: '#B7472A',
      city: 'Ridgewood, Queens',
      timezone: 'America/New_York',
    },
    {
      userId: 'theok',
      handle: 'theok_fm',
      displayName: 'Theo K.',
      initials: 'TK',
      color: '#3F6B4F',
      city: 'Bushwick, Brooklyn',
      timezone: 'America/New_York',
    },
    {
      userId: 'generated-user-id',
      handle: 'alice_listens',
      displayName: 'Alice Listener',
      initials: 'AL',
      color: '#315A72',
      city: '',
      timezone: 'UTC',
    },
  ]);
  await database
    .insert(follows)
    .values({ followerId: 'juno', followeeId: 'theok', status: 'accepted' });

  repository = new DemoRepository(database as unknown as DemoDatabase);
});

describe('DemoRepository', () => {
  it('lists persisted profiles in the directory shape', async () => {
    const people = await repository.listPeople();
    expect(people).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'theok',
          name: 'Theo K.',
          handle: 'theok_fm',
          private: false,
        }),
        expect.objectContaining({
          id: 'generated-user-id',
          name: 'Alice Listener',
          handle: 'alice_listens',
        }),
      ]),
    );
  });

  it('looks handles up case-insensitively and excludes the current owner', async () => {
    await expect(repository.findPersonByHandle('THEOK_FM')).resolves.toEqual(
      expect.objectContaining({ id: 'theok' }),
    );
    await expect(repository.isHandleAvailable('THEOK_FM')).resolves.toBe(false);
    await expect(repository.isHandleAvailable('junotapes', 'juno')).resolves.toBe(true);
  });

  it('hydrates persisted profile and follow state into the server snapshot', async () => {
    const snapshot = await repository.getAppSnapshot();

    expect(snapshot.me).toEqual(expect.objectContaining({ userId: 'juno', handle: 'junotapes' }));
    expect(snapshot.people.theok.name).toBe('Theo K.');
    expect(snapshot.relations.theok).toBe('friend');
    expect(snapshot.catalog).not.toHaveLength(0);
  });
});
