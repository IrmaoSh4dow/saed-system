import { LSPD_ESTABLISHMENT_SLUG, LSPD_ORGANIZATION } from '../../common/constants/workplaces';

/** Days before expiry when a psychotechnical evaluation is considered "expiring soon". */
export const PSYCHOTECHNICAL_EXPIRING_SOON_DAYS = 30;

/** Institution partner keys for LSPD interoperability (extensible later: SAFD, DOJ…). */
export const INSTITUTIONAL_PARTNERS = {
  LSPD: {
    slug: LSPD_ESTABLISHMENT_SLUG,
    name: LSPD_ORGANIZATION,
    aliases: ['LSPD', 'Los Santos Police Department', 'Los Santos PD'],
  },
} as const;

export type InstitutionalPartnerKey = keyof typeof INSTITUTIONAL_PARTNERS;
