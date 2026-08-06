export function roundMoney(value: number): number {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function decimalToNumber(value: unknown): number {
  return roundMoney(Number(value ?? 0));
}

export function toDateOnlyString(value: Date | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return value.toISOString().slice(0, 10);
}

export function parseDateOnly(value?: string | null): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (match) {
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Invoice match against an establishment using immutable billing snapshots. */
export function buildInvoiceEstablishmentFilter(establishment: {
  id: string;
  slug: string;
  name: string;
}) {
  return {
    OR: [
      { billingEstablishmentId: establishment.id },
      { billingEstablishmentSlug: establishment.slug },
      {
        billingOrganization: {
          equals: establishment.name,
          mode: 'insensitive' as const,
        },
      },
    ],
  };
}
