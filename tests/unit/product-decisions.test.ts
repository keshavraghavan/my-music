// @vitest-environment node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { artists, profiles, recommendations, reports, tracks, users } from '@/core/db/schema';
import * as schema from '@/core/db/schema';
import { ModerationRepository } from '@/core/moderation/repository';

type TestDatabase = ReturnType<typeof drizzle<typeof schema>>;

let database: TestDatabase;
type AlertOperator = (report: {
  id: string;
  reporterId: string;
  subjectId: string;
  reason: string;
}) => Promise<void>;
let alertOperator: ReturnType<typeof vi.fn<AlertOperator>>;
let repository: ModerationRepository;

beforeEach(async () => {
  const client = new PGlite();
  for (const file of [
    'drizzle/0000_good_invisible_woman.sql',
    'drizzle/0001_misty_doctor_strange.sql',
    'drizzle/0002_clean_mindworm.sql',
  ]) {
    const migration = await readFile(resolve(process.cwd(), file), 'utf8');
    await client.exec(migration.replaceAll('--> statement-breakpoint', ''));
  }
  database = drizzle(client, { schema });
  await database.insert(users).values([
    { id: 'recipient', name: 'Recipient' },
    { id: 'sender', name: 'Sender' },
    { id: 'stranger', name: 'Stranger' },
  ]);
  await database.insert(profiles).values([
    {
      userId: 'recipient',
      handle: 'recipient',
      displayName: 'Recipient',
      initials: 'RE',
      color: '#000000',
    },
    {
      userId: 'sender',
      handle: 'sender',
      displayName: 'Sender',
      initials: 'SE',
      color: '#000000',
    },
  ]);
  await database.insert(artists).values({ id: 'artist', name: 'Artist' });
  await database
    .insert(tracks)
    .values({ id: 'track', artistId: 'artist', title: 'Reported Track' });
  await database.insert(recommendations).values({
    id: 'recommendation',
    senderId: 'sender',
    recipientId: 'recipient',
    trackId: 'track',
  });
  alertOperator = vi.fn<AlertOperator>().mockResolvedValue(undefined);
  repository = new ModerationRepository(
    database as unknown as PostgresJsDatabase<typeof schema>,
    alertOperator,
  );
});

describe('report persistence decision contract', () => {
  it('persists an open report, marks the recommendation, and alerts the operator', async () => {
    await repository.reportRecommendation('recipient', 'recommendation', 'Harassment');
    const [report] = await database.select().from(reports);
    const [recommendation] = await database
      .select()
      .from(recommendations)
      .where(eq(recommendations.id, 'recommendation'));

    expect(report).toEqual(
      expect.objectContaining({
        reporterId: 'recipient',
        subjectType: 'recommendation',
        subjectId: 'recommendation',
        reason: 'Harassment',
        status: 'open',
      }),
    );
    expect(recommendation?.status).toBe('reported');
    expect(alertOperator).toHaveBeenCalledOnce();
  });

  it('does not allow an unrelated account to report another inbox item', async () => {
    await expect(
      repository.reportRecommendation('stranger', 'recommendation', 'Not mine'),
    ).rejects.toMatchObject({ code: 'not-allowed' });
    await expect(database.select().from(reports)).resolves.toHaveLength(0);
    expect(alertOperator).not.toHaveBeenCalled();
  });
});
