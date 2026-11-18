import { spawnSync } from 'node:child_process';

// prisma.config.ts resolves env('DATABASE_URL') when Prisma loads it. A fresh
// checkout has no .env yet, so give `generate` a harmless local default; it
// only loads the schema and never connects to a database.
const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || 'file:./prisma/dev.db',
};

const result = spawnSync('npx', ['prisma', 'generate'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env,
});
process.exit(result.status ?? 1);
