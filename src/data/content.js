// Bilingual content source of truth for the portfolio.
// Every visible string lives here so the FR/EN toggle stays trivial.

export const CONTACT = {
  email: 'haidar@laboccaz.com',
  phone: '+33 7 49 03 36 79',
  phoneHref: '+33749033679',
  github: 'https://github.com/HaidarESBER',
  linkedin: 'https://linkedin.com/in/haidaresber',
  cojeco: 'https://cojeco.fr',
  zenodo: 'https://zenodo.org',
  hal: 'https://hal.science',
  location: 'Vannes, France',
};

export const content = {
  fr: {
    loader: { enter: 'Entrer dans la pièce' },
    hint: { text: 'Glissez pour explorer · cliquez les objets' },
    panel: { back: 'Retour' },
    arcade: { hint: '← → bouger · ESPACE tirer · ÉCHAP quitter' },
    nav: { about: 'À propos', work: 'Projets', research: 'Recherche', certs: 'Certifs', contact: 'Contact' },
    hero: {
      eyebrow: 'Vannes, France · 🇱🇧 → 🇫🇷',
      name: 'Haidar Esber',
      roles: [
        'Développeur Fullstack',
        'Chercheur en Cybersécurité',
        "Concepteur d'Applications",
        'Fondateur de CoJeCo',
      ],
      tagline:
        "Je construis des systèmes — du web aux couches physiques. Recherche en sécurité, IA et réseaux.",
      cta: 'Voir mes projets',
      ctaContact: 'Me contacter',
      scroll: 'défiler',
    },
    about: {
      eyebrow: 'À propos',
      title: 'Développeur & chercheur',
      p1: "À 24 ans, je suis développeur Fullstack et chercheur indépendant basé à Vannes — originaire du Liban. Mon parcours couvre les architectures logicielles, les systèmes distribués et l'ingénierie réseau, du web aux couches physiques.",
      p2: "En 2026, j'ai publié PhaseShield, un framework adversarial pour protéger la vie privée face à la détection passive via WiFi CSI. J'ai aussi fondé CoJeCo, une association pour l'éducation et l'inclusion numérique.",
      stackLabel: 'Stack technique',
      langLabel: 'Langues',
      languages: 'Français · Anglais · Arabe — C2',
      statusLabel: 'Statut',
      status: 'Ouvert aux opportunités',
    },
    workSection: { eyebrow: 'Projets', title: 'Ce que je construis' },
    researchSection: {
      eyebrow: 'Recherche',
      title: 'PhaseShield',
      subtitle: 'Sécurité de la couche physique · 2026',
      body: "Premier framework adversarial contre la détection passive humaine via WiFi CSI. Quatre algorithmes de perturbation (FGSM, PGD…), étude par simulation, entièrement open source. Publié sur Zenodo et HAL Science (cs.CR / cs.NI).",
      stats: [
        { v: '4', k: 'algorithmes de perturbation' },
        { v: '2', k: 'publications (Zenodo · HAL)' },
        { v: '100%', k: 'open source' },
      ],
    },
    experienceSection: { eyebrow: 'Parcours', title: 'Expérience & formation', expLabel: 'Expérience', eduLabel: 'Formation' },
    infraSection: {
      eyebrow: 'Infra',
      title: 'Le labo réseau',
      body: "Un rack de serveurs à la maison : infrastructure simulée avec supervision Zabbix en temps réel, tunnels OpenVPN et annuaire Active Directory. C'est aussi mon terrain d'expérimentation pour la recherche WiFi CSI — l'antenne n'est pas là pour décorer.",
      servicesLabel: 'Services actifs',
      services: ['Zabbix — supervision', 'OpenVPN — accès distant', 'Active Directory', 'Linux — Debian / Ubuntu', 'Capture WiFi CSI'],
      note: "La supervision réseau fait partie de mes projets — détails dans la section Projets.",
    },
    certsSection: { eyebrow: 'Certifications', title: 'Reconnaissance professionnelle', partnersLabel: 'Partenaires de CoJeCo' },
    extrasSection: {
      eyebrow: 'En coulisses', title: 'Au-delà du code',
      facts: [
        { icon: '🌍', label: 'Origines', value: 'Né au Liban 🇱🇧 — basé à Vannes, France 🇫🇷' },
        { icon: '🗣️', label: 'Langues', value: 'Français · Anglais · Arabe — tous C2' },
        { icon: '🛡️', label: 'Obsession', value: 'La vie privée à la couche physique (WiFi CSI)' },
        { icon: '🤝', label: 'Mission', value: "L'inclusion numérique pour tous via CoJeCo" },
        { icon: '🧩', label: 'Pour le fun', value: 'Rubik\'s cube, arcade rétro & électronique' },
      ],
    },
    contact: {
      eyebrow: 'Contact',
      title: 'Travaillons ensemble',
      body: "Une idée, un poste, une collaboration de recherche ? Ma boîte mail est toujours ouverte.",
      cta: 'Écrivez-moi',
    },
    footer: { rights: 'Conçu & développé par Haidar Esber', back: 'Haut de page' },
  },
  en: {
    loader: { enter: 'Enter the room' },
    hint: { text: 'Drag to explore · click the objects' },
    panel: { back: 'Back' },
    arcade: { hint: '← → move · SPACE shoot · ESC quit' },
    nav: { about: 'About', work: 'Work', research: 'Research', certs: 'Certs', contact: 'Contact' },
    hero: {
      eyebrow: 'Vannes, France · 🇱🇧 → 🇫🇷',
      name: 'Haidar Esber',
      roles: [
        'Fullstack Developer',
        'Cybersecurity Researcher',
        'Application Designer',
        'Founder of CoJeCo',
      ],
      tagline:
        'I build systems — from the web down to the physical layer. Research in security, AI and networks.',
      cta: 'View my work',
      ctaContact: 'Get in touch',
      scroll: 'scroll',
    },
    about: {
      eyebrow: 'About',
      title: 'Developer & researcher',
      p1: 'At 24, I am a Fullstack developer and independent researcher based in Vannes — originally from Lebanon. My background spans software architectures, distributed systems and network engineering, from the web down to the physical layer.',
      p2: 'In 2026 I published PhaseShield, an adversarial framework for privacy protection against passive WiFi CSI sensing. I also founded CoJeCo, an association for digital education and inclusion.',
      stackLabel: 'Tech stack',
      langLabel: 'Languages',
      languages: 'French · English · Arabic — C2',
      statusLabel: 'Status',
      status: 'Open to opportunities',
    },
    workSection: { eyebrow: 'Work', title: 'What I build' },
    researchSection: {
      eyebrow: 'Research',
      title: 'PhaseShield',
      subtitle: 'Physical-layer security · 2026',
      body: 'The first adversarial framework against passive human sensing via WiFi CSI. Four perturbation algorithms (FGSM, PGD…), a simulation-based study, fully open source. Published on Zenodo and HAL Science (cs.CR / cs.NI).',
      stats: [
        { v: '4', k: 'perturbation algorithms' },
        { v: '2', k: 'publications (Zenodo · HAL)' },
        { v: '100%', k: 'open source' },
      ],
    },
    experienceSection: { eyebrow: 'Journey', title: 'Experience & education', expLabel: 'Experience', eduLabel: 'Education' },
    infraSection: {
      eyebrow: 'Infra',
      title: 'The network lab',
      body: "A home server rack: simulated infrastructure with real-time Zabbix monitoring, OpenVPN tunnels and an Active Directory domain. It doubles as my testbed for WiFi CSI research — the antenna is not just for show.",
      servicesLabel: 'Running services',
      services: ['Zabbix — monitoring', 'OpenVPN — remote access', 'Active Directory', 'Linux — Debian / Ubuntu', 'WiFi CSI capture'],
      note: 'Network monitoring is one of my projects — details in the Work section.',
    },
    certsSection: { eyebrow: 'Certifications', title: 'Professional credentials', partnersLabel: 'CoJeCo partners' },
    extrasSection: {
      eyebrow: 'Behind the scenes', title: 'Beyond the code',
      facts: [
        { icon: '🌍', label: 'Roots', value: 'Born in Lebanon 🇱🇧 — based in Vannes, France 🇫🇷' },
        { icon: '🗣️', label: 'Languages', value: 'French · English · Arabic — all C2' },
        { icon: '🛡️', label: 'Obsession', value: 'Privacy at the physical layer (WiFi CSI)' },
        { icon: '🤝', label: 'Mission', value: 'Digital inclusion for everyone through CoJeCo' },
        { icon: '🧩', label: 'For fun', value: "Rubik's cubes, retro arcade & electronics" },
      ],
    },
    contact: {
      eyebrow: 'Contact',
      title: "Let's work together",
      body: 'An idea, a role, a research collaboration? My inbox is always open.',
      cta: 'Say hello',
    },
    footer: { rights: 'Designed & built by Haidar Esber', back: 'Back to top' },
  },
};

export const CERTIFICATIONS = [
  { org: 'Cisco', sub: { fr: 'Networking Academy', en: 'Networking Academy' }, color: '#1ba0d7', items: ['Certified Ethical Hacker', 'Introduction to Cybersecurity', 'Introduction to Modern AI', 'Introduction to Data Science', 'IT Essentials', 'JavaScript Essentials', 'Python Essentials', { fr: '+ 7 autres', en: '+ 7 more' }] },
  { org: 'NASA', sub: { fr: 'Open Science', en: 'Open Science' }, color: '#0b3d91', items: ['Open Science Essentials', 'Science 101'] },
  { org: 'AWS Educate', sub: { fr: 'Amazon Web Services', en: 'Amazon Web Services' }, color: '#ff9900', items: ['Introduction to Generative AI'] },
  { org: 'LVMH', sub: { fr: '2025', en: '2025' }, color: '#b8975a', items: [{ fr: 'Création & Branding', en: 'Creation & Branding' }, { fr: 'Retail & Expérience Client', en: 'Retail & Customer Experience' }] },
  { org: 'Arduino · EFSET', sub: { fr: 'Robotique & Langue', en: 'Robotics & Language' }, color: '#00979d', items: ['Arduino UNO Robotics', 'EFSET English — C2'] },
];

export const PARTNERS = ['Cisco Networking Academy', 'Microsoft', 'LPI — Linux Professional Institute', 'Palo Alto Networks'];

export const RESEARCH = {
  fullTitle: 'PhaseShield: Adversarial Perturbation of WiFi Channel State Information for Privacy-Preserving Passive Sensing Mitigation',
  venue: 'Preprint · 2026 · Zenodo + HAL',
  keywords: ['WiFi sensing', 'CSI privacy', 'OFDM', 'Adversarial perturbation', 'Physical-layer security', 'IEEE 802.11', 'FGSM', 'PGD'],
  algorithms: ['FGSM', 'PGD', 'Random', 'Subcarrier'],
};

export const COJECO = {
  founded: { fr: 'Fondateur & Président · mai 2025 — présent', en: 'Founder & President · May 2025 — present' },
  legal: ['cojeco.fr', 'SIREN 988 619 979', 'RNA W491022051', 'Angers, France'],
};

export const SKILLS = [
  'React', 'Next.js', 'TypeScript', 'Node.js', 'Python', 'PHP',
  'Docker', 'Azure', 'Linux', 'Ollama / LLM', 'SQL', 'WiFi CSI',
  'Zabbix', 'OpenVPN', 'Three.js',
];

// label = visible name; type = which device/visual the card maps to
export const PROJECTS = [
  {
    num: '01',
    tag: { fr: 'Projet', en: 'Project' },
    title: { fr: 'Moteur de recherche IA Éthique', en: 'Ethical AI Search Engine' },
    desc: {
      fr: "Moteur de recherche open source propulsé par des LLMs locaux. Frontend React avec réponses en streaming, intégration SearXNG + DuckDuckGo, chatbot intelligent configurable.",
      en: 'Open-source search engine powered by local LLMs. React frontend with streaming responses, SearXNG + DuckDuckGo integration, configurable intelligent chatbot.',
    },
    stack: ['React', 'Ollama', 'SearXNG', 'Python', 'Streaming'],
    links: [{ label: { fr: 'Code source', en: 'Source' }, href: 'https://github.com/HaidarESBER', icon: 'github' }],
    accent: '#5CE1E6',
  },
  {
    num: '02',
    tag: { fr: 'Projet', en: 'Project' },
    title: { fr: 'Plateforme CoJeCo', en: 'CoJeCo Platform' },
    desc: {
      fr: "Site web complet pour l'association CoJeCo — gestion des ateliers, bénévoles et partenariats institutionnels. Responsive, accessible, full-custom.",
      en: 'Complete website for the CoJeCo association — workshop, volunteer and institutional partnership management. Responsive, accessible, fully custom.',
    },
    stack: ['React', 'Node.js', 'SQL', 'cojeco.fr'],
    links: [{ label: { fr: 'cojeco.fr', en: 'cojeco.fr' }, href: 'https://cojeco.fr', icon: 'link' }],
    accent: '#7C9CFF',
  },
  {
    num: '03',
    tag: { fr: 'Recherche', en: 'Research' },
    title: { fr: 'PhaseShield', en: 'PhaseShield' },
    desc: {
      fr: "Framework adversarial pour la protection de la vie privée face à la détection passive humaine via WiFi CSI. 4 algorithmes de perturbation, étude par simulation, open source.",
      en: 'Adversarial framework for privacy protection against passive human sensing via WiFi CSI. 4 perturbation algorithms, simulation-based study, open source.',
    },
    stack: ['Python', 'WiFi CSI', 'FGSM', 'PGD', 'cs.CR'],
    links: [
      { label: { fr: 'Zenodo', en: 'Zenodo' }, href: 'https://zenodo.org', icon: 'book' },
      { label: { fr: 'HAL Science', en: 'HAL Science' }, href: 'https://hal.science', icon: 'book' },
      { label: { fr: 'Code', en: 'Code' }, href: 'https://github.com/HaidarESBER', icon: 'github' },
    ],
    accent: '#FF7A45',
  },
  {
    num: '04',
    tag: { fr: 'Projet', en: 'Project' },
    title: { fr: 'Migration Laboccaz', en: 'Laboccaz Migration' },
    desc: {
      fr: 'Migration Bubble IO → code conventionnel. Nouvelles fonctionnalités et site vitrine.',
      en: 'Bubble IO to conventional code migration. New features and showcase website.',
    },
    stack: ['Bubble IO', 'Fullstack'],
    links: [],
    accent: '#9D7CFF',
  },
  {
    num: '05',
    tag: { fr: 'Projet', en: 'Project' },
    title: { fr: 'Supervision Réseau', en: 'Network Monitoring' },
    desc: {
      fr: 'Infrastructure simulée : Zabbix + OpenVPN, Active Directory, monitoring temps réel.',
      en: 'Simulated infrastructure: Zabbix + OpenVPN, Active Directory, real-time monitoring.',
    },
    stack: ['Zabbix', 'OpenVPN', 'Linux'],
    links: [],
    accent: '#5CE1E6',
  },
];

export const EXPERIENCE = [
  {
    date: { fr: 'sep 2025 — présent', en: 'Sep 2025 — present' },
    role: { fr: 'Développeur Fullstack & NoCode', en: 'Fullstack & NoCode Developer' },
    org: 'Laboccaz',
  },
  {
    date: { fr: 'mai 2025 — présent', en: 'May 2025 — present' },
    role: { fr: 'Fondateur & Développeur', en: 'Founder & Developer' },
    org: 'CoJeCo — cojeco.fr',
  },
  {
    date: { fr: 'sep 2024 — sep 2025', en: 'Sep 2024 — Sep 2025' },
    role: { fr: 'Développeur & Support IT', en: 'Developer & IT Support' },
    org: { fr: 'Pôle BTS Alternance — Trélazé', en: 'Pôle BTS Alternance — Trélazé' },
  },
];

export const EDUCATION = [
  {
    date: { fr: '2025 — présent', en: '2025 — present' },
    role: { fr: 'Bac+3 Développeur Fullstack', en: "Bachelor's — Fullstack Developer" },
    org: 'EFREI Paris',
  },
  {
    date: { fr: '2025 — présent', en: '2025 — present' },
    role: { fr: 'Learning AI through Visualization', en: 'Learning AI through Visualization' },
    org: 'Columbia University',
  },
  {
    date: { fr: '2024 — 2025', en: '2024 — 2025' },
    role: { fr: 'Bac+2 CDA', en: "Associate's Degree — CDA" },
    org: 'LearnIT by Open Campus',
  },
  {
    date: { fr: '2023 — 2024', en: '2023 — 2024' },
    role: { fr: 'L1 Maths-Informatique', en: 'L1 Maths & Computer Science' },
    org: "Université d'Angers",
  },
];
