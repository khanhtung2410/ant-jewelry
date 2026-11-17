import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'server-only': fileURLToPath(new URL('./src/test/server-only.ts', import.meta.url)),
      'next/cache': fileURLToPath(new URL('./src/test/next-cache.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: false,
    // Every test file shares the same SQLite database (prisma/test.db). Running
    // them in parallel makes SQLite report SQLITE_BUSY (Prisma surfaces it as
    // "Operation has timed out") on serializable transactions, so files run
    // one at a time.
    fileParallelism: false,
    globalSetup: './vitest.global-setup.ts',
    setupFiles: ['./vitest.setup.ts'],
  },
});
