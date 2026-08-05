import { profilePage } from '../pages/profile.page.js';
import { settingsPage } from '../pages/settings.page.js';
import { dashboardPage } from '../pages/dashboard.page.js';
import { adminHomePage } from '../pages/admin/admin-home.page.js';
import { adminCharactersPage } from '../pages/admin/admin-characters.page.js';
import { adminOfficersPage } from '../pages/admin/admin-staff.page.js';
import { adminRanksPage } from '../pages/admin/admin-ranks.page.js';
import { adminDepartmentsPage } from '../pages/admin/admin-departments.page.js';
import { adminPermissionsPage } from '../pages/admin/admin-permissions.page.js';
import { adminRolesPage } from '../pages/admin/admin-roles.page.js';
import { adminDecorationsPage } from '../pages/admin/admin-decorations.page.js';
import { adminLicensesPage } from '../pages/admin/admin-licenses.page.js';
import { adminAccountsPage } from '../pages/admin/admin-accounts.page.js';
import {
  adminAcademyApplicationsPage,
  adminAcademyPage,
} from '../pages/admin/admin-academy.page.js';
import { adminNewsPage } from '../pages/admin/admin-news.page.js';
import { adminGalleryPage } from '../pages/admin/admin-gallery.page.js';
import { complaintsPage } from '../pages/complaints.page.js';
import { createComplaintPage } from '../pages/create-complaint.page.js';
import { officersPage } from '../pages/staff.page.js';
import { departmentsPage } from '../pages/departments.page.js';
import { allReportsPage, departmentReportsPage, reportsPage } from '../pages/reports.page.js';
import { createReportPage } from '../pages/create-report.page.js';
import { academyPage } from '../pages/academy.page.js';
import {
  academyApplicationsPage,
  academyApplyPage,
  academyTransferApplyPage,
} from '../pages/academy-applications.page.js';
import { PERMISSIONS } from '../utils/permissions.js';

export const privateRoutes = [
  {
    path: '/dashboard',
    handler: dashboardPage,
    permission: PERMISSIONS.DASHBOARD_READ,
  },
  {
    path: '/profile',
    handler: profilePage,
    permission: PERMISSIONS.PROFILE_READ,
  },
  {
    path: '/settings',
    handler: settingsPage,
    permission: PERMISSIONS.SETTINGS_READ,
  },
  {
    path: '/complaints',
    handler: complaintsPage,
    permission: PERMISSIONS.COMPLAINTS_READ,
  },
  {
    path: '/complaints/new',
    handler: createComplaintPage,
    permission: PERMISSIONS.COMPLAINTS_CREATE,
  },
  { path: '/admin', handler: adminHomePage },
  { path: '/admin/characters', handler: adminCharactersPage },
  { path: '/admin/staff', handler: adminOfficersPage },
  { path: '/admin/accounts', handler: adminAccountsPage },
  { path: '/admin/ranks', handler: adminRanksPage },
  { path: '/admin/departments', handler: adminDepartmentsPage },
  { path: '/admin/permissions', handler: adminPermissionsPage },
  { path: '/admin/roles', handler: adminRolesPage },
  { path: '/admin/decorations', handler: adminDecorationsPage },
  { path: '/admin/licenses', handler: adminLicensesPage },
  { path: '/admin/academy', handler: adminAcademyPage },
  { path: '/admin/academy/applications', handler: adminAcademyApplicationsPage },
  { path: '/admin/news', handler: adminNewsPage },
  { path: '/admin/gallery', handler: adminGalleryPage },
  {
    path: '/staff',
    handler: officersPage,
    permission: PERMISSIONS.STAFF_READ,
  },
  {
    path: '/departments',
    handler: departmentsPage,
    permission: PERMISSIONS.DEPARTMENTS_READ,
  },
  {
    path: '/reports',
    handler: reportsPage,
    permission: PERMISSIONS.REPORTS_READ,
  },
  {
    path: '/reports/new',
    handler: createReportPage,
    permission: PERMISSIONS.REPORTS_CREATE,
  },
  {
    path: '/reports/department',
    handler: departmentReportsPage,
    permission: PERMISSIONS.REPORTS_READ,
  },
  {
    path: '/reports/all',
    handler: allReportsPage,
    permission: PERMISSIONS.REPORTS_READ,
  },
  {
    path: '/academy',
    handler: academyPage,
  },
  {
    path: '/academy/applications',
    handler: academyApplicationsPage,
    permission: PERMISSIONS.ACADEMY_APPLY,
  },
  {
    path: '/academy/apply',
    handler: academyApplyPage,
    permission: PERMISSIONS.ACADEMY_APPLY,
  },
  {
    path: '/academy/apply/transfer',
    handler: academyTransferApplyPage,
    permission: PERMISSIONS.ACADEMY_APPLY,
  },
];

export const publicRoutes = [
  { path: '/', name: 'landing' },
  { path: '/auth/login', name: 'login' },
  { path: '/auth/register', name: 'register' },
  { path: '/auth/forgot-password', name: 'forgot-password' },
  { path: '/denuncias', name: 'public-complaints' },
];
