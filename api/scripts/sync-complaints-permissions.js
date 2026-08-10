/**
 * Upserts complaints.* permissions and grants:
 * - read/create → every role (civilians included)
 * - assign/manage → High Command only
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PERMISSIONS = [
  {
    key: 'complaints.read',
    description: 'View own institutional complaints (all characters)',
  },
  {
    key: 'complaints.create',
    description: 'Create institutional complaints (all characters)',
  },
  {
    key: 'complaints.assign',
    description: 'Assign complaint investigators (High Command)',
  },
  {
    key: 'complaints.manage',
    description: 'Manage complaints (Medical Director)',
  },
];

const ASSIGN_ROLES = ['deputy-medical-director', 'medical-director', 'administrator'];
const MANAGE_ROLES = ['medical-director', 'administrator'];

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

    let targetSlugs = allSlugs;
    if (item.key === 'complaints.assign') {
      targetSlugs = ASSIGN_ROLES;
    } else if (item.key === 'complaints.manage') {
      targetSlugs = MANAGE_ROLES;
    }

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
