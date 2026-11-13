import { GROUPS, BACKGROUNDS } from './config.js';
import { $, el, toast } from './helpers.js';
import { backgroundCss, imageCss } from './theme.js';
import { state, allTargets, groupById, save, ui } from './state.js';
import { renderRail, renderSearchBar, select } from './sidebar.js';

export function drawer(open) {
  $('overlay').toggleAttribute('data-open', open);
  $('drawer').toggleAttribute('data-open', open);
  $('drawer').toggleAttribute('inert', !open);   // closed drawer must not be tabbable
  $('drawer').setAttribute('aria-hidden', String(!open));
}

export function applyBackground() {
  const bg = BACKGROUNDS.find(b => b.id === state.background) || BACKGROUNDS[0];
  const root = document.documentElement.style;
  root.setProperty('--bg-base', bg.colors[0]);   // sidebar, cards and panels are tinted from this
  root.setProperty('--page-bg', state.backgroundImage ? imageCss(state.backgroundImage) : backgroundCss(bg));
  document.querySelectorAll('[data-bg]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.bg === state.background && !state.backgroundImage)));
}

export function renderSwatches() {
  const root = $('swatches');
  root.replaceChildren();
  BACKGROUNDS.forEach(b => {
    const s = el('button', { className: 'h-[35px] w-[42px] rounded-[9px] border-2 border-transparent aria-pressed:border-accent-soft aria-pressed:outline-2 aria-pressed:outline-accent/25', type: 'button', title: b.label });
    s.dataset.bg = b.id;
    s.setAttribute('aria-label', b.label);
    s.style.background = `linear-gradient(135deg,${b.colors[0]},${b.colors[1]})`;
    s.addEventListener('click', () => { state.background = b.id; state.backgroundImage = ''; save(); applyBackground(); });
    root.append(s);
  });
}

function renderManaged() {
  const root = $('managedTargets');
  root.replaceChildren();
  state.custom.forEach(t => {
    const del = el('button', { className: 'border-0 bg-transparent text-[11px] text-accent-soft', type: 'button', textContent: 'Remove' });
    del.addEventListener('click', () => {
      state.custom = state.custom.filter(x => x.id !== t.id);
      if (state.defaultId === t.id) state.defaultId = 'google';
      if (ui.activeId === t.id) ui.activeId = state.defaultId;
      save(); renderAll();
    });
    root.append(el('div', { className: 'flex items-center justify-between gap-2.5 border-b border-white/5 py-[9px] text-xs' }, el('span', {}, t.name, el('small', { className: 'ml-1.5 text-faint', textContent: groupById(t.group).singular })), del));
  });
}

function renderDefaults() {
  const s = $('defaultTarget');
  s.replaceChildren();
  GROUPS.forEach(g => {
    const og = el('optgroup', { label: g.label });
    allTargets().filter(t => t.group === g.id).forEach(t => og.append(el('option', { value: t.id, textContent: t.name })));
    s.append(og);
  });
  s.value = state.defaultId;
}

export function renderGroupSelect() {
  $('targetGroup').replaceChildren(...GROUPS.map(g => el('option', { value: g.id, textContent: g.singular })));
}

export function renderAll() { renderRail(); renderSearchBar(); renderManaged(); renderDefaults(); }

function addTarget() {
  const group = $('targetGroup').value, name = $('targetName').value.trim(), url = $('targetUrl').value.trim(), err = $('targetError');
  err.textContent = '';
  if (!name) { err.textContent = 'Enter a name.'; return; }
  if (!url.includes('%s')) { err.textContent = 'The URL must contain %s where the query goes.'; return; }
  let parsed; try { parsed = new URL(url.replaceAll('%s', 'sample')); } catch {}
  if (!parsed || !['https:', 'http:'].includes(parsed.protocol)) { err.textContent = 'Enter a valid HTTP or HTTPS URL.'; return; }
  const id = 'custom-' + (crypto.randomUUID ? crypto.randomUUID() : Date.now());
  state.custom.push({ id, group, name, url });
  save();
  ui.activeId = id;
  renderAll();
  $('targetName').value = ''; $('targetUrl').value = '';
  toast(`${name} added`);
}

export function bindSettings() {
  $('openSettings').onclick = () => drawer(true);
  $('closeSettings').onclick = () => drawer(false);
  $('overlay').onclick = () => drawer(false);
  $('addTarget').onclick = addTarget;
  $('defaultTarget').onchange = e => { state.defaultId = e.target.value; save(); select(state.defaultId); toast('Default updated'); };
  $('removeBackground').onclick = () => { state.background = 'default'; state.backgroundImage = ''; save(); applyBackground(); $('backgroundFile').value = ''; toast('Background reset'); };
  $('backgroundFile').onchange = e => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith('image/') || f.size > 3 * 1024 * 1024) { toast('Choose an image smaller than 3 MB.'); return; }
    const r = new FileReader();
    r.onload = () => { state.backgroundImage = r.result; save(); applyBackground(); toast('Background updated'); };
    r.readAsDataURL(f);
  };
}
