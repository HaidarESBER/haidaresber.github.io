// The landing site — a faithful vanilla port of the portfolio1 design
// ("cyber-signal": phosphor grid, scanlines, green terminal accents).
// The 3D room appears as a small live aperçu panel; entering it switches modes.
import { content, CONTACT, PROJECTS, EXPERIENCE, EDUCATION, CERTS, CERT_DISPLAY, CERT_GROUPS, PARTNERS } from '../data/content.js';
import { isShieldOn } from '../experience/screenDraws.js';

const L = (v, lang) => (v && typeof v === 'object' && ('fr' in v || 'en' in v) ? v[lang] : v);
const PROJECT_IMG = { 'Vilber — Microscope 3D': '/images/vilber-hero.webp', Arguile: '/images/arguile-card.webp', 'cojeco.fr': '/images/cojeco-site.webp' };

// seamless waveform paths (periodic over half width, like portfolio1's Waveform.tsx)
function sinePath(components, W = 1600, H = 200, step = 8) {
  const pts = [];
  for (let x = 0; x <= W; x += step) {
    let y = H / 2;
    for (const [a, l, p] of components) y += a * Math.sin((2 * Math.PI * x) / l + p);
    pts.push(`${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)}`);
  }
  return pts.join(' ');
}
function waveform(cls, perturbVisible) {
  const carrier = sinePath([[30, 800, 0], [11, 200, 1.1]]);
  const perturb = sinePath([[24, 400, Math.PI / 2], [15, 160, 2.3], [7, 100, 0.4]]);
  const residual = sinePath([[42, 800, Math.PI], [8, 266.7, 1.9]]);
  const g = (dx) => `
    <g transform="translate(${dx} 0)" filter="url(#wfglow)">
      <path d="${residual}" fill="none" stroke="#3dff8e" stroke-width="1" class="sg-wave-res" />
      <path d="${carrier}" fill="none" stroke="#3dff8e" stroke-width="1.4" class="sg-wave-car" />
      <path d="${perturb}" fill="none" stroke="#ff5040" stroke-width="1.4" class="sg-wave-per" style="opacity:${perturbVisible ? 0.65 : 0}" />
    </g>`;
  return `
  <div class="sg-wave ${cls}" aria-hidden="true"><div class="sg-waveTrack">
    <svg viewBox="0 0 3200 200" preserveAspectRatio="none">
      <defs><filter id="wfglow" x="-20%" y="-50%" width="140%" height="200%">
        <feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter></defs>
      <line x1="0" y1="100" x2="3200" y2="100" stroke="#1e2924" stroke-width="1"/>
      ${g(0)}${g(1600)}
    </svg>
  </div></div>`;
}

function radar() {
  const blips = [[38, -25], [-52, 12], [18, 55], [-20, -58], [62, 38]]
    .map(([x, y], i) => `<circle cx="${100 + x}" cy="${100 + y}" r="2.2" fill="#3dff8e" class="sg-blip" style="animation-delay:${i * 0.7}s"/>`)
    .join('');
  return `
  <div class="sg-radar" aria-hidden="true">
    <svg viewBox="0 0 200 200">
      ${[28, 56, 84].map((r) => `<circle cx="100" cy="100" r="${r}" fill="none" stroke="#1e2924" stroke-width="1"/>`).join('')}
      <circle cx="100" cy="100" r="84" fill="none" stroke="rgba(61,255,142,0.25)" stroke-width="1"/>
      <line x1="16" y1="100" x2="184" y2="100" stroke="#1e2924" stroke-width="1"/>
      <line x1="100" y1="16" x2="100" y2="184" stroke="#1e2924" stroke-width="1"/>
      ${blips}
      <g class="sg-sweep"><path d="M100 100 L100 16 A84 84 0 0 1 152 33 Z" fill="rgba(61,255,142,0.14)"/><line x1="100" y1="100" x2="100" y2="16" stroke="#3dff8e" stroke-width="1.4"/></g>
    </svg>
    <p class="sg-dim sg-radar-label">RF · 802.11 · CSI</p>
  </div>`;
}

const tags = (arr) => `<ul class="sg-topics">${arr.map((t) => `<li>${t}</li>`).join('')}</ul>`;

function sectionHead(index, label) {
  return `<span class="sg-ghost" aria-hidden="true">${index}</span>
    <p class="sg-tag sg-reveal">// ${index}</p>
    <h2 class="sg-h2 sg-reveal">${label}</h2>`;
}

export function renderSite(lang) {
  curLang = lang;
  const c = content[lang];
  const s = c.site;
  const r = c.researchSection;
  const marqueeRow = (items) => `<div class="sg-track">${[0, 1].map(() => items.map((w) => `<span>${w.toUpperCase()}</span><i>▮</i>`).join('')).join('')}</div>`;

  const projCard = (p) => {
    const name = lang === 'en' && p.nameEn ? p.nameEn : p.name;
    const img = PROJECT_IMG[p.name];
    return `
    <article class="sg-card reticle sweep sg-reveal${p.minor ? ' sg-card--minor' : ''}">
      ${img ? `<img class="sg-card-img" src="${img}" alt="${name}" loading="lazy"/>` : ''}
      <div class="sg-card-body">
        <p class="sg-tag">${L(p.kind, lang)}</p>
        <h3>${name}</h3>
        <p class="sg-body">${L(p.body, lang)}</p>
        ${p.tech ? `<p class="sg-dim sg-card-tech">${p.tech.join(' · ')}</p>` : ''}
        <p class="sg-card-links">
          ${p.github ? `<a href="${p.github}" target="_blank" rel="noopener" data-cursor>↗ ${s.ui.github}</a>` : ''}
          ${p.live ? `<a href="${p.live}" target="_blank" rel="noopener" data-cursor>↗ ${s.ui.live}</a>` : ''}
        </p>
      </div>
    </article>`;
  };

  return `
  <div class="sg-scanlines" aria-hidden="true"></div>
  <div class="sg-grain" aria-hidden="true"></div>
  <div class="sg-vignette" aria-hidden="true"></div>
  <div class="sg-progress" id="sgProgress" aria-hidden="true"></div>

  <header class="sg-nav">
    <div class="sg-wrap sg-nav-in">
      <a href="#top" class="sg-logo" data-cursor>HAIDAR.ESBER<span class="sg-blink">_</span></a>
      <nav class="sg-nav-links" aria-label="Sections">
        <a href="#work" data-cursor><i>01</i><span class="sg-hov">${c.nav.work}</span></a>
        <a href="#experience" data-cursor><i>02</i><span class="sg-hov">${s.sections.experience}</span></a>
        <a href="#certs" data-cursor><i>03</i><span class="sg-hov">${c.nav.certs}</span></a>
        <a href="#contact" data-cursor><i>04</i><span class="sg-hov">${c.nav.contact}</span></a>
      </nav>
      <div class="sg-nav-right">
        <div class="lang-switch sg-lang"><button data-lang="fr" data-cursor>FR</button><span>/</span><button data-lang="en" data-cursor>EN</button></div>
        <button class="sg-btn sg-btn--green sg-enter-desktop" data-enter-room data-cursor>[ ${s.enterRoom} ]</button>
        <button class="sg-menu-btn" data-menu aria-expanded="false" aria-label="Menu" data-cursor>[≡]</button>
      </div>
    </div>
  </header>

  <nav class="sg-mmenu" id="sgMenu" aria-label="Menu">
    <a href="#work" data-cursor><i>01</i>${c.nav.work}</a>
    <a href="#experience" data-cursor><i>02</i>${s.sections.experience}</a>
    <a href="#certs" data-cursor><i>03</i>${c.nav.certs}</a>
    <a href="#contact" data-cursor><i>04</i>${c.nav.contact}</a>
    <button class="sg-btn sg-btn--green" data-enter-room data-cursor>[ ${s.enterRoom} → ]</button>
  </nav>

  <section id="top" class="sg-hero sg-grid">
    <div class="sg-wrap sg-hero-grid">
      <div>
        <h1 class="sg-h1 glitch" id="sgName"><span class="sg-scr">HAIDAR</span><br/><span class="sg-green sg-glow sg-scr">ESBER</span></h1>
        <p class="sg-role sg-scr">${s.role}</p>
        <div class="sg-term">
          <div class="sg-term-bar"><span class="sg-dot sg-dot--r"></span><span class="sg-dot"></span><span class="sg-dot sg-dot--g"></span><span class="sg-dim">haidar@esber:~</span></div>
          <div class="sg-term-lines" id="sgHeroTerm" data-lines='${JSON.stringify(s.heroTerm).replace(/'/g, '&#39;')}'></div>
        </div>
        <div class="sg-hero-cta">
          <p class="sg-status"><span class="sg-pulse"></span>${c.status}</p>
        </div>
      </div>
      <div class="sg-hero-right"><div id="ghSlot" class="sg-ghwrap"><div class="sg-gh sg-gh--loading"><p class="sg-dim">${s.gh.loading}</p></div></div></div>
    </div>
    <div class="sg-stats">
      <div class="sg-wrap sg-stats-grid">
        ${c.about.stats.map((x) => `<div><p class="sg-stat-v">${x.v}</p><p class="sg-dim">${x.k}</p></div>`).join('')}
      </div>
    </div>
    ${waveform('sg-wave--hero', true)}
  </section>

  <div class="sg-marquee" aria-hidden="true">${marqueeRow(s.marquee)}</div>

  <!-- ── the 3D room, as a small live aperçu ── -->
  <section class="sg-apercu-sec">
    <div class="sg-wrap">
      <div class="sg-apercu sg-panel sg-reveal" data-enter-room data-cursor role="button" tabindex="0" aria-label="${s.enterRoom}">
        <div class="sg-panel-head"><p class="sg-tag">◉ ${s.apercu.tag}</p><p class="sg-dim">WebGL · Three.js</p></div>
        <div class="sg-apercu-slot" id="apercuSlot"><div class="sg-apercu-veil"><span class="sg-btn sg-btn--green">[ ${s.enterRoom} → ]</span></div></div>
        <div class="sg-panel-foot"><p class="sg-body">${s.apercu.body}</p><p class="sg-dim">${s.apercu.hint}</p></div>
      </div>
    </div>
  </section>

  <section id="work" class="sg-sec">
    <div class="sg-wrap sg-sec-in">
      ${sectionHead('01', s.sections.work)}
      <div class="sg-work">
        <article class="sg-panel sg-panel--alert scan-border sg-reveal">
          <div class="sg-panel-head"><p class="sg-tag sg-tag--red">▲ ${c.workSection.featured[0].tag}</p><p class="sg-dim">REF: 10.5281/zenodo.19047475</p></div>
          <div class="sg-panel-body">
            <h3 class="sg-h3">PhaseShield</h3>
            <p class="sg-green-line">${r.fullTitle}</p>
            <p class="sg-body">${r.body}</p>
            <div class="sg-demo">
              <div class="sg-demo-bar">
                <p class="sg-demo-status ${isShieldOn() ? 'is-on' : ''}">${isShieldOn() ? '✓ ' + r.demo.obfuscated : '⚠ ' + r.demo.detectable}</p>
                <button class="sg-btn ${isShieldOn() ? '' : 'sg-btn--green'}" data-shield data-cursor>[ ${isShieldOn() ? r.demo.deactivate : r.demo.activate} ]</button>
              </div>
              ${waveform('sg-wave--demo', isShieldOn())}
            </div>
            ${tags(r.topics)}
            <p class="sg-dim sg-meta">${c.workSection.featured[0].meta}</p>
            <ul class="sg-links">${r.links.map((l) => `<li><a href="${l.href}" target="_blank" rel="noopener" data-cursor><span class="sg-green">↗</span> ${l.label}</a></li>`).join('')}</ul>
            <button class="sg-btn sg-btn--ghost" data-goto="whiteboard" data-cursor>[ ${lang === 'fr' ? 'voir dans la pièce 3D' : 'see it in the 3D room'} → ]</button>
          </div>
        </article>
        <article class="sg-panel sg-reveal">
          <div class="sg-panel-head"><p class="sg-tag">■ ${c.workSection.featured[1].tag}</p></div>
          <div class="sg-panel-body">
            <h3 class="sg-h3--sm">${c.workSection.featured[1].name}</h3>
            <p class="sg-body">${c.workSection.featured[1].body}</p>
            <p class="sg-dim sg-meta">${c.workSection.featured[1].meta}</p>
          </div>
        </article>
        <article class="sg-panel sg-panel--wide sg-reveal">
          <div class="sg-panel-head"><p class="sg-tag">◆ ${c.workSection.featured[2].tag}</p><p class="sg-dim">SIREN 988 619 979</p></div>
          <div class="sg-cojeco">
            <a href="https://cojeco.fr" target="_blank" rel="noopener" data-cursor><img src="/images/cojeco-site.webp" alt="cojeco.fr" loading="lazy"/></a>
            <div class="sg-panel-body">
              <span class="sg-logochip"><img src="/images/cojeco-logo.svg" alt="Logo CoJeCo" loading="lazy"/></span>
              <h3 class="sg-h3--sm">CoJeCo</h3>
              <p class="sg-body">${c.workSection.featured[2].body}</p>
              <p class="sg-card-links"><a href="https://cojeco.fr" target="_blank" rel="noopener" data-cursor>↗ cojeco.fr</a></p>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>

  <section id="about" class="sg-sec">
    <div class="sg-wrap sg-sec-in">
      ${sectionHead('02', s.sections.about)}
      <div class="sg-about">
        <div class="sg-reveal">
          <p class="sg-body sg-body--lead">${c.about.paragraphs[0]}</p>
          <p class="sg-body">${c.about.paragraphs[1]}</p>
        </div>
        <div class="sg-facts sg-reveal">
          ${c.about.facts.map((f) => `<div class="sg-fact"><p class="sg-dim">${f.label}</p><p>${f.value}</p></div>`).join('')}
        </div>
      </div>
    </div>
  </section>

  <section id="experience" class="sg-sec">
    <div class="sg-wrap sg-sec-in">
      ${sectionHead('03', s.sections.experience)}
      <ol class="sg-tl">
        ${EXPERIENCE.map((e) => `
        <li class="sg-reveal">
          <span class="sg-tl-node" aria-hidden="true"></span>
          <p class="sg-dim">${L(e.date, lang)}</p>
          <h3>${L(e.role, lang)}</h3>
          <p class="sg-green-line">${L(e.org, lang)}</p>
          <p class="sg-body">${L(e.body, lang)}</p>
          ${e.media ? `<div class="sg-tl-media"><a href="${e.url}" target="_blank" rel="noopener" data-cursor><img src="/images/cojeco-site.webp" alt="cojeco.fr" loading="lazy"/></a><span class="sg-logochip"><img src="/images/cojeco-logo.svg" alt="Logo CoJeCo"/></span></div>` : ''}
        </li>`).join('')}
      </ol>
    </div>
  </section>

  <section id="projects" class="sg-sec">
    <div class="sg-wrap sg-sec-in">
      ${sectionHead('04', s.sections.projects)}
      <div class="sg-projects">${PROJECTS.map(projCard).join('')}</div>
    </div>
  </section>

  <section id="skills" class="sg-sec">
    <div class="sg-wrap sg-sec-in">
      ${sectionHead('05', s.sections.skills)}
      <div class="sg-skills">
        ${c.about.skills.map((k) => `<div class="sg-skill sg-reveal"><p class="sg-tag">${k.label}</p><p class="sg-body">${k.items}</p></div>`).join('')}
      </div>
    </div>
  </section>

  <section id="certs" class="sg-sec">
    <div class="sg-wrap sg-sec-in">
      ${sectionHead('06', s.sections.certs)}
      <p class="sg-body sg-reveal">${c.certsSection.intro} — <span class="sg-green sg-glow">${CERT_DISPLAY}</span> ${c.certsSection.countLabel}.</p>
      ${['cisco', 'nasa', 'other'].map((g) => `
      <div class="sg-certgroup sg-reveal">
        <p class="sg-dim sg-certgroup-head">${CERT_GROUPS[g] || c.certsSection.othersLabel}</p>
        <div class="sg-tiles">
          ${CERTS.filter((x) => x.group === g).map((i) => `
            <div class="sg-tile sweep${i.featured ? ' sg-tile--star scan-border' : ''}">
              ${i.featured ? '<p class="sg-tag sg-tag--red">★ featured</p>' : ''}
              <p>${i.title}${i.count ? ` <span class="sg-dim">×${i.count}</span>` : ''}</p>
              ${i.issuer ? `<p class="sg-dim">${i.issuer}</p>` : ''}
            </div>`).join('')}
        </div>
      </div>`).join('')}
      <p class="sg-dim sg-reveal">CoJeCo — ${PARTNERS.join(' · ').toLowerCase()}</p>
    </div>
  </section>

  <section id="education" class="sg-sec">
    <div class="sg-wrap sg-sec-in">
      ${sectionHead('07', s.sections.education)}
      <ul class="sg-edu">
        ${EDUCATION.map((e) => `<li class="sg-reveal"><p class="sg-dim">${L(e.date, lang)}</p><div><h3>${L(e.role, lang)}</h3><p class="sg-green-line">${L(e.org, lang)}</p></div></li>`).join('')}
      </ul>
    </div>
  </section>

  <div class="sg-marquee sg-marquee--rev" aria-hidden="true">${marqueeRow(s.marquee2)}</div>

  <section id="contact" class="sg-sec">
    <div class="sg-wrap sg-sec-in sg-contact">
      ${sectionHead('08', s.sections.contact)}
      <div class="sg-tx" aria-hidden="true"><span class="sg-txring"></span><span class="sg-txring" style="animation-delay:1.1s"></span><span class="sg-txring" style="animation-delay:2.2s"></span></div>
      <p class="sg-body sg-body--lead sg-reveal">${c.contact.body}</p>
      <div class="sg-rows sg-reveal">
        <div class="sg-row"><p class="sg-dim">Email</p><a href="mailto:${CONTACT.email}" data-cursor>${CONTACT.email}</a></div>
        <div class="sg-row"><p class="sg-dim">${c.contact.phoneLabel}</p><p><span class="phone-val">${CONTACT.phoneMask}</span> <button class="sg-btn" data-reveal data-cursor>[ ${s.ui.reveal} ]</button></p></div>
        <div class="sg-row"><p class="sg-dim">LinkedIn</p><a href="${CONTACT.linkedin}" target="_blank" rel="noopener" data-cursor>linkedin.com/in/haidaresber</a></div>
        <div class="sg-row"><p class="sg-dim">GitHub</p><a href="${CONTACT.github}" target="_blank" rel="noopener" data-cursor>github.com/HaidarESBER</a></div>
        <div class="sg-row"><p class="sg-dim">ResearchGate</p><a href="${CONTACT.researchgate}" target="_blank" rel="noopener" data-cursor>researchgate.net/profile/Haidar-Esber</a></div>
      </div>
    </div>
  </section>

  <footer class="sg-foot">
    <div class="sg-wrap sg-foot-in">
      <p class="sg-dim">${s.colophon}</p>
      <p class="sg-dim">${s.footerBeyond}</p>
      <p class="sg-dim">[EOF]</p>
    </div>
  </footer>`;
}

// ---- site behaviours: typed hero terminal, decrypt effects, reveals, nav ----
const SCRAMBLE_CHARS = '!<>-_\\/[]{}—=+*^?#01';
function scramble(el, delay = 0) {
  if (el.dataset.scrambled) return;
  el.dataset.scrambled = '1';
  const final = el.textContent;
  const total = Math.max(16, final.length * 2.2);
  let frame = 0;
  setTimeout(() => {
    const tick = () => {
      frame++;
      const reveal = Math.floor((frame / total) * final.length);
      el.textContent = final.slice(0, reveal) +
        [...final.slice(reveal)].map((c) => (c === ' ' ? ' ' : SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0])).join('');
      if (reveal < final.length) requestAnimationFrame(tick);
      else el.textContent = final;
    };
    tick();
  }, delay);
}

// ---- GitHub contribution graph (live data; radar is the offline fallback) ----
let ghPromise = null;
let curLang = 'fr';
const fetchGH = () => {
  if (!ghPromise) {
    ghPromise = fetch(`https://github-contributions-api.jogruber.de/v4/HaidarESBER?y=last`)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
    ghPromise.catch(() => { ghPromise = null; }); // allow retry on next render
  }
  return ghPromise;
};
function renderGH(slot) {
  const s = content[curLang].site;
  fetchGH().then((data) => {
    if (!slot.isConnected) return;
    const contribs = data.contributions || [];
    const total = (data.total && (data.total.lastYear ?? Object.values(data.total)[0])) ??
      contribs.reduce((n, c) => n + c.count, 0);
    const firstDay = contribs.length ? new Date(contribs[0].date).getDay() : 0;
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push('<span class="sg-gh-cell" style="visibility:hidden"></span>');
    contribs.forEach((c, i) => {
      cells.push(`<span class="sg-gh-cell l${c.level}" title="${c.date} · ${c.count}" style="transition-delay:${Math.floor((i + firstDay) / 7) * 14}ms"></span>`);
    });
    // derived intel: longest streak, active days, best single day
    let streak = 0, run = 0, active = 0, best = 0;
    contribs.forEach((c) => {
      if (c.count > 0) { run++; active++; streak = Math.max(streak, run); best = Math.max(best, c.count); }
      else run = 0;
    });
    const stat = (v, k) => `<div><p class="sg-gh-v">${v}</p><p class="sg-dim">${k}</p></div>`;
    slot.innerHTML = `
      <a class="sg-gh" href="https://github.com/HaidarESBER" target="_blank" rel="noopener" data-cursor>
        <div class="sg-panel-head"><p class="sg-tag">▦ ${s.gh.title}</p><p class="sg-dim">@HAIDARESBER</p></div>
        <div class="sg-gh-grid">${cells.join('')}</div>
        <p class="sg-gh-legend sg-dim">${s.gh.less}
          <span class="sg-gh-cell on"></span><span class="sg-gh-cell on l1"></span><span class="sg-gh-cell on l2"></span><span class="sg-gh-cell on l3"></span><span class="sg-gh-cell on l4"></span>
          ${s.gh.more}</p>
        <div class="sg-gh-stats">
          ${stat(total, s.gh.total)}
          ${stat(streak + (curLang === 'fr' ? ' j' : ' d'), s.gh.streak)}
          ${stat(active, s.gh.active)}
          ${stat(best, s.gh.best)}
        </div>
        <p class="sg-gh-foot"><span class="sg-green">↗</span> ${s.gh.profile}</p>
      </a>`;
    requestAnimationFrame(() => requestAnimationFrame(() =>
      slot.querySelectorAll('.sg-gh-cell').forEach((el) => el.classList.add('on'))));
  }).catch(() => { if (slot.isConnected) slot.innerHTML = radar(); });
}

function scrambleHover(el) {
  if (!el || el.dataset.busy) return;
  el.dataset.busy = '1';
  const final = el.dataset.txt || (el.dataset.txt = el.textContent);
  const total = Math.max(10, final.length * 1.4);
  let frame = 0;
  const tick = () => {
    frame++;
    const reveal = Math.floor((frame / total) * final.length);
    el.textContent = final.slice(0, reveal) +
      [...final.slice(reveal)].map((c) => (c === ' ' ? ' ' : SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0])).join('');
    if (reveal < final.length) requestAnimationFrame(tick);
    else { el.textContent = final; delete el.dataset.busy; }
  };
  tick();
}

export function initSiteFx(root) {
  // live GitHub contribution graph in the hero
  const ghSlot = root.querySelector('#ghSlot');
  if (ghSlot) renderGH(ghSlot);
  // decrypting name + role
  root.querySelectorAll('.sg-scr').forEach((el, i) => scramble(el, 180 + i * 160));
  // nav links re-decrypt on hover; mobile menu toggle (bound once — survives re-renders)
  if (!root.dataset.hovBound) {
    root.dataset.hovBound = '1';
    root.addEventListener('mouseover', (e) => {
      const a = e.target.closest('.sg-nav-links a');
      if (a) scrambleHover(a.querySelector('.sg-hov'));
    });
    root.addEventListener('click', (e) => {
      const menu = root.querySelector('#sgMenu');
      const btn = root.querySelector('[data-menu]');
      if (!menu || !btn) return;
      const closeMenu = () => {
        menu.classList.remove('is-open');
        btn.textContent = '[≡]'; btn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      };
      if (e.target.closest('[data-menu]')) {
        const open = menu.classList.toggle('is-open');
        btn.textContent = open ? '[×]' : '[≡]';
        btn.setAttribute('aria-expanded', String(open));
        document.body.classList.toggle('menu-open', open);
        return;
      }
      if (e.target.closest('.sg-mmenu a') || e.target.closest('[data-enter-room]')) closeMenu();
    });
  }
  // periodic glitch burst on the name (so touch users see it too)
  if (glitchTimer) clearInterval(glitchTimer);
  glitchTimer = setInterval(() => {
    const h1 = root.querySelector('#sgName');
    if (!h1) return;
    h1.classList.add('sg-glitching');
    setTimeout(() => h1.classList.remove('sg-glitching'), 300);
  }, 9000 + Math.random() * 5000);
  // typed terminal
  const term = root.querySelector('#sgHeroTerm');
  if (term && !term.dataset.done) {
    term.dataset.done = '1';
    const lines = JSON.parse(term.dataset.lines);
    let li = 0;
    const typeLine = () => {
      if (li >= lines.length) return;
      const line = lines[li++];
      const p = document.createElement('p');
      if (!line.startsWith('>')) p.classList.add('is-out');
      term.appendChild(p);
      let ci = 0;
      const tick = () => {
        p.textContent = line.slice(0, ++ci);
        if (ci < line.length) setTimeout(tick, 14);
        else setTimeout(typeLine, 160);
      };
      tick();
    };
    setTimeout(typeLine, 300);
  }
  // scroll reveals — section headings decrypt as they come into view
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      if (e.target.classList.contains('sg-h2')) scramble(e.target);
      io.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  root.querySelectorAll('.sg-reveal').forEach((el) => io.observe(el));
  // scroll progress + active nav (single listener survives re-renders)
  if (prevScrollHandler) removeEventListener('scroll', prevScrollHandler);
  const bar = root.querySelector('#sgProgress');
  const links = [...root.querySelectorAll('.sg-nav-links a')];
  const onScroll = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    if (bar) bar.style.width = `${max > 0 ? (h.scrollTop / max) * 100 : 0}%`;
    let active = '';
    ['work', 'experience', 'certs', 'contact'].forEach((id) => {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top < innerHeight * 0.4) active = id;
    });
    links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${active}`));
  };
  prevScrollHandler = onScroll;
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
let prevScrollHandler = null;
let glitchTimer = null;
