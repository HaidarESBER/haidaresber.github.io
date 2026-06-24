// Preloader, custom cursor, nav behaviour, role typing, magnetic buttons.
import { getRoles } from './i18n.js';

/* ---------- Preloader ---------- */
export function initPreloader(onComplete) {
  const el = document.getElementById('preloader');
  const fill = document.getElementById('preloaderFill');
  const count = document.getElementById('preloaderCount');
  let p = 0;
  const tick = () => {
    p += Math.random() * 14 + 4;
    if (p >= 100) p = 100;
    fill.style.width = p + '%';
    count.textContent = Math.floor(p);
    if (p < 100) {
      setTimeout(tick, 90 + Math.random() * 120);
    } else {
      setTimeout(() => {
        el.classList.add('is-done');
        el.style.transition = 'opacity 0.6s, transform 0.8s cubic-bezier(0.22,1,0.36,1)';
        el.style.transform = 'translateY(-100%)';
        el.style.opacity = '0';
        onComplete && onComplete();
        setTimeout(() => el.remove(), 900);
      }, 350);
    }
  };
  tick();
}

/* ---------- Custom cursor ---------- */
export function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const ring = document.getElementById('cursor');
  const dot = document.getElementById('cursorDot');
  let mx = innerWidth / 2, my = innerHeight / 2;
  let rx = mx, ry = my;

  addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
  });

  const loop = () => {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  };
  loop();

  // delegated hover state for anything tagged data-cursor (incl. dynamic nodes)
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('[data-cursor], a, button')) ring.classList.add('is-hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('[data-cursor], a, button')) ring.classList.remove('is-hover');
  });
}

/* ---------- Nav ---------- */
export function initNav() {
  const nav = document.getElementById('nav');
  const burger = document.getElementById('navBurger');
  const links = document.getElementById('navLinks');

  addEventListener('scroll', () => {
    nav.classList.toggle('is-scrolled', scrollY > 60);
  });

  burger.addEventListener('click', () => nav.classList.toggle('is-open'));
  links.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => nav.classList.remove('is-open'))
  );
}

/* ---------- Role typing (reacts to language) ---------- */
export function initTyping() {
  const el = document.getElementById('typed');
  let i = 0, c = 0, deleting = false;
  const step = () => {
    const roles = getRoles();
    const word = roles[i % roles.length];
    el.textContent = deleting ? word.slice(0, --c) : word.slice(0, ++c);
    let delay = deleting ? 38 : 80;
    if (!deleting && c === word.length) { delay = 1800; deleting = true; }
    else if (deleting && c === 0) { deleting = false; i++; delay = 320; }
    setTimeout(step, delay);
  };
  step();
}

/* ---------- Magnetic buttons ---------- */
export function initMagnetic() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
}
