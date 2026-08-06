/**
 * Restrict Quejas / Solicitudes / LSPD to High Command (+ LSPD supervisor exception).
 * Upserts High Command grants and revokes those keys from lower roles.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const HIGH_COMMAND_SLUGS = [
  'deputy-medical-director',
  'medical-director',
  'administrator',
];

const LOWER_ROLE_SLUGS = [
  'citizen',
  'intern',
  'resident',
  'doctor',
  'specialist',
  'department-chief',
];

/** Keys restricted to High Command (and optionally LSPD supervisor). */
const HIGH_COMMAND_ONLY_KEYS = [
  'complaints.read',
  'complaints.create',
  'complaints.assign',
  'complaints.manage',
  'admin-requests.read',
  'admin-requests.create',
  'admin-requests.assign',
  'admin-requests.manage',
  'occupational-health.read',
  'lspd.finance.read',
  'institutional-payments.read',
  'institutional-payments.create',
  'institutional-payments.update',
  'institutional-payments.delete',
  'medical-record-access.review',
];

const ROLE_GRANTS = {
  'deputy-medical-director': [
    'complaints.read',
    'complaints.create',
    'complaints.assign',
    'admin-requests.read',
    'admin-requests.create',
    'admin-requests.assign',
    'admin-requests.manage',
    'occupational-health.read',
    'lspd.finance.read',
    'institutional-payments.read',
    'institutional-payments.create',
    'institutional-payments.update',
    'institutional-payments.delete',
    'medical-record-access.read',
    'medical-record-access.review',
  ],
  'medical-director': [
    'complaints.read',
    'complaints.create',
    'complaints.assign',
    'complaints.manage',
    'admin-requests.read',
    'admin-requests.create',
    'admin-requests.assign',
    'admin-requests.manage',
    'occupational-health.read',
    'lspd.finance.read',
    'institutional-payments.read',
    'institutional-payments.create',
    'institutional-payments.update',
    'institutional-payments.delete',
    'medical-record-access.read',
    'medical-record-access.review',
  ],
  administrator: [
    'complaints.read',
    'complaints.create',
    'complaints.assign',
    'complaints.manage',
    'admin-requests.read',
    'admin-requests.create',
    'admin-requests.assign',
    'admin-requests.manage',
    'occupational-health.read',
    'occupational-health.interop',
    'lspd.finance.read',
    'institutional-payments.read',
    'institutional-payments.create',
    'institutional-payments.update',
    'institutional-payments.delete',
    'medical-record-access.read',
    'medical-record-access.request',
    'medical-record-access.review',
  ],
  'lspd-medical-supervisor': [
    'occupational-health.interop',
    'medical-record-access.read',
    'medical-record-access.request',
  ],
};

async function grantKeys(roleId, keys) {
  for (const key of keys) {
    const permission = await prisma.permission.findUnique({ where: { key } });
    if (!permission) {
      console.log(`  skip missing permission ${key}`);
      continue;
    }
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId,
        permissionId: permission.id,
      },
    });
  }
}

async function revokeKeys(roleId, keys) {
  const permissions = await prisma.permission.findMany({
    where: { key: { in: keys } },
    select: { id: true, key: true },
  });
  if (!permissions.length) return;

  const result = await prisma.rolePermission.deleteMany({
    where: {
      roleId,
      permissionId: { in: permissions.map((item) => item.id) },
    },
  });
  if (result.count) {
    console.log(`  revoked ${result.count} permission(s)`);
  }
}

async function main() {
  for (const [slug, keys] of Object.entries(ROLE_GRANTS)) {
    const role = await prisma.role.findUnique({ where: { slug } });
    if (!role) {
      console.log(`skip role ${slug} (missing)`);
      continue;
    }
    await grantKeys(role.id, keys);
    console.log(`granted ${slug}`);
  }

  for (const slug of LOWER_ROLE_SLUGS) {
    const role = await prisma.role.findUnique({ where: { slug } });
    if (!role) {
      console.log(`skip role ${slug} (missing)`);
      continue;
    }
    console.log(`revoking from ${slug}`);
    await revokeKeys(role.id, HIGH_COMMAND_ONLY_KEYS);
  }

  // LSPD supervisor must not keep High Command–only keys if they were granted by mistake.
  const lspdRole = await prisma.role.findUnique({
    where: { slug: 'lspd-medical-supervisor' },
  });
  if (lspdRole) {
    console.log('scrubbing lspd-medical-supervisor of High Command–only keys');
    await revokeKeys(lspdRole.id, [
      'complaints.read',
      'complaints.create',
      'complaints.assign',
      'complaints.manage',
      'admin-requests.read',
      'admin-requests.create',
      'admin-requests.assign',
      'admin-requests.manage',
      'occupational-health.read',
      'lspd.finance.read',
      'medical-record-access.review',
    ]);
  }

  console.log('done');
  console.log(
    `High Command roles: ${HIGH_COMMAND_SLUGS.join(', ')}. LSPD also keeps lspd-medical-supervisor.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
