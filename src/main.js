import './style.css';
import Experience from './experience/Experience.js';
import { ArcadeGame } from './experience/arcadeGame.js';
import { applyStatic, initLangSwitch, getLang, onLangChange } from './modules/i18n.js';
import { buildPanel } from './modules/panels.js';
import { content } from './data/content.js';
import { sfx, isMuted, toggleMute, unlockAudio } from './modules/audio.js';

const arcadeFacts = (lang) => content[lang].extrasSection.facts.map((f) => `${f.icon}  ${f.value}`);

const $ = (id) => document.getElementById(id);

function initCursor() {
  if (matchMedia('(pointer: coarse)').matches) return;
  const ring = $('cursor'), dot = $('cursorDot');
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    ring.classList.add('is-active'); dot.classList.add('is-active'); // hidden until the mouse actually moves
    dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
  });
  const loop = () => { rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2; ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`; requestAnimationFrame(loop); };
  loop();
  document.addEventListener('mouseover', (e) => { if (e.target.closest('[data-cursor], a, button')) ring.classList.add('is-hover'); });
  document.addEventListener('mouseout', (e) => { if (e.target.closest('[data-cursor], a, button')) ring.classList.remove('is-hover'); });
}

function boot() {
  applyStatic();
  initLangSwitch();
  initCursor();
  addEventListener('pointerdown', unlockAudio, { once: true }); // browser autoplay policy

  const exp = new Experience($('webgl'));
  window.__exp = exp; // debugging/tuning handle

  const loader = $('loader'), fill = $('loaderFill'), pct = $('loaderPct');
  const hud = $('hud'), hint = $('hint'), tip = $('tip'), backBtn = $('backBtn');
  const panel = $('panel'), panelBody = $('panelBody');
  const arcadeOverlay = $('arcadeGame');
  let currentSection = null;
  let hintDismissed = false;

  // ---- Arcade mini-game ----
  const game = new ArcadeGame(exp.room.arcadeScreen.canvas, { onExit: () => { if (!exp.isMoving) exp.unfocus(); } });
  game.setFacts(arcadeFacts(getLang()));
  exp.arcadeGame = game;
  $('arcadeMount').appendChild(game.canvas);
  function openArcade() { arcadeOverlay.classList.add('is-on'); game.start(); sfx.click(); }
  function closeArcade() { arcadeOverlay.classList.remove('is-on'); game.stop(); }
  const hold = (id, dir) => {
    const b = $(id);
    const on = (e) => { e.preventDefault(); game.press(dir, true); };
    const off = (e) => { e.preventDefault(); game.press(dir, false); };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off);
  };
  hold('agLeft', 'left'); hold('agRight', 'right');
  $('agFire').addEventListener('pointerdown', (e) => { e.preventDefault(); game.action(); });

  // ---- Loading (assets are procedural → quick splash, then straight in) ----
  function enterRoom() {
    loader.classList.add('is-hidden');
    setTimeout(() => (loader.style.display = 'none'), 800);
    exp.playIntro(() => { hud.classList.add('is-on'); hint.classList.add('is-on'); });
  }
  let p = 0;
  const grow = () => {
    p = Math.min(100, p + Math.random() * 24 + 14);
    fill.style.width = p + '%'; pct.textContent = Math.floor(p);
    if (p < 100) setTimeout(grow, 50 + Math.random() * 60);
    else setTimeout(enterRoom, 350);
  };
  grow();

  // ---- Hover tooltip ----
  exp.onHover = (it, x, y) => {
    if (it) {
      tip.innerHTML = `<span class="tip__accent">◈</span> ${it.label[getLang()]}`;
      tip.style.left = x + 'px'; tip.style.top = y + 'px';
      tip.classList.add('is-on');
      if (!tip.dataset.h) { sfx.hover(); tip.dataset.h = '1'; }
    } else { tip.classList.remove('is-on'); delete tip.dataset.h; }
  };

  // ---- Panel open/close ----
  // On desktop the panel eats the right side of the screen, so we shift the
  // rendered view to keep the focused object centered in the visible area.
  const panelOffset = () => (innerWidth > 720 ? Math.min(460, innerWidth * 0.92) / 2 : 0);
  function openPanel(section) {
    currentSection = section;
    panelBody.innerHTML = buildPanel(section, getLang());
    panelBody.scrollTop = 0;
    panel.classList.add('is-on');
    document.body.classList.add('panel-open');
    exp.setSideOffset(panelOffset());
    setActiveNav(section);
  }
  function closePanel() {
    currentSection = null;
    panel.classList.remove('is-on');
    document.body.classList.remove('panel-open');
    setActiveNav(null);
  }
  function setActiveNav(section) {
    const map = { about: 'laptop', work: 'monitors', research: 'whiteboard', certs: 'certs', contact: 'contact', infra: 'serverRack' };
    document.querySelectorAll('#hudNav button, #dock button').forEach((b) =>
      b.classList.toggle('active', map[section] === b.dataset.target)
    );
  }
  // cross-links inside panels (e.g. infra → projects)
  panelBody.addEventListener('click', (e) => {
    const b = e.target.closest('[data-goto]');
    if (b && !exp.isMoving) exp.focusKey(b.dataset.goto);
  });

  // ---- Camera focus callback ----
  exp.onFocus = (f) => {
    if (f && f.panel === 'extras') { closePanel(); exp.setSideOffset(0); openArcade(); backBtn.classList.add('is-on'); }
    else if (f && f.panel) { closeArcade(); openPanel(f.panel); backBtn.classList.add('is-on'); sfx.click(); }
    else { closePanel(); closeArcade(); backBtn.classList.remove('is-on'); }
  };

  // dismiss hint once the user does anything
  const dismissHint = () => { if (!hintDismissed) { hintDismissed = true; hint.classList.add('is-hidden'); } };
  $('webgl').addEventListener('pointerdown', dismissHint, { once: true });

  // ---- Nav buttons (top bar + mobile dock) ----
  document.querySelectorAll('#hudNav button, #dock button').forEach((b) => {
    b.addEventListener('click', () => { dismissHint(); if (!exp.isMoving) exp.focusKey(b.dataset.target); });
  });

  // ---- Back button / panel close / keyboard ----
  const goBack = () => { if (!exp.isMoving && exp.isFocused) { sfx.whoosh(); exp.unfocus(); } };
  backBtn.addEventListener('click', goBack);
  $('panelClose').addEventListener('click', goBack);
  addEventListener('keydown', (e) => {
    if (arcadeOverlay.classList.contains('is-on')) return; // the game owns the keyboard (ESC included)
    if (e.key === 'Escape') { goBack(); return; }
    const keys = { 1: 'laptop', 2: 'monitors', 3: 'whiteboard', 4: 'certs', 5: 'contact' };
    if (keys[e.key] && !exp.isMoving) { dismissHint(); exp.focusKey(keys[e.key]); }
  });

  // ---- Sound toggle ----
  const soundBtn = $('soundBtn');
  soundBtn.classList.toggle('is-off', isMuted());
  soundBtn.addEventListener('click', () => { const m = toggleMute(); soundBtn.classList.toggle('is-off', m); if (!m) sfx.click(); });

  // ---- Language change rebuilds open panel + arcade facts ----
  onLangChange(() => {
    if (currentSection) panelBody.innerHTML = buildPanel(currentSection, getLang());
    game.setFacts(arcadeFacts(getLang()));
  });

  // ---- DEBUG: ?shot[=key] skips loader for screenshots/tuning ----
  if (location.search.includes('shot')) {
    loader.style.display = 'none';
    hud.classList.add('is-on');
    exp.showMarkers(true);
    const f = exp.foci.home;
    exp.camera.position.copy(f.pos); exp.controls.target.copy(f.target);
    exp.controls.enabled = true; exp.controls.update();
    const m = location.search.match(/shot=(\w+)/);
    if (m && m[1] === 'play') {
      const fc = exp.foci.arcade;
      exp.camera.position.copy(fc.pos); exp.controls.target.copy(fc.target);
      exp.controls.update(); exp.isFocused = true;
      openArcade(); game.action(); backBtn.classList.add('is-on');
    } else if (m && exp.foci[m[1]]) {
      const fc = exp.foci[m[1]];
      exp.camera.position.copy(fc.pos); exp.controls.target.copy(fc.target);
      exp.controls.update(); exp.isFocused = true;
      exp.onFocus(fc); backBtn.classList.add('is-on');
    }
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
