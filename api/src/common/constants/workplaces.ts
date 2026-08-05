import { OccupationType } from '@prisma/client';

export const SAED_ORGANIZATION = 'SAED';

export interface ICivilianWorkplace {
  slug: string;
  name: string;
  type: OccupationType;
  defaultPosition: string;
}

/**
 * Civilian workplaces selectable at character creation.
 * SAED is intentionally excluded — assigned only on staff promotion.
 */
export const CIVILIAN_WORKPLACES: readonly ICivilianWorkplace[] = [
  {
    slug: 'uwu-cafe',
    name: 'UwU Cafe',
    type: OccupationType.BUSINESS,
    defaultPosition: 'Empleado',
  },
  {
    slug: 'los-santos-customs',
    name: 'Los Santos Customs',
    type: OccupationType.BUSINESS,
    defaultPosition: 'Empleado',
  },
  {
    slug: 'burger-shot',
    name: 'Burger Shot',
    type: OccupationType.BUSINESS,
    defaultPosition: 'Empleado',
  },
  {
    slug: 'bean-machine',
    name: 'Bean Machine',
    type: OccupationType.BUSINESS,
    defaultPosition: 'Empleado',
  },
  {
    slug: 'vanilla-unicorn',
    name: 'Vanilla Unicorn',
    type: OccupationType.BUSINESS,
    defaultPosition: 'Empleado',
  },
  {
    slug: 'unemployed',
    name: 'Sin empleo',
    type: OccupationType.OTHER,
    defaultPosition: 'Desempleado',
  },
] as const;

export function findCivilianWorkplace(organization: string): ICivilianWorkplace | undefined {
  const normalized = organization.trim().toLowerCase();
  return CIVILIAN_WORKPLACES.find(
    (item) =>
      item.name.toLowerCase() === normalized || item.slug.toLowerCase() === normalized,
  );
}

export function isSaedOrganization(organization: string): boolean {
  return organization.trim().toLowerCase() === SAED_ORGANIZATION.toLowerCase();
}
