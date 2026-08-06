import { renderAboutSection } from '../components/landing/about-section.js';
import { renderDepartmentsSection } from '../components/landing/departments-section.js';
import { renderFaqSection } from '../components/landing/faq-section.js';
import { renderFinalCta } from '../components/landing/final-cta.js';
import {
  paintGallerySection,
  renderGallerySection,
} from '../components/landing/gallery-section.js';
import { renderHero } from '../components/landing/hero.js';
import { renderHowItWorksSection } from '../components/landing/how-it-works.js';
import { renderModulesSection } from '../components/landing/modules-section.js';
import { renderNewsDetailModalHost } from '../components/landing/news-detail-modal.js';
import {
  bindNewsSection,
  paintNewsSection,
  renderNewsSection,
} from '../components/landing/news-section.js';
import {
  paintRecruitmentSection,
  renderRecruitmentSection,
} from '../components/landing/recruitment-section.js';
import {
  initOfficerCarousel,
  paintOfficerCarousel,
  renderOfficerCarousel,
} from '../components/landing/staff-carousel.js';
import { bindAppModal } from '../components/ui/modal.js';
import { initLandingLayout, renderLandingLayout } from '../layouts/landing.layout.js';
import { listAcademyIntake } from '../services/academy.service.js';
import { listActiveGallery } from '../services/gallery.service.js';
import { listLandingPersonnel } from '../services/landing.service.js';
import { listPublishedNews } from '../services/news.service.js';
import { initHeroEffects } from '../utils/hero-effects.js';
import { initCountUp, initScrollReveal } from '../utils/scroll-reveal.js';
import { initFlowbite } from 'flowbite';

export function landingPage() {
  const content = [
    renderHero(),
    renderModulesSection(),
    renderAboutSection(),
    renderRecruitmentSection([]),
    renderNewsSection([]),
    renderOfficerCarousel([]),
    renderDepartmentsSection(),
    renderGallerySection([]),
    renderHowItWorksSection(),
    renderFaqSection(),
    renderFinalCta(),
    renderNewsDetailModalHost(),
  ].join('');

  return {
    html: renderLandingLayout(content),
    afterMount(root) {
      document.title = 'SAED · San Andreas Emergency Department';

      let carouselCleanup = initOfficerCarousel(root);
      let newsCleanup = () => {};

      const cleanups = [
        initLandingLayout(root),
        initScrollReveal(root),
        initCountUp(root),
        initHeroEffects(root),
        bindAppModal(root, { modalId: 'news-detail-modal' }),
        () => carouselCleanup?.(),
        () => newsCleanup?.(),
      ];

      initFlowbite();

      void Promise.all([
        listPublishedNews().catch(() => []),
        listLandingPersonnel().catch(() => []),
        listActiveGallery().catch(() => []),
        listAcademyIntake().catch(() => []),
      ]).then(([news, personnel, gallery, intake]) => {
        paintNewsSection(root, news);
        paintOfficerCarousel(root, personnel);
        paintGallerySection(root, gallery);
        paintRecruitmentSection(root, intake);
        newsCleanup?.();
        newsCleanup = bindNewsSection(root, news);
        carouselCleanup?.();
        carouselCleanup = initOfficerCarousel(root);
        initScrollReveal(root);
      });

      if (window.location.hash) {
        const target = root.querySelector(window.location.hash);
        if (target) {
          requestAnimationFrame(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }
      }

      root.querySelectorAll('#inicio [data-reveal]').forEach((el) => {
        el.classList.add('is-visible');
      });

      return () => {
        for (const cleanup of cleanups) {
          if (typeof cleanup === 'function') cleanup();
        }
      };
    },
  };
}
