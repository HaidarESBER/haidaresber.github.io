// Builds the HTML shown in the slide-in info panel, per section, per language.
import { content, PROJECTS, EXPERIENCE, EDUCATION, SKILLS, CONTACT, CERTIFICATIONS, PARTNERS, RESEARCH, COJECO } from '../data/content.js';

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

function projectCard(p, lang) {
  const links = p.links
    .map((lnk) => `<a href="${lnk.href}" target="_blank" rel="noopener" data-cursor>${L(lnk.label, lang)} ↗</a>`)
    .join('');
  return `<div class="proj" style="--accent:${p.accent}">
    <div class="proj__top"><span class="proj__num">${p.num}</span><h3>${L(p.title, lang)}</h3></div>
    <p class="proj__desc">${L(p.desc, lang)}</p>
    <div class="proj__stack">${p.stack.map((s) => `<span>${s}</span>`).join('')}</div>
    ${links ? `<div class="proj__links">${links}</div>` : ''}
  </div>`;
}

export function buildPanel(section, lang) {
  const c = content[lang];
  switch (section) {
    case 'about':
      return `
        <span class="eyebrow">${c.about.eyebrow}</span>
        <h2>${c.about.title}</h2>
        <p class="lead">${c.about.p1}</p>
        <p>${c.about.p2}</p>
        <span class="label">${c.about.stackLabel}</span>
        <div class="tags">${SKILLS.map((s) => `<span class="tag">${s}</span>`).join('')}</div>
        <span class="label">${c.about.langLabel}</span>
        <p>${c.about.languages}</p>
        <span class="label">${c.experienceSection.expLabel}</span>
        ${timeline(EXPERIENCE, lang)}
        <span class="label">${c.experienceSection.eduLabel}</span>
        ${timeline(EDUCATION, lang)}
        <span class="label">CoJeCo</span>
        <p class="proj__num" style="color:var(--violet)">${L(COJECO.founded, lang)}</p>
        <div class="tags">${COJECO.legal.map((x) => `<span class="tag">${x}</span>`).join('')}</div>`;

    case 'work':
      return `
        <span class="eyebrow">${c.workSection.eyebrow}</span>
        <h2>${c.workSection.title}</h2>
        ${PROJECTS.map((p) => projectCard(p, lang)).join('')}`;

    case 'research': {
      const r = c.researchSection;
      return `
        <span class="eyebrow">${r.eyebrow}</span>
        <h2>${r.title}</h2>
        <p class="proj__num" style="color:var(--amber)">${RESEARCH.venue}</p>
        <p class="lead" style="font-size:1rem;font-style:italic">${RESEARCH.fullTitle}</p>
        <p>${r.body}</p>
        <div class="stats">${r.stats.map((s) => `<div><div class="v">${s.v}</div><div class="k">${s.k}</div></div>`).join('')}</div>
        <span class="label">${lang === 'fr' ? 'Mots-clés' : 'Keywords'}</span>
        <div class="tags">${RESEARCH.keywords.map((k) => `<span class="tag">${k}</span>`).join('')}</div>
        <div class="btn-row">
          <a class="pbtn pbtn--solid" href="${CONTACT.zenodo}" target="_blank" rel="noopener" data-cursor>Zenodo ↗</a>
          <a class="pbtn" href="${CONTACT.hal}" target="_blank" rel="noopener" data-cursor>HAL Science ↗</a>
          <a class="pbtn" href="${CONTACT.github}" target="_blank" rel="noopener" data-cursor>Code ↗</a>
        </div>`;
    }

    case 'certs': {
      const s = c.certsSection;
      return `
        <span class="eyebrow">${s.eyebrow}</span>
        <h2>${s.title}</h2>
        ${CERTIFICATIONS.map((g) => `
          <div class="proj" style="--accent:${g.color}">
            <div class="proj__top"><span class="proj__num">◆</span><h3>${g.org}</h3></div>
            <p class="proj__desc">${L(g.sub, lang)}</p>
            <div class="proj__stack">${g.items.map((i) => `<span>✓ ${L(i, lang)}</span>`).join('')}</div>
          </div>`).join('')}
        <span class="label">${s.partnersLabel}</span>
        <div class="tags">${PARTNERS.map((p) => `<span class="tag">${p}</span>`).join('')}</div>`;
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
        <p>${c.contact.body}</p>
        <a class="mail-big" href="mailto:${CONTACT.email}" data-cursor>${CONTACT.email}</a>
        <p>${CONTACT.phone} · ${CONTACT.location}</p>
        <div class="btn-row">
          <a class="pbtn" href="${CONTACT.github}" target="_blank" rel="noopener" data-cursor>GitHub ↗</a>
          <a class="pbtn" href="${CONTACT.linkedin}" target="_blank" rel="noopener" data-cursor>LinkedIn ↗</a>
          <a class="pbtn" href="${CONTACT.cojeco}" target="_blank" rel="noopener" data-cursor>CoJeCo ↗</a>
        </div>`;

    default:
      return '';
  }
}
