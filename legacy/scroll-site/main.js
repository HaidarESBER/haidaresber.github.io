import './style.css';
import { applyLang, initLangSwitch, onLangChange } from './modules/i18n.js';
import { initPreloader, initCursor, initNav, initTyping, initMagnetic } from './modules/ui.js';
import { initHero } from './modules/hero.js';
import { initSmoothScroll, playHeroIntro, initReveals, refreshScroll } from './modules/scroll.js';

function boot() {
  // 1. Build all content (so reveals & measurements see real DOM)
  applyLang();
  initLangSwitch();

  // 2. Immediate UI that doesn't depend on scroll
  initCursor();
  initNav();
  initMagnetic();
  const disposeHero = initHero();

  // re-measure scroll triggers whenever language (and thus layout) changes
  onLangChange(() => refreshScroll());

  // 3. Run intro + scroll systems once the preloader lifts
  initPreloader(() => {
    initTyping();
    initSmoothScroll();
    playHeroIntro();
    initReveals();
  });

  window.__disposeHero = disposeHero;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
