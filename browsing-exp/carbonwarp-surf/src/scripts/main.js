import { $ } from './helpers.js';
import { renderQuickLinks, bindSearch } from './sidebar.js';
import { renderSpiral } from './spiral.js';
import { initNotes } from './notes.js';
import { loadFeed } from './feed.js';
import { renderGroupSelect, renderSwatches, applyBackground, renderAll, bindSettings, drawer } from './settings.js';

$('clock').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

renderGroupSelect();
renderSwatches();
applyBackground();
renderAll();
renderQuickLinks();
renderSpiral();
initNotes();
bindSearch();
bindSettings();
loadFeed();

$('scrollCue').onclick = () => $('feed').scrollIntoView({ behavior: 'smooth' });
$('refreshFeed').onclick = () => loadFeed(true);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') drawer(false);
  if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) { e.preventDefault(); $('query').focus(); }
});
