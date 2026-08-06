/**
 * Upserts applications.manage permission and grants it to High Command roles.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PERMISSION = {
  key: 'applications.manage',
  description: 'Open/close application convocatorias (High Command)',
};

const ROLE_SLUGS = ['deputy-medical-director', 'medical-director', 'administrator'];

async function main() {
  const permission = await prisma.permission.upsert({
    where: { key: PERMISSION.key },
    update: { description: PERMISSION.description },
    create: PERMISSION,
  });

  for (const slug of ROLE_SLUGS) {
    const role = await prisma.role.findUnique({ where: { slug } });
    if (!role) {
      console.log(`skip role ${slug}`);
      continue;
    }
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });
    console.log(`granted ${slug}`);
  }

  for (const type of ['ACADEMY', 'TRANSFER']) {
    await prisma.applicationConfiguration.upsert({
      where: { type },
      update: {},
      create: { type, isOpen: false },
    });
    console.log(`config ${type}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
