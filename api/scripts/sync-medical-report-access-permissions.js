/**
 * Upserts medical-report-access.* permissions and grants them to High Command / LSPD supervisors.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PERMISSIONS = [
  {
    key: 'medical-report-access.read',
    description: 'View temporary medical report access grants',
  },
  {
    key: 'medical-report-access.grant',
    description: 'Grant temporary medical report access to external supervisors',
  },
  {
    key: 'medical-report-access.revoke',
    description: 'Revoke temporary medical report access grants',
  },
];

const READ_ROLES = [
  'deputy-medical-director',
  'medical-director',
  'administrator',
  'lspd-medical-supervisor',
];

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

    const roles = item.key === 'medical-report-access.read' ? READ_ROLES : MANAGE_ROLES;
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
