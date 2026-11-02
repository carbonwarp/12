# Justfile for pulling upstream Filee binaries (x86_64 and arm64)
# and packaging them with nfpm. Run from the directory containing filee/.

version  := "2.2.0"
base_url := "https://github.com/KnifeLemon/Filee/releases/download/v" + version
workdir  := "filee"
upstream := workdir + "/upstream_bin"
dist     := workdir + "/dist"

default: pull_bin

# Download both upstream tarballs into filee/upstream_bin/{x86_64,arm64}/
pull_bin:
    #!/usr/bin/env bash
    set -euo pipefail

    fetch() {
        local dir="{{upstream}}/$1" suffix="$2"
        if [ -d "$dir" ] && [ -n "$(ls -A "$dir")" ]; then
            echo "$1: already present, skipping"
            return
        fi
        mkdir -p "$dir"
        echo "$1: downloading"
        curl -fsSL "{{base_url}}/Filee-{{version}}-linux-$suffix.tar.gz" \
            | tar -xz -C "$dir" --strip-components=1
        chmod +x "$dir/Filee"
    }

    fetch x86_64 x64
    fetch arm64  arm64

# Build the RPM with nfpm (arch: x86_64 or arm64)
package arch="x86_64": pull_bin
    test -f {{workdir}}/filee.py
    mkdir -p {{dist}}
    for fmt in rpm deb; do \
        BIN_DIR={{upstream}}/{{arch}} \
        EXT_FILE={{workdir}}/filee.py \
        ARCH={{ if arch == "x86_64" { "amd64" } else { arch } }} \
        VERSION={{version}} \
            nfpm package -p "$fmt" --config filee.nfpm --target {{dist}}/filee-{{arch}}.$fmt; \
    done
    
package_all: (package "x86_64") (package "arm64")
