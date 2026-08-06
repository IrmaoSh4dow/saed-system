/**
 * Progressive entrance + subtle atmosphere for auth screens.
 * Pure CSS-class orchestration (no Framer Motion in this stack).
 */
export function initAuthMotion(root = document) {
  const stage = root.querySelector('[data-auth-stage]') || root;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const reveal = () => {
    stage.classList.add('is-ready');
    if (reduced) {
      stage.classList.add('auth-reduced-motion');
    }

    const card = stage.querySelector('[data-auth-card]');
    const fields = card
      ? [
          ...card.querySelectorAll(
            '.auth-field, .auth-alert, .auth-submit, .auth-card-switch, .auth-meta-row, .auth-alert-host',
          ),
        ]
      : [];

    fields.forEach((el, index) => {
      el.style.setProperty('--auth-field-delay', `${160 + index * 50}ms`);
      el.classList.add('auth-enter-item');
      requestAnimationFrame(() => el.classList.add('is-visible'));
    });
  };

  requestAnimationFrame(reveal);
  // Fallback: never leave the form invisible if a frame is skipped.
  const fallback = window.setTimeout(() => {
    stage.classList.add('is-ready');
    stage
      .querySelectorAll('.auth-enter-item, .auth-card, .auth-highlight')
      .forEach((el) => el.classList.add('is-visible'));
  }, 700);

  return () => {
    window.clearTimeout(fallback);
    stage.classList.remove('is-ready');
  };
}
