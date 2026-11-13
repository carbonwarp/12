import { CONFIG } from './config.js';
import { $, el, store } from './helpers.js';
import { initTodos } from './todos.js';

/* Right-hand panel: notepad tab (autosaves) + to-do tab. */
export function initNotes() {
  const saved = Object.assign({ text: '', open: false, w: 0, h: 0 }, store.get(CONFIG.notesKey, {}));
  const text = $('notesText'), read = $('notesRead'), panel = $('notesPanel'), toggle = $('notesToggle'),
        status = $('notesStatus'), grip = $('notesGrip'), clear = $('notesClear');
  initTodos();
  const MIN = { w: 240, h: 300 };
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const dockMq = window.matchMedia('(min-width: 1280px)');   // wide screens: dock to the right edge and stay open
  function updateDock() {                                    // reserve room so the page never sits under the notes
    document.documentElement.style.setProperty('--dock', !dockMq.matches ? '0px' : panel.hidden ? '22px' : (panel.offsetWidth + 44) + 'px');
  }
  let editing = true;

  function write() {
    if (store.set(CONFIG.notesKey, saved)) return true;
    try { localStorage.removeItem(CONFIG.feedCacheKey); localStorage.removeItem(CONFIG.ogCacheKey); } catch {}
    return store.set(CONFIG.notesKey, saved);
  }
  const label = () => { const n = text.value.length; return `Saved · ${n} char${n === 1 ? '' : 's'}`; };

  function flush() {
    saved.text = text.value;
    status.textContent = write() ? label() : 'Not saved (browser storage blocked)';
  }

  function renderRead() {
    read.replaceChildren();
    read.toggleAttribute('data-empty', !text.value);
    if (!text.value) { read.textContent = 'Nothing here yet.'; return; }
    text.value.split(/(https?:\/\/[^\s<]+)/g).forEach((part, i) => {
      if (i % 2) read.append(el('a', { className: 'text-accent-soft underline', href: part, target: '_blank', rel: 'noopener noreferrer', textContent: part }));
      else read.append(document.createTextNode(part));
    });
  }

  function setMode(edit) {
    editing = edit;
    text.hidden = !edit; read.hidden = edit; clear.hidden = !edit;
    [['modeEdit', edit], ['modeRead', !edit]].forEach(([id, on]) => {
      $(id).setAttribute('aria-pressed', String(on));
    });
    if (edit) text.focus(); else renderRead();
  }

  function setOpen(open) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.title = open ? 'Hide panel' : 'Show panel';
    saved.open = open;
    write();
    updateDock();
    if (open && editing) text.focus();
  }

  // Drag the bottom-left corner to resize. The size is saved and clamped by CSS on small screens.
  function applySize() {
    if (saved.w) panel.style.setProperty('--nw', saved.w + 'px');
    if (saved.h) panel.style.setProperty('--nh', saved.h + 'px');
  }
  grip.addEventListener('pointerdown', e => {
    e.preventDefault();
    grip.setPointerCapture(e.pointerId);
    const r = panel.getBoundingClientRect(), sx = e.clientX, sy = e.clientY;
    const maxW = Math.max(MIN.w, dockMq.matches ? Math.min(560, innerWidth - 796) : Math.min(720, innerWidth - 290));
    const maxH = Math.max(MIN.h, innerHeight - (dockMq.matches ? 48 : 120));
    const move = ev => {
      panel.style.setProperty('--nw', clamp(r.width + (sx - ev.clientX), MIN.w, maxW) + 'px');
      panel.style.setProperty('--nh', clamp(r.height + (ev.clientY - sy), MIN.h, maxH) + 'px');
    };
    const up = () => {
      grip.removeEventListener('pointermove', move);
      grip.removeEventListener('pointerup', up);
      grip.removeEventListener('pointercancel', up);
      const b = panel.getBoundingClientRect();
      saved.w = Math.round(b.width); saved.h = Math.round(b.height);
      write();
    };
    grip.addEventListener('pointermove', move);
    grip.addEventListener('pointerup', up);
    grip.addEventListener('pointercancel', up);
  });

  text.value = saved.text || '';
  status.textContent = label();
  applySize();
  panel.hidden = !saved.open;
  toggle.setAttribute('aria-expanded', String(!!saved.open));
  toggle.title = saved.open ? 'Hide panel' : 'Show panel';
  updateDock();
  dockMq.addEventListener('change', updateDock);
  if (window.ResizeObserver) new ResizeObserver(updateDock).observe(panel);

  toggle.addEventListener('click', () => setOpen(panel.hidden));
  text.addEventListener('input', flush);
  $('modeEdit').addEventListener('click', () => setMode(true));
  $('modeRead').addEventListener('click', () => setMode(false));
  clear.addEventListener('click', () => {
    if (text.value && !confirm('Clear all notes?')) return;
    text.value = ''; flush(); text.focus();
  });
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  window.addEventListener('storage', e => {            // keep other open tabs in sync
    if (e.key !== CONFIG.notesKey || !e.newValue || document.activeElement === text) return;
    try { text.value = saved.text = JSON.parse(e.newValue).text || ''; status.textContent = label(); if (!editing) renderRead(); } catch {}
  });
  document.addEventListener('pointerdown', e => { if (!dockMq.matches && !panel.hidden && !$('notes').contains(e.target)) setOpen(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !dockMq.matches && !panel.hidden) setOpen(false); });
}
