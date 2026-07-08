import './style.css';
import Experience from './experience/Experience.js';
import { ArcadeGame } from './experience/arcadeGame.js';
import { applyStatic, initLangSwitch, getLang, setLang, onLangChange } from './modules/i18n.js';
import { buildPanel } from './modules/panels.js';
import { renderSite, initSiteFx } from './modules/site.js';
import { content, CONTACT, PROJECTS } from './data/content.js';
import { sfx, isMuted, toggleMute, unlockAudio } from './modules/audio.js';
import { setShield, isShieldOn } from './experience/screenDraws.js';

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
  // don't pop the on-screen keyboard on touch — let users read first, tap the field when ready
  const isTouch = matchMedia('(pointer: coarse)').matches;
  const softFocus = (el) => { if (!isTouch) el.focus(); };

  const loader = $('loader'), fill = $('loaderFill'), pct = $('loaderPct');
  const hud = $('hud'), hint = $('hint'), tip = $('tip'), backBtn = $('backBtn');
  const panel = $('panel'), panelBody = $('panelBody');
  const arcadeOverlay = $('arcadeGame');
  const site = $('site');
  let currentSection = null;
  let hintDismissed = false;
  let inRoom = false;

  // ---- Site <-> Room mode ----
  // The canvas physically moves between the fullscreen room and the site's small aperçu slot.
  const canvasEl = exp.canvas;
  const canvasToSlot = () => {
    const slot = site.querySelector('#apercuSlot');
    if (slot) { slot.prepend(canvasEl); exp._resize(); if (exp.paused) exp.renderOnce(); }
  };
  const canvasToBody = () => { document.body.prepend(canvasEl); exp._resize(); };
  // while the preview is frozen, repaint one frame after window resizes
  addEventListener('resize', () => { if (!inRoom && exp.paused) exp.renderOnce(); });
  const renderSiteNow = () => {
    site.innerHTML = renderSite(getLang());
    initSiteFx(site);
    if (!inRoom) canvasToSlot();
  };
  renderSiteNow();
  applyStatic(); // stamp lang-switch active state in the freshly rendered site header
  document.body.classList.add('site-mode');

  function enterRoomMode(focusTarget = null) {
    if (inRoom) { if (focusTarget && !exp.isMoving) exp.focusKey(focusTarget); return; }
    inRoom = true;
    sfx.whoosh();
    document.body.classList.remove('site-mode');
    document.body.classList.add('room-mode');
    canvasToBody();
    exp.resume();
    // re-frame for the fullscreen (possibly portrait) viewport
    if (!exp.isFocused) {
      exp.camera.position.copy(exp._adapt(exp.foci.home));
      exp.controls.update();
    }
    site.classList.add('is-hidden');
    hud.classList.add('is-on');
    if (!hintDismissed && !focusTarget) hint.classList.add('is-on');
    exp.showMarkers(true);
    exp.controls.enabled = !focusTarget;
    exp.controls.autoRotate = false;
    if (focusTarget && !exp.isMoving) { dismissHint(); exp.focusKey(focusTarget); }
  }

  function exitRoomMode() {
    if (!inRoom) return;
    inRoom = false;
    sfx.whoosh();
    if (exp.isFocused && !exp.isMoving) exp.unfocus();
    hud.classList.remove('is-on');
    hint.classList.remove('is-on');
    closeChat();
    exp.showMarkers(false);
    exp.controls.enabled = false;
    exp.controls.autoRotate = false;
    document.body.classList.remove('room-mode');
    document.body.classList.add('site-mode');
    site.classList.remove('is-hidden');
    canvasToSlot();
    // let the camera glide home in the preview for a beat, then freeze again
    setTimeout(() => { if (!inRoom) freezePreview(); }, 1400);
  }

  $('exitRoom').addEventListener('click', exitRoomMode);
  $('hudLogo').addEventListener('click', (e) => { e.preventDefault(); exitRoomMode(); });

  // ---- Arcade mini-game ----
  const game = new ArcadeGame(exp.room.arcadeScreen.canvas, { onExit: () => { if (!exp.isMoving) exp.unfocus(); } });
  game.setFacts(arcadeFacts(getLang()));
  exp.arcadeGame = game;
  $('arcadeMount').appendChild(game.canvas);
  function openArcade() { arcadeOverlay.classList.add('is-on'); document.body.classList.add('arcade-open'); game.start(); sfx.click(); }
  function closeArcade() { arcadeOverlay.classList.remove('is-on'); document.body.classList.remove('arcade-open'); game.stop(); }
  const hold = (id, dir) => {
    const b = $(id);
    const on = (e) => { e.preventDefault(); game.press(dir, true); };
    const off = (e) => { e.preventDefault(); game.press(dir, false); };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off);
  };
  hold('agLeft', 'left'); hold('agRight', 'right');
  $('agFire').addEventListener('pointerdown', (e) => { e.preventDefault(); game.action(); });

  // ---- Loading: mini boot terminal + progress → reveal the site ----
  // The room is NOT animated on the site: we park the camera at the home view,
  // render two warm-up frames into the aperçu, then pause the loop entirely.
  function freezePreview() {
    const f = exp.foci.home;
    exp.camera.position.copy(exp._adapt(f));
    exp.controls.target.copy(f.target);
    exp.controls.enabled = false;
    exp.controls.autoRotate = false;
    exp.showMarkers(false);
    exp.controls.update();
    exp._resize();
    requestAnimationFrame(() => requestAnimationFrame(() => { if (!inRoom) exp.pause(); }));
  }
  function revealSite() {
    loader.classList.add('is-hidden');
    setTimeout(() => (loader.style.display = 'none'), 800);
    document.body.classList.add('is-ready');
    freezePreview();
  }
  const bootLines = content[getLang()].loader.boot;
  const term = $('loaderTerm');
  bootLines.forEach((line, i) => {
    setTimeout(() => {
      const p = document.createElement('p');
      p.textContent = line;
      if (!line.startsWith('>')) p.classList.add('is-out');
      term.appendChild(p);
    }, 120 + i * 230);
  });
  let p = 0;
  const grow = () => {
    p = Math.min(100, p + Math.random() * 16 + 9);
    fill.style.width = p + '%'; pct.textContent = Math.floor(p);
    if (p < 100) setTimeout(grow, 60 + Math.random() * 70);
    else if (!location.search.includes('shot')) setTimeout(revealSite, 420);
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
  // The panel eats screen space (right side on desktop, bottom sheet on mobile),
  // so we shift the rendered view to keep the focused object fully visible.
  const panelShift = () => (innerWidth > 720
    ? [Math.min(460, innerWidth * 0.92) / 2, 0]
    : [0, innerHeight * 0.2]);
  function openPanel(section) {
    currentSection = section;
    panelBody.innerHTML = buildPanel(section, getLang());
    panelBody.scrollTop = 0;
    panel.classList.add('is-on');
    document.body.classList.add('panel-open');
    exp.setSideOffset(...panelShift());
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
  // cross-links, phone reveal and the PhaseShield live demo toggle — shared by
  // the slide-in panel and the landing site (which reuse the same markup)
  function panelClicks(e, inSite) {
    const enter = e.target.closest('[data-enter-room]');
    if (enter) { enterRoomMode(); return; }
    const b = e.target.closest('[data-goto]');
    if (b) {
      if (inSite) enterRoomMode(b.dataset.goto);
      else if (!exp.isMoving) exp.focusKey(b.dataset.goto);
      return;
    }
    const rev = e.target.closest('[data-reveal]');
    if (rev) {
      const v = rev.closest('p').querySelector('.phone-val');
      if (v) v.innerHTML = `<a href="tel:${CONTACT.phoneHref}" data-cursor>${CONTACT.phone}</a>`;
      rev.remove();
      return;
    }
    const sh = e.target.closest('[data-shield]');
    if (sh) {
      const on = !isShieldOn();
      setShield(on);
      const d = content[getLang()].researchSection.demo;
      const box = sh.closest('.demo-box, .sg-demo');
      const isSite = sh.classList.contains('sg-btn');
      if (isSite) {
        sh.textContent = `[ ${on ? d.deactivate : d.activate} ]`;
        sh.classList.toggle('sg-btn--green', !on);
      } else {
        sh.textContent = on ? d.deactivate : d.activate;
        sh.classList.toggle('pbtn--solid', !on);
      }
      const st = box && box.querySelector('.demo-status, .sg-demo-status');
      if (st) {
        st.textContent = isSite ? (on ? `✓ ${d.obfuscated}` : `⚠ ${d.detectable}`) : (on ? d.obfuscated : d.detectable);
        st.classList.toggle('is-on', on);
      }
      const wave = box && box.querySelector('.sg-wave-per'); // site demo waveform reacts too
      if (wave) wave.style.opacity = on ? 0.65 : 0;
      sfx.click();
    }
  }
  panelBody.addEventListener('click', (e) => panelClicks(e, false));
  site.addEventListener('click', (e) => panelClicks(e, true));

  // ---- Camera focus callback ----
  exp.onFocus = (f) => {
    if (f) dismissHint(); // never leave the hint under the back button
    exp.room.teardown.set(!!(f && f.panel === 'laptop')); // explode the bench laptop only while focused on it
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
  $('arcadeClose').addEventListener('click', goBack);
  addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') { if (e.key === 'Escape') { closeChat(); closeTerm(); } return; }
    if (arcadeOverlay.classList.contains('is-on')) return; // the game owns the keyboard (ESC included)
    if (e.key === 'Escape') {
      if (chatWin.classList.contains('is-on')) { closeChat(); return; }
      if (termWin.classList.contains('is-on')) { closeTerm(); return; }
      if (inRoom && exp.isFocused) { goBack(); return; }
      if (inRoom) exitRoomMode();
      return;
    }
    if (!inRoom) return; // number shortcuts only inside the room
    const keys = { 1: 'laptop', 2: 'monitors', 3: 'whiteboard', 4: 'certs', 5: 'contact', 6: 'workbench' };
    if (keys[e.key] && !exp.isMoving) { dismissHint(); exp.focusKey(keys[e.key]); }
  });

  // ---- Mini-Haidar chat (click the little guy in the room) ----
  const chatWin = $('chatWin'), chatOut = $('chatOut'), chatChips = $('chatChips'), chatInput = $('chatInput');
  const C = () => content[getLang()].chat;
  let chatGreeted = false;
  const chatMsg = (text, who) => {
    const d = document.createElement('div');
    d.className = `chat__msg chat__msg--${who}`;
    d.textContent = text;
    chatOut.appendChild(d);
    chatOut.scrollTop = chatOut.scrollHeight;
    return d;
  };
  let chatCam = false; // camera flew to the guy for this chat
  function openChat() {
    const c = C();
    $('chatTitle').textContent = c.title;
    $('chatStatus').textContent = c.status;
    chatInput.placeholder = c.placeholder;
    chatChips.innerHTML = c.chips.map((x) => `<button data-cursor>${x}</button>`).join('');
    chatWin.classList.add('is-on');
    if (!chatGreeted) { chatGreeted = true; chatMsg(c.greeting, 'bot'); }
    // meet him face to face: camera flies over, he waves for as long as you stay
    if (inRoom) {
      let camPos = exp.camera.position;
      if (!exp.isFocused) { camPos = exp.flyToGuy(); chatCam = true; }
      exp.room.guy.setGreeting(true);
      exp.room.guy.wave(camPos);
    }
    softFocus(chatInput);
    sfx.click();
  }
  const closeChat = () => {
    if (!chatWin.classList.contains('is-on')) return;
    chatWin.classList.remove('is-on');
    exp.room.guy.setGreeting(false);
    if (chatCam) { chatCam = false; if (inRoom) exp.unfocus(); }
  };
  $('chatClose').addEventListener('click', closeChat);
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); // strip accents
  function chatSend(raw) {
    const text = raw.trim();
    if (!text) return;
    chatMsg(text, 'me');
    const typing = chatMsg('•••', 'bot');
    typing.classList.add('chat__msg--typing');
    const q = norm(text);
    const rule = C().rules.find((r) => r.k.some((k) => q.includes(norm(k))));
    setTimeout(() => {
      typing.classList.remove('chat__msg--typing');
      typing.textContent = rule ? rule.a : C().fallback;
      chatOut.scrollTop = chatOut.scrollHeight;
    }, 500 + Math.random() * 500);
  }
  chatChips.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) chatSend(b.textContent); });
  $('chatSend').addEventListener('click', () => { chatSend(chatInput.value); chatInput.value = ''; });
  chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { chatSend(chatInput.value); chatInput.value = ''; } });
  exp.onEvent = (name) => {
    if (name === 'chat') openChat();
    if (name === 'rubik') { exp.room.rubikSolve(); sfx.click(); }
  };
  // the little guy follows you to whichever section you focus
  exp.onFocusStart = (key) => exp.room.guy.guide(key);

  // ---- Terminal easter egg (ported from portfolio1) ----
  const termLaunch = $('termLaunch'), termWin = $('termWin'), termOut = $('termOut'), termInput = $('termInput');
  const T = () => content[getLang()].terminal;
  let greeted = false;
  const tHistory = []; let tHistIdx = -1;
  const tLine = (textOrHtml, cls = '', html = false) => {
    const p = document.createElement('p');
    if (cls) p.className = cls;
    if (html) p.innerHTML = textOrHtml; else p.textContent = textOrHtml;
    termOut.appendChild(p);
    termOut.scrollTop = termOut.scrollHeight;
  };
  const tLink = (href, label) => `<a href="${href}" target="_blank" rel="noopener" data-cursor>${label}</a>`;
  function openTerm() {
    termWin.classList.add('is-on'); termLaunch.classList.add('is-open');
    termLaunch.setAttribute('aria-expanded', 'true');
    if (!greeted) { greeted = true; T().greet.forEach((l) => tLine(l)); }
    softFocus(termInput); sfx.click();
  }
  function closeTerm() {
    termWin.classList.remove('is-on'); termLaunch.classList.remove('is-open');
    termLaunch.setAttribute('aria-expanded', 'false');
  }
  termLaunch.addEventListener('click', () => (termWin.classList.contains('is-on') ? closeTerm() : openTerm()));
  const GOTO = { about: 'laptop', work: 'monitors', research: 'whiteboard', certs: 'certs', contact: 'contact', infra: 'serverRack', arcade: 'arcade', bench: 'workbench', workbench: 'workbench' };
  function runCmd(raw) {
    const s = T();
    const cmd = raw.trim().toLowerCase();
    tLine(`guest@portfolio:~$ ${raw}`, 'term__echo');
    if (!cmd) return;
    tHistory.unshift(raw); tHistIdx = -1;
    if (cmd === 'clear') { termOut.innerHTML = ''; return; }
    if (cmd === 'help' || cmd === '?') return s.help.forEach((l) => tLine(l));
    if (cmd === 'whoami') return tLine(s.whoami);
    if (cmd === 'certs' || cmd === 'certifications') return tLine(s.certs);
    if (cmd === 'phaseshield') {
      tLine(content[getLang()].researchSection.fullTitle);
      return tLine(`${tLink(CONTACT.zenodo, 'DOI 10.5281/zenodo.19047475')} · ${tLink(CONTACT.hal, 'HAL')}`, '', true);
    }
    if (cmd === 'projects' || cmd === 'ls projects') {
      return PROJECTS.forEach((pr, i) => {
        const bits = [`${String(i + 1).padStart(2, '0')} ${pr.name}`];
        if (pr.github) bits.push(tLink(pr.github, 'github'));
        if (pr.live) bits.push(tLink(pr.live, 'live'));
        tLine(bits.join(' — '), '', true);
      });
    }
    if (cmd === 'contact') {
      tLine(`email — ${tLink('mailto:' + CONTACT.email, CONTACT.email)}`, '', true);
      tLine(`linkedin — ${tLink(CONTACT.linkedin, 'in/haidaresber')}`, '', true);
      return tLine(`github — ${tLink(CONTACT.github, 'HaidarESBER')}`, '', true);
    }
    if (cmd === 'ls' || cmd === 'ls sections') return tLine(Object.keys(GOTO).slice(0, 8).join('  '));
    if (cmd.startsWith('goto ') || cmd.startsWith('cd ')) {
      const target = cmd.split(/\s+/)[1];
      if (!GOTO[target]) return tLine(s.gotoUsage);
      if (!inRoom) enterRoomMode(GOTO[target]);
      else if (!exp.isMoving) { dismissHint(); exp.focusKey(GOTO[target]); }
      return tLine(s.gotoOk(target));
    }
    if (cmd === 'lang fr' || cmd === 'lang en') {
      setLang(cmd.endsWith('fr') ? 'fr' : 'en');
      return tLine(T().langSet);
    }
    if (cmd === 'sudo hire haidar' || cmd === 'hire haidar' || cmd === 'sudo hire') {
      s.hired.slice(0, 3).forEach((l, i) => tLine(l, i === 0 ? 'term__ok term__ok--big' : 'term__ok'));
      return tLine(`→ ${tLink('mailto:' + CONTACT.email, CONTACT.email)} — ${s.hired[3].split('— ')[1]}`, '', true);
    }
    if (cmd.startsWith('sudo') || cmd.startsWith('rm ')) return tLine(s.denied);
    return tLine(s.notFound(cmd.split(/\s+/)[0]));
  }
  termInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { runCmd(termInput.value); termInput.value = ''; }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (tHistory[tHistIdx + 1] !== undefined) { tHistIdx++; termInput.value = tHistory[tHistIdx]; } }
    else if (e.key === 'ArrowDown') { e.preventDefault(); tHistIdx = Math.max(-1, tHistIdx - 1); termInput.value = tHistIdx >= 0 ? tHistory[tHistIdx] : ''; }
  });

  // ---- Sound toggle ----
  const soundBtn = $('soundBtn');
  soundBtn.classList.toggle('is-off', isMuted());
  soundBtn.addEventListener('click', () => { const m = toggleMute(); soundBtn.classList.toggle('is-off', m); if (!m) sfx.click(); });

  // ---- Language change rebuilds open panel + arcade facts ----
  onLangChange(() => {
    if (currentSection) panelBody.innerHTML = buildPanel(currentSection, getLang());
    game.setFacts(arcadeFacts(getLang()));
    exp.room.teardown.setLang(getLang());
    renderSiteNow();
    applyStatic(); // re-stamp [data-i18n] + lang-switch active states in the fresh site DOM
  });
  exp.room.teardown.setLang(getLang());

  // ---- DEBUG: ?shot[=key] skips loader for screenshots/tuning ----
  if (location.search.includes('shot')) {
    loader.style.display = 'none';
    document.body.classList.add('is-ready');
    if (location.search.includes('site')) {
      // ?shot=site — landing page screenshot state
      exp.controls.enabled = false;
      const f = exp.foci.home;
      exp.camera.position.copy(f.pos); exp.controls.target.copy(f.target); exp.controls.update();
    } else {
      inRoom = true;
      document.body.classList.remove('site-mode');
      document.body.classList.add('room-mode');
      canvasToBody();
      site.classList.add('is-hidden');
      hud.classList.add('is-on');
      exp.showMarkers(true);
    }
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
