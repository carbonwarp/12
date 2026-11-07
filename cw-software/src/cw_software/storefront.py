import datetime

import gi

gi.require_version("Gtk", "4.0")
gi.require_version("Gdk", "4.0")
from gi.repository import Gdk, GLib, Gtk, Pango  # noqa: E402

from .feed import FeedManager  # noqa: E402

SIDE = 16  # matches LIST_MARGIN in app.py

BASE_CSS = """
button.cw-tinted { border: none; padding: 0; color: #ffffff; box-shadow: none; }
button.cw-tinted:hover { opacity: 0.93; }
button.cw-tinted:focus-visible { outline: 3px solid alpha(#ffffff, 0.8); outline-offset: -3px; }

button.cw-hero { border-radius: 20px; min-height: 230px;
                 box-shadow: 0 14px 34px -18px rgba(0,0,0,0.6); }
.cw-hero-title { font-size: 32px; font-weight: 800; letter-spacing: -0.02em; }
.cw-hero-sub { font-size: 15px; opacity: 0.92; }
.cw-chip { background: rgba(255,255,255,0.20); border-radius: 999px;
           padding: 3px 12px; font-size: 12px; font-weight: 600; }

button.cw-nav { background: rgba(0,0,0,0.30); color: #ffffff; border: none;
                box-shadow: none; border-radius: 999px; min-width: 36px;
                min-height: 36px; padding: 0; margin: 0 14px; }
button.cw-nav:hover { background: rgba(0,0,0,0.5); }
.cw-dot { background: rgba(255,255,255,0.45); border-radius: 999px;
          min-width: 8px; min-height: 8px; }
.cw-dot.active { background: #ffffff; min-width: 24px; }

button.cw-card { border-radius: 18px; min-height: 150px;
                 box-shadow: 0 10px 26px -16px rgba(0,0,0,0.55); }
.cw-card-label { font-size: 12px; font-weight: 600; opacity: 0.92; }
.cw-card-title { font-size: 22px; font-weight: 800; letter-spacing: -0.015em; }
.cw-card-sub { font-size: 13px; opacity: 0.9; }
"""

_base_provider = None


def _shade(hex_color, factor):
    r, g, b = (int(hex_color[i:i + 2], 16) for i in (1, 3, 5))
    r, g, b = (max(0, min(255, int(c * factor))) for c in (r, g, b))
    return "#%02x%02x%02x" % (r, g, b)


def _tint_class(hex_color):
    return "tint-" + hex_color[1:]


def _tint_css(colors):
    return "\n".join(
        "button.cw-tinted.%s { background-image: linear-gradient(135deg, %s, %s); "
        "background-color: %s; }" % (_tint_class(c), _shade(c, 1.12), _shade(c, 0.62), c)
        for c in sorted(colors))


def _load_css(provider, css):
    if hasattr(provider, "load_from_string"):
        provider.load_from_string(css)
    else:
        provider.load_from_data(css.encode())


def _ensure_base_css():
    global _base_provider
    if _base_provider is None:
        _base_provider = Gtk.CssProvider()
        _load_css(_base_provider, BASE_CSS)
        Gtk.StyleContext.add_provider_for_display(
            Gdk.Display.get_default(), _base_provider,
            Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION)


def _clear(box):
    while (c := box.get_first_child()) is not None:
        box.remove(c)


def _label(text, css, wrap=False, xalign=0.5, ellipsize=True):
    lab = Gtk.Label(label=text, xalign=xalign, wrap=wrap)
    lab.add_css_class(css)
    if ellipsize:
        lab.set_ellipsize(Pango.EllipsizeMode.END)
        lab.set_max_width_chars(1)
        lab.set_hexpand(True)
    return lab


class Carousel(Gtk.Overlay):
    INTERVAL = 7

    def __init__(self, on_open, make_icon):
        super().__init__()
        self._on_open, self._make_icon = on_open, make_icon
        self._items, self._index, self._timer, self._paused = [], 0, 0, False

        self.stack = Gtk.Stack(transition_type=Gtk.StackTransitionType.SLIDE_LEFT_RIGHT,
                               transition_duration=380, hhomogeneous=True,
                               vhomogeneous=True)
        self.set_child(self.stack)

        for icon, align, step in (("go-previous-symbolic", Gtk.Align.START, -1),
                                  ("go-next-symbolic", Gtk.Align.END, 1)):
            btn = Gtk.Button.new_from_icon_name(icon)
            btn.add_css_class("cw-nav")
            btn.set_halign(align)
            btn.set_valign(Gtk.Align.CENTER)
            btn.connect("clicked", lambda _b, s=step: self._step(s, user=True))
            self.add_overlay(btn)
        self.nav_buttons = [c for c in self._overlay_children()]

        self.dots = Gtk.Box(spacing=6, halign=Gtk.Align.CENTER, valign=Gtk.Align.END,
                            margin_bottom=14)
        self.add_overlay(self.dots)

        motion = Gtk.EventControllerMotion()
        motion.connect("enter", lambda *_: setattr(self, "_paused", True))
        motion.connect("leave", lambda *_: setattr(self, "_paused", False))
        self.add_controller(motion)
        self.connect("map", lambda *_: self._start())
        self.connect("unmap", lambda *_: self._stop())

    def _overlay_children(self):
        child = self.get_first_child()
        while child is not None:
            if isinstance(child, Gtk.Button):
                yield child
            child = child.get_next_sibling()

    def set_items(self, items):
        _clear(self.stack)
        _clear(self.dots)
        self._items, self._index = list(items), 0
        for i, item in enumerate(self._items):
            self.stack.add_named(self._slide(item), str(i))
            dot = Gtk.Box()
            dot.add_css_class("cw-dot")
            self.dots.append(dot)
        multi = len(self._items) > 1
        for b in self.nav_buttons:
            b.set_visible(multi)
        self.dots.set_visible(multi)
        self._show(0, animate=False)
        if self.get_mapped():
            self._start()

    def _slide(self, item):
        row = Gtk.Box(spacing=28, halign=Gtk.Align.FILL, hexpand=True,
                      valign=Gtk.Align.CENTER, margin_start=64, margin_end=64)
        row.append(self._make_icon(item, 112))
        text = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=8,
                       valign=Gtk.Align.CENTER, hexpand=True)
        text.append(_label(item["name"], "cw-hero-title", xalign=0))
        if item["tagline"]:
            text.append(_label(item["tagline"], "cw-hero-sub", xalign=0))
        if item.get("badge"):
            chip = _label(item["badge"], "cw-chip", ellipsize=False)
            chip.set_halign(Gtk.Align.START)
            text.append(chip)
        row.append(text)

        btn = Gtk.Button(child=row)
        btn.add_css_class("cw-tinted")
        btn.add_css_class("cw-hero")
        btn.add_css_class(_tint_class(item["color"]))
        btn.connect("clicked", lambda _b, i=item: self._on_open(i))
        return btn

    def _show(self, index, animate=True):
        if not self._items:
            return
        self._index = index % len(self._items)
        if not animate:
            self.stack.set_transition_type(Gtk.StackTransitionType.NONE)
        self.stack.set_visible_child_name(str(self._index))
        self.stack.set_transition_type(Gtk.StackTransitionType.SLIDE_LEFT_RIGHT)
        dot, n = self.dots.get_first_child(), 0
        while dot is not None:
            (dot.add_css_class if n == self._index else dot.remove_css_class)("active")
            dot, n = dot.get_next_sibling(), n + 1

    def _step(self, delta, user=False):
        self._show(self._index + delta)
        if user:
            self._stop()
            self._start()

    def _tick(self):
        if not self._paused:
            self._step(1)
        return True

    def _start(self):
        if not self._timer and len(self._items) > 1:
            self._timer = GLib.timeout_add_seconds(self.INTERVAL, self._tick)

    def _stop(self):
        if self._timer:
            GLib.source_remove(self._timer)
            self._timer = 0


def _app_card(item, on_open, make_icon, label):
    col = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=4, halign=Gtk.Align.FILL,
                  valign=Gtk.Align.END, hexpand=True, margin_start=22, margin_bottom=20)
    top = Gtk.Box(spacing=6, halign=Gtk.Align.START)
    top.append(Gtk.Image.new_from_icon_name("starred-symbolic"))
    top.append(_label(label, "cw-card-label", xalign=0))
    col.append(top)
    col.append(_label(item["name"], "cw-card-title", xalign=0))
    if item["tagline"]:
        sub = _label(item["tagline"], "cw-card-sub", wrap=True, xalign=0, ellipsize=False)
        sub.set_lines(2)
        sub.set_ellipsize(Pango.EllipsizeMode.END)
        sub.set_max_width_chars(1)
        col.append(sub)

    row = Gtk.Box(spacing=8)
    row.append(col)
    icon = make_icon(item, 72)
    icon.set_valign(Gtk.Align.CENTER)
    icon.set_margin_end(22)
    row.append(icon)

    btn = Gtk.Button(child=row, hexpand=True)
    btn.add_css_class("cw-tinted")
    btn.add_css_class("cw-card")
    btn.add_css_class(_tint_class(item["color"]))
    btn.connect("clicked", lambda _b, i=item: on_open(i))
    return btn


class Promo(Gtk.Box):
    """The recommendation area. Call rebuild() whenever the catalog may have changed;
    it is cheap when nothing is different."""

    def __init__(self, win, make_icon, on_open, feed_manager=None):
        super().__init__(orientation=Gtk.Orientation.VERTICAL, spacing=14,
                         margin_start=SIDE, margin_end=SIDE, margin_top=6,
                         margin_bottom=8)
        _ensure_base_css()
        self.win, self._make_icon, self._on_open = win, make_icon, on_open
        self._tint_provider = Gtk.CssProvider()
        Gtk.StyleContext.add_provider_for_display(
            Gdk.Display.get_default(), self._tint_provider,
            Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION + 1)

        self.body = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=14)
        self.append(self.body)
        self.body.set_visible(False)

        heading = Gtk.Label(label="Recommended", xalign=0)
        heading.add_css_class("title-4")
        self.body.append(heading)
        self.carousel = Carousel(on_open, make_icon)
        self.body.append(self.carousel)
        self.cards = Gtk.Box(spacing=14, homogeneous=True)
        self.body.append(self.cards)

        self.feed_manager = feed_manager or FeedManager()
        self._feed, _src = self.feed_manager.load_local()
        self._sig = None
        self.feed_manager.refresh_async(lambda f, s: GLib.idle_add(self._new_feed, f))

    def _new_feed(self, feed):
        self._feed = feed
        self.rebuild()
        return False

    def _resolve(self, items):
        """Only show apps that really exist in the loaded catalog."""
        if not self.win.catalog_ready:
            return []
        return [i for i in items if self.win.find_entry(i)]

    def rebuild(self):
        featured = self._resolve(self._feed["featured"])
        picks = self._resolve(self._feed["apps_of_the_day"])
        today = datetime.date.today().toordinal()
        sig = (tuple(i["id"] for i in featured), tuple(i["id"] for i in picks), today)
        if sig == self._sig:
            return
        self._sig = sig

        colors = {i["color"] for i in featured + picks}
        _load_css(self._tint_provider, _tint_css(colors))

        self.carousel.set_visible(bool(featured))
        if featured:
            self.carousel.set_items(featured)

        _clear(self.cards)
        self.cards.set_visible(bool(picks))
        if picks:
            start = today % len(picks)
            for n in range(min(2, len(picks))):
                self.cards.append(_app_card(picks[(start + n) % len(picks)], self._on_open,
                                            self._make_icon, "App of the day"))
        self.body.set_visible(bool(featured or picks))
