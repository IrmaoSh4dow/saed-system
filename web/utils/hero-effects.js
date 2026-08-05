export function initHeroEffects(root = document) {
  const hero = root.querySelector('#inicio');
  const canvas = root.querySelector('#hero-particles');
  const parallaxNodes = [...root.querySelectorAll('[data-parallax]')];

  if (!hero) {
    return () => {};
  }

  let frameId = 0;
  let particles = [];
  let width = 0;
  let height = 0;
  let ctx = null;
  let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const resize = () => {
    if (!canvas) {
      return;
    }

    const rect = hero.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.max(28, Math.floor((width * height) / 28000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.6 + 0.4,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      a: Math.random() * 0.35 + 0.1,
    }));
  };

  const draw = () => {
    if (!ctx || reducedMotion) {
      return;
    }

    ctx.clearRect(0, 0, width, height);

    for (const particle of particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0 || particle.x > width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > height) particle.vy *= -1;

      ctx.beginPath();
      ctx.fillStyle = `rgba(147, 197, 253, ${particle.a})`;
      ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      ctx.fill();
    }

    frameId = requestAnimationFrame(draw);
  };

  const onPointerMove = (event) => {
    if (reducedMotion || !parallaxNodes.length) {
      return;
    }

    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    for (const node of parallaxNodes) {
      const depth = Number(node.getAttribute('data-parallax') || '10');
      node.style.transform = `translate3d(${x * depth}px, ${y * depth}px, 0)`;
    }
  };

  const onLeave = () => {
    for (const node of parallaxNodes) {
      node.style.transform = 'translate3d(0, 0, 0)';
    }
  };

  resize();
  if (!reducedMotion) {
    draw();
  }

  window.addEventListener('resize', resize);
  hero.addEventListener('pointermove', onPointerMove);
  hero.addEventListener('pointerleave', onLeave);

  return () => {
    cancelAnimationFrame(frameId);
    window.removeEventListener('resize', resize);
    hero.removeEventListener('pointermove', onPointerMove);
    hero.removeEventListener('pointerleave', onLeave);
  };
}
