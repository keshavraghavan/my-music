import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: ['./src/core/db/schema/index.ts'],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://mymusic:mymusic@localhost:5432/mymusic',
  },
  strict: true,
  verbose: true,
});
