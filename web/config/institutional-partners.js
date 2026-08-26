import { hasAnyPermission, PERMISSIONS } from '../utils/permissions.js';

/**
 * External agencies the SAED interoperates with. Mirrors the backend registry in
 * api/src/common/constants/institutional-partners.ts — adding an entry here is
 * what makes its module appear in navigation, routes and pages.
 */
export const INSTITUTIONAL_PARTNERS = [
  {
    key: 'LSPD',
    label: 'LSPD',
    displayName: 'Los Santos Police Department',
    routePath: '/lspd',
    apiBasePath: '/lspd',
    financePermission: PERMISSIONS.LSPD_FINANCE_READ,
    establishmentSlug: 'lspd',
    description:
      'Plataforma médica entre el SAED y el Departamento de Policía de Los Santos. Aptitud laboral, privacidad clínica y facturación institucional.',
    rosterLabel: 'Personal LSPD vinculado',
    badgeLabel: 'Placa LSPD',
    badgePlaceholder: 'Ej. 1A-12',
    supervisorRoleSlug: 'lspd-medical-supervisor',
  },
  {
    key: 'LSCSO',
    label: 'LSCSO',
    displayName: "Los Santos County Sheriff's Office",
    routePath: '/lscso',
    apiBasePath: '/lscso',
    financePermission: PERMISSIONS.LSCSO_FINANCE_READ,
    establishmentSlug: 'lscso',
    description:
      'Plataforma médica entre el SAED y la Oficina del Sheriff del Condado de Los Santos. Aptitud laboral, privacidad clínica y facturación institucional.',
    rosterLabel: 'Personal LSCSO vinculado',
    badgeLabel: 'Placa LSCSO',
    badgePlaceholder: 'Ej. S-114',
    supervisorRoleSlug: 'lscso-medical-supervisor',
  },
];

export function getInstitutionalPartner(key) {
  return INSTITUTIONAL_PARTNERS.find((partner) => partner.key === key) ?? null;
}

export function findPartnerBySupervisorRole(roleSlug) {
  const value = (roleSlug ?? '').trim().toLowerCase();
  return (
    INSTITUTIONAL_PARTNERS.find((partner) => partner.supervisorRoleSlug === value) ?? null
  );
}

export function findPartnerByEstablishmentSlug(slug) {
  const value = (slug ?? '').trim().toLowerCase();
  return (
    INSTITUTIONAL_PARTNERS.find((partner) => partner.establishmentSlug === value) ?? null
  );
}

/** SAED-side permissions that grant oversight over every agency at once. */
const CROSS_PARTNER_PERMISSIONS = [
  PERMISSIONS.OCCUPATIONAL_HEALTH_READ,
  PERMISSIONS.MEDICAL_RECORD_ACCESS_REVIEW,
];

/**
 * Mirrors the backend rule: SAED High Command oversees every agency, while an
 * external supervisor only sees its own. This merely hides the module — the
 * backend is what actually enforces the isolation.
 */
export function canAccessPartnerModule(partnerKey, grantedPermissions, activeCharacter) {
  if (hasAnyPermission(grantedPermissions, CROSS_PARTNER_PERMISSIONS)) {
    return true;
  }

  const partner = getInstitutionalPartner(partnerKey);
  return Boolean(partner) && Boolean(activeCharacter?.roles?.includes(partner.supervisorRoleSlug));
}
