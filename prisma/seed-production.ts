import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { seedCatalogue } from './seed-catalogue';

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  if (url.startsWith('file:') || url.startsWith('sqlite:')) {
    throw new Error(
      'db:seed:production requires a PostgreSQL DATABASE_URL (use the direct db.prisma.io string).',
    );
  }

  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

const prisma = createPrismaClient();

async function main() {
  const databaseHost = (() => {
    try {
      return new URL(process.env.DATABASE_URL ?? '').host;
    } catch {
      return '(unparsed)';
    }
  })();

  if (databaseHost.startsWith('pooled.')) {
    console.warn(
      '[seed] Warning: DATABASE_URL points at the pooled endpoint. The direct db.prisma.io string is recommended for seeding.',
    );
  }

  console.log(`[seed] Seeding demo catalogue into ${databaseHost} (no demo users).`);
  await seedCatalogue(prisma);
  console.log(
    '[seed] Catalogue seeded. Create a real ADMIN with `npm run db:create-admin:production`.',
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
