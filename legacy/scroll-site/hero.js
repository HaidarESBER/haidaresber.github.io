// Fullscreen Three.js shader: an "adversarial signal field" — flowing CSI-style
// interference waves perturbed by noise. A direct visual nod to PhaseShield.
import * as THREE from 'three';

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2  uRes;
  uniform vec2  uMouse;
  uniform float uIntensity;

  // hash + value noise + fbm
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i+vec2(0,0)), hash(i+vec2(1,0)), u.x),
               mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    for(int i=0;i<4;i++){ v += a*noise(p); p *= 2.0; a *= 0.5; }
    return v;
  }

  void main(){
    vec2 uv = vUv;
    float aspect = uRes.x / uRes.y;
    vec2 p = uv;
    p.x *= aspect;

    vec3 cyan  = vec3(0.36, 0.88, 0.90);
    vec3 amber = vec3(1.00, 0.48, 0.27);
    vec3 col = vec3(0.0);

    float t = uTime * 0.12;
    // mouse influence ripple
    vec2 m = uMouse; m.x *= aspect;
    float md = distance(p, m);
    float ripple = 0.035 * sin(md * 22.0 - uTime * 2.2) * exp(-md * 3.0);

    const int LINES = 13;
    for(int i = 0; i < LINES; i++){
      float fi = float(i) / float(LINES - 1);
      float baseY = fi;
      // adversarial perturbation: clean sine + fbm noise
      float wave = sin(p.x * 3.0 + t * 6.0 + fi * 9.0) * 0.045;
      float pert = (fbm(vec2(p.x * 2.0 + t * 4.0, fi * 6.0 + t)) - 0.5) * 0.12;
      float y = baseY + wave + pert + ripple;
      float d = abs(uv.y - y);
      float glow = 0.0026 / (d + 0.0016);
      vec3 lineCol = mix(cyan, amber, smoothstep(0.0, 1.0, fi));
      col += lineCol * glow * (0.5 + 0.5 * sin(t * 3.0 + fi * 6.2831));
    }

    // faint vignette + slight lift
    float vig = smoothstep(1.25, 0.2, distance(uv, vec2(0.5)));
    col *= 0.55 * uIntensity;
    col *= vig;
    col += vec3(0.015, 0.016, 0.024); // base ink tint

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function initHero() {
  const canvas = document.getElementById('webgl');
  if (!canvas) return () => {};

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (e) {
    canvas.style.display = 'none';
    console.warn('WebGL unavailable, hiding shader background.', e);
    return () => {};
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const geo = new THREE.PlaneGeometry(2, 2);
  const uniforms = {
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uIntensity: { value: 1 },
  };
  const mat = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms });
  scene.add(new THREE.Mesh(geo, mat));

  const resize = () => {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w, h);
  };
  resize();
  addEventListener('resize', resize);

  let tmx = 0.5, tmy = 0.5;
  addEventListener('mousemove', (e) => {
    tmx = e.clientX / innerWidth;
    tmy = 1 - e.clientY / innerHeight;
  });

  // pause rendering when tab/scene is off-screen for battery
  let running = true;
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) clock.start(); });

  const clock = new THREE.Clock();
  let raf;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    if (!running) return;
    uniforms.uTime.value = clock.getElapsedTime();
    uniforms.uMouse.value.x += (tmx - uniforms.uMouse.value.x) * 0.04;
    uniforms.uMouse.value.y += (tmy - uniforms.uMouse.value.y) * 0.04;
    renderer.render(scene, camera);
  };
  loop();

  return () => { cancelAnimationFrame(raf); renderer.dispose(); };
}
