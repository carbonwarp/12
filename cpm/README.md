# Compactful (Carbonwarp) Package Manager (CPM)

**Package management. Made simple. For both users and developers.**

Carbonwarp Package Manager (CPM) is a lightweight package management system designed to simplify software distribution and installation across all Linux distributions.

CPM uses a straightforward repository system. It searches these repositories for available packages and allows users to install and manage software through a unified interface. If a requested package isn't found in the CPM repositories, it falls back to the operating system's native package manager.

```
cpm install firefox # Install a package, also can be used to update if not installed
```

```
cpm update firefox # Update a package
```

```
cpm system update # Update system
cpm package update # update all packages
```
## A Simpler Repository System

Unlike traditional package managers, which often have complex repository structures and metadata systems, CPM keeps things simple.

Each repository is represented by a single file containing package information and download locations. Developers publish version-agnostic releases, eliminating the need for CPM to repeatedly check version numbers to determine the latest available release.

This makes maintaining repositories straightforward and allows developers to distribute software across multiple Linux package formats without maintaining separate repository databases.

## Repository Structure

Repositories are stored and fetched from `/usr/share/cpm/repo/` / `/usr/local/share/cpm/repo/` 

For example, a repository looks as follows:

```crystal
[
  "Name": "Carbonwarp Packages",
  "Items": [
    "cw software": [
      "https://github.com/carbonwarp/12/cw-software-latest/cw-software",
      "rpm"
    ],
    "cw browser": [
      "https://github.com/carbonwarp/12/cw-browser-latest/cw-backgrounds",
      "0",
      "rpm",
      "deb",
      "archlinux"
    ]
  ]
]
```

Each package entry defines its name, download location, architecture compatibility, and supported package formats.

## Cross-Distribution Package Support

CPM uses a common download URL for each package, with the appropriate package extension selected according to the target operating system.

For example, a release published at:

`https://github.com/carbonwarp/12/cw-software-latest/cw-software`

can provide multiple package formats:

- RPM-based distributions: `.rpm`
- Debian-based distributions: `.deb`
- Arch Linux: `.pkg.tar.zst`

CPM automatically selects the appropriate format based on the host operating system.

## Architecture Support

Each package can optionally specify its target architecture using a numeric value before specifing the target hosts:

| Value | Architecture |
|---|---|
| `0` | No architecture restriction (noarch) |
| `1` | x86 |
| `2` | ARM64 |
| `3` | Both x86 and ARM64 |

If the architecture field is omitted, CPM defaults to `0` (architecture-independent).

The architecture identifier is incorporated into the package filename when selecting the appropriate release asset. For example, an RPM package with architecture `1` uses the `.x86_64` designation, but the architecture independent release can just be named pkg.rpm (if both noarch.rpm and just .rpm found, noarch.rpm will be considered architecture independent).

## Supported Platforms

A repository entry can specify up to three supported package formats:

1. RPM
2. Debian
3. Arch Linux

This allows developers to publish one release containing the appropriate packages for all three ecosystems, while CPM handles selecting the correct package for the user's distribution.

## The Goal

CPM aims to make Linux package management less complicated for everyone.

- **For users:** A simple, unified way to discover, install, and manage software.
- **For developers:** An uncomplicated way to distribute applications across Linux distributions.
- **For maintainers:** Lightweight repository definitions without complicated metadata generation or version tracking.

**One repository format. Multiple Linux package ecosystems. Simpler package management.**
