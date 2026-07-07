// Minimal asset-free sound design via the WebAudio API: soft blips + whoosh.
// The context is only created after a real user gesture (browser autoplay policy).
let ctx = null;
let unlocked = false;
let muted = localStorage.getItem('muted') === '1';

export function unlockAudio() {
  unlocked = true;
  ensure();
}

function ensure() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type = 'sine', gain = 0.06) {
  if (muted || !unlocked) return;
  const ac = ensure();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type; osc.frequency.value = freq;
  g.gain.setValueAtTime(0, ac.currentTime);
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  osc.connect(g); g.connect(ac.destination);
  osc.start(); osc.stop(ac.currentTime + dur);
}

export const sfx = {
  hover: () => tone(880, 0.08, 'sine', 0.025),
  click: () => { tone(523.25, 0.12, 'triangle', 0.05); setTimeout(() => tone(783.99, 0.16, 'triangle', 0.04), 60); },
  whoosh: () => tone(180, 0.4, 'sawtooth', 0.03),
};

export const isMuted = () => muted;
export function toggleMute() {
  muted = !muted;
  localStorage.setItem('muted', muted ? '1' : '0');
  return muted;
}
