import bcrypt from 'bcryptjs';
import { Prisma, PrismaClient } from '@prisma/client';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { z } from 'zod';

const prisma = new PrismaClient();
const emailSchema = z.string().email();

function readHidden(prompt: string): Promise<string> {
  if (!stdin.isTTY || !stdin.setRawMode) {
    throw new Error(
      'Run this command in an interactive terminal to enter the ADMIN password safely.',
    );
  }

  return new Promise((resolve, reject) => {
    let value = '';
    const finish = (error?: Error) => {
      stdin.off('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (input: Buffer | string) => {
      for (const character of input.toString()) {
        if (character === '\u0003') {
          finish(new Error('ADMIN creation cancelled.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          finish();
          return;
        }
        if (character === '\u007f' || character === '\b') {
          value = value.slice(0, -1);
        } else {
          value += character;
        }
      }
    };

    stdout.write(prompt);
    stdin.setEncoding('utf8');
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}

function getProductionDatabase(): URL {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      'Set DATABASE_URL to the production PostgreSQL connection string before continuing.',
    );
  }
  const database = new URL(databaseUrl);
  if (!['postgres:', 'postgresql:'].includes(database.protocol)) {
    throw new Error(
      'Set DATABASE_URL to the production PostgreSQL connection string before continuing.',
    );
  }
  if (['localhost', '127.0.0.1', '[::1]'].includes(database.hostname)) {
    throw new Error(
      'The first ADMIN must be created in the remote production database, not localhost.',
    );
  }

  return database;
}

async function promptForAdmin(databaseHost: string): Promise<{ email: string; password: string }> {
  const readline = createInterface({ input: stdin, output: stdout });
  let emailInput: string;
  try {
    const confirmedHost = await readline.question(
      `Type the production database host (${databaseHost}) to continue: `,
    );
    if (confirmedHost.trim() !== databaseHost) {
      throw new Error('Database host confirmation did not match; ADMIN creation cancelled.');
    }
    emailInput = (await readline.question('First ADMIN email: ')).trim().toLowerCase();
  } finally {
    readline.close();
  }

  const parsedEmail = emailSchema.safeParse(emailInput);
  if (!parsedEmail.success) {
    throw new Error('Enter a valid email address for the first ADMIN.');
  }

  const password = await readHidden('New ADMIN password (minimum 16 characters): ');
  const confirmation = await readHidden('Confirm ADMIN password: ');
  if (password.length < 16 || password !== confirmation) {
    throw new Error('Passwords must match and contain at least 16 characters.');
  }

  return { email: parsedEmail.data, password };
}

async function createFirstAdmin(email: string, password: string): Promise<{ email: string }> {
  const passwordHash = await bcrypt.hash(password, 12);
  return prisma.$transaction(
    async (transaction) => {
      const existingAdmin = await transaction.user.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true },
      });
      if (existingAdmin) {
        throw new Error('An ADMIN already exists; refusing to create another bootstrap account.');
      }

      return transaction.user.create({
        data: {
          email,
          passwordHash,
          role: 'ADMIN',
          locked: false,
        },
        select: { email: true },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

async function main() {
  const database = getProductionDatabase();
  const { email, password } = await promptForAdmin(database.hostname);
  const admin = await createFirstAdmin(email, password);
  console.log(`Created the first ADMIN account for ${admin.email}.`);
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unexpected error.';
    const databaseUrl = process.env.DATABASE_URL;
    console.error(
      'First ADMIN creation failed:',
      databaseUrl ? message.replace(databaseUrl, '[DATABASE_URL]') : message,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
