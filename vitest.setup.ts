import { TEST_DATABASE_URL } from './vitest.database';

// Runs before every test file, so PrismaClient always connects to the test
// database instead of the developer's local prisma/dev.db.
process.env.DATABASE_URL = TEST_DATABASE_URL;
