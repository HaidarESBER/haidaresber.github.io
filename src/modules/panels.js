// Builds the HTML shown in the slide-in info panel, per section, per language.
import { content, PROJECTS, EXPERIENCE, EDUCATION, CONTACT, CERTS, CERT_DISPLAY, CERT_GROUPS, PARTNERS } from '../data/content.js';
import { isShieldOn } from '../experience/screenDraws.js';

const L = (v, lang) => (v && typeof v === 'object' && ('fr' in v || 'en' in v) ? v[lang] : v);

function timeline(items, lang) {
  return items
    .map(
      (it) => `<div class="tl-item">
        <div class="tl-date">${L(it.date, lang)}</div>
        <div class="tl-role">${L(it.role, lang)}</div>
        <div class="tl-org">${L(it.org, lang)}</div>
      </div>`
    )
    .join('');
}

function projectCard(p, i, lang) {
  const name = lang === 'en' && p.nameEn ? p.nameEn : p.name;
  const links = [
    p.github ? `<a href="${p.github}" target="_blank" rel="noopener" data-cursor>${lang === 'fr' ? 'Code source' : 'Source'} ↗</a>` : '',
    p.live ? `<a href="${p.live}" target="_blank" rel="noopener" data-cursor>${lang === 'fr' ? 'Démo live' : 'Live demo'} ↗</a>` : '',
  ].filter(Boolean).join('');
  return `<div class="proj${p.minor ? ' proj--minor' : ''}">
    <div class="proj__top"><span class="proj__num">${String(i + 1).padStart(2, '0')}</span><h3>${name}</h3></div>
    <p class="proj__kind">${L(p.kind, lang)}</p>
    ${p.img ? `<img class="proj__img" src="${p.img}" alt="${name}" loading="lazy" />` : ''}
    <p class="proj__desc">${L(p.body, lang)}</p>
    ${p.tech ? `<div class="proj__stack">${p.tech.map((s) => `<span>${s}</span>`).join('')}</div>` : ''}
    ${links ? `<div class="proj__links">${links}</div>` : ''}
  </div>`;
}

const statsRow = (stats) =>
  `<div class="stats">${stats.map((s) => `<div><div class="v">${s.v}</div><div class="k">${s.k}</div></div>`).join('')}</div>`;

export function buildPanel(section, lang) {
  const c = content[lang];
  switch (section) {
    case 'about': {
      const a = c.about;
      return `
        <span class="eyebrow">${a.eyebrow}</span>
        <h2>${a.title}</h2>
        <p class="status-pill">● ${c.status}</p>
        <p class="lead">${a.paragraphs[0]}</p>
        <p>${a.paragraphs[1]}</p>
        ${statsRow(a.stats)}
        <div class="facts">${a.facts.map((f) => `<div class="fact"><span>${f.label}</span>${f.value}</div>`).join('')}</div>
        <span class="label">${a.stackLabel}</span>
        ${a.skills.map((s) => `<div class="skill-row"><span>${s.label}</span>${s.items}</div>`).join('')}
        <span class="label">${c.experienceSection.expLabel}</span>
        ${timeline(EXPERIENCE, lang)}
        <span class="label">${c.experienceSection.eduLabel}</span>
        ${timeline(EDUCATION, lang)}`;
    }

    case 'work': {
      const w = c.workSection;
      return `
        <span class="eyebrow">${w.eyebrow}</span>
        <h2>${w.title}</h2>
        <span class="label">${w.featuredLabel}</span>
        ${w.featured.map((f) => `
          <div class="feat">
            <span class="feat__tag">${f.tag}</span>
            <h3>${f.name}</h3>
            ${f.img ? `<img class="proj__img" src="${f.img}" alt="${f.name}" loading="lazy" />` : ''}
            <p class="proj__desc">${f.body}</p>
            <p class="feat__meta">${f.meta}</p>
            ${f.goto ? `<button class="pbtn pbtn--sm" data-goto="${f.goto}" data-cursor>${lang === 'fr' ? 'Voir la recherche' : 'See the research'} →</button>` : ''}
            ${f.href ? `<a class="pbtn pbtn--sm" href="${f.href}" target="_blank" rel="noopener" data-cursor>${f.name} ↗</a>` : ''}
          </div>`).join('')}
        <span class="label">${w.projectsLabel}</span>
        ${PROJECTS.map((p, i) => projectCard(p, i, lang)).join('')}`;
    }

    case 'research': {
      const r = c.researchSection;
      return `
        <span class="eyebrow">${r.eyebrow}</span>
        <h2>${r.title}</h2>
        <p class="proj__num" style="color:var(--amber)">${r.subtitle}</p>
        <p class="lead" style="font-size:1rem;font-style:italic">${r.fullTitle}</p>
        <p>${r.body}</p>
        ${statsRow(r.stats)}
        <span class="label">${r.demo.label}</span>
        <div class="demo-box">
          <button class="pbtn${isShieldOn() ? '' : ' pbtn--solid'}" data-shield data-cursor>${isShieldOn() ? r.demo.deactivate : r.demo.activate}</button>
          <p class="demo-status${isShieldOn() ? ' is-on' : ''}">${isShieldOn() ? r.demo.obfuscated : r.demo.detectable}</p>
        </div>
        <span class="label">${r.keywordsLabel}</span>
        <div class="tags">${r.topics.map((k) => `<span class="tag">${k}</span>`).join('')}</div>
        <div class="btn-row">
          ${r.links.map((l) => `<a class="pbtn${l.solid ? ' pbtn--solid' : ''}" href="${l.href}" target="_blank" rel="noopener" data-cursor>${l.label} ↗</a>`).join('')}
        </div>`;
    }

    case 'certs': {
      const s = c.certsSection;
      const groups = ['cisco', 'nasa', 'other'];
      return `
        <span class="eyebrow">${s.eyebrow}</span>
        <h2>${s.title}</h2>
        <p>${s.intro}</p>
        <div class="stats"><div><div class="v">${CERT_DISPLAY}</div><div class="k">${s.countLabel}</div></div></div>
        ${groups.map((g) => {
          const items = CERTS.filter((x) => x.group === g);
          const head = CERT_GROUPS[g] || s.othersLabel;
          return `
          <div class="proj">
            <div class="proj__top"><span class="proj__num">◆</span><h3>${head}</h3></div>
            <div class="proj__stack">${items.map((i) => `<span>${i.featured ? '★ ' : '✓ '}${i.title}${i.count ? ` ×${i.count}` : ''}${i.issuer ? ` — ${i.issuer}` : ''}</span>`).join('')}</div>
          </div>`;
        }).join('')}
        <span class="label">${s.partnersLabel}</span>
        <div class="tags">${PARTNERS.map((p) => `<span class="tag">${p}</span>`).join('')}</div>`;
    }

    case 'laptop': {
      const s = c.laptopSection;
      return `
        <span class="eyebrow">${s.eyebrow}</span>
        <h2>${s.title}</h2>
        <p class="lead">${s.body}</p>
        ${s.parts.map((p) => `
          <div class="proj">
            <div class="proj__top"><span class="proj__num" style="font-size:1.2rem">${p.icon}</span><h3 style="font-size:1.02rem">${p.name}</h3></div>
            <p class="proj__desc">${p.desc}</p>
          </div>`).join('')}
        <p style="font-size:0.9rem;color:var(--text-3);margin-top:1rem">${s.note}</p>`;
    }

    case 'infra': {
      const s = c.infraSection;
      return `
        <span class="eyebrow">${s.eyebrow}</span>
        <h2>${s.title}</h2>
        <p class="lead">${s.body}</p>
        <span class="label">${s.servicesLabel}</span>
        <div class="proj__stack" style="margin-bottom:1.2rem">${s.services.map((i) => `<span>▸ ${i}</span>`).join('')}</div>
        <p style="font-size:0.9rem;color:var(--text-3)">${s.note}</p>
        <div class="btn-row">
          <button class="pbtn" data-goto="monitors" data-cursor>${c.workSection.title} →</button>
        </div>`;
    }

    case 'extras': {
      const s = c.extrasSection;
      return `
        <span class="eyebrow">${s.eyebrow}</span>
        <h2>${s.title}</h2>
        ${s.facts.map((f) => `
          <div class="proj">
            <div class="proj__top"><span class="proj__num" style="font-size:1.2rem">${f.icon}</span><h3 style="font-size:1.05rem">${f.label}</h3></div>
            <p class="proj__desc">${f.value}</p>
          </div>`).join('')}`;
    }

    case 'contact':
      return `
        <span class="eyebrow">${c.contact.eyebrow}</span>
        <h2>${c.contact.title}</h2>
        <p class="status-pill">● ${c.status}</p>
        <p>${c.contact.body}</p>
        <a class="mail-big" href="mailto:${CONTACT.email}" data-cursor>${CONTACT.email}</a>
        <p>${c.contact.phoneLabel} — <span class="phone-val">${CONTACT.phoneMask}</span>
          <button class="reveal-btn" data-reveal data-cursor>${c.contact.reveal}</button> · ${CONTACT.location}</p>
        <div class="btn-row">
          <a class="pbtn" href="${CONTACT.github}" target="_blank" rel="noopener" data-cursor>GitHub ↗</a>
          <a class="pbtn" href="${CONTACT.linkedin}" target="_blank" rel="noopener" data-cursor>LinkedIn ↗</a>
          <a class="pbtn" href="${CONTACT.researchgate}" target="_blank" rel="noopener" data-cursor>ResearchGate ↗</a>
          <a class="pbtn" href="${CONTACT.cojeco}" target="_blank" rel="noopener" data-cursor>CoJeCo ↗</a>
        </div>`;

    default:
      return '';
  }
}
