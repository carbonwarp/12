For faster development without bottle-necks, the mono-repo is structure for packages to be easy built from root which makes it un-favourable at long run. This branch's for refactoring the packages' paths and layout on standard practice.

```text
/packages/
  clearui/
    src/
    nfpm.yaml
    justfile
  ...
```
