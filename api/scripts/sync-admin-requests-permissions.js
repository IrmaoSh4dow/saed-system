/**
 * Upserts admin-requests.* permissions and grants:
 * - read/create → every role (civilians included)
 * - assign/manage → High Command only
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PERMISSIONS = [
  {
    key: 'admin-requests.read',
    description: 'View own administrative requests (all characters)',
  },
  {
    key: 'admin-requests.create',
    description: 'Create administrative requests (all characters)',
  },
  {
    key: 'admin-requests.assign',
    description: 'Assign administrative requests (High Command)',
  },
  {
    key: 'admin-requests.manage',
    description: 'Manage all administrative requests (High Command)',
  },
];

const HIGH_COMMAND_ROLES = ['deputy-medical-director', 'medical-director', 'administrator'];

async function grant(roleSlug, permissionId) {
  const role = await prisma.role.findUnique({ where: { slug: roleSlug } });
  if (!role) {
    console.log(`skip role ${roleSlug}`);
    return;
  }
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: { roleId: role.id, permissionId },
    },
    update: {},
    create: { roleId: role.id, permissionId },
  });
  console.log(`granted ${permissionId} → ${roleSlug}`);
}

async function main() {
  const roles = await prisma.role.findMany({ select: { slug: true } });
  const allSlugs = roles.map((item) => item.slug);

  for (const item of PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: { key: item.key },
      update: { description: item.description },
      create: item,
    });

    const isManage =
      item.key === 'admin-requests.manage' || item.key === 'admin-requests.assign';
    const targetSlugs = isManage ? HIGH_COMMAND_ROLES : allSlugs;

    for (const slug of targetSlugs) {
      await grant(slug, permission.id);
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
