import { CONFIG } from './config.js';

export const $ = id => document.getElementById(id);

export function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  Object.assign(n, props);
  n.append(...kids);
  return n;
}

export const store = {
  get(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } },
  set(key, value)    { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
};

export function hostOf(url) {
  try { return new URL(String(url).replaceAll('%s', 'x')).hostname.replace(/^www\./, ''); } catch { return ''; }
}

export function compact(n) { return new Intl.NumberFormat(undefined, { notation: 'compact' }).format(n || 0); }

export function timeAgo(iso) {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (!isFinite(s)) return '';
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

export function gradientFor(seed) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `linear-gradient(135deg,hsl(${h} 30% 24%),hsl(${(h + 40) % 360} 34% 14%))`;
}

export async function getJson(url, timeout = 9000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } finally { clearTimeout(timer); }
}

/* Favicon image with fallbacks: Google's icon service, then DuckDuckGo's, then a letter. */
export function favicon(host, letter) {
  const img = new Image();
  img.alt = '';
  img.className = 'block object-contain';
  img.decoding = 'async';
  img.referrerPolicy = 'no-referrer';
  const sources = [
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`,
    `https://icons.duckduckgo.com/ip3/${encodeURIComponent(host)}.ico`
  ];
  let i = 0;
  const next = () => {
    if (i < sources.length) img.src = sources[i++];
    else img.replaceWith(document.createTextNode(letter));
  };
  img.onerror = next;
  next();
  return img;
}

export function iconTile(host, letter, cls = '') {
  const t = el('span', { className: `icon-tile ${cls}`.trim() });  // cls sets size + radius
  t.append(host ? favicon(host, letter) : document.createTextNode(letter));
  return t;
}

let toastTimer;
export function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.toggleAttribute('data-show', true);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.toggleAttribute('data-show', false), 2300);
}

export function go(url) {
  if (CONFIG.openInNewTab) window.open(url, '_blank', 'noopener');
  else location.assign(url);
}
