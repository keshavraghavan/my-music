import type { EmailConfig } from '@auth/core/providers/email';
import { assertRateLimit } from './rate-limit';

export function magicLinkProvider(): EmailConfig {
  return {
    id: 'email',
    type: 'email',
    name: 'Email',
    from: process.env.EMAIL_FROM ?? 'MyMusic <hello@example.test>',
    maxAge: 15 * 60,
    async sendVerificationRequest({ identifier, url, provider, request }) {
      const address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
      assertRateLimit(`email-delivery:${address}:${identifier}`, {
        limit: 5,
        windowMs: 15 * 60_000,
      });
      if (!process.env.RESEND_API_KEY) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('RESEND_API_KEY is required to send production magic links');
        }
        console.info(`[MyMusic auth] Magic link for ${identifier}: ${url}`);
        return;
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: provider.from,
          to: identifier,
          subject: 'Your MyMusic sign-in link',
          text: `Sign in to MyMusic: ${url}\n\nThis link expires in 15 minutes.`,
        }),
      });
      if (!response.ok) throw new Error(`Email delivery failed (${response.status})`);
    },
  };
}
