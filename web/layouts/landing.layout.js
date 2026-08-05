import { renderFooter } from '../components/landing/footer.js';
import { initNavbar, renderNavbar } from '../components/landing/navbar.js';

export function renderLandingLayout(contentHtml) {
  return `
    ${renderNavbar()}
    <main>${contentHtml}</main>
    ${renderFooter()}
  `;
}

export function initLandingLayout(root = document) {
  return initNavbar(root);
}
