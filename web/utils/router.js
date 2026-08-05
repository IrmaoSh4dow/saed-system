import { takeAuthRedirect } from './auth-redirect.js';

const routes = new Map();
let currentCleanup = null;
let renderGeneration = 0;

export function registerRoute(path, handler) {
  routes.set(path, handler);
}

export function navigate(path, { replace = false } = {}) {
  if (replace) {
    window.history.replaceState({}, '', path);
  } else {
    window.history.pushState({}, '', path);
  }

  return renderRoute(path);
}

export async function renderRoute(path = window.location.pathname) {
  const generation = ++renderGeneration;
  const normalized = normalizePath(path);
  const handler = routes.get(normalized) ?? routes.get('/404');
  const appRoot = document.querySelector('#app');

  if (!appRoot || !handler) {
    return;
  }

  if (typeof currentCleanup === 'function') {
    currentCleanup();
    currentCleanup = null;
  }

  const result = await handler();

  if (generation !== renderGeneration) {
    return;
  }

  const redirect = typeof result?.redirect === 'string' ? result.redirect : takeAuthRedirect();

  if (redirect) {
    return navigate(redirect, { replace: true });
  }

  appRoot.innerHTML = typeof result === 'string' ? result : (result?.html ?? '');

  if (typeof result?.afterMount === 'function') {
    currentCleanup = result.afterMount(appRoot) ?? null;
  }

  window.scrollTo({ top: 0, behavior: 'instant' });
}

export function startRouter() {
  document.addEventListener('click', (event) => {
    const anchor = event.target.closest('a[data-link]');

    if (!anchor) {
      return;
    }

    const href = anchor.getAttribute('href');

    if (!href || href.startsWith('http') || href.startsWith('mailto:')) {
      return;
    }

    event.preventDefault();
    navigate(href);
  });

  window.addEventListener('popstate', () => {
    void renderRoute(window.location.pathname);
  });

  return renderRoute(window.location.pathname);
}

function normalizePath(path) {
  if (!path || path === '') {
    return '/';
  }

  const clean = path.split('?')[0].split('#')[0];
  return clean.length > 1 && clean.endsWith('/') ? clean.slice(0, -1) : clean;
}
