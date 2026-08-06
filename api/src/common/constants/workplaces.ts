import { OccupationType } from '@prisma/client';

export const SAED_ORGANIZATION = 'SAED';

/** Institutional partner slug used for LSPD occupational-health interoperability. */
export const LSPD_ESTABLISHMENT_SLUG = 'lspd';
export const LSPD_ORGANIZATION = 'LSPD';

export interface IEstablishmentSeed {
  slug: string;
  name: string;
  type: OccupationType;
  defaultPosition: string;
  sortOrder: number;
  /** When false, hidden from civilian character creation. */
  isSelectable?: boolean;
}

/**
 * Default civilian establishments seeded into the Establishment catalog.
 * Runtime validation must use the database — never hardcode this list in services.
 */
export const DEFAULT_ESTABLISHMENT_SEED: readonly IEstablishmentSeed[] = [
  {
    slug: LSPD_ESTABLISHMENT_SLUG,
    name: LSPD_ORGANIZATION,
    type: OccupationType.DEPARTMENT,
    defaultPosition: 'Officer',
    sortOrder: 5,
    isSelectable: true,
  },
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

export function isSaedOrganization(organization: string): boolean {
  return organization.trim().toLowerCase() === SAED_ORGANIZATION.toLowerCase();
}
