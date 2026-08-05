import '../css/main.css';
import { createCharacterPage } from '../../pages/create-character.page.js';
import { denunciasPage } from '../../pages/denuncias.page.js';
import { forgotPasswordPage } from '../../pages/forgot-password.page.js';
import { landingPage } from '../../pages/landing.page.js';
import { loginPage } from '../../pages/login.page.js';
import { notFoundPage } from '../../pages/not-found.page.js';
import { registerPage } from '../../pages/register.page.js';
import { selectCharacterPage } from '../../pages/select-character.page.js';
import { privateRoutes } from '../../routes/app-routes.js';
import { bootstrapSession } from '../../services/identity.service.js';
import { registerRoute, startRouter } from '../../utils/router.js';

registerRoute('/', () => {
  document.title = 'SAED · San Andreas Emergency Department';
  return landingPage();
});

registerRoute('/denuncias', denunciasPage);
registerRoute('/auth/login', loginPage);
registerRoute('/auth/register', registerPage);
registerRoute('/auth/forgot-password', forgotPasswordPage);
registerRoute('/characters/create', createCharacterPage);
registerRoute('/characters/select', selectCharacterPage);

for (const route of privateRoutes) {
  registerRoute(route.path, route.handler);
}

registerRoute('/404', notFoundPage);

async function boot() {
  await bootstrapSession();
  await startRouter();
}

void boot();
