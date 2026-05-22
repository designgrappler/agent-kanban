# Agent Kanban — Sprint Archive

Archive of closed sprints' plan blocks. Each sprint's full block (objective, tracks table, dependency order, DoD, Bridges, and any close-out notes) is moved here on close per the Architect's Sprint Housekeeping mandate. Sprints not yet listed here remain inline-archived in `docs/context/plan.md`.

---

## Archive: Sprint 9 — Backlog Tab (CLOSED 2026-05-21)

### Objective

Stand up the Backlog as the entry point to the north-star core loop: a lightweight surface where humans capture raw ideas before they become executable tasks. Each board gets a dedicated `/boards/:id/backlog` page (own route, not a tab) holding `backlog_items` — priority-tagged (P0–P3), status-tracked (idea / in_planning / consumed / dropped), and rendered grouped by priority with manual ordering inside each section. CRUD is available to humans and lead agents from the browser and from a new `ak backlog` CLI subcommand.

Sprint 9 ships only capture and grooming. Multi-select promotion and the "Create plan" workflow that turns backlog items into tasks remain out of scope and are deferred to Sprint 10.

### Tracks

| ID    | Name                  | Owner   | Status                                  | Notes                                                                 |
|-------|-----------------------|---------|-----------------------------------------|-----------------------------------------------------------------------|
| S9-T1 | Backend + Schema      | Skylar  | DONE — Bandit PASS                      | Migration 0026, repo, Hono routes, auth rules, shared types           |
| S9-T2 | CLI `ak backlog`      | Skylar  | DONE — Bandit PASS                      | `ak backlog add\|list\|update\|delete`, depends on S9-T1               |
| S9-T3 | Frontend Backlog page | Skylar  | DONE — Bandit PASS (E2E waived per Tim) | `/boards/:id/backlog` route, components, hook, Playwright spec        |

### Dependency Order

1. **S9-T1 must merge to `main` first.** It defines the migration, repo, route contracts, auth rules, and shared types that the other two tracks consume.
2. **S9-T2 and S9-T3 land in parallel after S9-T1 merges.** Both consume the same shared types and HTTP contracts; neither blocks the other.

### Definition of Done (Sprint 9)

- [x] Migration `apps/web/migrations/0026_backlog_items.sql` applied locally and committed
- [x] `backlogRepo.ts` thin repo layer (no raw SQL in routes)
- [x] Hono routes: `POST /api/boards/:id/backlog-items`, `GET /api/boards/:id/backlog-items`, `PATCH /api/backlog-items/:id`, `DELETE /api/backlog-items/:id`
- [x] `ROUTE_RULES` updated: write routes → `["user", "agent:leader"]`, GET inherits board-read rule
- [x] Shared types added to `packages/shared/src/` and consumed by web + CLI
- [x] CLI subcommand `ak backlog` implementing `add | list | update | delete`
- [x] Backlog page route `/boards/:id/backlog` registered in the web router
- [x] Components shipped: `BacklogPage`, `BacklogItemCard`, `BacklogItemForm`
- [x] Data hook `useBacklogItems` (load, mutate, optimistic update)
- [x] Priority-grouped rendering (P0/P1/P2/P3 sections, manual reorder within section)
- [x] Backlog entry point in board header — adjacent to board switcher
- [~] Playwright spec covers create / edit / delete flows on the Backlog page — **E2E waived per Tim 2026-05-21**; helper broken since `a4f8f76 feat(auth): require email verification` (2026-05-04), confirmed not a S9-T3 regression by sibling spec failing identically. Repair filed as Sprint 10 P0.
- [x] Vitest unit tests for `backlogRepo` and the four route handlers (auth, validation, happy path, error envelope)
- [x] Full regression green: `pnpm build && pnpm tsc --noEmit && npx vitest run` (2407 passed, 1 skipped, 0 failed)
- [x] All three tracks merged to `main` via PR

**Commits on main:**
- `92721b7` feat(backend): backlog_items schema + repo + routes + auth (S9-T1)
- `1118ff1` Merge S9-T1: backlog_items backend (schema + repo + routes + auth)
- `a8cc034` feat(cli): ak backlog add|list|update|delete (S9-T2)
- `c801ec9` Merge S9-T2: ak backlog CLI (add|list|update|delete)
- `0f76394` fix(biome): anchor worktree/claude ignores and skip generated reports (coupled biome.json fix)
- `09bb26a` feat(web): add backlog page with priority-grouped idea management (S9-T3)
- `75a5675` Merge S9-T3: backlog frontend (page + components + hook + spec)

---

### Sprint 9 Bridges

#### HANDOFF BRIDGE
**Topic:** Sprint 9 Track 1 — Backlog Backend + Schema
**Track:** S9-T1
**Static DNA Check:** Confirmed alignment with AGENTIC.md — thin repo layer (no raw SQL in routes), Hono onError envelope, ROUTE_RULES auth model, owner-scoped data, D1 migration conventions.
**Dynamic DNA State:**
- Product Context: Persist board-scoped backlog items (P0–P3, idea/in_planning/consumed/dropped) so humans and lead agents can capture and groom ideas before they become tasks.
- Current Plan: Sprint 9, Track S9-T1 — must merge before S9-T2 and S9-T3 begin.
- Execution Files:
  - `apps/web/migrations/0026_backlog_items.sql` (new)
  - `apps/web/server/repo/backlogRepo.ts` (new)
  - `apps/web/server/routes/backlogItems.ts` (new)
  - `apps/web/server/auth/routeRules.ts` (update — add three write rules)
  - `apps/web/worker/index.ts` (update — mount routes)
  - `packages/shared/src/backlog.ts` (new — `BacklogItem`, `BacklogItemPriority`, `BacklogItemStatus`, request/response types)
  - `packages/shared/src/index.ts` (update — re-export)
  - `tests/backlogRepo.test.ts` (new)
  - `tests/routes.backlogItems.test.ts` (new)
**Worktree Setup:** `bash scripts/worktree-add.sh .worktrees/s9-t1-backlog-backend track/s9-t1-backlog-backend`
**Verification:** `pnpm build && pnpm tsc --noEmit && npx vitest run tests/backlogRepo.test.ts tests/routes.backlogItems.test.ts`
**Next Step:** Skylar — implement migration 0026, `backlogRepo`, the four route handlers with `["user", "agent:leader"]` write rules, shared types, and unit/integration tests. Open PR to `main`; do not start S9-T2 or S9-T3 work in this worktree.

---

#### HANDOFF BRIDGE
**Topic:** Sprint 9 Track 2 — `ak backlog` CLI Subcommand
**Track:** S9-T2
**Static DNA Check:** Confirmed alignment with AGENTIC.md — CLI uses shared types from `packages/shared`, agent-auth JWT for authenticated calls, consistent command shape with existing `ak get` / `ak create` patterns, install via `bash scripts/install-cli.sh`.
**Dynamic DNA State:**
- Product Context: Give operators and lead agents a terminal-side path to add, list, update, and delete backlog items without opening the browser.
- Current Plan: Sprint 9, Track S9-T2 — starts after S9-T1 is merged to `main`. Lands in parallel with S9-T3.
- Execution Files:
  - `packages/cli/src/commands/backlog.ts` (new — `add | list | update | delete` subcommands)
  - `packages/cli/src/index.ts` (update — register `backlog` command group)
  - `packages/cli/src/api/backlogClient.ts` (new — typed HTTP client wrapping the Sprint 9 routes)
  - `packages/shared/src/backlog.ts` (consume — types from S9-T1)
  - `tests/cli.backlog.test.ts` (new)
**Worktree Setup:** `bash scripts/worktree-add.sh .worktrees/s9-t2-backlog-cli track/s9-t2-backlog-cli`
**Verification:** `bash scripts/install-cli.sh && ak backlog list --board <demo-board-id> -o json && npx vitest run tests/cli.backlog.test.ts`
**Next Step:** Skylar — implement the four `ak backlog` subcommands and their typed client, wire help text, add CLI tests. Confirm S9-T1 is merged to `main` and rebased into the worktree before starting. Open PR to `main`.

---

#### HANDOFF BRIDGE
**Topic:** Sprint 9 Track 3 — Backlog Page Frontend
**Track:** S9-T3
**Static DNA Check:** Confirmed alignment with AGENTIC.md and DESIGN.md — React + Vite + Tailwind + shadcn/ui, no drag-and-drop, human-editable surface (idea status), priority-grouped rendering per Decision 3, header entry point adjacent to board switcher per Decision 6, Playwright E2E coverage for component-touching changes.
**Dynamic DNA State:**
- Product Context: Render the Backlog as its own page (`/boards/:id/backlog`) so humans can capture and groom ideas grouped by priority, with create/edit/delete affordances on idea-status items.
- Current Plan: Sprint 9, Track S9-T3 — starts after S9-T1 is merged to `main`. Lands in parallel with S9-T2.
- Execution Files:
  - `apps/web/src/pages/BacklogPage.tsx` (new — route component)
  - `apps/web/src/components/backlog/BacklogItemCard.tsx` (new)
  - `apps/web/src/components/backlog/BacklogItemForm.tsx` (new)
  - `apps/web/src/components/backlog/BacklogPriorityGroup.tsx` (new — P0/P1/P2/P3 section wrapper)
  - `apps/web/src/hooks/useBacklogItems.ts` (new — load/mutate with optimistic update)
  - `apps/web/src/router.tsx` (update — register `/boards/:id/backlog` route)
  - `apps/web/src/components/board/BoardHeader.tsx` (update — add Backlog entry adjacent to board switcher)
  - `packages/shared/src/backlog.ts` (consume — types from S9-T1)
  - `tests/e2e/backlog.spec.ts` (new — Playwright create/edit/delete)
**Worktree Setup:** `bash scripts/worktree-add.sh .worktrees/s9-t3-backlog-frontend track/s9-t3-backlog-frontend`
**Verification:** `pnpm build && pnpm tsc --noEmit && npx playwright test tests/e2e/backlog.spec.ts`
**Next Step:** Skylar — implement `BacklogPage`, the three components, `useBacklogItems`, register the route, add the header entry point, and ship the Playwright spec covering create/edit/delete. Confirm S9-T1 is merged to `main` and rebased into the worktree before starting. Open PR to `main`.

---

### S9-T3 Track Close-Out (2026-05-21)

**Status:** Implementation complete; verified gates green; E2E proof waived. Merged to main via `75a5675`.

**Decision (Tim, 2026-05-21):** Land S9-T3 without Playwright E2E proof — option 1 approved. Stays consistent with S9-T1 and S9-T2, which merged green without depending on E2E. The Playwright suite has been broken since `a4f8f76 feat(auth): require email verification` (2026-05-04); confirmed not a S9-T3 regression by sibling spec `tests/header/header-elements.spec.ts` failing identically. Helper repair filed as Sprint 10 P0 (see `docs/context/tracks.md` → Sprint 10 Candidates).

**Verified gates for S9-T3:**
- `pnpm check` — clean from project root (408 files) and worktree (414 files); 2 cosmetic biome v2.2.0 warnings on `useBiomeIgnoreFolder` (filed as Sprint 10 P2)
- `pnpm tsc --noEmit` — clean
- `npx vitest run` — 2407 passed, 1 skipped, 0 failed
- `pnpm build` — clean (both `agent_kanban` and `client` envs)

**Coupled commit (landed on main before S9-T3 merge):** `biome.json` fix at project root, commit `0f76394`. Tim previously authorized direct commit to main. Changes:
- `!**/.worktrees` → `!.worktrees/**` (anchored to config root)
- `!**/.claude` → `!.claude/**` (anchored to config root)
- adds `!**/playwright-report` and `!**/test-results` (Playwright report output choked biome with 180KB of generated content)

---

*Sprint 9 archived: 2026-05-21 (CLOSED — all three tracks merged to main; S9-T3 E2E waiver honored; Playwright helper repair queued as Sprint 10 P0; biome warning cleanup queued as Sprint 10 P2.)*
