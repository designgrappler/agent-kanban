# Agent Kanban — Sprint Plan

---

## Current Sprint: Sprint 16 — Backlog Tab + Daemon Spawn-at-Create (OPEN 2026-05-23)

### Objective

Land the first wedge of the north-star core loop (`Backlog → Plan → Sprint → Tracks → Done`) and close the long-standing daemon onboarding gap left by S13-T4.

Three workstreams: (1) introduce a real backlog data model (`backlog_items` table) with repo + API, (2) ship the Backlog tab UI with multi-select + Create plan trigger, (3) make daemon spawn at board-create time so a brand-new board has a running daemon by default.

This sprint deliberately scopes the backlog feature **without** server-side LLM calls — Create plan emits a clipboard payload (and optional file write) per `north-star.md § Planning Trigger Flow`. Sprint entity (`sprints` table), agent_definitions sync, and full sprint lifecycle remain deferred — only the backlog-half of the loop lands here.

### Tracks

| Track  | Goal                                                                                                                                                                                                                                                                                                                                                | Type            | Owner             | Status     |
|--------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------|-------------------|------------|
| S16-T1 | Backlog data model + repo + API — additive `backlog_items` migration (per north-star.md §Data Model), `backlogItemRepo.ts`, REST endpoints under `/api/backlog-items` (list, create, update, delete, bulk-mark-in-planning) scoped to `board_id`, owner-scoped via existing auth middleware. Schema is additive; no changes to `tasks`, `boards`, or auth. | Code close-gate | Skylar (worktree) | DONE — Bandit PASS, merged 2026-05-23 |
| S16-T2 | Backlog tab UI + planning trigger — new `/boards/:id/backlog` route with priority-grouped list, multi-select checkboxes, create/edit/delete affordances for `idea` items, **Create plan** button that builds the prompt from `north-star.md § Planning Trigger Flow` and copies to clipboard (file-write deferred). DESIGN.md compliance required.   | Code close-gate | Skylar (worktree) | DONE — Bandit PASS, merged 2026-05-23 |
| S16-T3 | Daemon spawn-at-create — when a new board is created and the user has a registered machine, prompt to start the daemon and (on confirm) shell out to the same flow `ak start` uses. Closes the TODO left by S13-T4 in the create-board flow. No changes to daemon internals; only the UI/CLI handoff.                                              | Code close-gate | Skylar (worktree) | DONE — Bandit PASS, merged 2026-05-23 |
| S16-S1 | Env hygiene combo (stretch, deferred from S12-T4) — (a) diagnose + fix `prepare: lefthook install` failure on `pnpm install --frozen-lockfile`; (b) extend `json_query` redaction filter (`refresh_token` + `x-api-key`).                                                                                                                          | Stretch         | Skylar (capacity) | Stretch — no bridge; pick up if T1/T2/T3 land early |

### Dependency Order

```
S16-T1 (backlog data + API) ──┬── S16-T2 (backlog UI; needs T1 endpoints)
                              │
S16-T3 (daemon spawn-at-create) ── independent; touches create-board flow + CLI handoff
                              │
S16-S1 (env hygiene) ───────── stretch; independent of all above
```

T1 must land (or at minimum the API contract must be stable in a worktree Skylar can read from) before T2 begins UI work. T3 is fully parallel-safe with T1/T2 — disjoint files. S16-S1 is stretch, runs only if capacity allows.

### Definition of Done

- [x] **S16-T1 (backlog data + API):**
  - [x] Migration file `apps/web/migrations/<NNNN>_backlog_items.sql` adds the `backlog_items` table per `north-star.md § Data Model` (id, board_id FK, title, description, priority, status, created_at, created_by, consumed_by_sprint_id NULL FK — though sprints table doesn't exist yet, leave the column nullable with no FK constraint; document that the FK lands when `sprints` table arrives).
  - [x] `apps/web/server/repos/backlogItemRepo.ts` with `list({board_id, owner_id})`, `get(id, owner_id)`, `create`, `update`, `delete`, `bulkMarkInPlanning(ids[])`.
  - [x] Routes mounted at `apps/web/server/routes/backlogItems.ts` and registered in the main router. Endpoints: `GET /api/backlog-items?board_id=`, `POST /api/backlog-items`, `PATCH /api/backlog-items/:id`, `DELETE /api/backlog-items/:id`, `POST /api/backlog-items/bulk-mark-in-planning`.
  - [x] All endpoints owner-scoped and auth-gated (user session OR `agent:worker`/`agent:leader` JWT — same model as tasks). Machine tokens may read but not write (mirrors task creation rule).
  - [x] Vitest coverage in `tests/backlogItems.test.ts` — happy path + auth deny + cycle prevention not applicable (no FK to self).
  - [x] `pnpm build && pnpm tsc --noEmit && npx vitest run` clean.
  - [x] Bandit PASS.
- [x] **S16-T2 (backlog tab UI):**
  - [x] DESIGN.md read first; visual decisions match the existing kanban aesthetic (font, color, spacing).
  - [x] New route `/boards/:id/backlog` rendered via existing router; tab linked from board view header next to Tracks.
  - [x] Priority-grouped list (P0 → P3) with multi-select checkboxes per item.
  - [x] Create/edit/delete affordances visible **only** for items with `status = idea` (mirrors the locked-once-claimed rule from CLAUDE.md UI principles).
  - [x] **Create plan** button bulk-marks selected items to `in_planning` via `POST /api/backlog-items/bulk-mark-in-planning`, builds the prompt from `north-star.md § Planning Trigger Flow` step 3, and copies it to the clipboard. File-write delivery is deferred.
  - [x] Playwright E2E spec covering: add backlog item, edit, delete, multi-select + Create plan triggers status transition + clipboard write.
  - [x] `pnpm build && pnpm tsc --noEmit && npx vitest run` clean.
  - [x] Bandit PASS.
- [x] **S16-T3 (daemon spawn-at-create):**
  - [x] After successful board create, if the user has at least one registered machine, show a non-blocking modal: "Start the daemon now?" with a Start button.
  - [x] On Start, the UI displays the exact `ak start --board <id>` command and a one-click "copy to clipboard" affordance. (No browser-side spawning of local processes — that's not possible from a Worker-served SPA. The copy-and-paste handoff fulfills the S13-T4 TODO without crossing the browser↔OS boundary.)
  - [x] If the user has zero registered machines, the modal links to Settings → Daemon connection (the S13-T3 location) instead of to start.
  - [x] Vitest coverage in `tests/createBoardDaemonHandoff.test.tsx` — both branches (has machine / no machine).
  - [x] Playwright E2E spec adds a step to existing create-board flow.
  - [x] `pnpm build && pnpm tsc --noEmit && npx vitest run` clean.
  - [x] Bandit PASS.
- [ ] **S16-S1 (env hygiene, stretch):**
  - [ ] If shipped: lefthook prepare fix verified by `pnpm install --frozen-lockfile` clean run; `json_query` redaction extended to filter `refresh_token` and `x-api-key`.
  - [ ] If not shipped: explicitly noted in close-sprint commentary.

### Circuit-Breaker Risk

**MEDIUM.** T1 introduces a new table — additive, but it's the first schema change since S8 and the migration must apply cleanly to the live `.wrangler/state` DB on dev-server restart. Mitigation: schema reviewed against `north-star.md` and approved by Tim; migration is purely additive (new table, no alters); CLAUDE.md "Migration restart" rule in DoD applies.

T2 has the highest risk of scope drift — Backlog UI is greenfield and DESIGN.md compliance is non-trivial. Mitigation: DESIGN.md is the first read in the T2 bridge; any deviation surfaces in Bandit review. Clipboard-only delivery (no file write) keeps T2 scope tight.

T3 is the lowest risk — UI + clipboard handoff, no daemon internal changes.

### Board Task Creation

**Tim creates four S16 board tasks manually in the browser** (S16-T1, S16-T2, S16-T3, S16-S1) before Skylar begins. Per AGENTIC.md §5, machine tokens cannot create tasks. Title format: `T<N>: <track short description>`. Status: `todo`. The S16-S1 board task can be created with status `todo` and pulled in only if capacity allows.

### Migration Safety + Security Review

- **T1:** Reversible (additive migration; rollback = drop table). Schema sign-off granted by Tim 2026-05-23. No auth/payments surface — endpoints reuse existing owner-scoped auth middleware.
- **T2:** Reversible (UI only, no schema changes). No auth/payments/schema surface.
- **T3:** Reversible (UI + CLI handoff, no schema changes). No auth/payments surface.
- **S16-S1:** Reversible if shipped. No auth/payments/schema surface.

---

## Previous Sprint: Sprint 15 — Agent OS Remediation (OPEN 2026-05-23)

### Objective

Close the Agent OS gaps surfaced by the Sprint 14 diagnostic (`docs/context/findings/s14-agent-os-diagnostic.md`). Three workstreams: (1) fix concrete drift inside agent-kanban, (2) restructure `plan.md` to a per-sprint pattern so context stops rotting, (3) author a clean upstream report for the canonical Agent OS team.

### Tracks

| Track  | Goal                                                                                                                                                                                                                                                                                                          | Type            | Owner              | Status     |
|--------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------|--------------------|------------|
| S15-T1 | agent-kanban config fixes — install canonical skills (`open-sprint`, `report-track-status`, `minify-context`) to `~/.claude/skills/`; rewire CLAUDE.md auto-triggers (`/sprint-open` → `/open-sprint`, `/track-status` → `/report-track-status`); create `docs/context/product.md` from `north-star.md`; correct AGENTIC.md §5 board task endpoint+auth; normalize `bandit.md` model to `sonnet` | Code close-gate | Skylar              | DONE — Bandit PASS, merged 2026-05-23 |
| S15-T2 | plan.md context migration — archive S1–S13 to `docs/context/archive/plan-archive-s1-s13.md`, archive S14 to `docs/context/archive/plan-s14-diagnostic.md`, leave `plan.md` with current sprint only; create `docs/context/handoffs/` for current/future bridges; update `peaches.md` init to reference the archive path | Code close-gate | Skylar (worktree)   | In progress |
| S15-T3 | Agent OS upstream issue report — clean external-facing bug/improvement report at `docs/context/findings/s14-agent-os-upstream-report.md` covering 5 canonical-install gaps from findings §6 with reproduction, severity, proposed fix, backward-compat note | Paper           | Peaches (no Skylar) | DONE — authored 2026-05-23 |

### Dependency Order

```
S15-T1 (config fixes)        ──┐
S15-T2 (plan.md migration)     ├── parallel-safe; T1 and T2 touch disjoint files
S15-T3 (upstream report)     ──┘  paper-only, no merge gate, runs alongside
```

T1 and T2 are independently mergeable. T1 changes user-level skill installs + scoped project files. T2 is structurally destructive to `plan.md` and lives behind a worktree. T3 is paper authored by Peaches in this session — no Skylar, no Bandit, no merge gate.

### Definition of Done

- [ ] **S15-T1 (config fixes):**
  - [ ] `~/.claude/skills/open-sprint.md` present (copied from `~/Developer/agent-skills/claude/skills/open-sprint.md`); `/open-sprint` invokable.
  - [ ] `~/.claude/skills/report-track-status.md` present; `/report-track-status` invokable.
  - [ ] `~/.claude/skills/minify-context.md` present; `/minify-context` invokable.
  - [ ] `CLAUDE.md` auto-trigger table rewritten: `/sprint-open` → `/open-sprint`, `/track-status` → `/report-track-status`.
  - [ ] `docs/context/product.md` exists, summarized from `north-star.md`; `north-star.md` remains in place unchanged.
  - [ ] `AGENTIC.md §5` corrected: endpoint is `POST /api/tasks` with `board_id` in body; machine tokens cannot create tasks (requires user session via browser).
  - [ ] `.claude/agents/bandit.md` frontmatter `model:` line equals `sonnet` (matches canonical QA template).
  - [ ] `pnpm build` and `pnpm tsc --noEmit` clean.
  - [ ] Bandit PASS on the project-tracked files (user-level skills are not git-tracked; Bandit verifies `CLAUDE.md`, `AGENTIC.md`, `.claude/agents/bandit.md`, `docs/context/product.md`).
- [ ] **S15-T2 (plan.md migration):**
  - [ ] `docs/context/archive/plan-archive-s1-s13.md` written first, contains S1–S13 sections (and any pre-S14 bridges) verbatim from `plan.md`.
  - [ ] `docs/context/archive/plan-s14-diagnostic.md` written, contains the S14 section verbatim.
  - [ ] Both archive files committed BEFORE `plan.md` is truncated.
  - [ ] `docs/context/handoffs/` directory created; current S15 bridges (`s15-t01-bridge.md`, `s15-t02-bridge.md`) live there going forward.
  - [ ] `plan.md` reduced to current-sprint-only (this S15 section + a small pointer to archive paths).
  - [ ] `.claude/agents/peaches.md` initialization step updated to reference `docs/context/archive/` so historical context is discoverable.
  - [ ] `pnpm build` and `pnpm tsc --noEmit` unchanged (docs only — should be no-op for code).
  - [ ] Bandit PASS — verifies archive files contain the migrated content and `plan.md` is lean.
- [ ] **S15-T3 (upstream report):**
  - [ ] `docs/context/findings/s14-agent-os-upstream-report.md` written by Peaches in this session.
  - [ ] Each of the 5 canonical-install gaps (findings §6a–6e) documented with: reproduction steps, severity (Critical/High/Medium), proposed fix, backward-compat note.
  - [ ] Document is external-facing — no agent-kanban-specific assumptions, references upstream paths.
  - [ ] No Bandit review (paper track).

### Circuit-Breaker Risk

**LOW–MEDIUM.** T1 is mechanical (copies + small text edits). T3 is authored prose. T2 is the only meaningful risk: truncating `plan.md` is irreversible without git, and we lose history if the archive files aren't written and verified first. Mitigation in the T2 Bridge: archive-then-truncate ordering is mandatory; Tim must explicitly approve before Skylar begins; work runs in a worktree so the main branch is never partially mutated. Any T2 step failure stops the sprint immediately.

### Board Task Creation

Per the AGENTIC.md §5 correction landing in T1: machine tokens cannot create tasks. **Tim will create three S15 board tasks manually in the browser** (S15-T1, S15-T2, S15-T3) before Skylar begins T1/T2. This is itself documentation that the bug we are fixing is real.

### Migration Safety + Security Review

- **T1:** Reversible (skill copies are idempotent; doc edits are git-tracked). No auth/payments/schema surface.
- **T2:** Irreversible without git (archive then truncate). No auth/payments/schema surface. Tim approval granted 2026-05-23.
- **T3:** Paper only. N/A.

---

## Archive Pointer

Sprint history (S1–S13) is archived at `docs/context/archive/plan-archive-s1-s13.md`. Sprint 14 diagnostic is archived at `docs/context/archive/plan-s14-diagnostic.md`. The S14 findings doc remains at `docs/context/findings/s14-agent-os-diagnostic.md`. Current and future Handoff Bridges live in `docs/context/handoffs/`.
