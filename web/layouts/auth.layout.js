import { icon } from '../components/landing/icons.js';

const MODE_COPY = {
  login: {
    eyebrow: 'Acceso institucional',
    headline: 'Operaciones clínicas con precisión.',
    lead: 'El sistema oficial del San Andreas Emergency Department para personal, pacientes e infraestructura médica.',
    highlights: [
      { icon: 'shield', label: 'Seguridad institucional' },
      { icon: 'heartPulse', label: 'Dominio clínico' },
      { icon: 'bolt', label: 'Respuesta en tiempo real' },
    ],
  },
  register: {
    eyebrow: 'Alta de cuenta',
    headline: 'Tu puerta de entrada al SAED.',
    lead: 'Crea tu cuenta para gestionar personajes, acceder a módulos autorizados y operar dentro del ecosistema institucional.',
    highlights: [
      { icon: 'users', label: 'Multi-personaje' },
      { icon: 'lock', label: 'Credenciales protegidas' },
      { icon: 'cross', label: 'Identidad médica' },
    ],
  },
  forgot: {
    eyebrow: 'Recuperación',
    headline: 'Restablecimiento controlado.',
    lead: 'Por seguridad institucional, el restablecimiento de acceso se gestiona mediante administración autorizada.',
    highlights: [
      { icon: 'lock', label: 'Proceso verificado' },
      { icon: 'shield', label: 'Sin exposición de datos' },
      { icon: 'users', label: 'Soporte de altos mandos' },
    ],
  },
};

/**
 * Auth layout.
 * - Object signature → premium split-screen shell (login/register/forgot).
 * - String signature → ambient frame for other auth flows (e.g. create character).
 *
 * @param {string | {
 *   mode?: 'login' | 'register' | 'forgot',
 *   title: string,
 *   subtitle: string,
 *   formHtml: string,
 *   footerHtml?: string,
 *   switchHtml?: string,
 * }} input
 * @param {{ contentAlign?: 'center' | 'start' }} [legacyOptions]
 */
export function renderAuthLayout(input, legacyOptions = {}) {
  if (typeof input === 'string') {
    return renderAuthAmbientFrame(input, legacyOptions);
  }

  return renderAuthSplitShell(input);
}

function renderAtmosphere() {
  return `
    <div class="auth-atmosphere" aria-hidden="true">
      <div class="auth-atmosphere-base"></div>
      <div class="auth-atmosphere-grid"></div>
      <div class="auth-orb auth-orb-a"></div>
      <div class="auth-orb auth-orb-b"></div>
      <div class="auth-orb auth-orb-c"></div>
      <div class="auth-sheen"></div>
    </div>
  `;
}

function renderAuthSplitShell({
  mode = 'login',
  title,
  subtitle,
  formHtml,
  footerHtml = '',
  switchHtml = '',
} = {}) {
  const copy = MODE_COPY[mode] ?? MODE_COPY.login;

  return `
    <div class="auth-stage" data-auth-stage data-auth-mode="${mode}">
      ${renderAtmosphere()}

      <div class="auth-split">
        <aside class="auth-brand-panel" data-auth-brand>
          <div class="auth-brand-inner">
            <a data-link href="/" class="auth-brand-mark group">
              <span class="auth-brand-icon">
                ${icon('cross', 'h-5 w-5')}
              </span>
              <span class="leading-tight">
                <span class="block text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-300">SAED</span>
                <span class="block text-sm font-semibold text-white">Management System</span>
              </span>
            </a>

            <div class="auth-brand-copy">
              <p class="auth-brand-eyebrow">${copy.eyebrow}</p>
              <h1 class="auth-brand-title">${copy.headline}</h1>
              <p class="auth-brand-lead">${copy.lead}</p>
            </div>

            <ul class="auth-highlights">
              ${copy.highlights
                .map(
                  (item, index) => `
                <li class="auth-highlight" style="--auth-delay: ${120 + index * 70}ms">
                  <span class="auth-highlight-icon">${icon(item.icon, 'h-4 w-4')}</span>
                  <span>${item.label}</span>
                </li>`,
                )
                .join('')}
            </ul>

            <p class="auth-brand-footer">
              San Andreas Emergency Department · Plataforma oficial
            </p>
          </div>
        </aside>

        <section class="auth-form-panel" data-auth-form>
          <div class="auth-form-top">
            <a data-link href="/" class="auth-back-link">
              ${icon('arrowLeft', 'h-4 w-4')}
              <span>Landing</span>
            </a>
            ${
              mode === 'login'
                ? `<a data-link href="/auth/register" class="auth-top-switch">Crear cuenta</a>`
                : mode === 'register'
                  ? `<a data-link href="/auth/login" class="auth-top-switch">Iniciar sesión</a>`
                  : `<a data-link href="/auth/login" class="auth-top-switch">Volver al login</a>`
            }
          </div>

          <div class="auth-card" data-auth-card>
            <div class="auth-card-header">
              <div class="auth-mobile-brand lg:hidden">
                <span class="auth-brand-icon !h-11 !w-11">
                  ${icon('cross', 'h-5 w-5')}
                </span>
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-300">SAED</p>
                  <p class="text-sm font-semibold text-white">Management System</p>
                </div>
              </div>
              <h2 class="auth-card-title">${title}</h2>
              <p class="auth-card-subtitle">${subtitle}</p>
            </div>

            <div class="auth-card-body">
              ${formHtml}
            </div>

            ${switchHtml ? `<div class="auth-card-switch">${switchHtml}</div>` : ''}
            ${footerHtml ? `<div class="auth-card-footer">${footerHtml}</div>` : ''}
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderAuthAmbientFrame(contentHtml, { contentAlign = 'center' } = {}) {
  const mainAlign =
    contentAlign === 'start' ? 'items-start justify-center' : 'items-center justify-center';

  return `
    <div class="auth-stage auth-stage-ambient" data-auth-stage>
      ${renderAtmosphere()}

      <header class="relative z-20">
        <div class="landing-container flex h-16 items-center justify-between md:h-[4.5rem]">
          <a data-link href="/" class="auth-brand-mark group">
            <span class="auth-brand-icon">
              ${icon('cross', 'h-5 w-5')}
            </span>
            <span class="leading-tight">
              <span class="block text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-300">SAED</span>
              <span class="block text-sm font-semibold text-white">Management System</span>
            </span>
          </a>
          <a data-link href="/" class="auth-back-link">
            ${icon('arrowLeft', 'h-4 w-4')}
            <span>Volver</span>
          </a>
        </div>
      </header>

      <main class="relative z-10 flex min-h-[calc(100vh-4.5rem)] ${mainAlign} px-5 pb-12 pt-4 sm:px-6 md:pb-16">
        <div class="auth-ambient-content w-full" data-auth-card>
          ${contentHtml}
        </div>
      </main>
    </div>
  `;
}
