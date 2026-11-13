import { $, el, getJson, hostOf, compact, timeAgo } from './helpers.js';

/* Feed sources. All allow browser (CORS) requests with no sign-in.
   load() returns [{ title, url, image, summary, meta, domain, needsPreview }]. */
export const FEED_SOURCES = [
  {
    id: 'hn', name: 'Hacker News', color: '#ff6600', host: 'news.ycombinator.com', limit: 12,
    async load() {
      const d = await getJson('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30');
      return d.hits.filter(h => h.title).map(h => ({
        title: h.title,
        url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
        image: null,
        needsPreview: !!h.url,
        domain: h.url ? hostOf(h.url) : 'news.ycombinator.com',
        meta: `▲ ${h.points || 0} · ${h.num_comments || 0} comments`
      }));
    }
  },
  {
    id: 'devto', name: 'DEV', color: '#8b8fff', host: 'dev.to', limit: 8,
    async load() {
      const d = await getJson('https://dev.to/api/articles?top=7&per_page=15');
      return d.map(a => ({
        title: a.title, url: a.url, image: a.cover_image || a.social_image,
        summary: a.description, domain: 'dev.to',
        meta: `${a.user?.name || 'DEV'} · ${a.reading_time_minutes} min read · ♥ ${a.positive_reactions_count}`
      }));
    }
  },
  {
    id: 'space', name: 'Spaceflight', color: '#4fb3ff', host: 'spaceflightnewsapi.net', limit: 8,
    async load() {
      const d = await getJson('https://api.spaceflightnewsapi.net/v4/articles/?limit=12');
      return d.results.map(a => ({
        title: a.title, url: a.url, image: a.image_url, summary: a.summary,
        domain: hostOf(a.url), meta: `${a.news_site} · ${timeAgo(a.published_at)}`
      }));
    }
  },
  {
    id: 'wiki', name: 'Wikipedia', color: '#c8c8c8', host: 'wikipedia.org', limit: 8,
    async load() {
      const pad = n => String(n).padStart(2, '0');
      const path = d => `${d.getUTCFullYear()}/${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())}`;
      let data = null;
      for (const back of [0, 1, 2]) {
        try { data = await getJson(`https://en.wikipedia.org/api/rest_v1/feed/featured/${path(new Date(Date.now() - back * 864e5))}`); break; } catch {}
      }
      if (!data) throw new Error('wikipedia unavailable');
      const page = a => a.content_urls?.desktop?.page;
      const big = u => u && u.replace(/\/(\d+)px-/, '/500px-');
      const out = [];
      if (data.tfa) out.push({
        title: data.tfa.titles?.normalized || data.tfa.title, url: page(data.tfa),
        image: big(data.tfa.thumbnail?.source), summary: data.tfa.description || data.tfa.extract,
        domain: 'wikipedia.org', meta: 'Featured article today'
      });
      (data.mostread?.articles || [])
        .filter(a => a.thumbnail && !/^(Main_Page|Special:|Wikipedia:|Portal:|File:|Help:)/.test(a.title))
        .slice(0, 7)
        .forEach(a => out.push({
          title: a.titles?.normalized || a.title, url: page(a), image: big(a.thumbnail.source),
          summary: a.description || '', domain: 'wikipedia.org', meta: `Trending · ${compact(a.views)} views`
        }));
      return out;
    }
  },
  {
    id: 'nasa', name: 'NASA APOD', color: '#fc3d21', host: 'nasa.gov', limit: 1,
    async load() {
      const d = await getJson('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
      if (d.media_type !== 'image') return [];
      return [{
        title: d.title, url: 'https://apod.nasa.gov/apod/astropix.html', image: d.url,
        summary: d.explanation, domain: 'nasa.gov', meta: 'Astronomy picture of the day'
      }];
    }
  }
];
