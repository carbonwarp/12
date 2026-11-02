import os
import shutil
import subprocess
import gi

for _ver in ("4.1", "4.0", "3.0"):
    try:
        gi.require_version("Nautilus", _ver)
        break
    except ValueError:
        continue  # wrong version, or already loaded by nautilus-python

from gi.repository import Nautilus, GObject

FILEE = "/usr/lib/carbonwarp/filee/Filee"
SEED = "/usr/share/carbonwarp/filee/skel/.config/Filee"  # placeholder path


def _seed_settings():
    """Copy the pre-made first-run settings into the user's config if missing."""
    config = os.environ.get("XDG_CONFIG_HOME") or os.path.expanduser("~/.config")
    dest = os.path.join(config, "Filee")
    if not os.path.exists(dest) and os.path.isdir(SEED):
        os.makedirs(config, exist_ok=True)
        shutil.copytree(SEED, dest)


class FileeExtension(GObject.GObject, Nautilus.MenuProvider):
    def _launch(self, menu, files):
        paths = [p for p in (f.get_location().get_path() for f in files) if p]
        if not paths:
            return
        _seed_settings()
        subprocess.Popen([FILEE, "--convert", *paths], start_new_session=True)

    def get_file_items(self, *args):
        files = args[-1]  # works for both the 3.0 and 4.0 signatures
        files = [f for f in files if f.get_uri_scheme() == "file"]
        if not files:
            return []

        item = Nautilus.MenuItem(
            name="FileeExtension::Convert",
            label="Convert",
            tip="Convert the selected files to any possible formats",
        )
        item.connect("activate", self._launch, files)
        return [item]
