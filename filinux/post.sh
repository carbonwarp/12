#!/bin/sh
# Restart Nautilus so it picks up the new/updated extension
pkill -x nautilus >/dev/null 2>&1 || true
exit 0

# Give every existing user in /home a default Filee settings.json
seed=/usr/share/carbonwarp/filee/settings.json
[ -f "$seed" ] || exit 0

for home in /home/*/; do
    home=${home%/}
    [ -d "$home" ] && [ ! -L "$home" ] || continue

    # The home folder's owner is the user
    uid=$(stat -c %u "$home") && gid=$(stat -c %g "$home") || continue
    [ "$uid" -ge 1000 ] || continue

    dest="$home/.config/Filee/settings.json"
    [ -e "$dest" ] && continue

    [ -d "$home/.config" ] || install -d -m 700 -o "$uid" -g "$gid" "$home/.config"
    install -d -o "$uid" -g "$gid" "$home/.config/Filee"
    install -m 644 -o "$uid" -g "$gid" "$seed" "$dest"
done
exit 0
