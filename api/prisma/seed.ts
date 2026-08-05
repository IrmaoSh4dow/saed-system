import {
  AccountStatus,
  AuthProvider,
  CharacterSex,
  CharacterStatus,
  OccupationType,
  StaffStatus,
  PrismaClient,
} from '@prisma/client';
import { hash } from '@node-rs/argon2';

const prisma = new PrismaClient();

/** Keep in sync with src/common/security/password-hash.ts */
const PASSWORD_HASH_OPTIONS = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
} as const;

function hashPassword(password: string): Promise<string> {
  return hash(password, PASSWORD_HASH_OPTIONS);
}

const SAED_ORGANIZATION = 'SAED';

type BootstrapStaffAccount = {
  username: string;
  /** Previous email used before username-only auth (migration lookup). */
  legacyEmail?: string;
  password: string;
  displayName: string;
  firstName: string;
  lastName: string;
  roleSlug: string;
  rankSlug: string;
  employeeNumber: string;
  sex: CharacterSex;
};

const BOOTSTRAP_STAFF_ACCOUNTS: readonly BootstrapStaffAccount[] = [
  {
    username: 'rapempireofficial',
    legacyEmail: 'rapempireofficial@gmail.com',
    password: 'Sh4dow012301**',
    displayName: 'Admin Support',
    firstName: 'Admin',
    lastName: 'Support',
    roleSlug: 'administrator',
    rankSlug: 'administrator',
    employeeNumber: 'ADMIN-001',
    sex: CharacterSex.MALE,
  },
  {
    username: 'adri',
    legacyEmail: 'adri@gmail.com',
    password: 'adri123',
    displayName: 'Hunter Knox',
    firstName: 'Hunter',
    lastName: 'Knox',
    roleSlug: 'medical-director',
    rankSlug: 'medical-director',
    employeeNumber: 'DIR-001',
    sex: CharacterSex.MALE,
  },
];

const BOOTSTRAP_LICENSES = [
  {
    code: 'ACLS',
    name: 'Advanced Cardiovascular Life Support',
    description: 'Certificación de soporte vital cardiovascular avanzado (ACLS).',
  },
  {
    code: 'ATLS',
    name: 'Advanced Trauma Life Support',
    description: 'Certificación de soporte vital avanzado en trauma (ATLS).',
  },
  {
    code: 'PALS',
    name: 'Pediatric Advanced Life Support',
    description: 'Certificación de soporte vital avanzado pediátrico (PALS).',
  },
] as const;

const OBSOLETE_LICENSE_CODES = ['AIR', 'HCU'] as const;
const OBSOLETE_DEPARTMENT_SLUGS = [
  'patrol',
  'swat',
  'detectives',
  'internal-affairs',
  'rtd',
] as const;
const OBSOLETE_RANK_SLUGS = [
  'civilian',
  'cadet',
  'officer-i',
  'officer-ii',
  'sergeant-i',
  'sergeant-ii',
  'lieutenant',
  'captain',
  'commander',
  'chief',
] as const;
const OBSOLETE_ROLE_SLUGS = [
  'cadet',
  'officer',
  'sergeant',
  'lieutenant',
  'captain',
  'commander',
  'chief',
  'internal-affairs',
] as const;

const PERMISSIONS = [
  { key: '*', description: 'Global access' },
  { key: 'permissions.read', description: 'List permissions' },
  { key: 'roles.read', description: 'List roles' },
  { key: 'roles.assign', description: 'Assign roles to characters' },
  { key: 'occupations.read', description: 'Read character occupations' },
  { key: 'occupations.manage', description: 'Manage character occupations' },
  { key: 'ranks.read', description: 'List ranks' },
  { key: 'ranks.create', description: 'Create ranks' },
  { key: 'ranks.update', description: 'Update ranks' },
  { key: 'ranks.delete', description: 'Delete unused ranks' },
  { key: 'characters.read', description: 'Read own characters' },
  { key: 'characters.create', description: 'Create characters' },
  { key: 'characters.update', description: 'Update own characters' },
  { key: 'characters.switch', description: 'Switch active character' },
  { key: 'characters.search', description: 'Search characters for admin actions' },
  { key: 'auth.session', description: 'Manage own session' },
  { key: 'dashboard.read', description: 'View dashboard' },
  { key: 'profile.read', description: 'View own profile' },
  { key: 'settings.read', description: 'View settings' },
  { key: 'staff.read', description: 'View medical staff directory' },
  { key: 'staff.create', description: 'Onboard characters as medical staff' },
  { key: 'staff.update', description: 'Edit staff rank, department and status' },
  { key: 'staff.identity', description: 'Edit staff employee number and callsign' },
  { key: 'staff.delete', description: 'Retire / remove staff profiles' },
  { key: 'accounts.manage', description: 'Manage system accounts (Administrator only)' },
  { key: 'departments.read', description: 'View departments' },
  { key: 'departments.create', description: 'Create departments' },
  { key: 'departments.update', description: 'Update departments' },
  { key: 'admin.access', description: 'Access administrative section' },
  { key: 'reports.read', description: 'View reports' },
  { key: 'reports.create', description: 'Create reports' },
  { key: 'reports.update', description: 'Update reports' },
  { key: 'reports.approve', description: 'Approve reports' },
  { key: 'reports.transfer', description: 'Transfer reports between departments' },
  { key: 'patients.read', description: 'View patient records' },
  { key: 'patients.update', description: 'Update patient records' },
  { key: 'complaints.read', description: 'View complaints' },
  { key: 'complaints.create', description: 'Create complaints' },
  { key: 'complaints.manage', description: 'Manage complaints (Medical Director)' },
  { key: 'complaints.assign', description: 'Assign complaint investigators' },
  { key: 'decorations.read', description: 'View decorations' },
  { key: 'decorations.manage', description: 'Manage decorations catalog and awards' },
  { key: 'licenses.read', description: 'View staff medical licenses and certifications' },
  { key: 'licenses.manage', description: 'Manage licenses catalog and assignments' },
  { key: 'academy.read', description: 'Access medical academy intern portal' },
  { key: 'academy.manage', description: 'Manage academy trainings and announcements' },
  { key: 'academy.apply', description: 'Submit academy or transfer applications' },
  { key: 'academy.applications', description: 'Review academy applications' },
  { key: 'news.manage', description: 'Manage landing page news CMS' },
  { key: 'gallery.manage', description: 'Manage landing page gallery CMS' },
  { key: 'audit.read', description: 'Read administrative audit logs' },
] as const;

const CIVILIAN_CORE = [
  'characters.read',
  'characters.create',
  'characters.update',
  'characters.switch',
  'auth.session',
  'dashboard.read',
  'profile.read',
  'settings.read',
  'complaints.read',
  'complaints.create',
] as const;

const CIVILIAN_BASE = [...CIVILIAN_CORE, 'academy.apply'] as const;

const INTERN_BASE = [
  ...CIVILIAN_CORE,
  'staff.read',
  'departments.read',
  'reports.read',
  'reports.create',
  'academy.read',
] as const;

const RESIDENT_BASE = [...INTERN_BASE, 'reports.update'] as const;

const DOCTOR_BASE = [
  ...RESIDENT_BASE,
  'patients.read',
  'patients.update',
  'reports.approve',
] as const;

const SPECIALIST_BASE = [...DOCTOR_BASE, 'departments.update'] as const;

const DEPARTMENT_CHIEF_BASE = [
  ...SPECIALIST_BASE,
  'staff.update',
  'reports.transfer',
  'departments.create',
  'academy.manage',
  'decorations.read',
  'licenses.read',
] as const;

const MEDICAL_DIRECTOR_BASE = [
  ...DEPARTMENT_CHIEF_BASE,
  'staff.create',
  'staff.delete',
  'staff.identity',
  'characters.search',
  'ranks.read',
  'ranks.create',
  'ranks.update',
  'ranks.delete',
  'occupations.read',
  'occupations.manage',
  'admin.access',
  'audit.read',
  'complaints.manage',
  'complaints.assign',
  'decorations.manage',
  'licenses.manage',
  'academy.applications',
  'news.manage',
  'gallery.manage',
] as const;

const ROLES = [
  {
    name: 'Citizen',
    slug: 'citizen',
    description: 'Default civilian role',
    permissions: [...CIVILIAN_BASE],
  },
  {
    name: 'Intern',
    slug: 'intern',
    description: 'SAED medical intern',
    permissions: [...INTERN_BASE],
  },
  {
    name: 'Resident',
    slug: 'resident',
    description: 'SAED medical resident',
    permissions: [...RESIDENT_BASE],
  },
  {
    name: 'Doctor',
    slug: 'doctor',
    description: 'SAED doctor',
    permissions: [...DOCTOR_BASE],
  },
  {
    name: 'Specialist',
    slug: 'specialist',
    description: 'SAED medical specialist',
    permissions: [...SPECIALIST_BASE],
  },
  {
    name: 'Department Chief',
    slug: 'department-chief',
    description: 'SAED department chief',
    permissions: [...DEPARTMENT_CHIEF_BASE],
  },
  {
    name: 'Medical Director',
    slug: 'medical-director',
    description: 'SAED medical director (high command)',
    permissions: [...MEDICAL_DIRECTOR_BASE],
  },
  {
    name: 'Administrator',
    slug: 'administrator',
    description: 'System administrator',
    permissions: ['*'],
  },
] as const;

const RANKS = [
  { name: 'Ciudadano', slug: 'citizen', description: 'Civilian hierarchy label', sortOrder: 0 },
  { name: 'Interno', slug: 'intern', description: 'Medical academy intern', sortOrder: 10 },
  { name: 'Residente', slug: 'resident', description: 'Medical resident', sortOrder: 20 },
  { name: 'Médico', slug: 'doctor', description: 'Doctor', sortOrder: 30 },
  { name: 'Especialista', slug: 'specialist', description: 'Medical specialist', sortOrder: 40 },
  {
    name: 'Jefe de Departamento',
    slug: 'department-chief',
    description: 'Department chief',
    sortOrder: 50,
  },
  {
    name: 'Director Médico',
    slug: 'medical-director',
    description: 'Medical director',
    sortOrder: 60,
  },
  {
    name: 'Administrador',
    slug: 'administrator',
    description: 'System administrator hierarchy label',
    sortOrder: 100,
  },
] as const;

const DEPARTMENTS = [
  {
    name: 'Emergency Room',
    slug: 'er',
    description: 'Urgencias — atención médica de emergencia',
  },
  {
    name: 'Trauma',
    slug: 'trauma',
    description: 'Trauma — atención avanzada de traumatismos',
  },
  {
    name: 'Intensive Care',
    slug: 'icu',
    description: 'UCI — unidad de cuidados intensivos',
  },
  {
    name: 'Surgery',
    slug: 'surgery',
    description: 'Cirugía — servicios quirúrgicos',
  },
  {
    name: 'Medical Academy',
    slug: 'medical-academy',
    description: 'Academia Médica — formación, reclutamiento e ingreso de internos',
  },
] as const;

async function seed(): Promise<void> {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: { description: permission.description },
      create: {
        key: permission.key,
        description: permission.description,
      },
    });
  }

  for (const role of ROLES) {
    const upsertedRole = await prisma.role.upsert({
      where: { slug: role.slug },
      update: {
        name: role.name,
        description: role.description,
        isSystem: true,
      },
      create: {
        name: role.name,
        slug: role.slug,
        description: role.description,
        isSystem: true,
      },
    });

    const desiredPermissionIds: string[] = [];

    for (const permissionKey of role.permissions) {
      const permission = await prisma.permission.findUnique({
        where: { key: permissionKey },
      });

      if (!permission) {
        continue;
      }

      desiredPermissionIds.push(permission.id);

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: upsertedRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: upsertedRole.id,
          permissionId: permission.id,
        },
      });
    }

    if (desiredPermissionIds.length) {
      await prisma.rolePermission.deleteMany({
        where: {
          roleId: upsertedRole.id,
          permissionId: { notIn: desiredPermissionIds },
        },
      });
    }
  }

  for (const slug of OBSOLETE_ROLE_SLUGS) {
    await prisma.role.updateMany({
      where: { slug },
      data: { isSystem: false },
    });
  }

  for (const rank of RANKS) {
    await prisma.rank.upsert({
      where: { slug: rank.slug },
      update: {
        name: rank.name,
        description: rank.description,
        sortOrder: rank.sortOrder,
        isActive: true,
      },
      create: {
        name: rank.name,
        slug: rank.slug,
        description: rank.description,
        sortOrder: rank.sortOrder,
        isActive: true,
      },
    });
  }

  for (const slug of OBSOLETE_RANK_SLUGS) {
    await prisma.rank.updateMany({
      where: { slug },
      data: { isActive: false },
    });
  }

  for (const department of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { slug: department.slug },
      update: {
        name: department.name,
        description: department.description,
        isActive: true,
      },
      create: {
        name: department.name,
        slug: department.slug,
        description: department.description,
        isActive: true,
      },
    });
  }

  for (const slug of OBSOLETE_DEPARTMENT_SLUGS) {
    await prisma.department.updateMany({
      where: { slug },
      data: { isActive: false },
    });
  }

  for (const license of BOOTSTRAP_LICENSES) {
    await prisma.license.upsert({
      where: { code: license.code },
      update: {
        name: license.name,
        description: license.description,
        isActive: true,
      },
      create: {
        code: license.code,
        name: license.name,
        description: license.description,
        isActive: true,
      },
    });
  }

  for (const code of OBSOLETE_LICENSE_CODES) {
    await prisma.license.updateMany({
      where: { code },
      data: { isActive: false },
    });
  }

  for (const bootstrap of BOOTSTRAP_STAFF_ACCOUNTS) {
    await upsertBootstrapStaffAccount(bootstrap);
  }

  console.log('Identity + administrative seed completed');
}

async function upsertBootstrapStaffAccount(
  bootstrap: BootstrapStaffAccount,
): Promise<void> {
  const username = bootstrap.username.trim().toLowerCase();
  const legacyEmail = bootstrap.legacyEmail?.trim().toLowerCase();
  const passwordHash = await hashPassword(bootstrap.password);

  const role = await prisma.role.findUnique({ where: { slug: bootstrap.roleSlug } });
  if (!role) {
    throw new Error(`Bootstrap role not found: ${bootstrap.roleSlug}`);
  }

  const rank = await prisma.rank.findUnique({ where: { slug: bootstrap.rankSlug } });
  if (!rank) {
    throw new Error(`Bootstrap rank not found: ${bootstrap.rankSlug}`);
  }

  let account =
    (await prisma.account.findUnique({ where: { username } })) ??
    (legacyEmail
      ? await prisma.account.findUnique({ where: { email: legacyEmail } })
      : null);

  if (account) {
    account = await prisma.account.update({
      where: { id: account.id },
      data: {
        username,
        email: null,
        displayName: bootstrap.displayName,
        status: AccountStatus.ACTIVE,
      },
    });
  } else {
    account = await prisma.account.create({
      data: {
        username,
        email: null,
        displayName: bootstrap.displayName,
        status: AccountStatus.ACTIVE,
      },
    });
  }

  const existingIdentity = await prisma.authIdentity.findFirst({
    where: {
      accountId: account.id,
      provider: AuthProvider.LOCAL,
    },
  });

  if (existingIdentity) {
    await prisma.authIdentity.update({
      where: { id: existingIdentity.id },
      data: {
        providerAccountId: username,
        passwordHash,
      },
    });
  } else {
    const identityByUsername = await prisma.authIdentity.findUnique({
      where: {
        provider_providerAccountId: {
          provider: AuthProvider.LOCAL,
          providerAccountId: username,
        },
      },
    });

    if (identityByUsername) {
      await prisma.authIdentity.update({
        where: { id: identityByUsername.id },
        data: {
          accountId: account.id,
          passwordHash,
        },
      });
    } else if (legacyEmail) {
      const identityByEmail = await prisma.authIdentity.findUnique({
        where: {
          provider_providerAccountId: {
            provider: AuthProvider.LOCAL,
            providerAccountId: legacyEmail,
          },
        },
      });

      if (identityByEmail) {
        await prisma.authIdentity.update({
          where: { id: identityByEmail.id },
          data: {
            accountId: account.id,
            providerAccountId: username,
            passwordHash,
          },
        });
      } else {
        await prisma.authIdentity.create({
          data: {
            accountId: account.id,
            provider: AuthProvider.LOCAL,
            providerAccountId: username,
            passwordHash,
          },
        });
      }
    } else {
      await prisma.authIdentity.create({
        data: {
          accountId: account.id,
          provider: AuthProvider.LOCAL,
          providerAccountId: username,
          passwordHash,
        },
      });
    }
  }

  let character = await prisma.character.findFirst({
    where: {
      accountId: account.id,
      firstName: { equals: bootstrap.firstName, mode: 'insensitive' },
      lastName: { equals: bootstrap.lastName, mode: 'insensitive' },
    },
    include: { staffProfile: true },
  });

  if (!character) {
    character = await prisma.character.create({
      data: {
        accountId: account.id,
        firstName: bootstrap.firstName,
        lastName: bootstrap.lastName,
        sex: bootstrap.sex,
        nationality: 'Los Santos',
        status: CharacterStatus.MEDICAL_STAFF,
        rankId: rank.id,
        joinedAt: new Date(),
      },
      include: { staffProfile: true },
    });
  } else {
    character = await prisma.character.update({
      where: { id: character.id },
      data: {
        firstName: bootstrap.firstName,
        lastName: bootstrap.lastName,
        status: CharacterStatus.MEDICAL_STAFF,
        rankId: rank.id,
        sex: bootstrap.sex,
        joinedAt: character.joinedAt ?? new Date(),
      },
      include: { staffProfile: true },
    });
  }

  await prisma.characterRole.deleteMany({
    where: {
      characterId: character.id,
      roleId: { not: role.id },
    },
  });

  await prisma.characterRole.upsert({
    where: {
      characterId_roleId: {
        characterId: character.id,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      characterId: character.id,
      roleId: role.id,
    },
  });

  const employeeConflict = await prisma.staffProfile.findFirst({
    where: {
      employeeNumber: bootstrap.employeeNumber,
      characterId: { not: character.id },
    },
  });
  if (employeeConflict) {
    throw new Error(
      `Bootstrap employee number ${bootstrap.employeeNumber} is already assigned to another staff member`,
    );
  }

  if (character.staffProfile) {
    await prisma.staffProfile.update({
      where: { id: character.staffProfile.id },
      data: {
        employeeNumber: bootstrap.employeeNumber,
        rankId: rank.id,
        status: StaffStatus.ACTIVE,
      },
    });
  } else {
    await prisma.staffProfile.create({
      data: {
        characterId: character.id,
        employeeNumber: bootstrap.employeeNumber,
        rankId: rank.id,
        status: StaffStatus.ACTIVE,
        joinedAt: new Date(),
      },
    });
  }

  await prisma.occupation.updateMany({
    where: {
      characterId: character.id,
      isActive: true,
      organization: { not: SAED_ORGANIZATION },
    },
    data: {
      isActive: false,
      isPrimary: false,
      endedAt: new Date(),
    },
  });

  const saedOccupation = await prisma.occupation.findFirst({
    where: {
      characterId: character.id,
      organization: SAED_ORGANIZATION,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (saedOccupation) {
    await prisma.occupation.update({
      where: { id: saedOccupation.id },
      data: {
        type: OccupationType.DEPARTMENT,
        position: rank.name,
        isPrimary: true,
        isActive: true,
        endedAt: null,
        startedAt: saedOccupation.startedAt ?? new Date(),
      },
    });

    await prisma.occupation.updateMany({
      where: {
        characterId: character.id,
        organization: SAED_ORGANIZATION,
        id: { not: saedOccupation.id },
        isActive: true,
      },
      data: {
        isActive: false,
        isPrimary: false,
        endedAt: new Date(),
      },
    });
  } else {
    await prisma.occupation.create({
      data: {
        characterId: character.id,
        type: OccupationType.DEPARTMENT,
        organization: SAED_ORGANIZATION,
        position: rank.name,
        isPrimary: true,
        isActive: true,
        startedAt: new Date(),
      },
    });
  }

  if (!account.activeCharacterId) {
    await prisma.account.update({
      where: { id: account.id },
      data: { activeCharacterId: character.id },
    });
  }

  console.log(
    `Bootstrap staff ready: ${bootstrap.firstName} ${bootstrap.lastName} @${username} [${bootstrap.roleSlug}/${bootstrap.rankSlug}]`,
  );
}

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
