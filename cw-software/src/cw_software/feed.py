import json
import os
import tempfile
import threading
import urllib.request
from pathlib import Path

DEFAULT_COLOR = "#5b6cff"
MAX_BYTES = 512 * 1024
TIMEOUT_SECONDS = 6

DEFAULT_FEED = {
    "version": 1,
    "featured": [
        {"id": "org.mozilla.firefox", "name": "Firefox",
         "tagline": "Fast, private browsing", "color": "#e8672b",
         "badge": "Essential"},
        {"id": "org.kde.krita", "name": "Krita",
         "tagline": "Paint and illustrate with pro brushes", "color": "#3b82c4"},
        {"id": "org.blender.Blender", "name": "Blender",
         "tagline": "Model, animate and render in 3D", "color": "#e0862a"},
        {"id": "org.inkscape.Inkscape", "name": "Inkscape",
         "tagline": "Vector graphics without limits", "color": "#4a5568"},
        {"id": "com.obsproject.Studio", "name": "OBS Studio",
         "tagline": "Record and stream like a pro", "color": "#6b5bd6"},
    ],
    "apps_of_the_day": [
        {"id": "org.videolan.VLC", "name": "VLC",
         "tagline": "Plays practically everything", "color": "#d9791f"},
        {"id": "org.gimp.GIMP", "name": "GIMP",
         "tagline": "Edit photos and images", "color": "#7a5a3a"},
        {"id": "org.libreoffice.LibreOffice", "name": "LibreOffice",
         "tagline": "Documents, sheets and slides", "color": "#2f8f5b"},
        {"id": "org.gnome.Boxes", "name": "Boxes",
         "tagline": "Try other systems in a window", "color": "#2563b8"},
    ],
}


def cache_path():
    base = os.environ.get("XDG_CACHE_HOME") or str(Path.home() / ".cache")
    return Path(base) / "cw-software" / "feed.json"


def configured_url():
    url = os.environ.get("CW_FEED_URL", "").strip()
    if not url:
        conf = Path(os.environ.get("XDG_CONFIG_HOME") or Path.home() / ".config")
        try:
            lines = (conf / "cw-software" / "feed.url").read_text().splitlines()
            url = lines[0].strip() if lines else ""
        except OSError:
            url = ""
    return url or None


def _valid_color(value):
    if isinstance(value, str) and len(value) == 7 and value[0] == "#":
        try:
            int(value[1:], 16)
            return value.lower()
        except ValueError:
            pass
    return DEFAULT_COLOR


def _clean_items(raw):
    items = []
    if not isinstance(raw, list):
        return items
    for entry in raw:
        if not isinstance(entry, dict):
            continue
        app_id = str(entry.get("id") or "").strip()
        name = str(entry.get("name") or "").strip()
        if not app_id or not name:
            continue
        item = {
            "id": app_id,
            "name": name,
            "tagline": str(entry.get("tagline") or "").strip(),
            "icon": str(entry.get("icon") or app_id).strip(),
            "color": _valid_color(entry.get("color")),
        }
        badge = str(entry.get("badge") or "").strip()
        if badge:
            item["badge"] = badge
        items.append(item)
    return items


def normalize(data):
    """Return a clean feed dict, or None if `data` has nothing usable."""
    if not isinstance(data, dict):
        return None
    feed = {
        "version": 1,
        "featured": _clean_items(data.get("featured")),
        "apps_of_the_day": _clean_items(data.get("apps_of_the_day")),
    }
    if not feed["featured"] and not feed["apps_of_the_day"]:
        return None
    # Fill a missing section from the defaults so the layout never has holes.
    for key in ("featured", "apps_of_the_day"):
        if not feed[key]:
            feed[key] = _clean_items(DEFAULT_FEED[key])
    return feed


class FeedManager:
    def __init__(self, url=None, cache_file=None):
        self.url = url if url is not None else configured_url()
        self.cache_file = Path(cache_file) if cache_file else cache_path()
        self._lock = threading.Lock()

    # -- local ------------------------------------------------------------
    def load_cached(self):
        try:
            return normalize(json.loads(self.cache_file.read_text()))
        except (OSError, ValueError):
            return None

    def load_local(self):
        """Fast, offline. Returns (feed, source) with source 'cache' or 'default'."""
        if self.url:
            cached = self.load_cached()
            if cached:
                return cached, "cache"
        return normalize(DEFAULT_FEED), "default"

    def _save_cache(self, feed):
        try:
            self.cache_file.parent.mkdir(parents=True, exist_ok=True)
            fd, tmp = tempfile.mkstemp(dir=self.cache_file.parent, suffix=".tmp")
            with os.fdopen(fd, "w") as fh:
                json.dump(feed, fh, indent=2)
            os.replace(tmp, self.cache_file)
        except OSError:
            pass

    # -- remote -----------------------------------------------------------
    def fetch(self):
        """Blocking. Returns a normalized feed or raises on any failure."""
        if not self.url or not self.url.lower().startswith(("http://", "https://")):
            raise ValueError("feed URL must be http(s)")
        req = urllib.request.Request(
            self.url, headers={"User-Agent": "cw-software", "Accept": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
            body = resp.read(MAX_BYTES + 1)
        if len(body) > MAX_BYTES:
            raise ValueError("feed too large")
        feed = normalize(json.loads(body.decode("utf-8")))
        if feed is None:
            raise ValueError("feed has no usable items")
        return feed

    def refresh_async(self, callback):
        """Fetch in a thread. callback(feed, 'network') runs in that thread
        only on success; on any failure nothing happens (offline = keep
        showing cache/default)."""
        if not self.url:
            return

        def work():
            try:
                with self._lock:
                    feed = self.fetch()
                    self._save_cache(feed)
            except Exception:
                return
            callback(feed, "network")

        threading.Thread(target=work, name="cw-feed", daemon=True).start()
