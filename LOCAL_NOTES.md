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

**Date:** 2026-05-20

### OAuth App Setup

- **App name:** agent-kanban-local (Tim's GitHub account)
- **Homepage URL:** `http://localhost:5173`
- **Authorization callback URL:** `http://localhost:5173/api/auth/callback/github`
- **Device flow:** disabled

### .dev.vars location

`apps/web/.dev.vars` (gitignored) — contains:
- `GITHUB_CLIENT_ID` — public OAuth app Client ID
- `GITHUB_CLIENT_SECRET` — OAuth app Client Secret
- `AUTH_SECRET` — randomly generated 32-byte hex secret for better-auth session signing

**Never commit .dev.vars.**

### Env var names (better-auth config)

Confirmed in `apps/web/server/betterAuth.ts`:
- `GITHUB_CLIENT_ID` → `env.GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET` → `env.GITHUB_CLIENT_SECRET`
- `AUTH_SECRET` → `env.AUTH_SECRET`

### Verification Result

- `pnpm dev` started at `http://localhost:5173/`; `.dev.vars` loaded (logged "Using secrets defined in .dev.vars")
- Browser at `http://localhost:5173` → clicked "Start Building" → GitHub OAuth round-trip completed → landed on Machines page authenticated as Tim's GitHub user
- Avatar visible top-right; API calls succeed (no 401)

---

## T4: Smoke Test

**Date:** 2026-05-20

### Board

- URL: `http://localhost:5173/boards/ka4fvp4a`
- Board name: Sprint 4
- Created via `POST /api/boards` (user session auth)

### Tasks Inserted

5 tasks inserted directly via SQLite (task creation requires `agent:worker` identity per ACL — user session not permitted):

| ID | Title | Status |
|---|---|---|
| `smoke-todo` | smoke-test-task-1 (todo) | todo |
| `smoke-progress` | smoke-test-task-1 (in_progress) | in_progress |
| `smoke-review` | smoke-test-task-1 (in_review) | in_review |
| `smoke-done` | smoke-test-task-1 (done) | done |
| `smoke-cancelled` | smoke-test-task-1 (cancelled) | cancelled |

### CLI Verification

`node packages/cli/dist/index.js --help` — prints full `ak` CLI help. Build successful.

### Persistence Test

- Killed dev server (`kill <pids>`)
- Restarted via `pnpm dev`
- Queried D1 SQLite directly: all 5 tasks present with correct status
- **PASSED**

### Board Rendering

- All 5 columns visible (Todo, In Progress, In Review, Done, Cancelled)
- One task card in each column
- GitHub OAuth session active throughout

**Note:** Tasks were pre-seeded at their terminal status; no sequential `todo → in_progress → in_review → done → cancelled` transition was executed on a single task. Board column rendering is confirmed but the status-update API path was not exercised in this smoke test.

### Known Gaps for Sprint 5

- **Task creation API not exercised:** `POST /api/tasks` requires `agent:worker` identity (machine API key with `ak_` prefix). User session auth is blocked by ACL (`auth.ts`). Tasks were inserted via SQLite directly. A real end-to-end CLI flow (`ak start` → agent claim → status transitions) was not run.
- **Status transitions not exercised via API:** The web UI is read-only by design (no status buttons per CLAUDE.md). Transitions require either direct D1 writes or API calls with correct machine/agent identity. Sprint 5 should include a full daemon smoke test once `ak start` is wired up.

### Sprint 4 Status

All tracks DONE. Local dev environment fully operational.
