import { getInstitutionalPartner } from '../config/institutional-partners.js';
import { createInstitutionalPartnerPage } from './institutional-partner.page.js';

export const lscsoPage = createInstitutionalPartnerPage(getInstitutionalPartner('LSCSO'));
