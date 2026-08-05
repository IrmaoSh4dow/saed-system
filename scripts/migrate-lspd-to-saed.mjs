/**
 * Domain migration: SAED (police) → SAED (medical).
 * Renames files/folders and applies ordered content replacements.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');

const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'coverage',
  '.git',
  'uploads',
  'dumps',
  'migrations',
]);

const TEXT_EXT = new Set([
  '.ts',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.mdc',
  '.html',
  '.css',
  '.prisma',
  '.yml',
  '.yaml',
  '.env',
  '.example',
  '.txt',
  '.sql',
]);

/** Longer / more specific first to avoid partial collisions. */
const CONTENT_REPLACEMENTS = [
  // Prisma / domain types (compound first)
  ['AcademyTrainingSupportStaff', 'AcademyTrainingSupportStaff'],
  ['supportStaff', 'supportStaff'],
  ['StaffDecoration', 'StaffDecoration'],
  ['StaffLicense', 'StaffLicense'],
  ['StaffDepartment', 'StaffDepartment'],
  ['StaffProfile', 'StaffProfile'],
  ['StaffStatus', 'StaffStatus'],
  ['DepartmentSupervisor', 'DepartmentSupervisor'],
  ['DepartmentOpeningStatus', 'DepartmentOpeningStatus'],
  ['DepartmentMembershipRole', 'DepartmentMembershipRole'],
  ['DepartmentOpening', 'DepartmentOpening'],
  ['staffFilters', 'staffFilters'],
  ['StaffFilters', 'StaffFilters'],
  ['STAFF_FILTERS', 'STAFF_FILTERS'],
  ['staff-filters', 'staff-filters'],
  ['accusedStaffId', 'accusedStaffId'],
  ['accusedStaff', 'accusedStaff'],
  ['leadStaffId', 'leadStaffId'],
  ['leadStaff', 'leadStaff'],
  ['staffProfileId', 'staffProfileId'],
  ['staffProfile', 'staffProfile'],
  ['StaffProfiles', 'StaffProfiles'],
  ['staffProfiles', 'staffProfiles'],
  ['employeeNumber', 'employeeNumber'],
  ['EmployeeNumber', 'EmployeeNumber'],
  ['EMPLOYEE_NUMBER', 'EMPLOYEE_NUMBER'],
  ['supervisedDepartments', 'supervisedDepartments'],
  ['departmentMemberships', 'departmentMemberships'],
  ['departmentId', 'departmentId'],
  ['DepartmentId', 'DepartmentId'],
  ['fromDepartmentId', 'fromDepartmentId'],
  ['toDepartmentId', 'toDepartmentId'],
  ['fromDepartment', 'fromDepartment'],
  ['toDepartment', 'toDepartment'],
  ['minRankId', 'minRankId'], // no-op keep
  ['DEPARTMENT_', 'DEPARTMENT_'],
  ['Department', 'Department'],
  ['department', 'department'],
  ['DEPARTMENTS', 'DEPARTMENTS'],
  ['departments', 'departments'],
  ['SAED_ORGANIZATION', 'SAED_ORGANIZATION'],
  ['isSaedOrganization', 'isSaedOrganization'],
  ['isSaedMember', 'isSaedMember'],
  ['SAED', 'SAED'],
  ['saed', 'saed'],
  ['@saed/', '@saed/'],
  // Character status enums in code strings
  ["'MEDICAL_STAFF'", "'MEDICAL_STAFF'"],
  ['"MEDICAL_STAFF"', '"MEDICAL_STAFF"'],
  ['CharacterStatus.MEDICAL_STAFF', 'CharacterStatus.MEDICAL_STAFF'],
  ["'INTERN'", "'INTERN'"],
  ['"INTERN"', '"INTERN"'],
  ['CharacterStatus.INTERN', 'CharacterStatus.INTERN'],
  // Modules / classes / services
  ['StaffService', 'StaffService'],
  ['StaffController', 'StaffController'],
  ['StaffModule', 'StaffModule'],
  ['CreateStaffDto', 'CreateStaffDto'],
  ['UpdateStaffDto', 'UpdateStaffDto'],
  ['UpdateStaffIdentityDto', 'UpdateStaffIdentityDto'],
  ['DepartmentsService', 'DepartmentsService'], // after Department→Department already applied to DepartmentsService
  ['LandingStaff', 'LandingStaff'],
  ['staff-carousel', 'staff-carousel'],
  ['staff-fiche', 'staff-fiche'],
  ['staff-card', 'staff-card'],
  ['staff-detail', 'staff-detail'],
  ['officer-departments', 'staff-departments'],
  ['admin-staff', 'admin-staff'],
  ['admin-staff', 'admin-staff'],
  ['create-staff', 'create-staff'],
  ['update-staff', 'update-staff'],
  ['staff.service', 'staff.service'],
  ['staff.controller', 'staff.controller'],
  ['staff.module', 'staff.module'],
  ['staff.page', 'staff.page'],
  ['/staff', '/staff'],
  ['/admin/staff', '/admin/staff'],
  ["'staff.", "'staff."],
  ['"staff.', '"staff.'],
  ['staff.read', 'staff.read'],
  ['staff.create', 'staff.create'],
  ['staff.update', 'staff.update'],
  ['staff.identity', 'staff.identity'],
  ['staff.delete', 'staff.delete'],
  ['departments.read', 'departments.read'],
  ['modules/staff', 'modules/staff'],
  ['modules/departments', 'modules/departments'],
  ['components/staff', 'components/staff'],
  ['components/departments', 'components/departments'],
  ['pages/staff', 'pages/staff'],
  ['pages/departments', 'pages/departments'],
  ['services/staff', 'services/staff'],
  ['services/departments', 'services/departments'],
  ['utils/staff', 'utils/staff'],
  ['BootstrapStaff', 'BootstrapStaff'],
  ['BOOTSTRAP_STAFF', 'BOOTSTRAP_STAFF'],
  ['upsertBootstrapStaff', 'upsertBootstrapStaff'],
  ['promoteToStaff', 'promoteToStaff'],
  ['PromoteToStaff', 'PromoteToStaff'],
  ['isMedicalStaff', 'isMedicalStaff'],
  ['hasStaffProfile', 'hasStaffProfile'],
  ['staffId', 'staffId'],
  ['Medical Director', 'Medical Director'],
  ['Medical academy', 'Medical academy'],
  ['Medical Academy', 'Medical Academy'],
  ['San Andreas Emergency Department', 'San Andreas Emergency Department'],
];

const PATH_REPLACEMENTS = [
  ['AcademyTrainingSupportStaff', 'AcademyTrainingSupportStaff'],
  ['staff-filters', 'staff-filters'],
  ['staff-carousel', 'staff-carousel'],
  ['staff-fiche', 'staff-fiche'],
  ['staff-card', 'staff-card'],
  ['staff-detail', 'staff-detail'],
  ['officer-departments', 'staff-departments'],
  ['officer-licenses', 'staff-licenses'],
  ['officer-decorations', 'staff-decorations'],
  ['officer-audit', 'staff-audit'],
  ['admin-staff', 'admin-staff'],
  ['admin-staff-detail', 'admin-staff-detail'],
  ['admin-departments', 'admin-departments'],
  ['department-detail', 'department-detail'],
  ['department-card', 'department-card'],
  ['department-recruitment', 'department-recruitment'],
  ['create-staff', 'create-staff'],
  ['update-staff-identity', 'update-staff-identity'],
  ['update-staff', 'update-staff'],
  ['create-department', 'create-department'],
  ['update-department', 'update-department'],
  ['staff.service', 'staff.service'],
  ['staff.controller', 'staff.controller'],
  ['staff.module', 'staff.module'],
  ['staff.page', 'staff.page'],
  ['departments.service', 'departments.service'],
  ['departments.controller', 'departments.controller'],
  ['departments.module', 'departments.module'],
  ['departments.page', 'departments.page'],
  ['staff.service.js', 'staff.service.js'],
  ['departments.service.js', 'departments.service.js'],
];

const DIR_RENAMES = [
  ['api/src/modules/staff', 'api/src/modules/staff'],
  ['api/src/modules/departments', 'api/src/modules/departments'],
  ['api/src/common/constants', 'api/src/common/constants'], // files inside
  ['web/components/staff', 'web/components/staff'],
  ['web/components/departments', 'web/components/departments'],
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function renamePath(filePath) {
  let next = filePath;
  for (const [from, to] of PATH_REPLACEMENTS) {
    if (next.includes(from)) next = next.split(from).join(to);
  }
  // folder segment renames
  next = next
    .replace(`${path.sep}officers${path.sep}`, `${path.sep}staff${path.sep}`)
    .replace(`${path.sep}departments${path.sep}`, `${path.sep}departments${path.sep}`)
    .replace(`${path.sep}officers`, `${path.sep}staff`)
    .replace(`${path.sep}departments`, `${path.sep}departments`);
  return next;
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function moveFile(from, to) {
  if (from === to) return;
  ensureDir(to);
  if (fs.existsSync(to)) {
    console.warn(`Target exists, skipping move: ${to}`);
    return;
  }
  fs.renameSync(from, to);
}

function applyContent(content) {
  let next = content;
  for (const [from, to] of CONTENT_REPLACEMENTS) {
    if (from === to) continue;
    if (next.includes(from)) next = next.split(from).join(to);
  }
  return next;
}

function main() {
  console.log('ROOT', ROOT);

  // 1) Rename directories first (deepest paths first)
  const dirRenames = [
    path.join(ROOT, 'api/src/modules/staff'),
    path.join(ROOT, 'api/src/modules/departments'),
    path.join(ROOT, 'web/components/staff'),
    path.join(ROOT, 'web/components/departments'),
  ];

  for (const dir of dirRenames) {
    if (!fs.existsSync(dir)) continue;
    const renamed = renamePath(dir);
    if (renamed !== dir) {
      ensureDir(renamed);
      fs.renameSync(dir, renamed);
      console.log('DIR', path.relative(ROOT, dir), '→', path.relative(ROOT, renamed));
    }
  }

  // 2) Rename files
  const roots = ['api', 'web', 'docs', 'database', '.cursor', 'scripts'].map((r) => path.join(ROOT, r));
  const rootFiles = [
    path.join(ROOT, 'package.json'),
    path.join(ROOT, 'README.md'),
    path.join(ROOT, '.env.example'),
  ].filter((f) => fs.existsSync(f));

  let files = [...rootFiles];
  for (const r of roots) files = walk(r, files);

  // Sort by path length descending so nested renames happen safely
  const moves = [];
  for (const file of files) {
    const next = renamePath(file);
    if (next !== file) moves.push([file, next]);
  }
  moves.sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of moves) {
    if (!fs.existsSync(from)) continue;
    moveFile(from, to);
    console.log('FILE', path.relative(ROOT, from), '→', path.relative(ROOT, to));
  }

  // 3) Content replace on all text files (re-walk)
  files = [...rootFiles];
  for (const r of roots) files = walk(r, files);

  let changed = 0;
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const base = path.basename(file);
    if (!TEXT_EXT.has(ext) && !base.startsWith('.env') && base !== 'Dockerfile') continue;
    // skip large dump
    if (file.includes(`${path.sep}dumps${path.sep}`)) continue;
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const next = applyContent(content);
    if (next !== content) {
      fs.writeFileSync(file, next, 'utf8');
      changed += 1;
    }
  }
  console.log(`Updated content in ${changed} files`);
}

main();
