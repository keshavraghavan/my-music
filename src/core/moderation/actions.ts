'use server';

import { currentUser } from '@/core/auth/session';
import { getDatabase } from '@/core/db/client';
import { assertRateLimit } from '@/core/auth/rate-limit';
import { ModerationRepository } from './repository';

async function alertOperator(report: {
  id: string;
  reporterId: string;
  subjectId: string;
  reason: string;
}) {
  const to = process.env.MODERATION_ALERT_EMAIL;
  if (!to || !process.env.RESEND_API_KEY) {
    console.info(`[MyMusic moderation] New report ${report.id} for ${report.subjectId}`);
    return;
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? 'MyMusic <hello@example.test>',
      to,
      subject: `New MyMusic report ${report.id}`,
      text: `Reporter: ${report.reporterId}\nRecommendation: ${report.subjectId}\nReason: ${report.reason}`,
    }),
  });
  if (!response.ok) throw new Error(`Moderation alert failed (${response.status})`);
}

export async function reportRecommendation(recommendationId: string) {
  const user = await currentUser();
  if (!user) return { ok: false as const, error: 'Sign in to report content.' };
  assertRateLimit(`report:${user.id}`, { limit: 10, windowMs: 60 * 60_000 });
  const database = getDatabase();
  if (!database) return { ok: false as const, error: 'Database configuration is required.' };
  try {
    await new ModerationRepository(database, alertOperator).reportRecommendation(
      user.id,
      recommendationId,
      'Reported from recommendation menu',
    );
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: 'That recommendation could not be reported.' };
  }
}
