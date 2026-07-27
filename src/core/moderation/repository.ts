import { and, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { reports } from '@/core/db/schema';
import { recommendations } from '@/domains/music/db/schema/music';
import type * as schema from '@/core/db/schema';

type ModerationDatabase = PostgresJsDatabase<typeof schema>;

export class ModerationError extends Error {
  constructor(
    readonly code: 'not-found' | 'not-allowed',
    message: string,
  ) {
    super(message);
    this.name = 'ModerationError';
  }
}

export class ModerationRepository {
  constructor(
    private readonly database: ModerationDatabase,
    private readonly alertOperator: (report: {
      id: string;
      reporterId: string;
      subjectId: string;
      reason: string;
    }) => Promise<void>,
  ) {}

  async reportRecommendation(reporterId: string, recommendationId: string, reason: string) {
    const report = await this.database.transaction(async (transaction) => {
      const [recommendation] = await transaction
        .select({ recipientId: recommendations.recipientId })
        .from(recommendations)
        .where(eq(recommendations.id, recommendationId))
        .limit(1);
      if (!recommendation) throw new ModerationError('not-found', 'Recommendation not found.');
      if (recommendation.recipientId !== reporterId) {
        throw new ModerationError('not-allowed', 'You cannot report this recommendation.');
      }
      const id = crypto.randomUUID();
      await transaction.insert(reports).values({
        id,
        reporterId,
        subjectType: 'recommendation',
        subjectId: recommendationId,
        reason: reason.slice(0, 500),
      });
      await transaction
        .update(recommendations)
        .set({ status: 'reported' })
        .where(
          and(
            eq(recommendations.id, recommendationId),
            eq(recommendations.recipientId, reporterId),
          ),
        );
      return { id, reporterId, subjectId: recommendationId, reason: reason.slice(0, 500) };
    });
    try {
      await this.alertOperator(report);
    } catch (error) {
      console.error('[MyMusic moderation] Report persisted but operator alert failed.', error);
    }
    return report;
  }
}
