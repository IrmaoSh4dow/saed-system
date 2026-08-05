export function initScrollReveal(root = document) {
  const elements = [...root.querySelectorAll('[data-reveal]')];

  if (!elements.length) {
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    },
    {
      threshold: 0.16,
      rootMargin: '0px 0px -8% 0px',
    },
  );

  for (const element of elements) {
    element.classList.add('reveal');
    const delay = element.getAttribute('data-reveal-delay');
    if (delay) {
      element.style.transitionDelay = `${delay}ms`;
    }
    observer.observe(element);
  }

  return () => observer.disconnect();
}

export function initCountUp(root = document) {
  const counters = [...root.querySelectorAll('[data-count-to]')];
  const progressBars = [...root.querySelectorAll('[data-progress]')];

  if (!counters.length && !progressBars.length) {
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          continue;
        }

        const el = entry.target;

        if (el.hasAttribute('data-count-to')) {
          const target = Number(el.getAttribute('data-count-to') ?? '0');
          const duration = Number(el.getAttribute('data-count-duration') ?? '900');
          animateCount(el, target, duration);
        }

        if (el.hasAttribute('data-progress')) {
          el.classList.add('is-visible');
        }

        observer.unobserve(el);
      }
    },
    { threshold: 0.35 },
  );

  for (const counter of counters) {
    observer.observe(counter);
  }

  for (const bar of progressBars) {
    observer.observe(bar);
  }

  return () => observer.disconnect();
}

function animateCount(element, target, duration) {
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - (1 - progress) ** 3;
    const value = Math.round(target * eased);
    element.textContent = formatNumber(value);

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
}

function formatNumber(value) {
  return new Intl.NumberFormat('es-ES').format(value);
}
