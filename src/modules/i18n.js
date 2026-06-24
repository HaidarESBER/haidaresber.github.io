// Language state for the room UI: applies [data-i18n] labels + notifies listeners.
import { content } from '../data/content.js';

let lang = localStorage.getItem('lang') || 'fr';
const listeners = [];

export const getLang = () => lang;
export const onLangChange = (fn) => listeners.push(fn);

function resolve(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

export function applyStatic() {
  const dict = content[lang];
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const val = resolve(dict, el.getAttribute('data-i18n'));
    if (val != null) el.textContent = val;
  });
  document.documentElement.lang = lang;
  document.querySelectorAll('.lang-switch button').forEach((b) =>
    b.classList.toggle('active', b.dataset.lang === lang)
  );
}

export function setLang(next) {
  if (next === lang) return;
  lang = next;
  localStorage.setItem('lang', lang);
  applyStatic();
  listeners.forEach((fn) => fn(lang));
}

export function initLangSwitch() {
  document.querySelectorAll('.lang-switch button').forEach((b) =>
    b.addEventListener('click', () => setLang(b.dataset.lang))
  );
}
