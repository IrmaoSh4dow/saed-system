import { icon } from './icons.js';

const NAV_ITEMS = [
  { href: '/#inicio', label: 'Inicio', type: 'hash' },
  { href: '/#noticias', label: 'Noticias', type: 'hash' },
  { href: '/#convocatorias', label: 'Convocatorias', type: 'hash' },
  { href: '/#personal', label: 'Personal', type: 'hash' },
  { href: '/#galeria', label: 'Galería', type: 'hash' },
  { href: '/denuncias', label: 'Denuncias', type: 'link' },
  { href: '/#faq', label: 'FAQ', type: 'hash' },
];

function navAnchor(item, className = 'nav-link') {
  if (item.type === 'link') {
    return `<a data-link href="${item.href}" class="${className}">${item.label}</a>`;
  }

  return `<a href="${item.href}" class="${className} landing-hash-link">${item.label}</a>`;
}

export function renderNavbar() {
  return `
    <header id="landing-navbar" class="fixed inset-x-0 top-0 z-50 transition duration-200">
      <div class="landing-container flex h-16 items-center justify-between md:h-[4.5rem]">
        <a data-link href="/" class="group flex items-center gap-3">
          <span class="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-300 transition duration-200 group-hover:border-brand-400/50 group-hover:bg-brand-500/15">
            ${icon('shield', 'h-5 w-5')}
          </span>
          <span class="leading-tight">
            <span class="block text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-400">SAED</span>
            <span class="block text-sm font-semibold text-white">Emergency Department</span>
          </span>
        </a>

        <nav class="hidden items-center gap-5 xl:flex" aria-label="Navegación principal">
          ${NAV_ITEMS.map((item) => navAnchor(item)).join('')}
        </nav>

        <div class="hidden items-center gap-3 xl:flex">
          <a data-link href="/auth/login" class="btn-primary">Iniciar sesión</a>
        </div>

        <button
          id="landing-menu-toggle"
          type="button"
          class="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2.5 text-ink-100 transition hover:bg-white/10 xl:hidden"
          aria-expanded="false"
          aria-controls="landing-mobile-menu"
          aria-label="Abrir menú"
        >
          ${icon('menu', 'h-5 w-5')}
        </button>
      </div>

      <div id="landing-mobile-menu" class="hidden border-t border-white/10 bg-surface-950/95 backdrop-blur-xl xl:hidden">
        <div class="landing-container flex flex-col gap-1 py-4">
          ${NAV_ITEMS.map(
            (item) => `
              ${navAnchor(item, 'nav-link rounded-xl px-3 py-3 hover:bg-white/5')}
            `,
          ).join('')}
          <a data-link href="/auth/login" class="btn-primary mt-3 w-full">Iniciar sesión</a>
        </div>
      </div>
    </header>
  `;
}

export function initNavbar(root = document) {
  const navbar = root.querySelector('#landing-navbar');
  const toggle = root.querySelector('#landing-menu-toggle');
  const mobileMenu = root.querySelector('#landing-mobile-menu');

  const onScroll = () => {
    if (!navbar) {
      return;
    }

    if (window.scrollY > 24) {
      navbar.classList.add('nav-glass');
    } else {
      navbar.classList.remove('nav-glass');
    }
  };

  const onToggle = () => {
    if (!mobileMenu || !toggle) {
      return;
    }

    const isOpen = !mobileMenu.classList.contains('hidden');
    mobileMenu.classList.toggle('hidden', isOpen);
    toggle.setAttribute('aria-expanded', String(!isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Abrir menú' : 'Cerrar menú');
    toggle.innerHTML = isOpen ? icon('menu', 'h-5 w-5') : icon('close', 'h-5 w-5');
  };

  const onHashClick = (event) => {
    const link = event.target.closest('.landing-hash-link');
    if (!link) {
      return;
    }

    const href = link.getAttribute('href');
    if (!href?.includes('#')) {
      return;
    }

    const id = href.split('#')[1];
    const target = document.getElementById(id);

    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
        onToggle();
      }
    }
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  toggle?.addEventListener('click', onToggle);
  root.addEventListener('click', onHashClick);

  return () => {
    window.removeEventListener('scroll', onScroll);
    toggle?.removeEventListener('click', onToggle);
    root.removeEventListener('click', onHashClick);
  };
}
