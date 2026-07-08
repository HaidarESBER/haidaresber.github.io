// The 3D experience: scene, camera, controls, raycasting, camera focus.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { gsap } from 'gsap';
import { buildRoom } from './Room.js';

// On slow GPUs (or throttled tabs) GSAP's lag smoothing caps each frame's
// progress, which can stall the intro/camera tweens indefinitely. Follow
// wall-clock time instead — a jump-to-end beats a camera that never arrives.
gsap.ticker.lagSmoothing(0);

// Pulsing ring texture for the clickable-object markers.
function ringTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  x.strokeStyle = '#bffbfd'; x.lineWidth = 7; x.shadowColor = '#5ce1e6'; x.shadowBlur = 16;
  x.beginPath(); x.arc(64, 64, 40, 0, Math.PI * 2); x.stroke();
  x.fillStyle = '#eafeff'; x.beginPath(); x.arc(64, 64, 11, 0, Math.PI * 2); x.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export default class Experience {
  constructor(canvas) {
    this.canvas = canvas;
    this.onFocus = null;   // callback(focusObj|null, interactive)
    this.onHover = null;   // callback(interactive|null, x, y)
    this.onEvent = null;   // callback(name) for non-camera interactions (e.g. the chat guy)
    this.isFocused = false;
    this.isMoving = false;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isTouch = matchMedia('(pointer: coarse)').matches;
    this._sideOffset = { x: 0, y: 0 }; // view shift while the info panel is open (x: desktop side panel, y: mobile bottom sheet)

    this._initRenderer();
    this._initScene();
    this._initCamera();
    this._initLights();
    this._initRoom();
    this._initRaycaster();
    this._initMarkers();
    this._initPost();

    this.arcadeGame = null;
    this._clock = new THREE.Clock();
    this._last = 0;
    addEventListener('resize', this._resize);
    this._resize();
    this._tick();
  }

  // phones pay dearly for the bloom pass — cap their render resolution lower
  _pr() { return Math.min(devicePixelRatio, this.isTouch ? 1.5 : 2); }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(this._pr());
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c12);
    // far plane sits beyond max zoom-out so the room never washes out
    this.scene.fog = new THREE.Fog(0x0a0c12, 22, 60);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  }

  // viewport = the canvas's CSS box (fullscreen in room mode, the aperçu slot on the site)
  _vw() { return this.canvas.clientWidth || innerWidth; }
  _vh() { return this.canvas.clientHeight || innerHeight; }

  _initCamera() {
    this.camera = new THREE.PerspectiveCamera(35, this._vw() / this._vh(), 0.1, 100);
    this.camera.position.set(12, 9, 12);
    this.scene.add(this.camera);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enablePan = false;
    this.controls.minDistance = 5.5;
    this.controls.maxDistance = this.isTouch ? 26 : 15; // portrait needs room to pull back
    this.controls.minPolarAngle = 0.35;
    this.controls.maxPolarAngle = 1.45;
    this.controls.minAzimuthAngle = 0.15;
    this.controls.maxAzimuthAngle = 1.42;
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = 0.35;
    this.controls.enabled = false; // until intro completes
  }

  _initPost() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.setPixelRatio(this._pr());
    this.composer.setSize(this._vw(), this._vh());
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(this._vw(), this._vh()), 0.2, 0.45, 0.95);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    // stop idle auto-rotate on first user interaction
    this.canvas.addEventListener('pointerdown', () => { this.controls.autoRotate = false; }, { once: true });
  }

  _initLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(0xfff0e0, 2.2);
    key.position.set(5, 9, 6); key.castShadow = true;
    const sm = this.isTouch ? 1024 : 2048;
    key.shadow.mapSize.set(sm, sm); key.shadow.camera.far = 30;
    key.shadow.camera.left = -10; key.shadow.camera.right = 10;
    key.shadow.camera.top = 10; key.shadow.camera.bottom = -10;
    key.shadow.bias = -0.0004;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x5ce1e6, 0.9); rim.position.set(-6, 4, -4); this.scene.add(rim);
    const fill = new THREE.PointLight(0xff9a6b, 7, 11, 2); fill.position.set(-1.7, 2.0, -1.5); this.scene.add(fill); // desk-lamp warmth
  }

  _initRoom() {
    this.room = buildRoom();
    this.scene.add(this.room.group);
    this.foci = this.room.foci;
    // shadows + anisotropic filtering so canvas text stays crisp at an angle
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.room.group.traverse((o) => {
      if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
      const map = o.material && o.material.map;
      if (map && map.anisotropy < maxAniso) { map.anisotropy = maxAniso; map.needsUpdate = true; }
    });
  }

  _initRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.meshToInteractive = new Map();
    this.room.interactives.forEach((it) => it.meshes.forEach((m) => this.meshToInteractive.set(m, it)));
    this.hovered = null;
    this._down = new THREE.Vector2();

    this.canvas.addEventListener('pointermove', this._onPointerMove);
    this.canvas.addEventListener('pointerdown', (e) => this._down.set(e.clientX, e.clientY));
    this.canvas.addEventListener('pointerup', this._onPointerUp);
  }

  // Small pulsing rings floating over each clickable object — the room's
  // only discoverability cue on touch screens, a nice affordance everywhere.
  _initMarkers() {
    const tex = ringTexture();
    this.markers = [];
    this.room.interactives.forEach((it) => {
      if (!it.anchor) return;
      const mat = new THREE.SpriteMaterial({ map: tex, color: 0x5ce1e6, transparent: true, opacity: 0, depthTest: false });
      const sprite = new THREE.Sprite(mat);
      sprite.position.copy(it.anchor);
      sprite.scale.setScalar(0.2);
      sprite.renderOrder = 999;
      this.scene.add(sprite);
      this.meshToInteractive.set(sprite, it); // markers are clickable too
      this.markers.push({ sprite, phase: Math.random() * Math.PI * 2 });
    });
    this._markersOn = false; // fade in after the intro
  }

  showMarkers(on) { this._markersOn = on; }

  _animateMarkers(t) {
    const target = this._markersOn && !this.isFocused && !this.isMoving ? 1 : 0;
    this.markers.forEach((m) => {
      const pulse = 0.82 + Math.sin(t * 2.4 + m.phase) * 0.18;
      m.sprite.material.opacity += (target * pulse - m.sprite.material.opacity) * 0.1;
      m.sprite.scale.setScalar(0.19 + Math.sin(t * 2.4 + m.phase) * 0.025);
    });
  }

  _pick(e) {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    this.pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects([...this.meshToInteractive.keys()], false);
    return hits.length ? this.meshToInteractive.get(hits[0].object) : null;
  }

  _onPointerMove = (e) => {
    if (this.isFocused || !this.controls.enabled) { this._setHover(null, e); return; }
    this._setHover(this._pick(e), e);
  };

  _setHover(it, e) {
    if (it === this.hovered) { if (it && this.onHover) this.onHover(it, e.clientX, e.clientY); return; }
    if (this.hovered) this.hovered.meshes.forEach((m) => gsap.to(m.scale, { x: 1, y: 1, z: 1, duration: 0.3 }));
    this.hovered = it;
    if (it) it.meshes.forEach((m) => gsap.to(m.scale, { x: 1.05, y: 1.05, z: 1.05, duration: 0.3 }));
    if (this.onHover) this.onHover(it, e ? e.clientX : 0, e ? e.clientY : 0);
  }

  _onPointerUp = (e) => {
    if (Math.hypot(e.clientX - this._down.x, e.clientY - this._down.y) > 6) return; // drag, not click
    if (this.isFocused || this.isMoving) return;
    const it = this._pick(e);
    if (!it) return;
    if (it.action?.type === 'url') { window.open(it.action.value, '_blank', 'noopener'); return; }
    if (it.action?.type === 'event') { if (this.onEvent) this.onEvent(it.action.value); return; }
    if (it.focusKey) this.focusKey(it.focusKey, it);
  };

  // ---------- Panel-aware framing ----------
  // Shifts the rendered view horizontally so the focused object stays centered
  // in the area left visible by the slide-in panel.
  setSideOffset(px, py = 0) {
    gsap.to(this._sideOffset, { x: px, y: py, duration: this._dur(1.0), ease: 'power3.inOut', onUpdate: () => this._applySideOffset() });
  }

  _applySideOffset() {
    const w = this._vw(), h = this._vh();
    if (Math.abs(this._sideOffset.x) < 1 && Math.abs(this._sideOffset.y) < 1) this.camera.clearViewOffset();
    else this.camera.setViewOffset(w, h, this._sideOffset.x, this._sideOffset.y, w, h);
  }

  _dur(d) { return this.reduced ? 0.01 : d; }

  // Portrait crops the horizontal field of view badly, so wide subjects (dual
  // monitors, wall boards) get clipped. Rather than pull the camera back (which
  // shrinks everything), we WIDEN the vertical FOV on narrow screens — that
  // grows horizontal coverage too, fitting every focus without moving.
  _applyFov() {
    const aspect = this._vw() / this._vh();
    this.camera.aspect = aspect;
    this.camera.fov = aspect >= 0.9 ? 35 : Math.min(58, 35 + (0.9 - aspect) * 42);
    this.camera.updateProjectionMatrix();
  }

  // camera position is unchanged now that FOV handles the fit; kept so existing
  // call sites (intro/focus/unfocus/preview) stay simple.
  _adapt(f) { return f.pos.clone(); }

  // ---------- Camera focus ----------
  focusKey(key, interactive = null) {
    const f = this.foci[key];
    if (!f) return;
    if (this.onFocusStart) this.onFocusStart(key);
    this._setHover(null, { clientX: 0, clientY: 0 });
    this.isFocused = true; this.isMoving = true;
    this.controls.enabled = false; this.controls.autoRotate = false;
    const pos = this._adapt(f);
    gsap.to(this.camera.position, { x: pos.x, y: pos.y, z: pos.z, duration: this._dur(1.3), ease: 'power3.inOut' });
    gsap.to(this.controls.target, {
      x: f.target.x, y: f.target.y, z: f.target.z, duration: this._dur(1.3), ease: 'power3.inOut',
      onUpdate: () => this.controls.update(),
      onComplete: () => { this.isMoving = false; if (this.onFocus) this.onFocus(f, interactive); },
    });
  }

  unfocus() {
    const f = this.foci.home;
    if (this.onFocusStart) this.onFocusStart(null);
    this.isMoving = true;
    this.setSideOffset(0);
    const pos = this._adapt(f);
    gsap.to(this.camera.position, { x: pos.x, y: pos.y, z: pos.z, duration: this._dur(1.2), ease: 'power3.inOut' });
    gsap.to(this.controls.target, {
      x: f.target.x, y: f.target.y, z: f.target.z, duration: this._dur(1.2), ease: 'power3.inOut',
      onUpdate: () => this.controls.update(),
      onComplete: () => { this.isMoving = false; this.isFocused = false; this.controls.enabled = true; },
    });
    if (this.onFocus) this.onFocus(null, null);
  }

  // Fly in on the little guy for a chat — frames him in the upper half on
  // portrait screens so the bottom-sheet chatbox never hides him.
  flyToGuy() {
    const gp = this.room.guy.pos();
    const portrait = this._vw() / this._vh() < 0.9;
    const target = gp.clone(); target.y += portrait ? 0.1 : 0.45;
    const dir = this.camera.position.clone().sub(gp); dir.y = 0;
    if (dir.lengthSq() < 0.01) dir.set(1, 0, 1);
    dir.normalize();
    const pos = target.clone().addScaledVector(dir, portrait ? 3.1 : 2.4);
    pos.y += portrait ? 1.15 : 0.75;
    this._setHover(null, { clientX: 0, clientY: 0 });
    this.isFocused = true; this.isMoving = true;
    this.controls.enabled = false; this.controls.autoRotate = false;
    gsap.to(this.camera.position, { x: pos.x, y: pos.y, z: pos.z, duration: this._dur(1.1), ease: 'power3.inOut' });
    gsap.to(this.controls.target, {
      x: target.x, y: target.y, z: target.z, duration: this._dur(1.1), ease: 'power3.inOut',
      onUpdate: () => this.controls.update(),
      onComplete: () => { this.isMoving = false; },
    });
    return pos;
  }

  // ---------- Intro ----------
  playIntro(done) {
    const f = this.foci.home;
    this.controls.target.copy(f.target);
    const pos = this._adapt(f);
    const tl = gsap.timeline({
      onComplete: () => {
        this.controls.enabled = true;
        this.controls.autoRotate = !this.reduced;
        this.showMarkers(true);
        done && done();
      },
    });
    tl.to(this.camera.position, { x: pos.x, y: pos.y, z: pos.z, duration: this._dur(2.2), ease: 'power3.inOut', onUpdate: () => this.controls.update() });
  }

  _resize = () => {
    const w = this._vw(), h = this._vh();
    this._applyFov();
    this._applySideOffset();
    this.renderer.setSize(w, h, false); // CSS owns the display size
    this.renderer.setPixelRatio(this._pr());
    if (this.composer) { this.composer.setSize(w, h); this.composer.setPixelRatio(this._pr()); }
  };

  // ---------- Render loop control ----------
  // On the landing site the room is a frozen preview: the loop is fully
  // paused (zero GPU/CPU cost) and the canvas keeps its last frame.
  pause() { this.paused = true; }
  resume() {
    if (!this.paused) return;
    this.paused = false;
    this._last = this._clock.getElapsedTime();
    this._tick();
  }
  renderOnce() {
    const t = this._clock.getElapsedTime();
    this.room.animate(t);
    this.controls.update();
    this.composer.render();
  }

  _tick = () => {
    if (this.paused) return; // resume() restarts the loop
    requestAnimationFrame(this._tick);
    const t = this._clock.getElapsedTime();
    const dt = t - this._last; this._last = t;
    this.room.animate(t);
    this._animateMarkers(t);
    // full-rate while playing, ~11fps for the idle attract screen in the room
    if (this.arcadeGame) {
      this._arcAcc = (this._arcAcc || 0) + dt;
      if (this.arcadeGame.enabled || this._arcAcc > 0.09) {
        this.arcadeGame.update(this.arcadeGame.enabled ? dt : this._arcAcc);
        this.room.arcadeScreen.texture.needsUpdate = true;
        this._arcAcc = 0;
      }
    }
    this.controls.update();
    this.composer.render();
  };
}
