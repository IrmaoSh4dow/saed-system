const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PERMISSIONS = [
  {
    key: 'staff-ratings.create',
    description: 'Submit medical staff ratings after completed appointments',
  },
  {
    key: 'staff-ratings.read',
    description: 'View medical staff ratings (High Command only)',
  },
  {
    key: 'staff-ratings.dashboard',
    description: 'View hospital-wide ratings analytics',
  },
];

const ROLE_KEYS = {
  citizen: ['staff-ratings.create'],
  intern: ['staff-ratings.create'],
  resident: ['staff-ratings.create'],
  doctor: ['staff-ratings.create'],
  specialist: ['staff-ratings.create'],
  'department-chief': ['staff-ratings.create'],
  'deputy-medical-director': [
    'staff-ratings.create',
    'staff-ratings.read',
    'staff-ratings.dashboard',
  ],
  'medical-director': [
    'staff-ratings.create',
    'staff-ratings.read',
    'staff-ratings.dashboard',
  ],
  administrator: [
    'staff-ratings.create',
    'staff-ratings.read',
    'staff-ratings.dashboard',
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
      console.log(`skip role ${slug}`);
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
