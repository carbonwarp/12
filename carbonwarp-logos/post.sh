#! /usr/bin/env bash
set -euo pipefail

dconf update

echo "done"


plymouth-set-default-theme carbonwarp

KERNEL_VERSION="$(rpm -q kernel-core --queryformat '%{VERSION}-%{RELEASE}.%{ARCH}')"
/usr/bin/dracut --no-hostonly --kver "$KERNEL_VERSION" --reproducible -v --add ostree \
  -f "/usr/lib/modules/$KERNEL_VERSION/initramfs.img"
chmod 0600 "/usr/lib/modules/$KERNEL_VERSION/initramfs.img"
