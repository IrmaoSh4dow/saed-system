/**
 * Ensures every institutional partner (LSPD, LSCSO) has its establishment,
 * finance permission and Medical Supervisor role, without running the full seed
 * cleanup. Safe to re-run.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PARTNERS = [
  {
    key: 'LSPD',
    slug: 'lspd',
    name: 'LSPD',
    defaultPosition: 'Officer',
    sortOrder: 5,
    roleSlug: 'lspd-medical-supervisor',
    roleName: 'LSPD Medical Supervisor',
    financePermission: {
      key: 'lspd.finance.read',
      description: 'View LSPD institutional billing summary',
    },
  },
  {
    key: 'LSCSO',
    slug: 'lscso',
    name: 'LSCSO',
    defaultPosition: 'Deputy',
    sortOrder: 6,
    roleSlug: 'lscso-medical-supervisor',
    roleName: 'LSCSO Medical Supervisor',
    financePermission: {
      key: 'lscso.finance.read',
      description: 'View LSCSO institutional billing summary',
    },
  },
];

const SHARED_PERMISSIONS = [
  {
    key: 'occupational-health.read',
    description: 'View institutional occupational fitness dashboard (High Command)',
  },
  {
    key: 'occupational-health.interop',
    description: 'Institutional interop directory (redacted fitness data)',
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
  {
    key: 'medical-report-access.read',
    description: 'View temporary medical report access grants',
  },
];

/**
 * Mirrors INSTITUTIONAL_MEDICAL_SUPERVISOR_PERMISSIONS in prisma/seed.ts. Each
 * supervisor also gets the billing permission of its own agency.
 */
const SUPERVISOR_PERMISSIONS = [
  'auth.session',
  'dashboard.read',
  'profile.read',
  'settings.read',
  'characters.read',
  'characters.switch',
  'occupational-health.interop',
  'medical-record-access.read',
  'medical-record-access.request',
  'medical-report-access.read',
  'admin-requests.read',
  'admin-requests.create',
  'complaints.read',
  'complaints.create',
  'employment-change.create',
  'employment-change.read',
];

const HIGH_COMMAND_ROLE_SLUGS = [
  'deputy-medical-director',
  'medical-director',
  'administrator',
];

async function upsertPermission(permission) {
  return prisma.permission.upsert({
    where: { key: permission.key },
    update: { description: permission.description },
    create: permission,
  });
}

async function attachPermissions(roleSlug, keys) {
  const role = await prisma.role.findUnique({ where: { slug: roleSlug } });
  if (!role) {
    console.log(`skip role ${roleSlug} (missing)`);
    return;
  }

  let attached = 0;
  for (const key of keys) {
    const permission = await prisma.permission.findUnique({ where: { key } });
    if (!permission) continue;
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: role.id, permissionId: permission.id },
      },
      update: {},
      create: { roleId: role.id, permissionId: permission.id },
    });
    attached += 1;
  }
  console.log(`synced ${roleSlug} (${attached} permissions)`);
}

async function main() {
  for (const permission of SHARED_PERMISSIONS) {
    await upsertPermission(permission);
  }

  for (const partner of PARTNERS) {
    await upsertPermission(partner.financePermission);

    await prisma.establishment.upsert({
      where: { slug: partner.slug },
      update: {
        name: partner.name,
        defaultPosition: partner.defaultPosition,
        occupationType: 'DEPARTMENT',
        sortOrder: partner.sortOrder,
        status: 'ACTIVE',
        isSelectable: true,
      },
      create: {
        slug: partner.slug,
        name: partner.name,
        defaultPosition: partner.defaultPosition,
        occupationType: 'DEPARTMENT',
        sortOrder: partner.sortOrder,
        status: 'ACTIVE',
        isSelectable: true,
      },
    });

    await prisma.role.upsert({
      where: { slug: partner.roleSlug },
      update: { name: partner.roleName },
      create: {
        slug: partner.roleSlug,
        name: partner.roleName,
        description: `External ${partner.name} interoperability role — occupational fitness only (no clinical chart access)`,
      },
    });

    await attachPermissions(partner.roleSlug, [
      ...SUPERVISOR_PERMISSIONS,
      partner.financePermission.key,
    ]);
    console.log(`ensured establishment + role for ${partner.key}`);
  }

  const highCommandKeys = [
    'occupational-health.read',
    'medical-record-access.read',
    'medical-record-access.review',
    'medical-report-access.read',
    ...PARTNERS.map((partner) => partner.financePermission.key),
  ];

  for (const slug of HIGH_COMMAND_ROLE_SLUGS) {
    await attachPermissions(slug, highCommandKeys);
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
