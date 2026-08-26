import { OccupationType } from '@prisma/client';
import {
  INSTITUTIONAL_PARTNERS,
  listInstitutionalPartners,
} from './institutional-partners';

export const SAED_ORGANIZATION = 'SAED';

/** @deprecated Use INSTITUTIONAL_PARTNERS from './institutional-partners'. */
export const LSPD_ESTABLISHMENT_SLUG = INSTITUTIONAL_PARTNERS.LSPD.slug;
/** @deprecated Use INSTITUTIONAL_PARTNERS from './institutional-partners'. */
export const LSPD_ORGANIZATION = INSTITUTIONAL_PARTNERS.LSPD.name;

export interface IEstablishmentSeed {
  slug: string;
  name: string;
  type: OccupationType;
  defaultPosition: string;
  sortOrder: number;
  /** When false, hidden from civilian character creation. */
  isSelectable?: boolean;
}

const INSTITUTIONAL_PARTNER_SEED: readonly IEstablishmentSeed[] =
  listInstitutionalPartners().map((partner) => ({
    slug: partner.slug,
    name: partner.name,
    type: OccupationType.DEPARTMENT,
    defaultPosition: partner.defaultPosition,
    sortOrder: partner.sortOrder,
    isSelectable: true,
  }));

const CIVILIAN_ESTABLISHMENT_SEED: readonly IEstablishmentSeed[] = [
  {
    slug: 'uwu-cafe',
    name: 'UwU Cafe',
    type: OccupationType.BUSINESS,
    defaultPosition: 'Empleado',
    sortOrder: 10,
  },
  {
    slug: 'los-santos-customs',
    name: 'Los Santos Customs',
    type: OccupationType.BUSINESS,
    defaultPosition: 'Empleado',
    sortOrder: 20,
  },
  {
    slug: 'burger-shot',
    name: 'Burger Shot',
    type: OccupationType.BUSINESS,
    defaultPosition: 'Empleado',
    sortOrder: 30,
  },
  {
    slug: 'bean-machine',
    name: 'Bean Machine',
    type: OccupationType.BUSINESS,
    defaultPosition: 'Empleado',
    sortOrder: 40,
  },
  {
    slug: 'vanilla-unicorn',
    name: 'Vanilla Unicorn',
    type: OccupationType.BUSINESS,
    defaultPosition: 'Empleado',
    sortOrder: 50,
  },
  {
    slug: 'unemployed',
    name: 'Sin empleo',
    type: OccupationType.OTHER,
    defaultPosition: 'Desempleado',
    sortOrder: 999,
  },
] as const;

/**
 * Default establishments seeded into the Establishment catalog.
 * Runtime validation must use the database — never hardcode this list in services.
 */
export const DEFAULT_ESTABLISHMENT_SEED: readonly IEstablishmentSeed[] = [
  ...INSTITUTIONAL_PARTNER_SEED,
  ...CIVILIAN_ESTABLISHMENT_SEED,
];

export function isSaedOrganization(organization: string): boolean {
  return organization.trim().toLowerCase() === SAED_ORGANIZATION.toLowerCase();
}
