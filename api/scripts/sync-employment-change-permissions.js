/**
 * Upserts employment-change.* permissions and grants them to citizen / High Command / LSPD roles.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PERMISSIONS = [
  {
    key: 'employment-change.create',
    description: 'Request a civilian employment / establishment change',
  },
  {
    key: 'employment-change.read',
    description: 'View employment change requests',
  },
  {
    key: 'employment-change.review',
    description: 'Approve or reject employment change requests',
  },
  {
    key: 'employment-change.manage',
    description: 'Manually change character employment',
  },
];

const CREATE_READ_ROLES = ['citizen', 'lspd-medical-supervisor'];
const MANAGE_ROLES = ['deputy-medical-director', 'medical-director', 'administrator'];

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
  console.log(`granted → ${roleSlug}`);
}

async function main() {
  for (const item of PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: { key: item.key },
      update: { description: item.description },
      create: item,
    });

    const roles =
      item.key === 'employment-change.create' || item.key === 'employment-change.read'
        ? [...new Set([...CREATE_READ_ROLES, ...MANAGE_ROLES])]
        : MANAGE_ROLES;

    for (const slug of roles) {
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
