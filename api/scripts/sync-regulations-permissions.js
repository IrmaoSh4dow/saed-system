/**
 * Upserts regulations.* permissions and grants them to SAED / High Command roles.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PERMISSIONS = [
  { key: 'regulations.read', description: 'Read institutional regulations and protocols' },
  { key: 'regulations.create', description: 'Create regulation documents and categories' },
  { key: 'regulations.update', description: 'Update regulation documents and categories' },
  { key: 'regulations.delete', description: 'Delete regulation documents' },
  { key: 'regulations.publish', description: 'Publish or archive regulation documents' },
];

const READ_ROLES = [
  'intern',
  'resident',
  'doctor',
  'specialist',
  'department-chief',
  'deputy-medical-director',
  'medical-director',
  'administrator',
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

    const roles = item.key === 'regulations.read' ? READ_ROLES : MANAGE_ROLES;
    for (const slug of roles) {
      await grant(slug, permission.id);
    }
  }

  const defaults = [
    ['Reglamento General', 'reglamento-general', 10],
    ['Protocolos Médicos', 'protocolos-medicos', 20],
    ['Administración', 'administracion', 30],
    ['Academia', 'academia', 40],
    ['Trauma', 'trauma', 50],
    ['Cirugía', 'cirugia', 60],
    ['Cuidados Intensivos', 'cuidados-intensivos', 70],
    ['Recursos Humanos', 'recursos-humanos', 80],
    ['Comunicados', 'comunicados', 90],
  ];

  for (const [name, slug, sortOrder] of defaults) {
    await prisma.regulationCategory.upsert({
      where: { slug },
      update: {},
      create: { name, slug, sortOrder, isActive: true },
    });
    console.log(`category ${slug}`);
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
