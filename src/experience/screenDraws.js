// 2D canvas painters used as live textures on the room's screens.
// Each returns its canvas; callers wrap it in a THREE.CanvasTexture.

// Canvases are rendered at 2x and drawn with a scaled context so the
// textures stay crisp when the camera zooms in on a screen.
function makeCanvas(w, h, scale = 2) {
  const c = document.createElement('canvas');
  c.width = w * scale; c.height = h * scale;
  c.getContext('2d').scale(scale, scale);
  return c;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---- Code editor (laptop) ----
export function drawCode(t = 0) {
  const c = makeCanvas(640, 400);
  const x = c.getContext('2d');
  x.fillStyle = '#0d1117'; x.fillRect(0, 0, 640, 400);
  x.fillStyle = '#161b22'; x.fillRect(0, 0, 640, 30);
  ['#ff5f56', '#ffbd2e', '#27c93f'].forEach((col, i) => {
    x.beginPath(); x.arc(18 + i * 22, 15, 6, 0, Math.PI * 2); x.fillStyle = col; x.fill();
  });
  x.fillStyle = '#8b949e'; x.font = '13px monospace';
  x.fillText('phaseshield.py — haidar@vannes', 110, 20);
  x.fillStyle = '#161b22'; x.fillRect(0, 30, 40, 370);

  const S = { kw: '#ff7b72', fn: '#d2a8ff', str: '#a5d6ff', cm: '#6e7681', pl: '#79c0ff', op: '#f2cc60' };
  const lines = [
    [['kw', 'import '], ['pl', 'numpy '], ['kw', 'as '], ['fn', 'np']],
    [['kw', 'from '], ['pl', 'phaseshield '], ['kw', 'import '], ['fn', 'Perturb']],
    [],
    [['cm', '# adversarial CSI perturbation']],
    [['kw', 'def '], ['fn', 'shield'], ['op', '('], ['pl', 'csi'], ['op', ', '], ['pl', 'eps'], ['op', '=0.03):']],
    [['op', '    '], ['pl', 'grad'], ['op', ' = '], ['fn', 'fgsm'], ['op', '(csi)']],
    [['op', '    '], ['kw', 'return '], ['pl', 'csi'], ['op', ' + '], ['pl', 'eps'], ['op', ' * np.'], ['fn', 'sign'], ['op', '(grad)']],
    [],
    [['cm', '# fullstack · security · AI']],
    [['kw', 'while '], ['fn', 'True'], ['op', ':']],
    [['op', '    '], ['fn', 'build'], ['op', '(), '], ['fn', 'research'], ['op', '()']],
  ];
  lines.forEach((ln, i) => {
    const y = 56 + i * 30;
    x.fillStyle = '#30363d'; x.font = '12px monospace';
    x.fillText(String(i + 1).padStart(2, ' '), 8, y);
    let px = 50;
    ln.forEach(([col, txt]) => { x.fillStyle = S[col] || col; x.font = '15px monospace'; x.fillText(txt, px, y); px += x.measureText(txt).width; });
  });
  // blinking cursor
  if (Math.floor(t * 1.5) % 2 === 0) { x.fillStyle = '#5ce1e6'; x.fillRect(50, 56 + lines.length * 30 - 13, 8, 16); }
  return c;
}

// ---- App dashboard (a monitor): CoJeCo ----
export function drawCoJeCo(t = 0) {
  const c = makeCanvas(640, 400);
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 400);
  g.addColorStop(0, '#0a0a14'); g.addColorStop(1, '#101524');
  x.fillStyle = g; x.fillRect(0, 0, 640, 400);
  x.fillStyle = '#7c9cff'; x.font = 'bold 28px sans-serif'; x.fillText('CoJeCo', 30, 56);
  x.fillStyle = '#ffffff66'; x.font = '13px sans-serif'; x.fillText('Collectif de Jeunes Connectés · cojeco.fr', 30, 78);
  const cards = [['Partenaires', '4', '#5ce1e6'], ['Fondé', '2025', '#7c9cff'], ['Mission', '100%', '#ff7a45']];
  cards.forEach((cd, i) => {
    const cx = 30 + i * 195;
    x.fillStyle = '#ffffff0d'; rr(x, cx, 110, 175, 110, 12); x.fill();
    x.fillStyle = cd[2]; x.font = 'bold 34px sans-serif'; x.fillText(cd[1], cx + 18, 170);
    x.fillStyle = '#ffffff99'; x.font = '13px sans-serif'; x.fillText(cd[0], cx + 18, 196);
  });
  // animated bar chart
  x.fillStyle = '#ffffff0d'; rr(x, 30, 250, 580, 120, 12); x.fill();
  for (let i = 0; i < 12; i++) {
    const h = 20 + (Math.sin(i * 0.7 + t) * 0.5 + 0.5) * 70;
    x.fillStyle = i % 2 ? '#5ce1e6aa' : '#7c9cffaa';
    rr(x, 52 + i * 46, 360 - h, 30, h, 4); x.fill();
  }
  return c;
}

// ---- App dashboard (a monitor): Ethical AI search ----
export function drawAISearch(t = 0) {
  const c = makeCanvas(640, 400);
  const x = c.getContext('2d');
  x.fillStyle = '#0b0e14'; x.fillRect(0, 0, 640, 400);
  x.fillStyle = '#5ce1e6'; x.font = 'bold 22px sans-serif'; x.fillText('Ethical AI · Search', 30, 50);
  // search bar
  x.fillStyle = '#ffffff11'; rr(x, 30, 72, 580, 46, 23); x.fill();
  x.fillStyle = '#5ce1e6'; x.font = '16px monospace';
  const q = 'how does WiFi CSI sensing work?';
  const shown = q.slice(0, Math.min(q.length, Math.floor((t * 8) % (q.length + 8))));
  x.fillText('> ' + shown, 50, 102);
  // streaming answer lines
  x.fillStyle = '#a6a8b6'; x.font = '14px sans-serif';
  const ans = ['Channel State Information captures how WiFi', 'signals reflect off bodies in a space — enabling', 'passive human sensing. PhaseShield perturbs the', 'CSI to protect privacy against such detection…'];
  ans.forEach((l, i) => { x.globalAlpha = Math.min(1, Math.max(0, (t * 1.2) - i * 0.8)); x.fillText(l, 30, 160 + i * 30); });
  x.globalAlpha = 1;
  // model chips
  ['llama3', 'ollama', 'searxng'].forEach((m, i) => {
    x.fillStyle = '#ff7a4533'; rr(x, 30 + i * 110, 300, 96, 30, 15); x.fill();
    x.fillStyle = '#ff7a45'; x.font = '13px monospace'; x.fillText(m, 44 + i * 110, 320);
  });
  return c;
}

// ---- Retro arcade screen ----
export function drawArcade(t = 0) {
  const c = makeCanvas(360, 460);
  const x = c.getContext('2d');
  x.fillStyle = '#05030f'; x.fillRect(0, 0, 360, 460);
  // starfield
  for (let i = 0; i < 40; i++) {
    const sy = (i * 53 + t * 60) % 460;
    x.fillStyle = i % 5 === 0 ? '#5ce1e6' : '#ffffff55';
    x.fillRect((i * 71) % 360, sy, 2, 2);
  }
  // title
  x.fillStyle = '#ff7a45'; x.font = 'bold 30px monospace'; x.textAlign = 'center';
  x.fillText('HAIDAR', 180, 70);
  x.fillStyle = '#5ce1e6'; x.font = 'bold 18px monospace';
  x.fillText('· ARCADE ·', 180, 96);
  // invaders grid
  const rows = 3, cols = 6;
  for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) {
    const ox = 60 + col * 42 + Math.sin(t * 1.5) * 12;
    const oy = 150 + r * 40;
    x.fillStyle = ['#5ce1e6', '#9d7cff', '#ff7a45'][r];
    x.fillRect(ox, oy, 22, 16);
    x.clearRect(ox + 4, oy + 4, 4, 4); x.clearRect(ox + 14, oy + 4, 4, 4);
  }
  // player ship
  const px = 180 + Math.sin(t * 2) * 90;
  x.fillStyle = '#27c93f'; x.beginPath(); x.moveTo(px, 400); x.lineTo(px - 16, 420); x.lineTo(px + 16, 420); x.closePath(); x.fill();
  // bullet
  const by = 400 - ((t * 300) % 240);
  x.fillStyle = '#fff'; x.fillRect(px - 1, by, 3, 12);
  // insert coin blink
  if (Math.floor(t * 1.5) % 2 === 0) { x.fillStyle = '#ffbd2e'; x.font = '14px monospace'; x.fillText('INSERT COIN', 180, 448); }
  x.textAlign = 'left';
  return c;
}

// ---- Whiteboard: PhaseShield signal diagram (live demo togglable) ----
let shieldOn = false;
export const setShield = (on) => { shieldOn = on; };
export const isShieldOn = () => shieldOn;

export function drawWhiteboard(t = 0) {
  const c = makeCanvas(700, 460);
  const x = c.getContext('2d');
  x.fillStyle = '#e8e3d4'; x.fillRect(0, 0, 700, 460);
  x.strokeStyle = '#1a1a22'; x.fillStyle = '#1a1a22';
  x.font = 'bold 30px sans-serif'; x.fillText('PhaseShield', 36, 56);
  x.font = '16px sans-serif'; x.fillStyle = '#555';
  x.fillText('adversarial WiFi-CSI privacy', 36, 84);
  // demo state stamp
  x.font = 'bold 15px monospace';
  if (shieldOn) { x.fillStyle = '#1c7c3f'; x.fillText('● SHIELD ON — sensing neutralised', 380, 56); }
  else { x.fillStyle = '#b3402a'; x.fillText('○ shield off — presence detectable', 380, 56); }

  // transmitter -> waves -> receiver
  x.fillStyle = '#1a1a22'; x.font = '14px monospace';
  x.fillText('TX', 70, 250); x.fillText('RX', 600, 250);
  x.strokeStyle = '#1a1a22'; x.lineWidth = 3;
  x.beginPath(); x.moveTo(85, 240); x.lineTo(85, 200); x.stroke();
  x.beginPath(); x.moveTo(615, 240); x.lineTo(615, 200); x.stroke();
  // clean wave (blue) + adversarial perturbation (orange, only when the shield runs)
  x.lineWidth = 2.5;
  x.strokeStyle = '#2b6cff';
  x.beginPath();
  for (let px = 100; px <= 600; px += 4) {
    const phase = (px - 100) * 0.05 + t * 2;
    const breathing = shieldOn ? 0 : Math.sin(t * 1.2) * 9 * Math.sin((px - 100) * 0.02); // "human" envelope
    const py = 200 + Math.sin(phase) * 26 + breathing;
    px === 100 ? x.moveTo(px, py) : x.lineTo(px, py);
  }
  x.stroke();
  if (shieldOn) {
    x.strokeStyle = '#ff6a2b';
    x.beginPath();
    for (let px = 100; px <= 600; px += 4) {
      const phase = (px - 100) * 0.05 + t * 2;
      const noise = Math.sin(px * 0.31 + t * 7) * 14 + Math.sin(px * 0.11 - t * 3) * 8;
      const py = 200 + Math.sin(phase) * 26 + noise;
      px === 100 ? x.moveTo(px, py) : x.lineTo(px, py);
    }
    x.stroke();
    x.fillStyle = '#ff6a2b'; x.font = '13px sans-serif'; x.fillText('+ perturbation adversariale (FGSM / PGD)', 260, 320);
  } else {
    x.fillStyle = '#b3402a'; x.font = '13px sans-serif'; x.fillText('breathing / motion signature visible in CSI', 260, 320);
  }
  x.fillStyle = '#2b6cff'; x.font = '13px sans-serif'; x.fillText('CSI amplitude', 300, 150);
  // formula box
  x.strokeStyle = '#1a1a22'; x.lineWidth = 1.5; x.strokeRect(36, 360, 360, 60);
  x.fillStyle = '#1a1a22'; x.font = '18px monospace'; x.fillText("x' = x + ε · sign(∇ₓ J)", 56, 398);
  return c;
}
