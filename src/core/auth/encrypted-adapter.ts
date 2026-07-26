import type { Adapter, AdapterAccount } from 'next-auth/adapters';
import { decryptToken, encryptToken } from './token-crypto';

function encryptAccount(account: AdapterAccount): AdapterAccount {
  return {
    ...account,
    ...(account.access_token ? { access_token: encryptToken(account.access_token) } : {}),
    ...(account.refresh_token ? { refresh_token: encryptToken(account.refresh_token) } : {}),
    ...(account.id_token ? { id_token: encryptToken(account.id_token) } : {}),
  };
}

function decryptAccount(account: AdapterAccount | null): AdapterAccount | null {
  if (!account) return null;
  return {
    ...account,
    ...(account.access_token ? { access_token: decryptToken(account.access_token) } : {}),
    ...(account.refresh_token ? { refresh_token: decryptToken(account.refresh_token) } : {}),
    ...(account.id_token ? { id_token: decryptToken(account.id_token) } : {}),
  };
}

/** Encrypts OAuth credentials without changing Auth.js's adapter contract. */
export function withEncryptedOAuthTokens(adapter: Adapter): Adapter {
  return {
    ...adapter,
    linkAccount(account) {
      if (!adapter.linkAccount) throw new Error('Adapter does not support account linking');
      return adapter.linkAccount(encryptAccount(account));
    },
    async getAccount(providerAccountId, provider) {
      if (!adapter.getAccount) return null;
      return decryptAccount(await adapter.getAccount(providerAccountId, provider));
    },
  };
}
