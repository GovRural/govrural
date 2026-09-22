import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

/**
 * Cria o primeiro Super Admin GovRural, se ainda nao existir nenhum.
 * Uso: SEED_SUPER_ADMIN_EMAIL e SEED_SUPER_ADMIN_PASSWORD no .env.
 */
async function main() {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL;
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log(
      'SEED_SUPER_ADMIN_EMAIL/SEED_SUPER_ADMIN_PASSWORD nao definidos - nada a fazer.',
    );
    return;
  }

  const existing = await prisma.user.findFirst({
    where: { role: UserRole.SUPER_ADMIN, deletedAt: null },
  });

  if (existing) {
    console.log('Ja existe um Super Admin, seed ignorado.');
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: 'Super Admin GovRural',
      email,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      municipalityId: null,
    },
  });

  console.log(`Super Admin criado: ${user.email} (${user.id})`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
