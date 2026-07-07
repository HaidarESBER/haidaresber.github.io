// Builds the procedural 3D room and furniture, returns:
//   group        – THREE.Group to add to the scene
//   screens      – [{texture, draw}] updated every frame
//   interactives – [{name,label,meshes[],focusKey,action}]
//   foci         – { key: {pos, target, panel} } camera focus presets
//   animate(t)   – per-frame motion (LEDs, wifi rings, steam, screens)
import * as THREE from 'three';
import { drawCode, drawCoJeCo, drawAISearch, drawWhiteboard, drawArcade } from './screenDraws.js';

const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);

// 2x-resolution canvas with a scaled context, so text drawn on textures stays sharp.
const hiCanvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w * 2; c.height = h * 2;
  c.getContext('2d').scale(2, 2);
  return c;
};

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
  const skirtL = box(0.05, 0.12, 16, M.metal); skirtL.position.set(-2.97, 0.06, 0); group.add(skirtL);

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
  const npCanvas = hiCanvas(512, 200);
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
  const polCanvas = hiCanvas(192, 256);
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

  // ---------- PC tower under the desk (the monitors are plugged into something) ----------
  const tower = new THREE.Group(); tower.position.set(1.9, 0, -2.3); group.add(tower);
  const twBody = box(0.34, 0.72, 0.62, new THREE.MeshStandardMaterial({ color: 0x14151d, roughness: 0.45, metalness: 0.4 }));
  twBody.position.y = 0.44; tower.add(twBody);
  [[-0.12, -0.24], [0.12, -0.24], [-0.12, 0.24], [0.12, 0.24]].forEach(([x, z]) => {
    const foot = box(0.06, 0.08, 0.06, M.rubber); foot.position.set(x, 0.04, z); tower.add(foot);
  });
  const twGlass = box(0.006, 0.52, 0.44, new THREE.MeshStandardMaterial({ color: 0x0d141c, roughness: 0.12, metalness: 0.8 }));
  twGlass.position.set(0.172, 0.46, 0); tower.add(twGlass); // tempered-glass side panel
  const twStrip = box(0.016, 0.56, 0.016, new THREE.MeshBasicMaterial({ color: 0x5ce1e6, toneMapped: false }));
  twStrip.position.set(-0.13, 0.46, 0.305); tower.add(twStrip); // front RGB strip
  const twBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.012, 12), new THREE.MeshBasicMaterial({ color: 0xff7a45, toneMapped: false }));
  twBtn.rotation.x = Math.PI / 2; twBtn.position.set(0.1, 0.72, 0.305); tower.add(twBtn);
  // cables from the tower up behind the desk
  [1.45, -0.45].forEach((mx, i) => {
    const cable = box(0.015, 0.42, 0.015, M.rubber);
    cable.position.set(1.9 - (1.9 - mx) * 0.15, 0.94 + i * 0.02, -2.62); group.add(cable);
  });

  // ---------- Desk mat under keyboard + mouse ----------
  const deskMat = box(2.0, 0.008, 0.6, new THREE.MeshStandardMaterial({ color: 0x141720, roughness: 0.95 }));
  deskMat.position.set(0.85, 1.176, -1.52); group.add(deskMat);

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
  const wbFrame = box(2.45, 1.6, 0.06, M.metal); wbFrame.position.set(-0.85, 3.95, -2.93); wbGroup.add(wbFrame);
  const wbCanvas = drawWhiteboard(0); const wbS = screenMat(wbCanvas, true);
  const wbBoard = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.45), wbS.mat); wbBoard.position.set(-0.85, 3.95, -2.89); wbGroup.add(wbBoard);
  screens.push({ texture: wbS.tex, draw: drawWhiteboard, canvas: wbCanvas });
  interactives.push({ name: 'whiteboard', label: { fr: 'Recherche · PhaseShield', en: 'Research · PhaseShield' }, meshes: [wbFrame, wbBoard], focusKey: 'whiteboard', anchor: new THREE.Vector3(-0.85, 3.12, -2.82) });

  // ---------- Server rack + antenna (interactive: work / network) ----------
  const rack = new THREE.Group(); rack.position.set(4.45, 0, -2.05); group.add(rack);
  const rackBody = box(0.95, 2.2, 0.75, M.plastic); rackBody.position.y = 1.1; rack.add(rackBody);
  // mounting rails + stacked server units with faceplates, vents, handles and LEDs
  [-0.42, 0.42].forEach((x) => {
    const rail = box(0.05, 2.08, 0.02, M.metal); rail.position.set(x, 1.1, 0.38); rack.add(rail);
  });
  const unitFace = new THREE.MeshStandardMaterial({ color: 0x1b1d27, roughness: 0.35, metalness: 0.65 });
  const ventMat = new THREE.MeshStandardMaterial({ color: 0x08090e, roughness: 0.9 });
  const leds = [];
  for (let i = 0; i < 6; i++) {
    const y = 0.35 + i * 0.31;
    const face = box(0.78, 0.24, 0.05, unitFace); face.position.set(0, y, 0.39); rack.add(face);
    [-0.32, 0.32].forEach((hx) => {
      const handle = box(0.03, 0.15, 0.025, M.metal); handle.position.set(hx, y, 0.425); rack.add(handle);
    });
    if (i < 5) { // vent slots
      for (let v = 0; v < 3; v++) {
        const vent = box(0.36, 0.026, 0.012, ventMat);
        vent.position.set(-0.1, y - 0.06 + v * 0.06, 0.42); rack.add(vent);
      }
    }
    for (let d = 0; d < 2; d++) {
      const dot = box(0.035, 0.035, 0.014, new THREE.MeshBasicMaterial({ color: 0x5ce1e6, toneMapped: false }));
      dot.position.set(0.17 + d * 0.08, y - 0.05, 0.42); rack.add(dot); leds.push(dot);
    }
  }
  // top unit carries a small monitoring readout instead of vents
  const statCanvas = hiCanvas(256, 96);
  (() => {
    const x = statCanvas.getContext('2d');
    x.fillStyle = '#03110a'; x.fillRect(0, 0, 256, 96);
    x.fillStyle = '#27c93f'; x.font = 'bold 22px monospace';
    x.fillText('ZBX ▮▮▮▮▯ OK', 14, 38);
    x.fillStyle = '#1f9c33'; x.font = '17px monospace';
    x.fillText('vpn up · ad ok', 14, 72);
  })();
  const statTex = new THREE.CanvasTexture(statCanvas); statTex.colorSpace = THREE.SRGBColorSpace;
  const statScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.16), new THREE.MeshBasicMaterial({ map: statTex, toneMapped: false }));
  statScreen.position.set(-0.13, 0.35 + 5 * 0.31, 0.42); rack.add(statScreen);
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
  const plant = new THREE.Group(); plant.position.set(-2.6, 0, 1.45); plant.scale.setScalar(1.2); group.add(plant);
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

  // ---------- Workbench by the plant: an opened laptop mid-repair ----------
  const bench = new THREE.Group(); bench.position.set(-1.45, 0, 2.6); bench.rotation.y = 1.32; group.add(bench);
  const benchTop = box(1.35, 0.08, 0.75, M.deskTop); benchTop.position.y = 0.86; bench.add(benchTop);
  [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]].forEach(([x, z]) => {
    const leg = box(0.06, 0.82, 0.06, M.metal); leg.position.set(x, 0.41, z); bench.add(leg);
  });

  const alu = new THREE.MeshStandardMaterial({ color: 0x2c2e38, roughness: 0.35, metalness: 0.75 });
  const laptop = new THREE.Group(); laptop.position.set(-0.12, 0.9, 0.06); laptop.rotation.y = -0.3; bench.add(laptop);
  const lapBase = box(0.6, 0.025, 0.4, alu); lapBase.position.y = 0.013; laptop.add(lapBase);
  // chassis is unscrewed: inner tray with the internals exposed
  const lapTray = box(0.56, 0.008, 0.36, new THREE.MeshStandardMaterial({ color: 0x0e1016, roughness: 0.85 }));
  lapTray.position.y = 0.028; laptop.add(lapTray);
  // opened lid with the live code editor
  const lid = new THREE.Group(); lid.position.set(0, 0.02, -0.2); lid.rotation.x = -0.32; laptop.add(lid);
  const lidBack = box(0.6, 0.42, 0.018, alu); lidBack.position.y = 0.2; lid.add(lidBack);
  const lapCanvas = drawCode(0); const lapS = screenMat(lapCanvas);
  const lapScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.345), lapS.mat);
  lapScreen.position.set(0, 0.2, 0.011); lid.add(lapScreen);
  screens.push({ texture: lapS.tex, draw: drawCode, canvas: lapCanvas });

  // ---- Teardown internals: real parts at rest, exploded on focus ----
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const teardownParts = [];
  const tdPart = (mesh, home, exploded, labels) => {
    mesh.position.copy(home); laptop.add(mesh);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, opacity: 0, depthTest: false }));
    sprite.scale.set(0.36, 0.09, 1); sprite.renderOrder = 998;
    sprite.position.set(exploded.x, exploded.y + 0.11, exploded.z);
    laptop.add(sprite);
    teardownParts.push({ mesh, home, exploded, sprite, labels });
    return mesh;
  };
  const drawTdLabel = (sprite, text) => {
    const c = hiCanvas(256, 64);
    const x = c.getContext('2d');
    x.fillStyle = 'rgba(10,12,18,0.72)'; x.beginPath(); x.roundRect(4, 6, 248, 52, 26); x.fill();
    x.strokeStyle = 'rgba(92,225,230,0.55)'; x.lineWidth = 2; x.stroke();
    x.fillStyle = '#eafeff'; x.font = 'bold 26px "JetBrains Mono", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, 128, 33);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    if (sprite.material.map) sprite.material.map.dispose();
    sprite.material.map = tex; sprite.material.needsUpdate = true;
  };
  const pcbMat = new THREE.MeshStandardMaterial({ color: 0x173b23, roughness: 0.6 });
  const mobo = tdPart(box(0.34, 0.01, 0.3, pcbMat), V3(-0.09, 0.038, -0.02), V3(0.02, 0.52, -0.02), { fr: 'Carte mère', en: 'Motherboard' });
  tdPart(box(0.05, 0.012, 0.05, new THREE.MeshStandardMaterial({ color: 0x9aa3ad, roughness: 0.25, metalness: 0.8 })),
    V3(-0.04, 0.05, -0.09), V3(-0.06, 0.88, -0.08), { fr: 'CPU', en: 'CPU' });
  const fanGrp = new THREE.Group();
  const fanBody = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.02, 18), new THREE.MeshStandardMaterial({ color: 0x1a1c24, roughness: 0.5 }));
  fanGrp.add(fanBody);
  const fanHub = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.024, 12), new THREE.MeshStandardMaterial({ color: 0x3a3f4e, roughness: 0.4 }));
  fanGrp.add(fanHub);
  const heatpipe = box(0.15, 0.008, 0.028, new THREE.MeshStandardMaterial({ color: 0xb0703c, roughness: 0.35, metalness: 0.7 }));
  heatpipe.position.set(0.1, 0, 0.01); fanGrp.add(heatpipe);
  tdPart(fanGrp, V3(-0.19, 0.045, -0.09), V3(-0.36, 0.68, -0.04), { fr: 'Ventilateur', en: 'Cooling fan' });
  tdPart(box(0.11, 0.008, 0.04, new THREE.MeshStandardMaterial({ color: 0x1e7d3a, roughness: 0.6 })),
    V3(0.02, 0.048, 0.02), V3(0.28, 0.7, 0.0), { fr: 'RAM', en: 'RAM' });
  tdPart(box(0.09, 0.008, 0.032, new THREE.MeshStandardMaterial({ color: 0x23252f, roughness: 0.35, metalness: 0.6 })),
    V3(0.15, 0.045, -0.08), V3(0.46, 0.48, 0.1), { fr: 'SSD', en: 'SSD' });
  tdPart(box(0.045, 0.008, 0.035, new THREE.MeshStandardMaterial({ color: 0x2a3550, roughness: 0.5 })),
    V3(-0.23, 0.042, 0.05), V3(-0.46, 0.44, 0.12), { fr: 'Carte WiFi', en: 'WiFi card' });
  tdPart(box(0.26, 0.022, 0.12, new THREE.MeshStandardMaterial({ color: 0x0d0e13, roughness: 0.55 })),
    V3(0.02, 0.045, 0.13), V3(0.04, 0.27, 0.22), { fr: 'Batterie', en: 'Battery' });
  let tdK = 0, tdTarget = 0, tdLang = 'fr';
  const teardown = {
    set(on) { tdTarget = on ? 1 : 0; },
    setLang(l) { tdLang = l; teardownParts.forEach((p) => drawTdLabel(p.sprite, p.labels[tdLang])); },
  };
  teardown.setLang('fr');

  // the unscrewed bottom cover lies on the floor next to the bench, feet up
  const coverGrp = new THREE.Group(); coverGrp.position.set(1.0, 0.012, 0.3); coverGrp.rotation.y = 0.45; bench.add(coverGrp);
  const cover = box(0.58, 0.012, 0.38, alu); coverGrp.add(cover);
  [[-0.24, -0.15], [0.24, -0.15], [-0.24, 0.15], [0.24, 0.15]].forEach(([x, z]) => {
    const footPad = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.01, 10), M.rubber);
    footPad.position.set(x, 0.011, z); coverGrp.add(footPad);
  });

  interactives.push({
    name: 'workbench', label: { fr: "Atelier · Qu'y a-t-il dans un laptop ?", en: "Workbench · What's inside a laptop?" },
    meshes: [lapBase, lidBack, lapScreen, mobo], focusKey: 'workbench', anchor: new THREE.Vector3(-1.44, 1.65, 2.76),
  });

  // repair props: screwdriver, RAM stick, SSD, parts tray with screws
  const sdHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 10), new THREE.MeshStandardMaterial({ color: 0xff7a45, roughness: 0.5 }));
  sdHandle.rotation.z = Math.PI / 2; sdHandle.rotation.y = 0.4; sdHandle.position.set(0.42, 0.915, 0.22); bench.add(sdHandle);
  const sdShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 8), M.metal);
  sdShaft.rotation.z = Math.PI / 2; sdShaft.rotation.y = 0.4; sdShaft.position.set(0.31, 0.915, 0.175); bench.add(sdShaft);
  const ram = box(0.17, 0.008, 0.05, new THREE.MeshStandardMaterial({ color: 0x1e7d3a, roughness: 0.6 }));
  ram.rotation.y = 0.5; ram.position.set(0.45, 0.905, -0.05); bench.add(ram);
  for (let i = 0; i < 4; i++) {
    const chip = box(0.025, 0.006, 0.03, new THREE.MeshStandardMaterial({ color: 0x0b0c10, roughness: 0.4 }));
    chip.rotation.y = 0.5; chip.position.set(0.42 + Math.cos(0.5) * (i - 1.5) * 0.036, 0.912, -0.035 - Math.sin(0.5) * (i - 1.5) * 0.036); bench.add(chip);
  }
  const ssd = box(0.12, 0.014, 0.085, new THREE.MeshStandardMaterial({ color: 0x23252f, roughness: 0.35, metalness: 0.6 }));
  ssd.rotation.y = -0.3; ssd.position.set(0.32, 0.907, -0.24); bench.add(ssd);
  const tray = box(0.2, 0.025, 0.14, new THREE.MeshStandardMaterial({ color: 0x101218, roughness: 0.8 }));
  tray.position.set(-0.52, 0.9, 0.24); bench.add(tray);
  for (let i = 0; i < 3; i++) {
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.012, 8), M.metal);
    screw.position.set(-0.56 + i * 0.045, 0.918, 0.22 + (i % 2) * 0.04); bench.add(screw);
  }
  // little bench lamp
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.03, 14), M.metal);
  lampBase.position.set(-0.55, 0.915, -0.22); bench.add(lampBase);
  const lampArm = box(0.035, 0.42, 0.035, M.metal);
  lampArm.rotation.z = 0.35; lampArm.position.set(-0.48, 1.11, -0.22); bench.add(lampArm);
  const lampHead = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.14, 14, 1, true), new THREE.MeshStandardMaterial({ color: 0x1a1c24, roughness: 0.4, metalness: 0.5, side: THREE.DoubleSide }));
  lampHead.rotation.z = -0.9; lampHead.position.set(-0.35, 1.28, -0.22); bench.add(lampHead);
  const lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd9a8, toneMapped: false }));
  lampBulb.position.set(-0.31, 1.25, -0.22); bench.add(lampBulb);

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

  // ---------- Mini-Haidar: tiny chibi inhabitant (big head, soft curls) ----------
  const guy = new THREE.Group(); guy.position.set(1.2, 0, 1.4); group.add(guy);
  const skinM = new THREE.MeshStandardMaterial({ color: 0xdca87e, roughness: 0.65 });
  const hoodieM = new THREE.MeshStandardMaterial({ color: 0x3f7f8a, roughness: 0.75 });
  const pantsM = new THREE.MeshStandardMaterial({ color: 0x23252f, roughness: 0.9 });
  const shoeM = new THREE.MeshStandardMaterial({ color: 0xf0ede4, roughness: 0.6 });
  const hairM = new THREE.MeshStandardMaterial({ color: 0x2b1a10, roughness: 0.85 });
  // stubby legs with little white sneakers (pivot at hip)
  const mkLeg = (x) => {
    const pivot = new THREE.Group(); pivot.position.set(x, 0.18, 0); guy.add(pivot);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.08, 4, 10), pantsM);
    leg.position.y = -0.07; pivot.add(leg);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), shoeM);
    shoe.scale.set(1, 0.65, 1.3); shoe.position.set(0, -0.15, 0.015); pivot.add(shoe);
    return pivot;
  };
  const legL = mkLeg(-0.065), legR = mkLeg(0.065);
  // round little hoodie body
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.125, 0.1, 4, 14), hoodieM);
  torso.position.y = 0.32; torso.scale.set(1, 1, 0.88); guy.add(torso);
  [-0.022, 0.022].forEach((sx) => { // drawstrings
    const str = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.055, 6), shoeM);
    str.position.set(sx, 0.36, 0.115); str.rotation.x = 0.12; guy.add(str);
  });
  // stubby arms with round hands (pivot at shoulder)
  const mkArm = (x) => {
    const pivot = new THREE.Group(); pivot.position.set(x, 0.4, 0); guy.add(pivot);
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.038, 0.09, 4, 10), hoodieM);
    arm.position.y = -0.07; pivot.add(arm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 8), skinM);
    hand.position.y = -0.135; pivot.add(hand);
    return pivot;
  };
  const armL = mkArm(-0.155), armR = mkArm(0.155);
  // BIG head — nearly half the little guy
  const headGrp = new THREE.Group(); headGrp.position.y = 0.5; guy.add(headGrp);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 18), skinM);
  head.position.y = 0.13; headGrp.add(head);
  // big sparkly eyes + blush + a little smile
  [-0.062, 0.062].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 10), new THREE.MeshBasicMaterial({ color: 0x1a120c }));
    eye.position.set(ex, 0.15, 0.148); headGrp.add(eye);
    const spark = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    spark.position.set(ex + 0.009, 0.159, 0.169); headGrp.add(spark);
  });
  [-0.105, 0.105].forEach((bx) => {
    const blush = new THREE.Mesh(new THREE.CircleGeometry(0.024, 12),
      new THREE.MeshBasicMaterial({ color: 0xe58a6d, transparent: true, opacity: 0.55 }));
    blush.position.set(bx, 0.095, 0.128); blush.rotation.y = bx > 0 ? 0.55 : -0.55; blush.rotation.x = -0.15; headGrp.add(blush);
  });
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.006, 8, 14, Math.PI * 0.75), new THREE.MeshBasicMaterial({ color: 0x8a4a34 }));
  smile.position.set(0, 0.085, 0.152); smile.rotation.z = Math.PI + (Math.PI * 0.25) / 2 + Math.PI * 0.0; smile.rotation.x = -0.25;
  headGrp.add(smile);
  // hair: one fluffy cloud — a few BIG overlapping puffs with real volume
  // (wider than the head at the top), instead of many small lumps
  const puff = (x, y, z, r, sx = 1, sy = 1, sz = 1) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 16), hairM);
    m.position.set(x, y, z); m.scale.set(sx, sy, sz); headGrp.add(m); return m;
  };
  puff(0, 0.252, -0.02, 0.152, 1.22, 0.98, 1.12);   // main dome — wider than the skull
  puff(-0.132, 0.165, -0.02, 0.092, 1, 1.05, 1);     // left side, over the ear
  puff(0.132, 0.165, -0.02, 0.092, 1, 1.05, 1);      // right side, over the ear
  puff(0, 0.16, -0.125, 0.105, 1.15, 1, 0.9);        // back of the head
  puff(-0.068, 0.235, 0.105, 0.078);                 // fringe left
  puff(0.07, 0.232, 0.103, 0.075);                   // fringe right
  puff(0.002, 0.252, 0.115, 0.08);                   // fringe centre
  // a few gentle bumps riding the dome so the silhouette reads "curly"
  [[-0.1, 0.35, 0.03, 0.062], [0.09, 0.36, -0.01, 0.06], [0, 0.375, -0.06, 0.064],
   [-0.15, 0.29, -0.07, 0.058], [0.16, 0.28, -0.05, 0.056], [0.05, 0.34, 0.09, 0.055], [-0.06, 0.33, -0.12, 0.058]]
    .forEach(([hx, hy, hz, hr]) => puff(hx, hy, hz, hr));
  interactives.push({
    name: 'guy', label: { fr: 'Mini-Haidar · discuter', en: 'Mini-Haidar · chat' },
    meshes: [torso, head], action: { type: 'event', value: 'chat' },
  });

  // wandering brain: idle → stroll / sit at the desk / type on the bench laptop
  const G = {
    mode: 'idle', timer: 1.2, prevT: 0, k: 0,
    target: new THREE.Vector3(), from: new THREE.Vector3(), yawFrom: 0, yawTo: 0, after: null,
  };
  const SEAT = { pos: new THREE.Vector3(0.2, 0.45, -0.44), yaw: Math.PI - 0.25, approach: new THREE.Vector3(0.38, 0, 0.22) };
  const BENCH = { pos: new THREE.Vector3(-0.92, 0, 2.4), yaw: Math.atan2(-0.55, 0.35) };
  const wanderTarget = () => new THREE.Vector3(-1.1 + Math.random() * 3.6, 0, 0.45 + Math.random() * 1.6);
  const startWalk = (to, after) => {
    G.mode = 'walk'; G.target.copy(to); G.after = after;
    G.yawTo = Math.atan2(to.x - guy.position.x, to.z - guy.position.z);
  };
  const guyRest = () => { legL.rotation.x = legR.rotation.x = 0; armL.rotation.x = armR.rotation.x = 0; armR.rotation.z = 0; guy.position.y = 0; guy.rotation.z = 0; };
  // tour guide: where he stands and what he looks at, per focused section
  const GUIDE = {
    laptop:     { pos: new THREE.Vector3(-0.55, 0, 0.25), look: new THREE.Vector3(-1.95, 1.45, -1.5) },
    monitors:   { pos: new THREE.Vector3(1.05, 0, -0.2),  look: new THREE.Vector3(0.55, 2.0, -2.3) },
    whiteboard: { pos: new THREE.Vector3(-0.95, 0, -0.6), look: new THREE.Vector3(-0.85, 3.9, -2.9) },
    serverRack: { pos: new THREE.Vector3(3.5, 0, -0.8),   look: new THREE.Vector3(4.45, 1.6, -2.05) },
    contact:    { pos: new THREE.Vector3(-0.12, 0, -0.75), look: new THREE.Vector3(-0.9, 1.2, -1.38) },
    certs:      { pos: new THREE.Vector3(1.9, 0, -0.75),  look: new THREE.Vector3(1.8, 3.8, -2.9) },
    arcade:     { pos: new THREE.Vector3(-1.55, 0, 1.05), look: new THREE.Vector3(-2.4, 1.7, 0.5) },
    workbench:  { pos: new THREE.Vector3(-0.5, 0, 1.8),   look: new THREE.Vector3(-1.45, 0.95, 2.75) },
  };
  const guyGuide = (key) => {
    const spec = key && GUIDE[key] ? GUIDE[key] : null;
    G.guide = spec;
    if (!spec) {
      if (G.mode === 'watching') { G.mode = 'idle'; G.timer = 0.8; guyRest(); headGrp.rotation.x = 0; }
      return;
    }
    if (G.mode === 'sitting' || G.mode === 'typing') { G.timer = 0; return; } // finish up, idle routes him over
    if (G.mode === 'sitdown' || G.mode === 'situp' || G.mode === 'wave') return; // let it finish
    G.mode = 'idle'; G.timer = 0; guyRest();
  };
  // greet the visitor: turn to the camera (unless seated) and wave
  const guyWave = (camPos) => {
    const yaw = Math.atan2(camPos.x - guy.position.x, camPos.z - guy.position.z);
    G.waveYaw = yaw;
    if (G.mode === 'sitting' || G.mode === 'sitdown' || G.mode === 'situp') { G.waveTimer = 2.0; return; }
    if (G.mode !== 'wave') guyRest();
    G.mode = 'wave'; G.timer = 2.0; G.yawTo = yaw;
  };
  const headToward = (yaw) => {
    let dy = yaw - guy.rotation.y;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    headGrp.rotation.y = Math.max(-0.7, Math.min(0.7, dy));
  };
  function guyUpdate(t) {
    const dt = Math.min(Math.max(t - G.prevT, 0), 0.05); G.prevT = t;
    // ease yaw toward the current heading
    guy.rotation.y += (G.yawTo - guy.rotation.y) * Math.min(1, dt * 8);
    if (G.mode === 'idle') {
      guy.position.y = Math.sin(t * 2.2) * 0.008; // breathing
      headGrp.rotation.y = Math.sin(t * 0.7) * 0.3; // looking around
      G.timer -= dt;
      if (G.timer <= 0) {
        if (G.guide) { // a section is focused — go stand with the visitor
          const spec = G.guide;
          startWalk(spec.pos, () => { if (G.guide === spec) { G.mode = 'watching'; guyRest(); } else { G.mode = 'idle'; G.timer = 0; guyRest(); } });
          return;
        }
        const r = Math.random();
        if (r < 0.45) startWalk(wanderTarget(), () => { G.mode = 'idle'; G.timer = 1.5 + Math.random() * 2.5; guyRest(); });
        else if (r < 0.72) startWalk(SEAT.approach, () => { G.mode = 'sitdown'; G.k = 0; G.from.copy(guy.position); G.yawFrom = guy.rotation.y; });
        else startWalk(BENCH.pos, () => { G.mode = 'typing'; G.timer = 5 + Math.random() * 3; G.yawTo = BENCH.yaw; });
      }
    } else if (G.mode === 'watching') {
      const spec = G.guide;
      if (!spec) { G.mode = 'idle'; G.timer = 0.5; }
      else {
        const dx = spec.look.x - guy.position.x, dz = spec.look.z - guy.position.z;
        G.yawTo = Math.atan2(dx, dz);
        const pitch = Math.atan2(spec.look.y - 0.65, Math.hypot(dx, dz));
        headGrp.rotation.x += (-Math.min(pitch, 1.1) * 0.7 - headGrp.rotation.x) * Math.min(1, dt * 6);
        headGrp.rotation.y = 0;
        guy.position.y = Math.sin(t * 2.2) * 0.008;
        armR.rotation.x = (t % 7) < 1.4 ? -1.6 : 0; // points at it now and then
      }
    } else if (G.mode === 'walk') {
      const d = G.target.clone().sub(guy.position); d.y = 0;
      const dist = d.length();
      if (dist < 0.06) { G.after && G.after(); }
      else {
        guy.position.addScaledVector(d.normalize(), Math.min(dist, dt * 0.65));
        const swing = Math.sin(t * 10) * 0.6;
        legL.rotation.x = swing; legR.rotation.x = -swing;
        armL.rotation.x = -swing * 0.65; armR.rotation.x = swing * 0.65;
        guy.position.y = Math.abs(Math.sin(t * 10)) * 0.022;
        guy.rotation.z = Math.sin(t * 5) * 0.04; // little waddle
      }
    } else if (G.mode === 'sitdown' || G.mode === 'situp') {
      const down = G.mode === 'sitdown';
      G.k = Math.min(1, G.k + dt * 2.2);
      const e = G.k * G.k * (3 - 2 * G.k);
      const kk = down ? e : 1 - e;
      guy.position.lerpVectors(down ? G.from : SEAT.approach, SEAT.pos, kk);
      guy.rotation.y = G.yawFrom + (SEAT.yaw - G.yawFrom) * kk; G.yawTo = guy.rotation.y;
      legL.rotation.x = legR.rotation.x = -1.35 * kk;
      armL.rotation.x = armR.rotation.x = -0.7 * kk;
      if (G.k >= 1) {
        if (down) { G.mode = 'sitting'; G.timer = G.guide ? 0 : 6 + Math.random() * 4; }
        else { G.mode = 'idle'; G.timer = G.guide ? 0 : 1 + Math.random() * 2; guyRest(); G.yawFrom = guy.rotation.y; }
      }
    } else if (G.mode === 'sitting') {
      if (G.waveTimer > 0) { // greet from the chair
        G.waveTimer -= dt;
        armL.rotation.x = -0.7;
        armR.rotation.x = -2.55;
        armR.rotation.z = Math.sin(t * 10) * 0.4;
        headToward(G.waveYaw);
        if (G.waveTimer <= 0) armR.rotation.z = 0;
      } else {
        armL.rotation.x = -0.85 + Math.sin(t * 11) * 0.1; // typing at the desk
        armR.rotation.x = -0.85 + Math.sin(t * 11 + Math.PI) * 0.1;
        headGrp.rotation.y = Math.sin(t * 0.5) * 0.15;
        G.timer -= dt;
      }
      if (G.timer <= 0) { G.mode = 'situp'; G.k = 0; G.yawFrom = SEAT.yaw; }
    } else if (G.mode === 'wave') {
      guy.position.y = Math.sin(t * 2.2) * 0.008;
      armR.rotation.x = -2.55; // arm up
      armR.rotation.z = Math.sin(t * 10) * 0.45; // the wave
      armL.rotation.x = 0;
      headToward(G.waveYaw);
      headGrp.rotation.x = Math.sin(t * 6) * 0.04; // happy little nod
      G.timer -= dt;
      if (G.timer <= 0) { G.mode = 'idle'; G.timer = G.guide ? 0 : 2 + Math.random() * 2; guyRest(); headGrp.rotation.x = 0; }
    } else if (G.mode === 'typing') {
      armL.rotation.x = -1.0 + Math.sin(t * 12) * 0.14; // poking at the bench laptop
      armR.rotation.x = -1.0 + Math.sin(t * 12 + 1.7) * 0.14;
      headGrp.rotation.x = Math.sin(t * 3) * 0.05;
      G.timer -= dt;
      if (G.timer <= 0) { G.mode = 'idle'; G.timer = 1 + Math.random() * 2; guyRest(); headGrp.rotation.x = 0; }
    }
  }

  // ---------- Neon wall sign (glows under bloom) ----------
  const neonCanvas = hiCanvas(512, 256);
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
  // live night sky: fixed stars + skyline, and a shooting star every so often
  const winCanvas = hiCanvas(256, 320);
  const winStars = Array.from({ length: 60 }, () => ({ x: Math.random() * 256, y: Math.random() * 180, a: Math.random() > 0.5 ? 0.6 : 0.33, tw: Math.random() * 6 }));
  const winBuildings = Array.from({ length: 14 }, (_, i) => {
    const w = 14 + Math.random() * 26, h = 60 + Math.random() * 160;
    const wins = [];
    for (let wy = 320 - h + 6; wy < 314; wy += 12) for (let wx = i * 20 + 3; wx < i * 20 + w - 3; wx += 9) if (Math.random() > 0.5) wins.push([wx, wy]);
    return { x: i * 20, w, h, wins };
  });
  let shootingStar = null, nextShot = 5 + Math.random() * 6;
  function paintWindow(t = 0) {
    const x = winCanvas.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 320);
    g.addColorStop(0, '#12224e'); g.addColorStop(0.6, '#1e3268'); g.addColorStop(1, '#33508e');
    x.fillStyle = g; x.fillRect(0, 0, 256, 320);
    winStars.forEach((s) => { // gentle twinkle
      x.globalAlpha = s.a * (0.7 + 0.3 * Math.sin(t * 0.8 + s.tw));
      x.fillStyle = '#ffffff'; x.fillRect(s.x, s.y, 1.5, 1.5);
    });
    x.globalAlpha = 1;
    const mg = x.createRadialGradient(200, 60, 4, 200, 60, 34);
    mg.addColorStop(0, '#dbe6ff'); mg.addColorStop(0.55, '#93a9d6'); mg.addColorStop(1, 'rgba(147,169,214,0)');
    x.fillStyle = mg; x.beginPath(); x.arc(200, 60, 34, 0, Math.PI * 2); x.fill();
    // shooting star
    if (!shootingStar && t > nextShot) {
      shootingStar = { t0: t, x0: 10 + Math.random() * 120, y0: 15 + Math.random() * 55, dx: 1, dy: 0.42 + Math.random() * 0.2 };
    }
    if (shootingStar) {
      const k = (t - shootingStar.t0) / 0.9;
      if (k >= 1) { shootingStar = null; nextShot = t + 8 + Math.random() * 14; }
      else {
        const hx = shootingStar.x0 + k * 150 * shootingStar.dx;
        const hy = shootingStar.y0 + k * 150 * shootingStar.dy;
        const tail = 36 * (1 - k * 0.5);
        const lg = x.createLinearGradient(hx, hy, hx - tail * shootingStar.dx, hy - tail * shootingStar.dy);
        lg.addColorStop(0, `rgba(255,255,255,${0.95 * (1 - k)})`);
        lg.addColorStop(1, 'rgba(255,255,255,0)');
        x.strokeStyle = lg; x.lineWidth = 1.6; x.beginPath();
        x.moveTo(hx, hy); x.lineTo(hx - tail * shootingStar.dx, hy - tail * shootingStar.dy); x.stroke();
      }
    }
    winBuildings.forEach((b) => {
      x.fillStyle = '#0a1024'; x.fillRect(b.x, 320 - b.h, b.w, b.h);
      x.fillStyle = '#ffd98a';
      b.wins.forEach(([wx, wy]) => x.fillRect(wx, wy, 3, 4));
    });
    return winCanvas;
  }
  paintWindow(0);
  const winTex = new THREE.CanvasTexture(winCanvas); winTex.colorSpace = THREE.SRGBColorSpace;
  screens.push({ texture: winTex, draw: paintWindow, canvas: winCanvas });
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
  const posterCanvas = hiCanvas(256, 384);
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
  posterFrame.position.set(3.55, 3.8, -2.96); group.add(posterFrame);
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 1.28), new THREE.MeshBasicMaterial({ map: posterTex, toneMapped: true }));
  poster.position.set(3.55, 3.8, -2.93); group.add(poster);

  // ---------- Certifications board (interactive: certs) ----------
  const certBoard = new THREE.Group(); certBoard.position.set(1.8, 3.85, -2.92); group.add(certBoard);
  const certFrame = box(2.0, 1.3, 0.05, new THREE.MeshStandardMaterial({ color: 0x6b4f3a, roughness: 0.7 }));
  certBoard.add(certFrame);
  const certBack = box(1.85, 1.15, 0.04, new THREE.MeshStandardMaterial({ color: 0xb2a37f, roughness: 1 })); certBack.position.z = 0.02; certBoard.add(certBack);
  const certCols = [0x1ba0d7, 0x0b3d91, 0xff9900, 0xb8975a, 0x00979d];
  certCols.forEach((col, i) => {
    const badge = box(0.3, 0.38, 0.02, new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.2 }));
    badge.position.set(-0.7 + (i % 3) * 0.55, 0.22 - Math.floor(i / 3) * 0.5, 0.05);
    badge.rotation.z = ((i * 37) % 10 - 5) * 0.02; certBoard.add(badge);
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8),
      new THREE.MeshStandardMaterial({ color: [0xd94f4f, 0x5ce1e6, 0xffbd2e][i % 3], roughness: 0.35 }));
    pin.position.set(badge.position.x, badge.position.y + 0.16, 0.075); certBoard.add(pin);
  });
  interactives.push({ name: 'certs', label: { fr: 'Certifications', en: 'Certifications' }, meshes: [certFrame, certBack], focusKey: 'certs', anchor: new THREE.Vector3(1.8, 3.06, -2.82) });

  // ---------- Arcade machine (interactive: extras) ----------
  const arcade = new THREE.Group(); arcade.position.set(-2.5, 0, 0.5); arcade.rotation.y = Math.PI / 2; group.add(arcade);
  const arcMat = new THREE.MeshStandardMaterial({ color: 0x16121f, roughness: 0.5, metalness: 0.3 });
  const arcBody = box(1.0, 2.3, 0.8, arcMat); arcBody.position.y = 1.15; arcade.add(arcBody);
  // marquee: dark hood with a backlit title strip, like a real cabinet
  const arcHood = box(1.04, 0.34, 0.6, arcMat); arcHood.position.set(0, 2.32, 0.12); arcade.add(arcHood);
  const mqCanvas = hiCanvas(512, 128);
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
  const phCanvas = hiCanvas(128, 256);
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

  // ---------- Rubik's cube: real stickers, starts scrambled, click = solve ----------
  const rubik = new THREE.Group(); rubik.position.set(2.3, 1.42, -1.7); group.add(rubik);
  const stickerM = {};
  [['px', 0xff3b30], ['nx', 0xff9500], ['py', 0xffffff], ['ny', 0xffcc00], ['pz', 0x34c759], ['nz', 0x0a84ff]]
    .forEach(([k, col]) => { stickerM[k] = new THREE.MeshStandardMaterial({ color: col, roughness: 0.55 }); });
  const innerM = new THREE.MeshStandardMaterial({ color: 0x15161c, roughness: 0.6 });
  const cubies = [];
  for (let ix = -1; ix <= 1; ix++) for (let iy = -1; iy <= 1; iy++) for (let iz = -1; iz <= 1; iz++) {
    // BoxGeometry material order: +x, -x, +y, -y, +z, -z — sticker only on outside faces
    const mats = [
      ix === 1 ? stickerM.px : innerM, ix === -1 ? stickerM.nx : innerM,
      iy === 1 ? stickerM.py : innerM, iy === -1 ? stickerM.ny : innerM,
      iz === 1 ? stickerM.pz : innerM, iz === -1 ? stickerM.nz : innerM,
    ];
    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.085, 0.085), mats);
    cube.position.set(ix * 0.09, iy * 0.09, iz * 0.09); rubik.add(cube); cubies.push(cube);
  }
  interactives.push({
    name: 'rubik', label: { fr: "Rubik's cube · résoudre", en: "Rubik's cube · solve" },
    meshes: cubies, action: { type: 'event', value: 'rubik' },
  });
  const AXES = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
  const snapCubie = (c) => c.position.set(
    Math.round(c.position.x / 0.09) * 0.09, Math.round(c.position.y / 0.09) * 0.09, Math.round(c.position.z / 0.09) * 0.09);
  const sliceOf = (axis, layer) => {
    const ai = { x: 0, y: 1, z: 2 }[axis];
    return cubies.filter((c) => Math.abs(c.position.getComponent(ai) - layer) < 0.02);
  };
  const applyTurnInstant = ({ axis, layer, dir }) => {
    const av = AXES[axis];
    const qd = new THREE.Quaternion().setFromAxisAngle(av, dir * Math.PI / 2);
    sliceOf(axis, layer).forEach((c) => {
      c.position.applyAxisAngle(av, dir * Math.PI / 2); snapCubie(c);
      c.quaternion.premultiply(qd);
    });
  };
  const randomMove = () => ({
    axis: 'xyz'[Math.floor(Math.random() * 3)],
    layer: [-0.09, 0, 0.09][Math.floor(Math.random() * 3)],
    dir: Math.random() < 0.5 ? 1 : -1,
  });
  let rubikHistory = []; // moves applied since last solved state
  for (let i = 0; i < 8; i++) { const m = randomMove(); rubikHistory.push(m); applyTurnInstant(m); } // starts scrambled
  let rubikQueue = [], rubikTurn = null, rubikBounce = 0, rubikMode = null;
  const rubikSolve = () => {
    if (rubikTurn || rubikQueue.length || rubikBounce > 0) return;
    if (rubikHistory.length) { // undo the scramble, last move first
      rubikMode = 'solve';
      rubikQueue = rubikHistory.slice().reverse().map((m) => ({ ...m, dir: -m.dir }));
    } else { // already solved → shuffle it again for the next visitor
      rubikMode = 'scramble';
      rubikQueue = Array.from({ length: 8 }, randomMove);
    }
  };
  function rubikUpdate(adt) {
    if (!rubikTurn && rubikQueue.length) {
      const m = rubikQueue.shift();
      rubikTurn = {
        ...m, p: 0,
        cubs: sliceOf(m.axis, m.layer).map((c) => ({ c, p0: c.position.clone(), q0: c.quaternion.clone() })),
      };
    }
    if (rubikTurn) {
      rubikTurn.p = Math.min(1, rubikTurn.p + adt / (rubikMode === 'scramble' ? 0.13 : 0.22));
      const e = rubikTurn.p * rubikTurn.p * (3 - 2 * rubikTurn.p);
      const ang = e * (Math.PI / 2) * rubikTurn.dir;
      const av = AXES[rubikTurn.axis];
      const qd = new THREE.Quaternion().setFromAxisAngle(av, ang);
      rubikTurn.cubs.forEach(({ c, p0, q0 }) => {
        c.position.copy(p0).applyAxisAngle(av, ang);
        c.quaternion.copy(q0).premultiply(qd);
      });
      if (rubikTurn.p >= 1) {
        rubikTurn.cubs.forEach(({ c }) => snapCubie(c));
        if (rubikMode === 'scramble') rubikHistory.push({ axis: rubikTurn.axis, layer: rubikTurn.layer, dir: rubikTurn.dir });
        rubikTurn = null;
        if (!rubikQueue.length) {
          if (rubikMode === 'solve') { rubikHistory = []; rubikBounce = 1; } // ta-da!
          rubikMode = null;
        }
      }
    }
    if (rubikBounce > 0) {
      rubikBounce -= adt * 1.6;
      rubik.scale.setScalar(1 + Math.sin((1 - Math.max(rubikBounce, 0)) * Math.PI) * 0.3);
      if (rubikBounce <= 0) rubik.scale.setScalar(1);
    }
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
    whiteboard: { pos: V(-0.85, 4.05, 0.8), target: V(-0.85, 3.9, -2.9),  panel: 'research' },
    serverRack: { pos: V(4.45, 2.4, 0.85), target: V(4.45, 1.5, -2.05),   panel: 'infra' },
    contact:    { pos: V(-0.5, 2.5, 0.35), target: V(-0.9, 1.18, -1.38),  panel: 'contact' },
    certs:      { pos: V(1.8, 3.95, 0.8),  target: V(1.8, 3.85, -2.9),    panel: 'certs' },
    arcade:     { pos: V(0.7, 2.1, 0.9),   target: V(-2.2, 1.65, 0.5),    panel: 'extras' },
    workbench:  { pos: V(0.6, 2.15, 1.5),  target: V(-1.45, 1.3, 2.75),   panel: 'laptop' },
  };

  // ---------- Per-frame motion ----------
  let lastPaint = -1, animPrev = 0;
  function animate(t) {
    const adt = Math.min(Math.max(t - animPrev, 0), 0.05); animPrev = t;
    rubikUpdate(adt);
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
    guyUpdate(t);
    // laptop teardown: parts drift between assembled and exploded positions
    tdK += (tdTarget - tdK) * 0.07;
    const tdE = tdK * tdK * (3 - 2 * tdK);
    teardownParts.forEach((p, i) => {
      p.mesh.position.lerpVectors(p.home, p.exploded, tdE);
      p.mesh.position.y += Math.sin(t * 1.6 + i * 1.1) * 0.01 * tdE; // gentle float
      p.mesh.scale.setScalar(1 + tdE * 0.55); // parts grow a touch so they read next to their labels
      p.sprite.material.opacity = Math.max(0, tdE - 0.3) / 0.7;
    });
    lid.rotation.x = -0.32 - tdE * 1.1; // lid reclines flat so the parts rise clear of it
    neonMat.opacity = 0.85 + Math.sin(t * 9) * 0.12 + (Math.random() < 0.02 ? -0.4 : 0); // subtle flicker
    const dp = dust.geometry.attributes.position; const arr = dp.array;
    for (let i = 0; i < arr.length; i += 3) { arr[i + 1] += 0.0025; if (arr[i + 1] > 6) arr[i + 1] = 0; arr[i] += Math.sin(t + i) * 0.0006; }
    dp.needsUpdate = true;
    dust.rotation.y = t * 0.01;
  }

  return { group, screens, interactives, foci, animate, arcadeScreen, teardown, guy: { wave: guyWave, guide: guyGuide }, rubikSolve };
}
