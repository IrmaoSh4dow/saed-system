import { hasAnyPermission } from '../utils/permission.util';

/**
 * External agencies the SAED interoperates with. Adding a partner here is what
 * enables its whole module (directory, clinical access, authorized reports and
 * institutional billing) — no domain service should hardcode an agency again.
 */
export const INSTITUTIONAL_PARTNER_KEYS = ['LSPD', 'LSCSO'] as const;

export type InstitutionalPartnerKey = (typeof INSTITUTIONAL_PARTNER_KEYS)[number];

export interface IInstitutionalPartner {
  key: InstitutionalPartnerKey;
  /** Establishment slug in the catalog. */
  slug: string;
  /** Establishment name and canonical acronym. */
  name: string;
  displayName: string;
  /** Accepted values when matching legacy free-text organization fields. */
  aliases: readonly string[];
  /** Role that identifies an external supervisor of this agency. */
  supervisorRoleSlug: string;
  financePermission: string;
  /** Frontend route, used by notifications so each agency lands on its module. */
  routePath: string;
  /** Institutional badge (placa/estrella) support on linked patients. */
  usesBadgeNumber: boolean;
  /** Default position assigned when a character joins the agency. */
  defaultPosition: string;
  /** Catalog ordering for character creation and pickers. */
  sortOrder: number;
}

export const INSTITUTIONAL_PARTNERS: Record<
  InstitutionalPartnerKey,
  IInstitutionalPartner
> = {
  LSPD: {
    key: 'LSPD',
    slug: 'lspd',
    name: 'LSPD',
    displayName: 'Los Santos Police Department',
    aliases: ['LSPD', 'Los Santos Police Department', 'Los Santos PD'],
    supervisorRoleSlug: 'lspd-medical-supervisor',
    financePermission: 'lspd.finance.read',
    routePath: '/lspd',
    usesBadgeNumber: true,
    defaultPosition: 'Officer',
    sortOrder: 5,
  },
  LSCSO: {
    key: 'LSCSO',
    slug: 'lscso',
    name: 'LSCSO',
    displayName: "Los Santos County Sheriff's Office",
    aliases: [
      'LSCSO',
      "Los Santos County Sheriff's Office",
      'Los Santos County Sheriff',
      'Sheriff',
    ],
    supervisorRoleSlug: 'lscso-medical-supervisor',
    financePermission: 'lscso.finance.read',
    routePath: '/lscso',
    usesBadgeNumber: true,
    defaultPosition: 'Deputy',
    sortOrder: 6,
  },
};

/** SAED-side permissions that grant oversight over every partner at once. */
const CROSS_PARTNER_PERMISSIONS = [
  '*',
  'occupational-health.read',
  'medical-record-access.review',
] as const;

export function listInstitutionalPartners(): IInstitutionalPartner[] {
  return INSTITUTIONAL_PARTNER_KEYS.map((key) => INSTITUTIONAL_PARTNERS[key]);
}

export function getInstitutionalPartner(
  key: InstitutionalPartnerKey,
): IInstitutionalPartner {
  return INSTITUTIONAL_PARTNERS[key];
}

export function resolveInstitutionalPartnerKey(
  raw?: string | null,
): InstitutionalPartnerKey | null {
  const value = (raw ?? '').trim().toUpperCase();
  return (INSTITUTIONAL_PARTNER_KEYS as readonly string[]).includes(value)
    ? (value as InstitutionalPartnerKey)
    : null;
}

/** Matches an establishment (slug or name) against the partner registry. */
export function findPartnerByEstablishment(
  establishment?: { slug?: string | null; name?: string | null } | null,
): IInstitutionalPartner | null {
  if (!establishment) {
    return null;
  }

  const slug = (establishment.slug ?? '').trim().toLowerCase();
  const name = (establishment.name ?? '').trim().toLowerCase();

  return (
    listInstitutionalPartners().find(
      (partner) =>
        (slug && slug === partner.slug) ||
        (name && partner.aliases.some((alias) => alias.toLowerCase() === name)),
    ) ?? null
  );
}

/** Matches a free-text organization value against the partner registry. */
export function findPartnerByOrganization(
  organization?: string | null,
): IInstitutionalPartner | null {
  const value = (organization ?? '').trim().toLowerCase();
  if (!value) {
    return null;
  }

  return (
    listInstitutionalPartners().find((partner) =>
      partner.aliases.some((alias) => alias.toLowerCase() === value),
    ) ?? null
  );
}

/**
 * Resolves the partner an occupation belongs to, checking the establishment
 * relation first and falling back to the legacy organization string.
 */
export function findPartnerByOccupation(
  occupation?: {
    organization?: string | null;
    establishment?: { slug?: string | null; name?: string | null } | null;
  } | null,
): IInstitutionalPartner | null {
  if (!occupation) {
    return null;
  }

  return (
    findPartnerByEstablishment(occupation.establishment) ??
    findPartnerByOrganization(occupation.organization)
  );
}

/** True when the establishment belongs to an agency that issues badges. */
export function supportsInstitutionalBadge(
  establishment?: { slug?: string | null; name?: string | null } | null,
): boolean {
  return findPartnerByEstablishment(establishment)?.usesBadgeNumber ?? false;
}

/**
 * Partners a character may read. SAED High Command oversees every agency, while
 * an external supervisor is confined to its own agency so LSPD and LSCSO data
 * never cross over.
 */
export function resolveAllowedPartnerKeys(context: {
  roles?: string[] | null;
  permissions?: string[] | null;
}): InstitutionalPartnerKey[] {
  if (hasAnyPermission(context.permissions ?? [], [...CROSS_PARTNER_PERMISSIONS])) {
    return [...INSTITUTIONAL_PARTNER_KEYS];
  }

  const roles = context.roles ?? [];
  return listInstitutionalPartners()
    .filter((partner) => roles.includes(partner.supervisorRoleSlug))
    .map((partner) => partner.key);
}

export function canAccessPartner(
  key: InstitutionalPartnerKey,
  context: { roles?: string[] | null; permissions?: string[] | null },
): boolean {
  return resolveAllowedPartnerKeys(context).includes(key);
}
