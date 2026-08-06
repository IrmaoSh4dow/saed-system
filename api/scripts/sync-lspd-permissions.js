/**
 * Upserts LSPD / medical-record-access permissions without running the full seed cleanup.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PERMISSIONS = [
  {
    key: 'occupational-health.read',
    description: 'View LSPD occupational fitness dashboard (SAED)',
  },
  {
    key: 'occupational-health.interop',
    description: 'LSPD interop directory (redacted fitness data)',
  },
  {
    key: 'lspd.finance.read',
    description: 'View LSPD institutional billing summary',
  },
  {
    key: 'medical-record-access.read',
    description: 'View medical record access requests',
  },
  {
    key: 'medical-record-access.request',
    description: 'Request temporary clinical record access',
  },
  {
    key: 'medical-record-access.review',
    description: 'Approve or reject medical record access requests',
  },
];

const ROLE_KEYS = {
  'deputy-medical-director': [
    'lspd.finance.read',
    'medical-record-access.read',
    'medical-record-access.review',
    'occupational-health.read',
  ],
  'medical-director': [
    'lspd.finance.read',
    'medical-record-access.read',
    'medical-record-access.review',
    'occupational-health.read',
  ],
  administrator: [
    'lspd.finance.read',
    'medical-record-access.read',
    'medical-record-access.review',
    'occupational-health.read',
    'occupational-health.interop',
  ],
  'lspd-medical-supervisor': [
    'occupational-health.interop',
    'medical-record-access.read',
    'medical-record-access.request',
  ],
};

async function main() {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { description: permission.description },
      create: permission,
    });
  }

  for (const [slug, keys] of Object.entries(ROLE_KEYS)) {
    const role = await prisma.role.findUnique({ where: { slug } });
    if (!role) {
      console.log(`skip role ${slug} (missing)`);
      continue;
    }

    for (const key of keys) {
      const permission = await prisma.permission.findUnique({ where: { key } });
      if (!permission) continue;
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
    }
    console.log(`synced ${slug}`);
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
