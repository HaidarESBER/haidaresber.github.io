// Lenis smooth scroll + GSAP ScrollTrigger reveals + split-text hero intro.
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';

gsap.registerPlugin(ScrollTrigger);

let lenis;

export function initSmoothScroll() {
  lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // anchor links route through Lenis for smooth jumps
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = a.getAttribute('href');
      if (target.length > 1 && document.querySelector(target)) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -10 });
      }
    });
  });
  return lenis;
}

// Hero intro — animates once the preloader is gone.
export function playHeroIntro() {
  const name = document.getElementById('heroName');
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

  if (name) {
    const split = new SplitType(name, { types: 'chars' });
    tl.from(split.chars, { yPercent: 120, opacity: 0, duration: 1, stagger: 0.04 });
  }
  tl.from('.hero__eyebrow', { y: 20, opacity: 0, duration: 0.8 }, 0.1)
    .from('.hero__role', { y: 20, opacity: 0, duration: 0.8 }, '-=0.5')
    .from('.hero__tagline', { y: 20, opacity: 0, duration: 0.8 }, '-=0.6')
    .from('.hero__cta .btn', { y: 20, opacity: 0, duration: 0.7, stagger: 0.12 }, '-=0.6')
    .from('.hero__scroll', { opacity: 0, duration: 0.8 }, '-=0.3');
}

// Section reveals. Called after dynamic content is built.
export function initReveals() {
  // generic section heads
  gsap.utils.toArray('.section__head').forEach((el) => {
    gsap.from(el.children, {
      scrollTrigger: { trigger: el, start: 'top 82%' },
      y: 40, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out',
    });
  });

  // work items
  gsap.utils.toArray('.work__item').forEach((el) => {
    gsap.fromTo(el, { y: 50, opacity: 0 }, {
      scrollTrigger: { trigger: el, start: 'top 88%' },
      y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
    });
  });

  // research card
  const card = document.querySelector('.research__card');
  if (card) {
    gsap.from(card, {
      scrollTrigger: { trigger: card, start: 'top 80%' },
      y: 60, opacity: 0, duration: 1.1, ease: 'power3.out',
    });
  }

  // timelines
  gsap.utils.toArray('.timeline').forEach((tl) => {
    gsap.from(tl.querySelectorAll('.tl-item'), {
      scrollTrigger: { trigger: tl, start: 'top 85%' },
      x: -20, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power2.out',
    });
  });

  // about text + terminal
  gsap.from('.about__text > *', {
    scrollTrigger: { trigger: '.about__grid', start: 'top 78%' },
    y: 30, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out',
  });
  gsap.from('.terminal', {
    scrollTrigger: { trigger: '.about__grid', start: 'top 78%' },
    y: 40, opacity: 0, scale: 0.98, duration: 1, ease: 'power3.out',
  });

  // contact
  gsap.from('.contact > .container > *', {
    scrollTrigger: { trigger: '.contact', start: 'top 80%' },
    y: 40, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out',
  });

  ScrollTrigger.refresh();
}

export function refreshScroll() {
  if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
}
