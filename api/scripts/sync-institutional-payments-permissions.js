/**
 * Upserts institutional-payments.* permissions and grants them to High Command roles.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PERMISSIONS = [
  {
    key: 'institutional-payments.read',
    description: 'View institutional payments ledger and balances',
  },
  {
    key: 'institutional-payments.create',
    description: 'Register institutional payments',
  },
  {
    key: 'institutional-payments.update',
    description: 'Update institutional payments',
  },
  {
    key: 'institutional-payments.delete',
    description: 'Void institutional payments (soft delete)',
  },
];

const ROLE_SLUGS = ['deputy-medical-director', 'medical-director', 'administrator'];

async function main() {
  for (const item of PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: { key: item.key },
      update: { description: item.description },
      create: item,
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
      console.log(`granted ${item.key} → ${slug}`);
    }
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
