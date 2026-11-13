/* Settings, data lists and tunables. Edit this file to change what the page shows. */

export const CONFIG = {
  storageKey:   'homepage-settings-v2',
  notesKey:     'homepage-notes-v1',
  todosKey:     'homepage-todos-v1',
  feedCacheKey: 'homepage-feed-v2',
  ogCacheKey:   'homepage-og-v1',
  feedTtlMs:    20 * 60 * 1000,   // reuse the feed for 20 minutes
  openInNewTab: false,            // true = search results and cards open in a new tab
  fetchPreviewImages: true        // look up preview images for Hacker News links
};

export const GROUPS = [
  { id: 'search', label: 'Search engines', singular: 'Search engine', placeholder: 'Search the web…', verb: 'Searching with' },
  { id: 'ai',     label: 'AI',             singular: 'AI assistant',  placeholder: 'Ask anything…',  verb: 'Asking' }
];

// %s is replaced by the query. Icons come from the site's favicon.
export const BUILTIN_TARGETS = [
  { id: 'google',     group: 'search', name: 'Google',       url: 'https://www.google.com/search?q=%s' },
  { id: 'duckduckgo', group: 'search', name: 'DuckDuckGo',   url: 'https://duckduckgo.com/?q=%s' },
  { id: 'bing',       group: 'search', name: 'Bing',         url: 'https://www.bing.com/search?q=%s' },
  { id: 'brave',      group: 'search', name: 'Brave Search', url: 'https://search.brave.com/search?q=%s' },
  { id: 'ecosia',     group: 'search', name: 'Ecosia',       url: 'https://www.ecosia.org/search?q=%s' },
  { id: 'wikipedia',  group: 'search', name: 'Wikipedia',    url: 'https://en.wikipedia.org/w/index.php?search=%s' },

  { id: 'claude',     group: 'ai',     name: 'Claude',       url: 'https://claude.ai/new?q=%s' },
  { id: 'duckai',     group: 'ai',     name: 'Duck.ai',      url: 'https://duck.ai/?q=%s' },
  { id: 'leo',        group: 'ai',     name: 'Brave Leo',    url: 'https://search.brave.com/ask?q=%s' },
  { id: 'chatgpt',    group: 'ai',     name: 'ChatGPT',      url: 'https://chatgpt.com/?q=%s' }
];

export const QUICK_LINKS = [
  { name: 'Test your network speed', url: 'https://www.speedtest.net/' }
];

export const BACKGROUNDS = [
  { id: 'default', label: 'Default', colors: ['#182628', '#284246', '#172326'] },
  { id: 'violet',  label: 'Violet',  colors: ['#211d28', '#3b3042', '#241f2b'] },
  { id: 'copper',  label: 'Copper',  colors: ['#262624', '#2d2c29', '#222321'] },
  { id: 'ember',   label: 'Ember',   colors: ['#2b211d', '#503328', '#251d19'] }
];
