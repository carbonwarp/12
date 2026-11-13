import { CONFIG } from './config.js';
import { FEED_SOURCES } from './feed-sources.js';
import { $, el, store, getJson, gradientFor, iconTile } from './helpers.js';

const CHIP = 'rounded-full border border-white/12 bg-transparent px-[13px] py-1.5 text-xs text-ink-dim hover:bg-white/6 aria-pressed:border-accent/36 aria-pressed:bg-accent/14 aria-pressed:text-blush';

const feed = { items: [], filter: 'all', updated: 0 };
const sourceById = id => FEED_SOURCES.find(s => s.id === id);

function interleave(lists) {           // round-robin so sources are mixed together
  const out = [];
  for (let i = 0; lists.some(l => i < l.length); i++) lists.forEach(l => { if (i < l.length) out.push(l[i]); });
  return out;
}

export async function loadFeed(force = false) {
  const cache = store.get(CONFIG.feedCacheKey, null);
  if (!force && cache && Date.now() - cache.t < CONFIG.feedTtlMs && cache.items?.length) {
    Object.assign(feed, { items: cache.items, updated: cache.t });
    return renderFeed();
  }
  const btn = $('refreshFeed');
  btn.disabled = true;
  $('feedStatus').textContent = '';
  renderSkeletons();

  const results = await Promise.allSettled(FEED_SOURCES.map(async s =>
    (await s.load()).filter(i => i.title && i.url).slice(0, s.limit).map(i => ({ ...i, sourceId: s.id }))
  ));
  const items = interleave(results.map(r => r.status === 'fulfilled' ? r.value : []));

  if (items.length) {
    Object.assign(feed, { items, updated: Date.now() });
    store.set(CONFIG.feedCacheKey, { t: feed.updated, items });
  } else if (cache?.items?.length) {
    Object.assign(feed, { items: cache.items, updated: cache.t });   // offline: show the last good feed
  }
  btn.disabled = false;
  renderFeed();
}

function renderSkeletons() {
  $('feedGrid').replaceChildren(...Array.from({ length: 8 }, () => el('div', { className: 'aspect-[3/3.1] animate-shimmer rounded-2xl bg-surface bg-[linear-gradient(100deg,#ffffff08_30%,#ffffff12_50%,#ffffff08_70%)] bg-[length:300%_100%] motion-reduce:animate-none' })));
}

function renderChips() {
  const root = $('feedChips');
  root.replaceChildren();
  const present = FEED_SOURCES.filter(s => feed.items.some(i => i.sourceId === s.id));
  if (present.length < 2) return;
  [{ id: 'all', name: 'All' }, ...present].forEach(s => {
    const b = el('button', { className: CHIP, type: 'button', textContent: s.name });
    b.setAttribute('aria-pressed', String(feed.filter === s.id));
    b.addEventListener('click', () => { feed.filter = s.id; renderFeed(); });
    root.append(b);
  });
}

function renderFeed() {
  previewObserver.disconnect();
  if (feed.filter !== 'all' && !feed.items.some(i => i.sourceId === feed.filter)) feed.filter = 'all';
  renderChips();
  const grid = $('feedGrid');
  grid.replaceChildren();
  feed.items.filter(i => feed.filter === 'all' || i.sourceId === feed.filter).forEach(i => grid.append(card(i)));
  $('feedStatus').textContent = feed.items.length
    ? `Updated ${new Date(feed.updated).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    : "Couldn't load the feed. Check your connection and press Refresh.";
}

/* Card thumbnail: gradient + favicon first, cover image fades in on top when it loads. */
function attachImage(media, url) {
  const img = el('img', { className: 'absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-[350ms] data-[ready]:opacity-100', loading: 'lazy', decoding: 'async', referrerPolicy: 'no-referrer', alt: '' });
  img.onload = () => img.toggleAttribute('data-ready', true);
  img.onerror = () => img.remove();
  img.src = url;
  media.append(img);
}

function card(item) {
  const src = sourceById(item.sourceId);
  const host = item.domain || src.host;
  const a = el('a', { className: 'flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-surface transition duration-200 hover:-translate-y-[3px] hover:border-accent/38 hover:shadow-[0_18px_40px_#0004] motion-reduce:transition-none motion-reduce:hover:translate-y-0', href: item.url, rel: 'noopener noreferrer' });
  if (CONFIG.openInNewTab) a.target = '_blank';

  const media = el('div', { className: 'absolute inset-0 grid place-items-center' }, iconTile(host, src.name[0], 'size-[52px] rounded-[15px] text-xl opacity-95 [&>img]:size-8'));
  const pill = el('span', { className: "absolute top-2.5 left-2.5 z-1 flex items-center gap-1.5 rounded-full bg-[#191918]/78 px-[9px] py-1 text-[10px] font-bold tracking-[.4px] text-[#f4f0e8] backdrop-blur-[6px] before:size-1.5 before:rounded-full before:bg-(--pill,#d97757) before:content-['']", textContent: src.name });
  pill.style.setProperty('--pill', src.color);
  const thumb = el('div', { className: 'relative aspect-video overflow-hidden bg-[#3a3935] bg-(image:--thumb-bg)' }, media, pill);
  thumb.style.setProperty('--thumb-bg', gradientFor(item.title + host));

  const body = el('div', { className: 'flex flex-1 flex-col gap-2 px-[15px] pt-3.5 pb-[15px]' }, el('h3', { className: 'line-clamp-3 text-[15px] leading-[1.36] font-[640]', textContent: item.title }));
  if (item.summary) body.append(el('p', { className: 'line-clamp-2 text-xs leading-[1.5] text-muted', textContent: item.summary.replace(/\s+/g, ' ').trim() }));
  body.append(el('div', { className: 'mt-auto pt-1 text-[11px] text-faint', textContent: item.meta || host }));
  a.append(thumb, body);

  if (item.image) attachImage(media, item.image);
  else if (item.needsPreview && CONFIG.fetchPreviewImages) {
    const cached = store.get(CONFIG.ogCacheKey, {})[item.url];
    if (cached) attachImage(media, cached);
    else if (cached === undefined) { a._media = media; a._url = item.url; previewObserver.observe(a); }
  }
  return a;
}

/* Hacker News links have no image in the API, so look one up when the card scrolls into view. */
const previewObserver = new IntersectionObserver(entries => {
  entries.forEach(async e => {
    if (!e.isIntersecting) return;
    previewObserver.unobserve(e.target);
    const url = e.target._url, media = e.target._media;
    try {
      const d = await getJson(`https://api.microlink.io/?url=${encodeURIComponent(url)}`, 8000);
      const image = d?.data?.image?.url || '';
      const cache = store.get(CONFIG.ogCacheKey, {});
      if (Object.keys(cache).length > 300) for (const k in cache) delete cache[k];
      cache[url] = image;
      store.set(CONFIG.ogCacheKey, cache);
      if (image) attachImage(media, image);
    } catch { /* rate-limited or offline: keep the favicon placeholder */ }
  });
}, { rootMargin: '250px' });
