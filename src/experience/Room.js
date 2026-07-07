// Builds the procedural 3D room and furniture, returns:
//   group        – THREE.Group to add to the scene
//   screens      – [{texture, draw}] updated every frame
//   interactives – [{name,label,meshes[],focusKey,action}]
//   foci         – { key: {pos, target, panel} } camera focus presets
//   animate(t)   – per-frame motion (LEDs, wifi rings, steam, screens)
import * as THREE from 'three';
import { drawCode, drawCoJeCo, drawAISearch, drawWhiteboard, drawArcade } from './screenDraws.js';

const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);

function labelTexture(text, bg, fg) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 128, 128);
  x.fillStyle = fg; x.font = 'bold 56px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 64, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildRoom() {
  const group = new THREE.Group();
  const screens = [];
  const interactives = [];

  // ---------- Materials ----------
  const M = {
    floor: new THREE.MeshStandardMaterial({ color: 0x14151d, roughness: 0.95, metalness: 0 }),
    wall: new THREE.MeshStandardMaterial({ color: 0x1b1c28, roughness: 1, metalness: 0 }),
    wall2: new THREE.MeshStandardMaterial({ color: 0x191a25, roughness: 1, metalness: 0 }),
    deskTop: new THREE.MeshStandardMaterial({ color: 0x6b4f3a, roughness: 0.6, metalness: 0.05 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x23252f, roughness: 0.35, metalness: 0.85 }),
    plastic: new THREE.MeshStandardMaterial({ color: 0x121319, roughness: 0.5, metalness: 0.2 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x0d0e13, roughness: 0.9 }),
    rug: new THREE.MeshStandardMaterial({ color: 0x202a33, roughness: 1 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.8 }),
    pot: new THREE.MeshStandardMaterial({ color: 0x9d5b3e, roughness: 0.8 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x2f7d4f, roughness: 0.7 }),
    mug: new THREE.MeshStandardMaterial({ color: 0xff7a45, roughness: 0.4 }),
  };
  const screenMat = (canvas, toneMapped = false) => {
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace;
    return { tex, mat: new THREE.MeshBasicMaterial({ map: tex, toneMapped }) };
  };

  // ---------- Shell: floor + two walls ----------
  // subtle dark plank texture so the floor reads as a material, not a void
  const floorCanvas = document.createElement('canvas'); floorCanvas.width = floorCanvas.height = 512;
  (() => {
    const x = floorCanvas.getContext('2d');
    x.fillStyle = '#171821'; x.fillRect(0, 0, 512, 512);
    for (let row = 0; row < 8; row++) {
      const y = row * 64;
      x.fillStyle = row % 2 ? 'rgba(255,255,255,0.022)' : 'rgba(0,0,0,0.05)';
      x.fillRect(0, y, 512, 64);
      x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(0, y, 512, 2); // plank gap
      const off = (row * 170) % 512; // staggered end joints
      x.fillRect(off, y, 2, 64);
      for (let i = 0; i < 3; i++) { // faint grain streaks
        x.fillStyle = 'rgba(255,255,255,0.015)';
        x.fillRect(0, y + 12 + i * 16 + (row % 3), 512, 3);
      }
    }
  })();
  const floorTex = new THREE.CanvasTexture(floorCanvas);
  floorTex.colorSpace = THREE.SRGBColorSpace;
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(3, 3);
  M.floor.map = floorTex; M.floor.color.set(0xffffff);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), M.floor);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; group.add(floor);

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), M.wall);
  backWall.position.set(0, 4.5, -3); backWall.receiveShadow = true; group.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), M.wall2);
  leftWall.rotation.y = Math.PI / 2; leftWall.position.set(-3, 4.5, 0); leftWall.receiveShadow = true; group.add(leftWall);

  // baseboard accents
  const skirt = box(16, 0.12, 0.05, M.metal); skirt.position.set(0, 0.06, -2.97); group.add(skirt);

  // rug with a lighter inner field — reads as fabric instead of a slab
  const rug = box(6, 0.04, 4.5, M.rug); rug.position.set(0.2, 0.02, 0.2); group.add(rug);
  const rugInner = box(5.5, 0.045, 4.0, new THREE.MeshStandardMaterial({ color: 0x2a3641, roughness: 1 }));
  rugInner.position.set(0.2, 0.025, 0.2); group.add(rugInner);

  // ---------- Desk (wood-grain top on steel loop frames) ----------
  const woodCanvas = document.createElement('canvas'); woodCanvas.width = 512; woodCanvas.height = 256;
  (() => {
    const x = woodCanvas.getContext('2d');
    x.fillStyle = '#8a6547'; x.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 46; i++) { // long grain streaks
      const y = (i * 13 + (i * i * 7) % 9) % 256;
      x.strokeStyle = i % 3 ? 'rgba(60,38,24,0.18)' : 'rgba(214,176,138,0.16)';
      x.lineWidth = 1 + (i % 4);
      x.beginPath(); x.moveTo(0, y);
      x.bezierCurveTo(140, y + ((i * 11) % 7) - 3, 360, y - ((i * 5) % 7) + 3, 512, y);
      x.stroke();
    }
    for (let i = 0; i < 4; i++) { // knots
      const kx = 70 + i * 130, ky = 40 + (i * 83) % 180;
      x.strokeStyle = 'rgba(52,32,20,0.3)'; x.lineWidth = 1.5;
      for (let r = 3; r < 13; r += 3.5) { x.beginPath(); x.ellipse(kx, ky, r * 1.7, r, 0.2, 0, Math.PI * 2); x.stroke(); }
    }
  })();
  const woodTex = new THREE.CanvasTexture(woodCanvas);
  woodTex.colorSpace = THREE.SRGBColorSpace;
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping; woodTex.repeat.set(2, 1);
  M.deskTop.map = woodTex; M.deskTop.color.set(0xffffff); M.deskTop.roughness = 0.55;

  const desk = new THREE.Group(); group.add(desk);
  const top = box(5, 0.14, 1.6, M.deskTop); top.position.set(0, 1.1, -2.0); top.castShadow = true; desk.add(top);
  const apron = box(4.86, 0.09, 0.05, new THREE.MeshStandardMaterial({ color: 0x2a2c36, roughness: 0.4, metalness: 0.7 }));
  apron.position.set(0, 1.0, -1.26); desk.add(apron);
  [-2.3, 2.3].forEach((x) => { // modern loop-frame legs
    [-1.35, -2.65].forEach((z) => {
      const bar = box(0.08, 1.03, 0.09, M.metal); bar.position.set(x, 0.52, z); desk.add(bar);
    });
    const foot = box(0.08, 0.06, 1.5, M.metal); foot.position.set(x, 0.04, -2.0); desk.add(foot);
    const rail = box(0.08, 0.06, 1.3, M.metal); rail.position.set(x, 1.0, -2.0); desk.add(rail);
  });
  const cross = box(4.5, 0.07, 0.05, M.metal); cross.position.set(0, 0.82, -2.62); desk.add(cross);

  // ---------- Desk nameplate — the "about me" object ----------
  const npCanvas = document.createElement('canvas'); npCanvas.width = 512; npCanvas.height = 200;
  (() => {
    const nx = npCanvas.getContext('2d');
    const g = nx.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, '#181a22'); g.addColorStop(1, '#0e0f15');
    nx.fillStyle = g; nx.fillRect(0, 0, 512, 200);
    nx.strokeStyle = '#5ce1e6'; nx.lineWidth = 3; nx.strokeRect(8, 8, 496, 184);
    nx.textAlign = 'center';
    nx.fillStyle = '#f1e9d8'; nx.font = 'bold 62px "Space Grotesk", sans-serif'; nx.fillText('HAIDAR ESBER', 256, 92);
    nx.fillStyle = '#5ce1e6'; nx.font = '22px "JetBrains Mono", monospace'; nx.fillText('Fullstack Developer · Researcher', 256, 138);
    nx.fillStyle = '#8a8d9a'; nx.font = '18px "JetBrains Mono", monospace'; nx.fillText('Vannes, France', 256, 166);
  })();
  const npTex = new THREE.CanvasTexture(npCanvas); npTex.colorSpace = THREE.SRGBColorSpace;
  const plate = new THREE.Group(); plate.position.set(-1.95, 1.17, -1.5); plate.rotation.y = 0.42; group.add(plate);
  const plateBase = box(0.94, 0.06, 0.2, new THREE.MeshStandardMaterial({ color: 0x1a1b22, roughness: 0.35, metalness: 0.7 })); plateBase.position.y = 0.03; plate.add(plateBase);
  const plaquePivot = new THREE.Group(); plaquePivot.position.set(0, 0.06, 0.05); plaquePivot.rotation.x = -0.32; plate.add(plaquePivot);
  const plaqueBack = box(0.9, 0.36, 0.03, new THREE.MeshStandardMaterial({ color: 0x14151b, roughness: 0.4, metalness: 0.5 })); plaqueBack.position.y = 0.18; plaquePivot.add(plaqueBack);
  const plaqueFace = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.335), new THREE.MeshBasicMaterial({ map: npTex, toneMapped: false })); plaqueFace.position.set(0, 0.18, 0.016); plaquePivot.add(plaqueFace);
  interactives.push({ name: 'about', label: { fr: 'À propos de moi', en: 'About me' }, meshes: [plateBase, plaqueBack, plaqueFace], focusKey: 'laptop', anchor: new THREE.Vector3(-1.95, 1.85, -1.5) });

  // ---------- Framed polaroid on the desk: Beirut → Vannes ----------
  const polCanvas = document.createElement('canvas'); polCanvas.width = 192; polCanvas.height = 256;
  (() => {
    const x = polCanvas.getContext('2d');
    x.fillStyle = '#efe9dc'; x.fillRect(0, 0, 192, 256); // polaroid card
    x.fillStyle = '#101725'; x.fillRect(14, 14, 164, 170); // night "photo"
    for (let i = 0; i < 26; i++) { x.fillStyle = '#ffffff88'; x.fillRect(20 + Math.random() * 152, 20 + Math.random() * 90, 1.5, 1.5); }
    x.strokeStyle = '#5ce1e6'; x.lineWidth = 3; x.lineCap = 'round';
    // stylized cedar: trunk + three tiers
    x.beginPath(); x.moveTo(96, 172); x.lineTo(96, 128); x.stroke();
    [[42, 148], [30, 128], [18, 108]].forEach(([w, y]) => {
      x.beginPath(); x.moveTo(96 - w, y + 14); x.quadraticCurveTo(96, y - 6, 96 + w, y + 14); x.stroke();
    });
    x.fillStyle = '#3a3f52'; x.font = '18px "JetBrains Mono", monospace'; x.textAlign = 'center';
    x.fillText('Beyrouth → Vannes', 96, 222);
  })();
  const polTex = new THREE.CanvasTexture(polCanvas); polTex.colorSpace = THREE.SRGBColorSpace;
  const photoFrame = new THREE.Group(); photoFrame.position.set(-2.22, 1.17, -2.35); photoFrame.rotation.y = 0.35; group.add(photoFrame);
  const pfBack = box(0.36, 0.46, 0.03, new THREE.MeshStandardMaterial({ color: 0x1a1b22, roughness: 0.4, metalness: 0.5 }));
  pfBack.position.y = 0.25; pfBack.rotation.x = -0.12; photoFrame.add(pfBack);
  const pfPhoto = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), new THREE.MeshBasicMaterial({ map: polTex, toneMapped: true }));
  pfPhoto.position.set(0, 0.25, 0.017); pfPhoto.rotation.x = -0.12; photoFrame.add(pfPhoto);

  // ---------- Monitors (interactive: work) ----------
  function monitor(x, painter, name, label, anchor = null) {
    const g = new THREE.Group(); g.position.set(x, 1.17, -2.35); group.add(g);
    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.55, 16), M.metal); stand.position.y = 0.28; g.add(stand);
    const footM = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 20), M.metal); footM.position.y = 0.02; g.add(footM);
    const bezel = box(1.5, 0.92, 0.06, M.plastic); bezel.position.y = 1.05; g.add(bezel);
    const canvas = painter(0); const s = screenMat(canvas);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.82), s.mat); screen.position.set(0, 1.05, 0.035); g.add(screen);
    screens.push({ texture: s.tex, draw: painter, canvas });
    interactives.push({ name, label, meshes: [bezel, screen], focusKey: 'monitors', anchor });
    return g;
  }
  monitor(-0.45, drawAISearch, 'leftMonitor', { fr: 'Projets · Moteur IA', en: 'Work · AI Engine' }, new THREE.Vector3(-0.45, 2.55, -2.3));
  monitor(1.45, drawCoJeCo, 'rightMonitor', { fr: 'Projets · CoJeCo', en: 'Work · CoJeCo' });

  // ---------- Mechanical keyboard (backlit) ----------
  const keyboard = new THREE.Group(); keyboard.position.set(0.45, 1.19, -1.42); group.add(keyboard);
  const kbGlow = box(1.28, 0.02, 0.48, new THREE.MeshBasicMaterial({ color: 0x5ce1e6, toneMapped: false })); kbGlow.position.y = -0.004; keyboard.add(kbGlow);
  const kbBase = box(1.22, 0.05, 0.44, new THREE.MeshStandardMaterial({ color: 0x121319, roughness: 0.6, metalness: 0.35 })); kbBase.position.y = 0.02; keyboard.add(kbBase);
  const keyMat = new THREE.MeshStandardMaterial({ color: 0x2b2c35, roughness: 0.7 });
  for (let r = 0; r < 4; r++) for (let c = 0; c < 13; c++) {
    const k = box(0.07, 0.022, 0.06, keyMat); k.position.set(-0.525 + c * 0.0875, 0.052, -0.13 + r * 0.066); keyboard.add(k);
  }
  const spacebar = box(0.46, 0.022, 0.058, keyMat); spacebar.position.set(0, 0.052, 0.155); keyboard.add(spacebar);

  // ---------- Mouse (domed, with scroll wheel) ----------
  const mouse = new THREE.Group(); mouse.position.set(1.45, 1.19, -1.32); group.add(mouse);
  const mBody = new THREE.Mesh(new THREE.SphereGeometry(0.12, 22, 16), new THREE.MeshStandardMaterial({ color: 0x16171d, roughness: 0.3, metalness: 0.25 }));
  mBody.scale.set(0.72, 0.44, 1.06); mBody.position.y = 0.035; mouse.add(mBody);
  const mSplit = box(0.006, 0.07, 0.12, new THREE.MeshStandardMaterial({ color: 0x000000 })); mSplit.position.set(0, 0.055, -0.03); mouse.add(mSplit);
  const wheel = box(0.022, 0.022, 0.034, new THREE.MeshStandardMaterial({ color: 0x5ce1e6, emissive: 0x5ce1e6, emissiveIntensity: 0.6, toneMapped: false })); wheel.position.set(0, 0.075, -0.06); mouse.add(wheel);

  // ---------- Coffee mug + steam ----------
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.09, 0.22, 20), M.mug);
  mug.position.set(1.85, 1.28, -1.35); group.add(mug);
  const mugHandle = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.015, 8, 18), M.mug);
  mugHandle.position.set(1.955, 1.29, -1.35); mugHandle.rotation.y = 0.35; group.add(mugHandle);
  const coffee = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.012, 20), new THREE.MeshStandardMaterial({ color: 0x2b1a10, roughness: 0.35 }));
  coffee.position.set(1.85, 1.386, -1.35); group.add(coffee);
  const steamParts = [];
  const steamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0, depthWrite: false });
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), steamMat.clone());
    s.position.copy(mug.position); s.position.y += 0.2 + i * 0.12; group.add(s); steamParts.push(s);
  }

  // ---------- Whiteboard (interactive: research) ----------
  const wbGroup = new THREE.Group(); group.add(wbGroup);
  const wbFrame = box(2.45, 1.6, 0.06, M.metal); wbFrame.position.set(-0.6, 3.95, -2.93); wbGroup.add(wbFrame);
  const wbCanvas = drawWhiteboard(0); const wbS = screenMat(wbCanvas, true);
  const wbBoard = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.45), wbS.mat); wbBoard.position.set(-0.6, 3.95, -2.89); wbGroup.add(wbBoard);
  screens.push({ texture: wbS.tex, draw: drawWhiteboard, canvas: wbCanvas });
  interactives.push({ name: 'whiteboard', label: { fr: 'Recherche · PhaseShield', en: 'Research · PhaseShield' }, meshes: [wbFrame, wbBoard], focusKey: 'whiteboard', anchor: new THREE.Vector3(-0.6, 3.12, -2.82) });

  // ---------- Server rack + antenna (interactive: work / network) ----------
  const rack = new THREE.Group(); rack.position.set(4.45, 0, -2.05); group.add(rack);
  const rackBody = box(0.95, 2.2, 0.75, M.plastic); rackBody.position.y = 1.1; rack.add(rackBody);
  const leds = [];
  for (let i = 0; i < 9; i++) {
    const led = box(0.5, 0.04, 0.02, new THREE.MeshBasicMaterial({ color: 0x5ce1e6, toneMapped: false }));
    led.position.set(0, 0.5 + i * 0.18, 0.39); rack.add(led); leds.push(led);
  }
  // antenna
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 8), M.metal);
  mast.position.set(0, 2.55, 0); rack.add(mast);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), new THREE.MeshBasicMaterial({ color: 0x5ce1e6, toneMapped: false }));
  tip.position.set(0, 2.9, 0); rack.add(tip);
  // wifi rings (animated)
  const rings = [];
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x5ce1e6, transparent: true, side: THREE.DoubleSide, toneMapped: false });
  for (let i = 0; i < 4; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 8, 40), ringMat.clone());
    r.position.set(0, 2.9, 0); r.rotation.x = Math.PI / 2; rack.add(r); rings.push(r);
  }
  interactives.push({ name: 'serverRack', label: { fr: 'Infra · Réseau & Sécurité', en: 'Infra · Network & Security' }, meshes: [rackBody], focusKey: 'serverRack', anchor: new THREE.Vector3(4.45, 2.5, -1.95) });

  // ---------- Plant: little low-poly ficus by the window ----------
  const plant = new THREE.Group(); plant.position.set(-2.45, 0, 2.7); plant.scale.setScalar(1.2); group.add(plant);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.38, 10), new THREE.MeshStandardMaterial({ color: 0xc0714d, roughness: 0.75, flatShading: true }));
  pot.position.y = 0.19; plant.add(pot);
  const potRim = new THREE.Mesh(new THREE.CylinderGeometry(0.265, 0.25, 0.07, 10), new THREE.MeshStandardMaterial({ color: 0xa85e3e, roughness: 0.75, flatShading: true }));
  potRim.position.y = 0.38; plant.add(potRim);
  const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.03, 10), new THREE.MeshStandardMaterial({ color: 0x2a2019, roughness: 1 }));
  soil.position.y = 0.4; plant.add(soil);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 0.55, 7), new THREE.MeshStandardMaterial({ color: 0x6b4a33, roughness: 0.9, flatShading: true }));
  trunk.position.y = 0.66; trunk.rotation.z = 0.06; plant.add(trunk);
  [
    [0, 1.12, 0, 0.34, 0x2f7d4f],
    [0.24, 0.95, 0.12, 0.22, 0x3c9463],
    [-0.2, 0.98, -0.1, 0.2, 0x286842],
  ].forEach(([px, py, pz, r, col]) => {
    const blob = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), new THREE.MeshStandardMaterial({ color: col, roughness: 0.8, flatShading: true }));
    blob.position.set(px, py, pz); plant.add(blob);
  });

  // ---------- Chair (proper task chair: star base, cushions, armrests) ----------
  const chair = new THREE.Group(); chair.position.set(0.2, 0, -0.5); chair.rotation.y = -0.25; group.add(chair);
  const chFabric = new THREE.MeshStandardMaterial({ color: 0x1b1e29, roughness: 0.85 });
  const chAccent = new THREE.MeshStandardMaterial({ color: 0x2a3040, roughness: 0.8 });
  const seat = box(0.62, 0.1, 0.6, chFabric); seat.position.y = 0.58; chair.add(seat);
  const cushion = box(0.56, 0.045, 0.54, chAccent); cushion.position.y = 0.65; chair.add(cushion);
  const backRest = new THREE.Group(); backRest.position.set(0, 0.6, 0.3); backRest.rotation.x = 0.14; chair.add(backRest);
  const back = box(0.6, 0.88, 0.09, chFabric); back.position.y = 0.46; backRest.add(back);
  const backPad = box(0.5, 0.72, 0.035, chAccent); backPad.position.set(0, 0.44, -0.055); backRest.add(backPad);
  [-0.36, 0.36].forEach((x) => {
    const armPost = box(0.05, 0.24, 0.05, M.metal); armPost.position.set(x, 0.7, 0.14); chair.add(armPost);
    const armPad = box(0.08, 0.045, 0.34, chAccent); armPad.position.set(x, 0.83, 0.06); chair.add(armPad);
  });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.38, 12), M.metal); pole.position.y = 0.34; chair.add(pole);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const arm = box(0.32, 0.045, 0.06, M.metal);
    arm.position.set(Math.cos(a) * 0.17, 0.08, Math.sin(a) * 0.17);
    arm.rotation.y = -a;
    chair.add(arm);
    const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), M.rubber);
    wheel.position.set(Math.cos(a) * 0.31, 0.045, Math.sin(a) * 0.31);
    chair.add(wheel);
  }

  // ---------- Neon wall sign (glows under bloom) ----------
  const neonCanvas = document.createElement('canvas'); neonCanvas.width = 512; neonCanvas.height = 256;
  (() => {
    const x = neonCanvas.getContext('2d');
    x.fillStyle = '#000'; x.fillRect(0, 0, 512, 256);
    x.textAlign = 'center'; x.lineJoin = 'round';
    x.shadowColor = '#5ce1e6'; x.shadowBlur = 24;
    x.fillStyle = '#bff7f9'; x.font = 'bold 90px "Space Grotesk", sans-serif';
    x.fillText('HAIDAR', 256, 110);
    x.shadowColor = '#ff7a45'; x.fillStyle = '#ffd9c7'; x.font = 'bold 60px "Space Grotesk", sans-serif';
    x.fillText('· ESBER ·', 256, 190);
  })();
  const neonTex = new THREE.CanvasTexture(neonCanvas); neonTex.colorSpace = THREE.SRGBColorSpace;
  const neonMat = new THREE.MeshBasicMaterial({ map: neonTex, transparent: true, toneMapped: false, blending: THREE.AdditiveBlending });
  const neon = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), neonMat);
  neon.rotation.y = Math.PI / 2; neon.position.set(-2.9, 4.3, -0.6); group.add(neon);

  // ---------- Window with night skyline (left wall) ----------
  const winCanvas = document.createElement('canvas'); winCanvas.width = 256; winCanvas.height = 320;
  (() => {
    const x = winCanvas.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 320);
    g.addColorStop(0, '#12224e'); g.addColorStop(0.6, '#1e3268'); g.addColorStop(1, '#33508e');
    x.fillStyle = g; x.fillRect(0, 0, 256, 320);
    for (let i = 0; i < 60; i++) { x.fillStyle = '#ffffff' + (Math.random() > 0.5 ? '99' : '55'); x.fillRect(Math.random() * 256, Math.random() * 180, 1.5, 1.5); }
    const mg = x.createRadialGradient(200, 60, 4, 200, 60, 34); // soft moon, no bloom blob
    mg.addColorStop(0, '#dbe6ff'); mg.addColorStop(0.55, '#93a9d6'); mg.addColorStop(1, 'rgba(147,169,214,0)');
    x.fillStyle = mg; x.beginPath(); x.arc(200, 60, 34, 0, Math.PI * 2); x.fill();
    for (let i = 0; i < 14; i++) { const w = 14 + Math.random() * 26, h = 60 + Math.random() * 160; x.fillStyle = '#0a1024'; x.fillRect(i * 20, 320 - h, w, h);
      for (let wy = 320 - h + 6; wy < 314; wy += 12) for (let wx = i * 20 + 3; wx < i * 20 + w - 3; wx += 9) if (Math.random() > 0.5) { x.fillStyle = '#ffd98a'; x.fillRect(wx, wy, 3, 4); } }
  })();
  const winTex = new THREE.CanvasTexture(winCanvas); winTex.colorSpace = THREE.SRGBColorSpace;
  const winView = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.5), new THREE.MeshBasicMaterial({ map: winTex, toneMapped: true }));
  winView.rotation.y = Math.PI / 2; winView.position.set(-2.93, 3.0, 2.0); group.add(winView);
  const winFrame = box(0.1, 2.7, 2.2, M.metal); winFrame.position.set(-2.92, 3.0, 2.0); group.add(winFrame);
  const winBarV = box(0.12, 2.7, 0.06, M.metal); winBarV.position.set(-2.9, 3.0, 2.0); group.add(winBarV);
  const winBarH = box(0.12, 0.06, 2.2, M.metal); winBarH.position.set(-2.9, 3.0, 2.0); group.add(winBarH);
  const moonLight = new THREE.PointLight(0x9fc0ff, 3, 12, 2); moonLight.position.set(-2.4, 3.2, 2.0); group.add(moonLight);
  // curtain rod + tied-back panel (far side only — the arcade lives on the near side)
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 3.0, 10), M.metal);
  rod.rotation.x = Math.PI / 2; rod.position.set(-2.86, 4.52, 2.0); group.add(rod);
  const curtainMat = new THREE.MeshStandardMaterial({ color: 0x233042, roughness: 1 });
  const curtain = box(0.12, 2.95, 0.5, curtainMat); curtain.position.set(-2.84, 3.02, 3.35); group.add(curtain);
  const curtainTie = box(0.16, 0.12, 0.42, new THREE.MeshStandardMaterial({ color: 0x33465e, roughness: 1 }));
  curtainTie.position.set(-2.84, 2.5, 3.35); group.add(curtainTie);
  const valance = box(0.1, 0.3, 3.0, curtainMat); valance.position.set(-2.87, 4.42, 2.0); group.add(valance);

  // ---------- Poster on the back wall: PhaseShield print ----------
  const posterCanvas = document.createElement('canvas'); posterCanvas.width = 256; posterCanvas.height = 384;
  (() => {
    const x = posterCanvas.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 384); g.addColorStop(0, '#10131f'); g.addColorStop(1, '#0a0c14');
    x.fillStyle = g; x.fillRect(0, 0, 256, 384);
    x.strokeStyle = 'rgba(92,225,230,0.25)'; x.lineWidth = 1;
    for (let i = 1; i < 8; i++) { x.beginPath(); x.moveTo(0, i * 48); x.lineTo(256, i * 48); x.stroke(); } // faint grid
    x.strokeStyle = '#5ce1e6'; x.lineWidth = 2.5; x.beginPath();
    for (let px = 16; px <= 240; px += 4) {
      const py = 190 + Math.sin(px * 0.09) * 34 * Math.sin(px * 0.013);
      px === 16 ? x.moveTo(px, py) : x.lineTo(px, py);
    }
    x.stroke();
    x.strokeStyle = '#ff7a45'; x.lineWidth = 1.8; x.beginPath();
    for (let px = 16; px <= 240; px += 4) {
      const py = 190 + Math.sin(px * 0.09 + 0.8) * 34 * Math.sin(px * 0.013) + Math.sin(px * 0.5) * 7;
      px === 16 ? x.moveTo(px, py) : x.lineTo(px, py);
    }
    x.stroke();
    x.textAlign = 'center';
    x.fillStyle = '#edeef4'; x.font = 'bold 26px "Space Grotesk", sans-serif'; x.fillText('PHASESHIELD', 128, 60);
    x.fillStyle = '#5ce1e6'; x.font = '11px "JetBrains Mono", monospace'; x.fillText('privacy · physical layer', 128, 84);
    x.fillStyle = '#5d5f6e'; x.font = '10px "JetBrains Mono", monospace'; x.fillText('x\' = x + ε · sign(∇ J)', 128, 344);
  })();
  const posterTex = new THREE.CanvasTexture(posterCanvas); posterTex.colorSpace = THREE.SRGBColorSpace;
  const posterFrame = box(0.98, 1.38, 0.04, new THREE.MeshStandardMaterial({ color: 0x262837, roughness: 0.5, metalness: 0.4 }));
  posterFrame.position.set(3.3, 3.8, -2.96); group.add(posterFrame);
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 1.28), new THREE.MeshBasicMaterial({ map: posterTex, toneMapped: true }));
  poster.position.set(3.3, 3.8, -2.93); group.add(poster);

  // ---------- Certifications board (interactive: certs) ----------
  const certBoard = new THREE.Group(); certBoard.position.set(1.55, 3.85, -2.92); group.add(certBoard);
  const certFrame = box(2.0, 1.3, 0.05, new THREE.MeshStandardMaterial({ color: 0x6b4f3a, roughness: 0.7 }));
  certBoard.add(certFrame);
  const certBack = box(1.85, 1.15, 0.04, new THREE.MeshStandardMaterial({ color: 0xb2a37f, roughness: 1 })); certBack.position.z = 0.02; certBoard.add(certBack);
  const certCols = [0x1ba0d7, 0x0b3d91, 0xff9900, 0xb8975a, 0x00979d];
  certCols.forEach((col, i) => {
    const badge = box(0.3, 0.38, 0.02, new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.2 }));
    badge.position.set(-0.7 + (i % 3) * 0.55, 0.22 - Math.floor(i / 3) * 0.5, 0.05);
    badge.rotation.z = (Math.random() - 0.5) * 0.1; certBoard.add(badge);
  });
  interactives.push({ name: 'certs', label: { fr: 'Certifications', en: 'Certifications' }, meshes: [certFrame, certBack], focusKey: 'certs', anchor: new THREE.Vector3(1.55, 3.06, -2.82) });

  // ---------- Arcade machine (interactive: extras) ----------
  const arcade = new THREE.Group(); arcade.position.set(-2.5, 0, 0.5); arcade.rotation.y = Math.PI / 2; group.add(arcade);
  const arcMat = new THREE.MeshStandardMaterial({ color: 0x16121f, roughness: 0.5, metalness: 0.3 });
  const arcBody = box(1.0, 2.3, 0.8, arcMat); arcBody.position.y = 1.15; arcade.add(arcBody);
  // marquee: dark hood with a backlit title strip, like a real cabinet
  const arcHood = box(1.04, 0.34, 0.6, arcMat); arcHood.position.set(0, 2.32, 0.12); arcade.add(arcHood);
  const mqCanvas = document.createElement('canvas'); mqCanvas.width = 512; mqCanvas.height = 128;
  (() => {
    const x = mqCanvas.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, '#151223'); g.addColorStop(1, '#0a0913');
    x.fillStyle = g; x.fillRect(0, 0, 512, 128);
    x.strokeStyle = '#5ce1e6'; x.lineWidth = 5; x.strokeRect(8, 8, 496, 112);
    x.textAlign = 'center'; x.shadowBlur = 18;
    x.shadowColor = '#ff7a45'; x.fillStyle = '#ffc9ac'; x.font = 'bold 58px "Space Grotesk", sans-serif';
    x.fillText('INVADERS', 256, 82);
    x.shadowBlur = 0; x.fillStyle = '#5ce1e6'; x.font = '20px "JetBrains Mono", monospace';
    x.fillText('◂ ▴ ▸', 256, 110);
  })();
  const mqTex = new THREE.CanvasTexture(mqCanvas); mqTex.colorSpace = THREE.SRGBColorSpace;
  const marquee = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 0.24), new THREE.MeshBasicMaterial({ map: mqTex, toneMapped: false }));
  marquee.position.set(0, 2.32, 0.425); marquee.rotation.x = -0.08; arcade.add(marquee);
  const arcCanvas = drawArcade(0); const arcS = screenMat(arcCanvas);
  const arcScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.95), arcS.mat); arcScreen.position.set(0, 1.65, 0.41); arcScreen.rotation.x = -0.12; arcade.add(arcScreen);
  // arcade screen is driven by the live ArcadeGame (not the throttled screens list)
  const arcadeScreen = { texture: arcS.tex, canvas: arcCanvas };
  const arcPanel = box(0.8, 0.4, 0.3, arcMat); arcPanel.position.set(0, 1.05, 0.45); arcPanel.rotation.x = 0.5; arcade.add(arcPanel);
  ['#ff5f56', '#ffbd2e', '#27c93f'].forEach((c, i) => {
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 12), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.4 }));
    btn.position.set(-0.2 + i * 0.2, 1.12, 0.56); btn.rotation.x = Math.PI / 2 + 0.5; arcade.add(btn);
  });
  interactives.push({ name: 'arcade', label: { fr: 'En coulisses', en: 'Behind the scenes' }, meshes: [arcBody, arcScreen], focusKey: 'arcade', anchor: new THREE.Vector3(-2.25, 2.6, 0.5) });

  // ---------- Smartphone on the desk (interactive: contact) ----------
  const phone = new THREE.Group(); phone.position.set(-0.9, 1.175, -1.38); phone.rotation.y = -0.4; group.add(phone);
  const phCanvas = document.createElement('canvas'); phCanvas.width = 128; phCanvas.height = 256;
  (() => {
    const x = phCanvas.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#101828'); g.addColorStop(1, '#0a0f1c');
    x.fillStyle = g; x.fillRect(0, 0, 128, 256);
    x.textAlign = 'center';
    x.fillStyle = '#5ce1e6'; x.font = 'bold 44px sans-serif'; x.fillText('✉', 64, 118);
    x.fillStyle = '#edeef4'; x.font = 'bold 15px sans-serif'; x.fillText('Contact', 64, 158);
    x.fillStyle = '#5d5f6e'; x.font = '11px monospace'; x.fillText('say hello', 64, 180);
  })();
  const phTex = new THREE.CanvasTexture(phCanvas); phTex.colorSpace = THREE.SRGBColorSpace;
  const phBody = box(0.24, 0.025, 0.46, new THREE.MeshStandardMaterial({ color: 0x0d0e13, roughness: 0.3, metalness: 0.6 }));
  phBody.position.y = 0.012; phone.add(phBody);
  const phScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.42), new THREE.MeshBasicMaterial({ map: phTex, toneMapped: false }));
  phScreen.rotation.x = -Math.PI / 2; phScreen.position.y = 0.026; phone.add(phScreen);
  interactives.push({ name: 'contact', label: { fr: 'Contact', en: 'Contact' }, meshes: [phBody, phScreen], focusKey: 'contact', anchor: new THREE.Vector3(-0.9, 1.55, -1.38) });

  // ---------- Rubik's cube (homage, spins) ----------
  const rubik = new THREE.Group(); rubik.position.set(2.3, 1.42, -1.7); group.add(rubik);
  const faceCols = [0xff3b30, 0xff9500, 0xffffff, 0xffcc00, 0x34c759, 0x0a84ff];
  for (let ix = -1; ix <= 1; ix++) for (let iy = -1; iy <= 1; iy++) for (let iz = -1; iz <= 1; iz++) {
    const mats = faceCols.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 }));
    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.085, 0.085), mats);
    cube.position.set(ix * 0.09, iy * 0.09, iz * 0.09); rubik.add(cube);
  }

  // ---------- Floating dust particles ----------
  const dustCount = 90;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) { dustPos[i * 3] = (Math.random() - 0.5) * 9; dustPos[i * 3 + 1] = Math.random() * 6; dustPos[i * 3 + 2] = (Math.random() - 0.5) * 9; }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x9fb4d0, size: 0.022, transparent: true, opacity: 0.28, depthWrite: false }));
  group.add(dust);

  // ---------- Camera focus presets ----------
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const foci = {
    home:       { pos: V(7.5, 5.6, 7.5),  target: V(0, 1.7, -1.4) },
    laptop:     { pos: V(-0.95, 1.62, -0.3), target: V(-1.95, 1.42, -1.45), panel: 'about' },
    monitors:   { pos: V(0.55, 2.75, 2.1), target: V(0.55, 1.95, -2.3),   panel: 'work' },
    whiteboard: { pos: V(-0.6, 4.05, 0.8), target: V(-0.6, 3.9, -2.9),    panel: 'research' },
    serverRack: { pos: V(4.45, 2.4, 0.85), target: V(4.45, 1.5, -2.05),   panel: 'infra' },
    contact:    { pos: V(-0.5, 2.5, 0.35), target: V(-0.9, 1.18, -1.38),  panel: 'contact' },
    certs:      { pos: V(1.55, 3.95, 0.8), target: V(1.55, 3.85, -2.9),   panel: 'certs' },
    arcade:     { pos: V(0.7, 2.1, 0.9),   target: V(-2.2, 1.65, 0.5),    panel: 'extras' },
  };

  // ---------- Per-frame motion ----------
  let lastPaint = -1;
  function animate(t) {
    if (t - lastPaint > 0.09) { // repaint screens at ~11fps
      lastPaint = t;
      screens.forEach((s) => { s.texture.image = s.draw(t); s.texture.needsUpdate = true; });
    }
    leds.forEach((led, i) => {
      const on = Math.sin(t * (2 + i * 0.3) + i) > -0.2;
      led.material.color.setHex(on ? (i % 3 === 0 ? 0xff7a45 : 0x5ce1e6) : 0x16323a);
    });
    rings.forEach((r, i) => {
      const phase = (t * 0.6 + i * 0.25) % 1;
      r.scale.setScalar(0.2 + phase * 5);
      r.material.opacity = Math.max(0, 0.6 * (1 - phase));
    });
    tip.material.color.setHex(Math.sin(t * 4) > 0 ? 0x5ce1e6 : 0x1a4a4f);
    steamParts.forEach((s, i) => {
      const ph = (t * 0.5 + i * 0.33) % 1;
      s.position.y = mug.position.y + 0.18 + ph * 0.5;
      s.position.x = mug.position.x + Math.sin(t * 2 + i) * 0.05;
      s.material.opacity = 0.18 * (1 - ph);
      s.scale.setScalar(0.6 + ph);
    });
    rubik.rotation.y = t * 0.5; rubik.rotation.x = Math.sin(t * 0.4) * 0.3;
    neonMat.opacity = 0.85 + Math.sin(t * 9) * 0.12 + (Math.random() < 0.02 ? -0.4 : 0); // subtle flicker
    const dp = dust.geometry.attributes.position; const arr = dp.array;
    for (let i = 0; i < arr.length; i += 3) { arr[i + 1] += 0.0025; if (arr[i + 1] > 6) arr[i + 1] = 0; arr[i] += Math.sin(t + i) * 0.0006; }
    dp.needsUpdate = true;
    dust.rotation.y = t * 0.01;
  }

  return { group, screens, interactives, foci, animate, arcadeScreen };
}
