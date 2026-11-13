import { CONFIG, GROUPS, QUICK_LINKS } from './config.js';
import { $, el, hostOf, favicon, iconTile, go } from './helpers.js';
import { allTargets, targetById, groupById, ui } from './state.js';

const ENGINE = 'flex items-center gap-[11px] rounded-[11px] border border-transparent px-2.5 py-2 text-left text-ink-dim hover:bg-white/5 hover:text-ink aria-pressed:border-accent/22 aria-pressed:bg-accent/12 aria-pressed:text-blush max-compact:justify-center max-compact:px-1 max-compact:py-1.5';
const ENGINE_ICON = 'size-7 rounded-[9px] text-xs [&>img]:size-[18px] max-compact:size-[34px] max-compact:[&>img]:size-[21px]';
// on narrow screens the group label collapses into a thin divider (and the first one disappears)
const GROUP_LABEL = 'px-[11px] pb-2.5 text-[10px] font-bold tracking-[1.45px] text-faint uppercase max-compact:mx-2.5 max-compact:mb-2.5 max-compact:h-px max-compact:overflow-hidden max-compact:bg-line max-compact:p-0 max-compact:text-[0px] group-first/rail:max-compact:hidden';

export function renderRail() {
  const root = $('railSections');
  root.replaceChildren();
  GROUPS.forEach(g => {
    const nav = el('nav', { className: 'flex flex-col gap-1' });
    nav.setAttribute('aria-label', g.label);
    allTargets().filter(t => t.group === g.id).forEach(t => {
      const b = el('button', { className: ENGINE, type: 'button', title: t.name });
      b.setAttribute('aria-pressed', String(t.id === ui.activeId));
      b.append(iconTile(hostOf(t.url), t.name[0].toUpperCase(), ENGINE_ICON), el('span', { className: 'truncate text-[13px] font-[550] max-compact:hidden', textContent: t.name }));
      b.addEventListener('click', () => select(t.id));
      nav.append(b);
    });
    root.append(el('section', { className: 'group/rail mb-[18px]' }, el('div', { className: GROUP_LABEL, textContent: g.label }), nav));
  });
}

export function renderSearchBar() {
  const t = targetById(ui.activeId);
  const g = groupById(t.group);
  $('selectedIcon').replaceChildren(hostOf(t.url) ? favicon(hostOf(t.url), t.name[0].toUpperCase()) : document.createTextNode(t.name[0].toUpperCase()));
  $('query').placeholder = g.placeholder;
  $('hintVerb').textContent = g.verb;
  $('selectedName').textContent = t.name;
}

export function select(id) {
  if (!allTargets().some(t => t.id === id)) return;
  ui.activeId = id;
  renderRail();
  renderSearchBar();
  $('query').focus();
}

export function renderQuickLinks() {
  const root = $('quickLinks');
  root.replaceChildren();
  QUICK_LINKS.forEach(q => {
    const a = el('a', { className: 'inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 py-2 pr-3.5 pl-[9px] text-xs text-ink-dim hover:bg-white/8 hover:text-white', href: q.url, rel: 'noopener noreferrer' });
    if (CONFIG.openInNewTab) a.target = '_blank';
    a.append(iconTile(hostOf(q.url), q.name[0], 'size-5 rounded-[7px] text-[10px] [&>img]:size-[13px]'), q.name + ' ↗');
    root.append(a);
  });
}

export function bindSearch() {
  $('searchForm').addEventListener('submit', e => {
    e.preventDefault();
    const q = $('query').value.trim();
    if (q) go(targetById(ui.activeId).url.replaceAll('%s', encodeURIComponent(q)));
  });
}
