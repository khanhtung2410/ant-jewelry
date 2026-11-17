import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import { BCRYPT_COST } from '../src/features/shared/lib/password';
import { seedCatalogue } from './seed-catalogue';

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  if (url.startsWith('file:') || url.startsWith('sqlite:')) {
    return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

const prisma = createPrismaClient();

async function main() {
  if (!process.env.DATABASE_URL?.startsWith('file:')) {
    throw new Error(
      'The demo seed only supports local SQLite; use `npm run db:seed:production` for PostgreSQL.',
    );
  }

  await seedCatalogue(prisma);

  const adminPasswordHash = await bcrypt.hash('Admin@123', BCRYPT_COST);
  const editorPasswordHash = await bcrypt.hash('Editor@123', BCRYPT_COST);

  await prisma.user.upsert({
    where: { email: 'admin@antjewelry.local' },
    update: {
      name: 'Admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      locked: false,
    },
    create: {
      email: 'admin@antjewelry.local',
      name: 'Admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      locked: false,
    },
  });

  await prisma.user.upsert({
    where: { email: 'editor@antjewelry.local' },
    update: {
      name: 'Editor',
      passwordHash: editorPasswordHash,
      role: 'EDITOR',
      locked: false,
    },
    create: {
      email: 'editor@antjewelry.local',
      name: 'Editor',
      passwordHash: editorPasswordHash,
      role: 'EDITOR',
      locked: false,
    },
  });
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
