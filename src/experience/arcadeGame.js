// A self-contained Space Invaders mini-game. Draws to a 360x460 canvas that
// doubles as the arcade's 3D screen texture AND the playable CRT overlay.
const W = 360, H = 460;

export class ArcadeGame {
  constructor(canvas, { onExit } = {}) {
    this.canvas = canvas;
    this.canvas.width = W; this.canvas.height = H;
    this.ctx = this.canvas.getContext('2d');
    this.onExit = onExit || (() => {});
    this.enabled = false;          // input active (overlay open)
    this.keys = { left: false, right: false };
    this.facts = ['HAIDAR · ARCADE'];
    this.factIndex = 0; this.factTimer = 0;
    this.best = Number(localStorage.getItem('arcadeBest') || 0);
    this.stars = Array.from({ length: 36 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: Math.random() > 0.7 ? 2 : 1 }));
    this._toAttract();
    this._bind();
  }

  setFacts(facts) { if (facts && facts.length) this.facts = facts; }

  _toAttract() {
    this.mode = 'attract'; this.t = 0;
    this.ship = { x: W / 2, cd: 0 };
    this.bullets = []; this.eBullets = []; this.invaders = [];
    this.score = 0; this.lives = 3; this.wave = 1;
    this._spawnWave();
  }

  start() { this.enabled = true; if (this.mode !== 'play') this._toAttract(); this.draw(); }
  stop() { this.enabled = false; this._toAttract(); }

  _spawnWave() {
    this.invaders = [];
    const cols = 6, rows = 3;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
      this.invaders.push({ x: 50 + c * 44, y: 70 + r * 38, alive: true, kind: r });
    this.invDir = 1; this.invStep = 0; this.invInterval = Math.max(0.18, 0.6 - this.wave * 0.05);
  }

  _begin() { this.mode = 'play'; this.score = 0; this.lives = 3; this.wave = 1; this.bullets = []; this.eBullets = []; this.ship.x = W / 2; this._spawnWave(); }

  // ---- input ----
  _bind() {
    this._kd = (e) => {
      if (!this.enabled) return;
      const k = e.key;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', 'Spacebar'].includes(k)) e.preventDefault();
      if (k === 'ArrowLeft') this.keys.left = true;
      else if (k === 'ArrowRight') this.keys.right = true;
      else if (k === ' ' || k === 'Spacebar' || k === 'Enter') { (this.mode === 'play') ? this._fire() : this._begin(); }
      else if (k === 'Escape') this.onExit();
    };
    this._ku = (e) => {
      if (e.key === 'ArrowLeft') this.keys.left = false;
      if (e.key === 'ArrowRight') this.keys.right = false;
    };
    addEventListener('keydown', this._kd);
    addEventListener('keyup', this._ku);
  }
  press(dir, down) { if (dir === 'left') this.keys.left = down; if (dir === 'right') this.keys.right = down; }
  action() { (this.mode === 'play') ? this._fire() : this._begin(); }
  _fire() { if (this.ship.cd <= 0) { this.bullets.push({ x: this.ship.x, y: 402 }); this.ship.cd = 0.34; } }

  // ---- update ----
  update(dt) {
    dt = Math.min(dt, 0.05);
    this.t += dt;
    this.factTimer += dt; if (this.factTimer > 3) { this.factTimer = 0; this.factIndex = (this.factIndex + 1) % this.facts.length; }
    for (const s of this.stars) { s.y += (10 + s.s * 14) * dt; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } }

    if (this.mode === 'play') this._sim(dt);
    else { // attract: invaders drift, ghost ship sweeps
      this.invStep += dt;
      if (this.invStep > 0.5) { this.invStep = 0; this.invDir *= (Math.random() > 0.5 ? 1 : -1); }
      this.ship.x = W / 2 + Math.sin(this.t) * 110;
    }
    this.draw();
  }

  _sim(dt) {
    const sp = 250;
    if (this.keys.left) this.ship.x -= sp * dt;
    if (this.keys.right) this.ship.x += sp * dt;
    this.ship.x = Math.max(20, Math.min(W - 20, this.ship.x));
    this.ship.cd -= dt;

    this.bullets.forEach((b) => (b.y -= 380 * dt));
    this.bullets = this.bullets.filter((b) => b.y > -10);
    this.eBullets.forEach((b) => (b.y += 220 * dt));
    this.eBullets = this.eBullets.filter((b) => b.y < H + 10);

    // invader march
    this.invStep += dt;
    const alive = this.invaders.filter((i) => i.alive);
    const interval = Math.max(0.08, this.invInterval * (alive.length / 18));
    if (this.invStep >= interval) {
      this.invStep = 0;
      let hitEdge = false;
      alive.forEach((i) => { if ((i.x > W - 30 && this.invDir > 0) || (i.x < 30 && this.invDir < 0)) hitEdge = true; });
      if (hitEdge) { this.invDir *= -1; alive.forEach((i) => (i.y += 16)); }
      else alive.forEach((i) => (i.x += 14 * this.invDir));
      // random invader fires
      if (alive.length && Math.random() < 0.6) { const s = alive[Math.floor(Math.random() * alive.length)]; this.eBullets.push({ x: s.x, y: s.y + 10 }); }
    }

    // collisions: player bullets vs invaders
    for (const b of this.bullets) for (const inv of this.invaders) {
      if (inv.alive && Math.abs(b.x - inv.x) < 16 && Math.abs(b.y - inv.y) < 12) {
        inv.alive = false; b.y = -99; this.score += 10 * (3 - inv.kind + 1);
      }
    }
    this.bullets = this.bullets.filter((b) => b.y > -10);

    // enemy bullets vs ship
    for (const b of this.eBullets) if (Math.abs(b.x - this.ship.x) < 16 && Math.abs(b.y - 412) < 14) {
      b.y = H + 99; this.lives--; if (this.lives <= 0) this._end();
    }
    this.eBullets = this.eBullets.filter((b) => b.y < H + 10);

    // wave cleared / invaders reached bottom
    if (this.invaders.every((i) => !i.alive)) { this.wave++; this._spawnWave(); }
    if (this.invaders.some((i) => i.alive && i.y > 388)) this._end();
  }

  _end() {
    this.mode = 'over';
    if (this.score > this.best) { this.best = this.score; localStorage.setItem('arcadeBest', String(this.best)); }
  }

  // ---- draw ----
  draw() {
    const x = this.ctx;
    x.fillStyle = '#05030f'; x.fillRect(0, 0, W, H);
    for (const s of this.stars) { x.fillStyle = s.s > 1 ? '#5ce1e6' : '#ffffff55'; x.fillRect(s.x, s.y, s.s, s.s); }

    // HUD
    x.fillStyle = '#5ce1e6'; x.font = '12px "JetBrains Mono", monospace'; x.textAlign = 'left';
    x.fillText('SCORE ' + String(this.score).padStart(5, '0'), 10, 20);
    x.textAlign = 'right'; x.fillStyle = '#ff7a45'; x.fillText('HI ' + String(this.best).padStart(5, '0'), W - 10, 20);
    x.textAlign = 'left'; x.fillStyle = '#27c93f';
    for (let i = 0; i < this.lives; i++) this._ship(10 + i * 22, 34, 0.6);

    // invaders
    const colors = ['#5ce1e6', '#9d7cff', '#ff7a45'];
    this.invaders.forEach((inv) => { if (inv.alive) this._invader(inv.x, inv.y, colors[inv.kind], this.t); });

    // bullets
    x.fillStyle = '#ffffff'; this.bullets.forEach((b) => x.fillRect(b.x - 1.5, b.y, 3, 11));
    x.fillStyle = '#ffbd2e'; this.eBullets.forEach((b) => x.fillRect(b.x - 1.5, b.y, 3, 9));

    // ship
    if (this.mode !== 'over') this._ship(this.ship.x, 412, 1);

    // overlays
    x.textAlign = 'center';
    if (this.mode === 'attract') {
      x.fillStyle = '#ff7a45'; x.font = 'bold 30px "Space Grotesk", monospace'; x.fillText('HAIDAR', W / 2, 232);
      x.fillStyle = '#5ce1e6'; x.font = '16px "JetBrains Mono", monospace'; x.fillText('· INVADERS ·', W / 2, 260);
      if (Math.floor(this.t * 1.5) % 2 === 0) { x.fillStyle = '#fff'; x.font = '14px "JetBrains Mono", monospace'; x.fillText('PRESS SPACE / TAP FIRE', W / 2, 312); }
      x.fillStyle = '#8a8d9a'; x.font = '10px "JetBrains Mono", monospace';
      this._wrap(this.facts[this.factIndex] || '', W / 2, 432, 320, 13);
    } else if (this.mode === 'over') {
      x.fillStyle = '#ff3b30'; x.font = 'bold 30px "Space Grotesk", monospace'; x.fillText('GAME OVER', W / 2, 200);
      x.fillStyle = '#fff'; x.font = '14px "JetBrains Mono", monospace'; x.fillText('SCORE ' + this.score, W / 2, 234);
      if (Math.floor(this.t * 1.5) % 2 === 0) { x.fillStyle = '#5ce1e6'; x.fillText('PRESS SPACE TO REPLAY', W / 2, 280); }
    }
    x.textAlign = 'left';
  }

  _ship(cx, cy, sc) {
    const x = this.ctx; x.fillStyle = '#27c93f';
    x.fillRect(cx - 14 * sc, cy + 6 * sc, 28 * sc, 6 * sc);
    x.fillRect(cx - 8 * sc, cy, 16 * sc, 8 * sc);
    x.fillRect(cx - 2 * sc, cy - 6 * sc, 4 * sc, 8 * sc);
  }
  _invader(cx, cy, col, t) {
    const x = this.ctx; x.fillStyle = col; const f = Math.floor(t * 3) % 2;
    x.fillRect(cx - 12, cy - 6, 24, 12);
    x.clearRect(cx - 8, cy - 3, 4, 4); x.clearRect(cx + 4, cy - 3, 4, 4);
    x.fillRect(cx - 12 - f * 2, cy + 6, 5, 4); x.fillRect(cx + 7 + f * 2, cy + 6, 5, 4);
  }
  _wrap(text, cx, y, maxW, lh) {
    const x = this.ctx; const words = text.split(' '); let line = '', yy = y;
    for (const w of words) { if (x.measureText(line + w).width > maxW) { x.fillText(line, cx, yy); line = w + ' '; yy += lh; } else line += w + ' '; }
    x.fillText(line, cx, yy);
  }

  dispose() { removeEventListener('keydown', this._kd); removeEventListener('keyup', this._ku); }
}
