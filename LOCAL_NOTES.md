# Local Notes — agent-kanban

## T1: Fork & Local Clone

**Date:** 2026-05-20

### Upstream Commit SHA at Fork Time

```
15db0e1836cc5a6e8df658d89d5e84353d39c34e fix(admin): use table component for users
```

### pnpm Install Result

`pnpm install` completed successfully. 1016 packages resolved.

**Warnings observed:**

- `pnpm` version mismatch: lockfile was generated with pnpm v10.33.0; install ran under v10.33.0 (no conflict). Version update available to 11.1.3.
- Ignored build scripts (require `pnpm approve-builds` to enable): `esbuild@0.25.0`, `esbuild@0.25.12`, `esbuild@0.27.3`, `esbuild@0.27.7`, `lefthook@2.1.5`, `msw@2.13.2`, `sharp@0.34.5`, `workerd@1.20260430.1`.
- These ignored scripts are expected for a first install in a new environment. `esbuild` and `workerd` are required by Wrangler — will be approved before T2/T3 when `pnpm dev` is needed.
- `pnpm` was not present in the environment; installed globally via npm prior to running install.

### Shared Build Result

`pnpm --filter @agent-kanban/shared build` — **PASSED** (exit 0). TypeScript compiled cleanly via `tsc`.

---

## T2: Strip Cloudflare/cloud bindings

*(to be filled in during T2)*

---

## T3: GitHub OAuth for local dev

*(to be filled in during T3)*

---

## T4: Smoke Test

*(to be filled in during T4)*
