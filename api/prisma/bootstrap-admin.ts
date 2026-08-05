/**
 * Assigns an RBAC role to a character by name.
 * Usage: npx ts-node --transpile-only prisma/bootstrap-admin.ts "Thomas Graves" medical-director
 *
 * Rank (hierarchy) is NOT changed. Only CharacterRole is updated.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const fullName = process.argv[2];
  const roleSlug = (process.argv[3] || 'administrator').toLowerCase();

  if (!fullName) {
    console.error('Usage: bootstrap-admin.ts "First Last" [roleSlug]');
    console.error('Example: bootstrap-admin.ts "Thomas Graves" medical-director');
    process.exit(1);
  }

  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  const lastName = rest.join(' ');

  const character = await prisma.character.findFirst({
    where: {
      firstName: { equals: firstName, mode: 'insensitive' },
      lastName: { equals: lastName || undefined, mode: 'insensitive' },
    },
  });

  if (!character) {
    console.error(`Character not found: ${fullName}`);
    process.exit(1);
  }

  const role = await prisma.role.findUnique({ where: { slug: roleSlug } });
  if (!role) {
    console.error(`Role not found: ${roleSlug}`);
    process.exit(1);
  }

  await prisma.characterRole.deleteMany({ where: { characterId: character.id } });
  await prisma.characterRole.create({
    data: {
      characterId: character.id,
      roleId: role.id,
    },
  });

  console.log(
    `Assigned role "${role.slug}" to ${character.firstName} ${character.lastName} (${character.id})`,
  );
  console.log('Re-select the character in the app to refresh JWT permissions.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
