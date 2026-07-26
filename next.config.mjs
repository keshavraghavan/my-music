/** @type {import('next').NextConfig} */
const nextConfig = {
  // Phase 3 uses the full Next.js server runtime so Server Components can read
  // Postgres. With no DATABASE_URL the same components use the bundled seed
  // snapshot, keeping a fresh clone runnable without configuration.
};

export default nextConfig;
