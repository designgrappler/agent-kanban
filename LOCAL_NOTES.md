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

**Date:** 2026-05-20

### Cloud Binding Inventory (removed)

| Binding / Feature | Location | Action |
|---|---|---|
| `AE: AnalyticsEngineDataset` | `types.ts`, `metrics.ts` | Removed from Env; `metricsMiddleware` stubbed to no-op |
| `EMAIL: SendEmail` | `types.ts`, `emailService.ts` | Removed from Env; `sendVerificationEmail` now always logs to console |
| `TUNNEL_RELAY: DurableObjectNamespace` | `types.ts`, `routes.ts`, `worker/index.ts` | Removed; `/api/tunnel/ws` returns 501 |
| `CF_ACCOUNT_ID`, `CF_API_TOKEN` | `types.ts`, `metricsRepo.ts` | Removed from Env; `metricsRepo.ts` deleted |
| `MAILS_ADMIN_TOKEN` | `types.ts`, `routes.ts` | Removed from Env; mailbox create/delete calls removed from agent routes |
| `[[analytics_engine_datasets]]` | `wrangler.toml` | Removed |
| `[[send_email]]` | `wrangler.toml` | Removed |
| `[durable_objects]` + `[[migrations]]` | `wrangler.toml` | Removed (TunnelRelay) |
| `[env.staging]` (all sub-blocks) | `wrangler.toml` | Removed |
| `[observability]` | `wrangler.toml` | Removed |
| `[triggers]` (cron) | `wrangler.toml` | Removed (stale detection falls back to write-on-read) |
| `preview_urls` | `wrangler.toml` | Removed |

### What stays

- `[[d1_databases]]` — local D1 via Wrangler (21 migrations applied successfully)
- `[assets]` — Vite SPA serving
- `[limits]` — CPU cap (works locally)
- `ALLOWED_HOSTS` — still needed by betterAuth for OAuth host validation
- Hono API, React UI, betterAuth (GitHub OAuth path untouched)

### Verification Result

- `pnpm dev` started cleanly at `http://localhost:5173/` with no binding errors
- `.wrangler/state/v3/d1/` exists with migrated schema (21 migrations)
- `grep -i "analytics\|mailchannels\|durable" wrangler.toml` → no matches
- Full test suite: 100/101 files pass, 2297/2298 tests pass (1 file intentionally skipped)

---

## T3: GitHub OAuth for local dev

*(to be filled in during T3)*

---

## T4: Smoke Test

*(to be filled in during T4)*
