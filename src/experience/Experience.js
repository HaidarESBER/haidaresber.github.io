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
    this.isFocused = false;
    this.isMoving = false;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this._sideOffset = { x: 0 }; // horizontal view offset while the info panel is open

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

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c12);
    this.scene.fog = new THREE.Fog(0x0a0c12, 14, 30);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  }

  _initCamera() {
    this.camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100);
    this.camera.position.set(12, 9, 12);
    this.scene.add(this.camera);

    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enablePan = false;
    this.controls.minDistance = 5.5;
    this.controls.maxDistance = 15;
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
    this.composer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.composer.setSize(innerWidth, innerHeight);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.2, 0.45, 0.95);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    // stop idle auto-rotate on first user interaction
    this.canvas.addEventListener('pointerdown', () => { this.controls.autoRotate = false; }, { once: true });
  }

  _initLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(0xfff0e0, 2.2);
    key.position.set(5, 9, 6); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); key.shadow.camera.far = 30;
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
    // make all room meshes cast/receive shadow where sensible
    this.room.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
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
    this.pointer.x = (e.clientX / innerWidth) * 2 - 1;
    this.pointer.y = -(e.clientY / innerHeight) * 2 + 1;
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
    if (it.focusKey) this.focusKey(it.focusKey, it);
  };

  // ---------- Panel-aware framing ----------
  // Shifts the rendered view horizontally so the focused object stays centered
  // in the area left visible by the slide-in panel.
  setSideOffset(px) {
    gsap.to(this._sideOffset, { x: px, duration: this._dur(1.0), ease: 'power3.inOut', onUpdate: () => this._applySideOffset() });
  }

  _applySideOffset() {
    if (Math.abs(this._sideOffset.x) < 1) this.camera.clearViewOffset();
    else this.camera.setViewOffset(innerWidth, innerHeight, this._sideOffset.x, 0, innerWidth, innerHeight);
  }

  _dur(d) { return this.reduced ? 0.01 : d; }

  // ---------- Camera focus ----------
  focusKey(key, interactive = null) {
    const f = this.foci[key];
    if (!f) return;
    this._setHover(null, { clientX: 0, clientY: 0 });
    this.isFocused = true; this.isMoving = true;
    this.controls.enabled = false; this.controls.autoRotate = false;
    gsap.to(this.camera.position, { x: f.pos.x, y: f.pos.y, z: f.pos.z, duration: this._dur(1.3), ease: 'power3.inOut' });
    gsap.to(this.controls.target, {
      x: f.target.x, y: f.target.y, z: f.target.z, duration: this._dur(1.3), ease: 'power3.inOut',
      onUpdate: () => this.controls.update(),
      onComplete: () => { this.isMoving = false; if (this.onFocus) this.onFocus(f, interactive); },
    });
  }

  unfocus() {
    const f = this.foci.home;
    this.isMoving = true;
    this.setSideOffset(0);
    gsap.to(this.camera.position, { x: f.pos.x, y: f.pos.y, z: f.pos.z, duration: this._dur(1.2), ease: 'power3.inOut' });
    gsap.to(this.controls.target, {
      x: f.target.x, y: f.target.y, z: f.target.z, duration: this._dur(1.2), ease: 'power3.inOut',
      onUpdate: () => this.controls.update(),
      onComplete: () => { this.isMoving = false; this.isFocused = false; this.controls.enabled = true; },
    });
    if (this.onFocus) this.onFocus(null, null);
  }

  // ---------- Intro ----------
  playIntro(done) {
    const f = this.foci.home;
    this.controls.target.copy(f.target);
    const tl = gsap.timeline({
      onComplete: () => {
        this.controls.enabled = true;
        this.controls.autoRotate = !this.reduced;
        this.showMarkers(true);
        done && done();
      },
    });
    tl.to(this.camera.position, { x: f.pos.x, y: f.pos.y, z: f.pos.z, duration: this._dur(2.2), ease: 'power3.inOut', onUpdate: () => this.controls.update() });
  }

  _resize = () => {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this._applySideOffset();
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    if (this.composer) { this.composer.setSize(innerWidth, innerHeight); this.composer.setPixelRatio(Math.min(devicePixelRatio, 2)); }
  };

  _tick = () => {
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
