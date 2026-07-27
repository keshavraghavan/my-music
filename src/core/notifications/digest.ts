import 'server-only';

import { and, eq, inArray, isNull } from 'drizzle-orm';
import { getDatabase } from '@/core/db/client';
import { notificationPrefs, notifications, users } from '@/core/db/schema';

export interface DigestItem {
  text: string;
  createdAt: Date;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function renderNotificationDigest(items: DigestItem[], appUrl: string) {
  const rows = items
    .map(
      (item) =>
        `<li style="margin:0 0 12px">${escapeHtml(item.text)}<br><small>${item.createdAt.toLocaleDateString(
          'en-US',
          { month: 'short', day: 'numeric' },
        )}</small></li>`,
    )
    .join('');
  return {
    subject: `${items.length} update${items.length === 1 ? '' : 's'} from MyMusic`,
    text: `${items.map((item) => `• ${item.text}`).join('\n')}\n\nOpen MyMusic: ${appUrl}/notifications`,
    html: `<div style="font-family:Arial,sans-serif;color:#1E1B18"><h1 style="font-family:Georgia,serif">Your MyMusic line updates</h1><ul>${rows}</ul><a href="${escapeHtml(
      `${appUrl}/notifications`,
    )}">Open notifications →</a></div>`,
  };
}

async function deliverDigest(to: string, digest: ReturnType<typeof renderNotificationDigest>) {
  if (!process.env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY is required for production email digests');
    }
    console.info(`[MyMusic digest] ${to}: ${digest.subject}`);
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
      ...digest,
    }),
  });
  if (!response.ok) throw new Error(`Digest delivery failed (${response.status})`);
}

export async function sendPendingDigests() {
  const database = getDatabase();
  if (!database) return { recipients: 0, notifications: 0 };
  const recipients = await database
    .select({ userId: users.id, email: users.email })
    .from(users)
    .innerJoin(notificationPrefs, eq(notificationPrefs.userId, users.id))
    .where(eq(notificationPrefs.emailDigest, true));
  let deliveredRecipients = 0;
  let deliveredNotifications = 0;
  const appUrl = (process.env.AUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  for (const recipient of recipients) {
    if (!recipient.email) continue;
    const pending = await database
      .select({
        id: notifications.id,
        text: notifications.text,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(and(eq(notifications.userId, recipient.userId), isNull(notifications.digestSentAt)))
      .limit(50);
    if (!pending.length) continue;
    await deliverDigest(recipient.email, renderNotificationDigest(pending, appUrl));
    await database
      .update(notifications)
      .set({ digestSentAt: new Date() })
      .where(
        inArray(
          notifications.id,
          pending.map((item) => item.id),
        ),
      );
    deliveredRecipients += 1;
    deliveredNotifications += pending.length;
  }
  return { recipients: deliveredRecipients, notifications: deliveredNotifications };
}
