# feature/confined-users

## Purpose
This branch moves all users, including root, from unconfined SELinux
domains into confined ones.

## Background
Standard SELinux policy (the targeted policy) was designed around
desktop use, so interactive users and root run as unconfined
(`unconfined_u:unconfined_r:unconfined_t`). Confining them takes more
work than confining system services, because the policy has to
account for everything a user session might legitimately do.

## Scope and limits
Complete confinement is not always achievable. Some workflows (for
example, administration, development tools, and desktop applications)
need broader access than a strict policy allows. Where that happens,
we loosen types and roles deliberately, and only as far as needed.

## Rules for loosening
- Prefer the narrowest fix: a specific allow rule, or a small custom
  type, over a broad grant.
- Never fall back to unconfined domains or permissive mode to make
  something work.
- Document every loosened rule in `docs/exceptions.md`, with what
  needed it and why.
- Revisit exceptions periodically and tighten them when possible.
