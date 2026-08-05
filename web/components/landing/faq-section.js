import { mockFaq } from '../../utils/mock-faq.js';

export function renderFaqSection() {
  return `
    <section id="faq" class="landing-section border-t border-white/5 bg-surface-900/20">
      <div class="landing-container">
        <div class="mx-auto mb-12 max-w-2xl text-center" data-reveal>
          <p class="landing-eyebrow">Soporte</p>
          <h2 class="landing-title">Preguntas frecuentes</h2>
          <p class="landing-lead mx-auto">Respuestas claras antes de entrar a la plataforma.</p>
        </div>

        <div id="faq-accordion" class="mx-auto max-w-3xl divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-surface-900/50" data-reveal data-accordion="collapse" data-active-classes="bg-surface-850 text-white" data-inactive-classes="text-ink-100">
          ${mockFaq
            .map(
              (item, index) => `
                <h3 id="faq-heading-${item.id}">
                  <button
                    type="button"
                    class="flex w-full items-center justify-between gap-4 px-5 py-5 text-left text-sm font-semibold transition hover:bg-white/[0.03] md:text-base"
                    data-accordion-target="#faq-body-${item.id}"
                    aria-expanded="${index === 0 ? 'true' : 'false'}"
                    aria-controls="faq-body-${item.id}"
                  >
                    <span>${item.question}</span>
                    <svg class="h-4 w-4 shrink-0 text-ink-400 transition" data-accordion-icon fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>
                </h3>
                <div id="faq-body-${item.id}" class="${index === 0 ? '' : 'hidden'}" aria-labelledby="faq-heading-${item.id}">
                  <p class="px-5 pb-5 text-sm leading-relaxed text-ink-300">${item.answer}</p>
                </div>
              `,
            )
            .join('')}
        </div>
      </div>
    </section>
  `;
}
