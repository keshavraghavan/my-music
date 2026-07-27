import { accounts, sessions, users, verificationTokens } from '@/core/db/schema';

export const authAdapterSchema = {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
};
