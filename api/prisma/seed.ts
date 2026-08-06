import {
  AccountStatus,
  AuthProvider,
  CharacterSex,
  CharacterStatus,
  EstablishmentStatus,
  OccupationType,
  StaffStatus,
  PrismaClient,
} from '@prisma/client';
import { hash } from '@node-rs/argon2';
import { DEFAULT_ESTABLISHMENT_SEED } from '../src/common/constants/workplaces';

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

const BASE_USERNAME = 'sh4dow';

const BOOTSTRAP_STAFF_ACCOUNTS: readonly BootstrapStaffAccount[] = [
  {
    username: 'Sh4dow',
    password: 'Sh4dow012301**',
    displayName: 'Grant Mercer',
    firstName: 'Grant',
    lastName: 'Mercer',
    roleSlug: 'administrator',
    rankSlug: 'administrator',
    employeeNumber: 'SAED-001',
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
  { key: 'staff.manage', description: 'Full medical staff management' },
  { key: 'accounts.manage', description: 'Manage system accounts (Administrator only)' },
  { key: 'departments.read', description: 'View departments' },
  { key: 'departments.create', description: 'Create departments' },
  { key: 'departments.update', description: 'Update departments' },
  { key: 'departments.manage', description: 'Full department administration' },
  { key: 'admin.access', description: 'Access administrative section' },
  { key: 'reports.read', description: 'View medical reports' },
  { key: 'reports.create', description: 'Create medical reports' },
  { key: 'reports.update', description: 'Update medical reports' },
  { key: 'reports.approve', description: 'Approve medical reports' },
  { key: 'reports.transfer', description: 'Transfer medical reports between departments' },
  { key: 'medical-reports.read', description: 'View medical reports (alias domain key)' },
  { key: 'medical-reports.create', description: 'Create medical reports (alias domain key)' },
  { key: 'medical-reports.update', description: 'Update medical reports (alias domain key)' },
  { key: 'medical-records.create', description: 'Create medical records' },
  { key: 'medical-records.update', description: 'Update medical records' },
  { key: 'medical-records.read', description: 'View medical records' },
  { key: 'patients.read', description: 'View clinical patient registry' },
  { key: 'patients.create', description: 'Register clinical patients' },
  { key: 'patients.update', description: 'Update clinical patient records' },
  { key: 'complaints.read', description: 'View institutional complaints (High Command)' },
  { key: 'complaints.create', description: 'Create institutional complaints (High Command)' },
  { key: 'complaints.manage', description: 'Manage complaints (Medical Director)' },
  { key: 'complaints.assign', description: 'Assign complaint investigators (High Command)' },
  { key: 'appointments.read', description: 'View appointments' },
  { key: 'appointments.create', description: 'Create appointments' },
  { key: 'appointments.manage', description: 'Manage appointments (Medical Director)' },
  { key: 'appointments.assign', description: 'Assign staff to appointments' },
  { key: 'admin-requests.read', description: 'View administrative requests (High Command)' },
  { key: 'admin-requests.create', description: 'Create administrative requests (High Command)' },
  { key: 'admin-requests.manage', description: 'Manage administrative requests (High Command)' },
  { key: 'admin-requests.assign', description: 'Assign administrative requests (High Command)' },
  { key: 'decorations.read', description: 'View decorations' },
  { key: 'decorations.manage', description: 'Manage decorations catalog and awards' },
  { key: 'licenses.read', description: 'View staff medical licenses and certifications' },
  { key: 'licenses.manage', description: 'Manage licenses catalog and assignments' },
  { key: 'academy.read', description: 'Access medical academy intern portal' },
  { key: 'academy.manage', description: 'Manage academy trainings and announcements' },
  { key: 'academy.apply', description: 'Submit academy or transfer applications' },
  { key: 'academy.applications', description: 'Review academy applications' },
  { key: 'applications.manage', description: 'Open/close application convocatorias (High Command)' },
  { key: 'agreements.read', description: 'View institutional business agreements' },
  { key: 'agreements.manage', description: 'Manage institutional business agreements' },
  { key: 'establishments.read', description: 'View establishments catalog (admin)' },
  { key: 'establishments.create', description: 'Create establishments' },
  { key: 'establishments.update', description: 'Update establishments' },
  { key: 'establishments.delete', description: 'Delete or archive establishments' },
  { key: 'establishments.manage', description: 'Full establishments administration' },
  { key: 'psychotechnical-evaluations.read', description: 'View psychotechnical evaluations' },
  { key: 'psychotechnical-evaluations.create', description: 'Register psychotechnical evaluations' },
  { key: 'psychotechnical-evaluations.update', description: 'Update psychotechnical evaluations' },
  { key: 'psychotechnical-evaluations.manage', description: 'Manage psychotechnical evaluations' },
  { key: 'medical-leaves.read', description: 'View medical leaves' },
  { key: 'medical-leaves.create', description: 'Register medical leaves' },
  { key: 'medical-leaves.update', description: 'Update medical leaves' },
  { key: 'medical-leaves.manage', description: 'Manage medical leaves' },
  { key: 'occupational-health.read', description: 'View LSPD occupational fitness dashboard (High Command)' },
  { key: 'occupational-health.interop', description: 'LSPD interop directory (redacted fitness data)' },
  { key: 'lspd.finance.read', description: 'View LSPD institutional billing summary' },
  { key: 'institutional-payments.read', description: 'View institutional payments ledger and balances' },
  { key: 'institutional-payments.create', description: 'Register institutional payments' },
  { key: 'institutional-payments.update', description: 'Update institutional payments' },
  { key: 'institutional-payments.delete', description: 'Void institutional payments (soft delete)' },
  { key: 'regulations.read', description: 'Read institutional regulations and protocols' },
  { key: 'regulations.create', description: 'Create regulation documents and categories' },
  { key: 'regulations.update', description: 'Update regulation documents and categories' },
  { key: 'regulations.delete', description: 'Delete regulation documents' },
  { key: 'regulations.publish', description: 'Publish or archive regulation documents' },
  { key: 'medical-record-access.read', description: 'View medical record access requests' },
  { key: 'medical-record-access.request', description: 'Request temporary clinical record access' },
  { key: 'medical-record-access.review', description: 'Approve or reject medical record access requests' },
  { key: 'staff-ratings.create', description: 'Submit medical staff ratings after completed appointments' },
  { key: 'staff-ratings.read', description: 'View medical staff ratings (High Command only)' },
  { key: 'staff-ratings.dashboard', description: 'View hospital-wide ratings analytics' },
  { key: 'shifts.read', description: 'View own duty shifts and statistics' },
  { key: 'shifts.clock', description: 'Clock in and out of duty' },
  { key: 'shifts.manage', description: 'Manage duty shifts across staff' },
  { key: 'incentives.read', description: 'View institutional incentives module' },
  { key: 'incentives.manage', description: 'Manage institutional incentives administration' },
  { key: 'incentives.pay', description: 'Register incentive payments to staff' },
  { key: 'incentives.configuration', description: 'Configure incentive amounts per rank' },
  { key: 'news.manage', description: 'Manage landing page news CMS' },
  { key: 'gallery.manage', description: 'Manage landing page gallery CMS' },
  { key: 'audit.read', description: 'Read administrative audit logs' },
] as const;

const DEFAULT_INCENTIVE_AMOUNTS: Record<string, number> = {
  intern: 2500,
  resident: 5000,
  doctor: 8000,
  specialist: 10000,
  'department-chief': 15000,
  'deputy-medical-director': 20000,
  'medical-director': 25000,
  administrator: 25000,
};

const CIVILIAN_CORE = [
  'characters.read',
  'characters.create',
  'characters.update',
  'characters.switch',
  'auth.session',
  'dashboard.read',
  'profile.read',
  'settings.read',
  'staff-ratings.create',
  'appointments.read',
  'appointments.create',
] as const;

const CIVILIAN_BASE = [...CIVILIAN_CORE, 'academy.apply'] as const;

const INTERN_BASE = [
  ...CIVILIAN_CORE,
  'staff.read',
  'departments.read',
  'reports.read',
  'reports.create',
  'medical-reports.read',
  'medical-reports.create',
  'patients.read',
  'patients.create',
  'academy.read',
  'regulations.read',
  'shifts.read',
  'shifts.clock',
  'agreements.read',
  'psychotechnical-evaluations.read',
  'medical-leaves.read',
] as const;

const RESIDENT_BASE = [
  ...INTERN_BASE,
  'reports.update',
  'medical-reports.update',
  'medical-records.read',
] as const;

const DOCTOR_BASE = [
  ...RESIDENT_BASE,
  'patients.update',
  'reports.approve',
  'medical-records.create',
  'medical-records.update',
  'psychotechnical-evaluations.create',
  'psychotechnical-evaluations.update',
  'medical-leaves.create',
  'medical-leaves.update',
] as const;

const SPECIALIST_BASE = [...DOCTOR_BASE, 'departments.update'] as const;

const DEPARTMENT_CHIEF_BASE = [
  ...SPECIALIST_BASE,
  'staff.update',
  'staff.manage',
  'reports.transfer',
  'departments.create',
  'departments.manage',
  'academy.manage',
  'decorations.read',
  'licenses.read',
  'shifts.manage',
  'agreements.manage',
] as const;

const DEPUTY_MEDICAL_DIRECTOR_BASE = [
  ...DEPARTMENT_CHIEF_BASE,
  'staff.create',
  'staff.identity',
  'characters.search',
  'ranks.read',
  'occupations.read',
  'admin.access',
  'audit.read',
  // Quejas / Solicitudes / LSPD — High Command and above only
  'complaints.read',
  'complaints.create',
  'complaints.assign',
  'admin-requests.read',
  'admin-requests.create',
  'admin-requests.assign',
  'admin-requests.manage',
  'occupational-health.read',
  'appointments.assign',
  'academy.applications',
  'applications.manage',
  'incentives.read',
  'incentives.manage',
  'incentives.pay',
  'incentives.configuration',
  'establishments.read',
  'establishments.create',
  'establishments.update',
  'establishments.delete',
  'establishments.manage',
  'psychotechnical-evaluations.manage',
  'medical-leaves.manage',
  'lspd.finance.read',
  'institutional-payments.read',
  'institutional-payments.create',
  'institutional-payments.update',
  'institutional-payments.delete',
  'regulations.create',
  'regulations.update',
  'regulations.delete',
  'regulations.publish',
  'medical-record-access.read',
  'medical-record-access.review',
  'staff-ratings.read',
  'staff-ratings.dashboard',
] as const;

const MEDICAL_DIRECTOR_BASE = [
  ...DEPUTY_MEDICAL_DIRECTOR_BASE,
  'staff.delete',
  'ranks.create',
  'ranks.update',
  'ranks.delete',
  'occupations.manage',
  'complaints.manage',
  'appointments.manage',
  'decorations.manage',
  'licenses.manage',
  'news.manage',
  'gallery.manage',
] as const;

/** External agency interop — redacted occupational fitness only (no clinical chart). */
const LSPD_MEDICAL_SUPERVISOR_PERMISSIONS = [
  'auth.session',
  'dashboard.read',
  'profile.read',
  'settings.read',
  'characters.read',
  'characters.switch',
  'occupational-health.interop',
  'medical-record-access.read',
  'medical-record-access.request',
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
    name: 'Deputy Medical Director',
    slug: 'deputy-medical-director',
    description: 'SAED deputy medical director',
    permissions: [...DEPUTY_MEDICAL_DIRECTOR_BASE],
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
  {
    name: 'LSPD Medical Supervisor',
    slug: 'lspd-medical-supervisor',
    description:
      'External LSPD interoperability role — occupational fitness only (no clinical chart access)',
    permissions: [...LSPD_MEDICAL_SUPERVISOR_PERMISSIONS],
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
    name: 'Subdirector Médico',
    slug: 'deputy-medical-director',
    description: 'Deputy medical director',
    sortOrder: 55,
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

  const incentiveRanks = await prisma.rank.findMany({
    where: { slug: { not: 'citizen' }, isActive: true },
  });
  for (const rank of incentiveRanks) {
    const amount = DEFAULT_INCENTIVE_AMOUNTS[rank.slug] ?? 0;
    await prisma.incentiveConfiguration.upsert({
      where: { rankId: rank.id },
      update: {},
      create: {
        rankId: rank.id,
        amount,
        isActive: true,
      },
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

  for (const establishment of DEFAULT_ESTABLISHMENT_SEED) {
    const isSelectable = establishment.isSelectable ?? true;
    await prisma.establishment.upsert({
      where: { slug: establishment.slug },
      update: {
        name: establishment.name,
        defaultPosition: establishment.defaultPosition,
        occupationType: establishment.type,
        sortOrder: establishment.sortOrder,
        status: EstablishmentStatus.ACTIVE,
        isSelectable,
      },
      create: {
        slug: establishment.slug,
        name: establishment.name,
        defaultPosition: establishment.defaultPosition,
        occupationType: establishment.type,
        sortOrder: establishment.sortOrder,
        status: EstablishmentStatus.ACTIVE,
        isSelectable,
      },
    });
  }

  const establishments = await prisma.establishment.findMany({
    select: { id: true, name: true },
  });
  for (const establishment of establishments) {
    await prisma.occupation.updateMany({
      where: {
        establishmentId: null,
        organization: { equals: establishment.name, mode: 'insensitive' },
      },
      data: { establishmentId: establishment.id },
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

  await ensureApplicationConfigurations();

  await pruneOperationalData();
  await seedTreatments();

  console.log('Identity + administrative seed completed');
}

async function ensureApplicationConfigurations(): Promise<void> {
  for (const type of ['ACADEMY', 'TRANSFER'] as const) {
    await prisma.applicationConfiguration.upsert({
      where: { type },
      update: {},
      create: {
        type,
        isOpen: false,
      },
    });
  }
  console.log('Application configurations ensured (ACADEMY, TRANSFER)');
}

/**
 * Wipe transactional / operational content while preserving:
 * - @sh4dow account + characters + staff profile / assignments
 * - catalogs: roles, permissions, ranks, departments, licenses, decorations,
 *   treatments, establishments, incentive configuration
 *
 * Controlled by PRUNE_OPERATIONAL_DATA (default: false).
 * Set PRUNE_OPERATIONAL_DATA=true only for an intentional one-off cleanup deploy.
 */
async function pruneOperationalData(): Promise<void> {
  const enabled = String(process.env.PRUNE_OPERATIONAL_DATA ?? 'false').toLowerCase() === 'true';
  if (!enabled) {
    console.log('Skipping operational data prune (PRUNE_OPERATIONAL_DATA is not true)');
    return;
  }

  console.log('Pruning operational data (keeping catalogs + @sh4dow)…');

  // Explicit list — do NOT include Account/Character/StaffProfile/catalog tables.
  // CASCADE clears dependent FK rows that reference these tables.
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "StaffRating",
      "IncentivePayment",
      "StaffShift",
      "MedicalRecordAccessRequest",
      "PsychotechnicalEvaluation",
      "MedicalLeave",
      "MedicalRecord",
      "Hospitalization",
      "Diagnosis",
      "Surgery",
      "PatientInvoice",
      "ReportParticipant",
      "ReportEvidence",
      "ReportTransfer",
      "Report",
      "Patient",
      "ComplaintEvidence",
      "ComplaintMessage",
      "ComplaintInternalNote",
      "ComplaintAssignment",
      "ComplaintEvent",
      "Complaint",
      "AppointmentMessage",
      "AppointmentInternalNote",
      "AppointmentAssignment",
      "AppointmentEvent",
      "Appointment",
      "AdminRequestMessage",
      "AdminRequestInternalNote",
      "AdminRequestAssignment",
      "AdminRequestEvent",
      "AdminRequest",
      "AcademyTrainingAttendance",
      "AcademyTrainingSupportStaff",
      "AcademyTraining",
      "AcademyAnnouncement",
      "AcademyApplication",
      "InterestLetter",
      "DepartmentOpening",
      "DepartmentSupervisor",
      "AgreementHistory",
      "Agreement",
      "NewsArticle",
      "GalleryItem",
      "Notification",
      "AuditLog",
      "RefreshToken"
    RESTART IDENTITY CASCADE
  `);

  await removeNonBaseAccounts();
  console.log('Operational data pruned');
}

const DEFAULT_TREATMENTS = [
  { name: 'Consulta médica general', price: 150, sortOrder: 10 },
  { name: 'Curación / sutura menor', price: 250, sortOrder: 20 },
  { name: 'Radiografía', price: 300, sortOrder: 30 },
  { name: 'Analítica de sangre', price: 200, sortOrder: 40 },
  { name: 'Ecografía', price: 350, sortOrder: 50 },
  { name: 'Psicotécnico civil', price: 400, sortOrder: 60 },
  { name: 'Psicotécnico LSPD', price: 500, sortOrder: 70 },
  { name: 'Hospitalización (día)', price: 800, sortOrder: 80 },
  { name: 'Cirugía menor', price: 1500, sortOrder: 90 },
  { name: 'Tratamiento de urgencias', price: 600, sortOrder: 100 },
] as const;

async function seedTreatments(): Promise<void> {
  for (const treatment of DEFAULT_TREATMENTS) {
    await prisma.treatment.upsert({
      where: { name: treatment.name },
      update: {
        price: treatment.price,
        isActive: true,
        sortOrder: treatment.sortOrder,
      },
      create: {
        name: treatment.name,
        price: treatment.price,
        isActive: true,
        sortOrder: treatment.sortOrder,
      },
    });
  }
}

async function removeNonBaseAccounts(): Promise<void> {
  const removed = await prisma.account.deleteMany({
    where: {
      username: { not: BASE_USERNAME },
    },
  });

  console.log(`Removed ${removed.count} non-base account(s); kept @${BASE_USERNAME}`);
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
