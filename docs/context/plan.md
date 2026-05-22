# Agent Kanban — Sprint Plan

---

## Current Sprint: None — Sprint 9 CLOSED 2026-05-21; Sprint 10 not yet opened

Sprint 9 closed 2026-05-21 with all three tracks (S9-T1, S9-T2, S9-T3) merged to main. The full Sprint 9 plan block — objective, tracks, dependency order, DoD, the three Handoff Bridges, and the S9-T3 close-out note — has been moved to `docs/archive/sprint-archive.md`. Track-table archive: `docs/archive/historical_tracks.md`.

Queued for the next sprint open: see `docs/context/tracks.md` → Sprint 10 Candidates (P0 Playwright helper repair, P1 Agent OS install gap, P2 Biome lint warnings cleanup).

*Last updated: 2026-05-21 (Sprint 9 CLOSED — full plan block archived to `docs/archive/sprint-archive.md`.)*

---

## Archive: Sprint 8 — Sprints + Tracks Foundation (CLOSED 2026-05-21)

**Objective:** Land the data + API + UI scaffolding for the north-star architecture (see `docs/context/north-star.md`). Make `Sprint` a first-class entity with a number, theme, and `planning → active → closed` lifecycle. Give every task a `sprint_id` and per-sprint `track_number` so cards display as `S{n}-T{m}` (e.g. `S8-T1`). Backfill synthetic Sprint 4–7 rows so this sprint lands on number 8. Rename the **TODO** column to **TRACKS** and surface the sprint header on the board view. CLI gains `ak sprint open|close|list`.

This sprint is intentionally narrow: foundation only. Backlog tab, planning trigger, agent definition sync, settings reorg, and crypto deprecation are scheduled for Sprints 9–13 per the approved sequence in `north-star.md`.

---

## Tracks

| Track | Goal | Status |
|---|---|---|
| S8-T1 | Backend: `sprints` table + `tasks.sprint_id` + `tasks.track_number`; backfill Sprints 4–7; sprint repo + routes | DONE — Bandit PASS |
| S8-T2 | CLI: `ak sprint open|close|list` commands | DONE — Bandit PASS |
| S8-T3 | Frontend: TODO→TRACKS rename, `SprintHeader` banner, `S{n}-T{m}` label on TaskCard, `useSprint` hook | DONE — Bandit PASS |

---

## Dependency order

```
S8-T1 (backend foundation) → S8-T2 (CLI consumes routes)
S8-T1 (backend foundation) → S8-T3 (frontend consumes routes)
S8-T2 ∥ S8-T3 (parallel after S8-T1 lands on main)
```

---

## Definition of Done (Sprint 8)

- [x] **S8-T1:**
  - [x] Migration creates `sprints` table per `north-star.md` schema (id, board_id, number, theme, status, opened_at, closed_at, created_by). UNIQUE(board_id, number).
  - [x] Migration adds `tasks.sprint_id` (TEXT NULL FK), `tasks.track_number` (INTEGER NULL). UNIQUE(sprint_id, track_number) where sprint_id IS NOT NULL.
  - [x] Backfill SQL inserts synthetic rows for Sprint 4, 5, 6, 7 on the legacy/demo board(s) so `ak sprint open` lands on number 8 next. Synthetic rows carry `status='closed'` and `theme` matching the archive headers in `tracks.md`. Existing tasks from those sprints are NOT migrated (per `north-star.md` migration strategy — Sprint 7 tasks T18–T24 may be backfilled to `sprint_id` of the synthetic Sprint 7 row; earlier sprints remain documentation-only).
  - [x] `apps/web/server/sprintRepo.ts` — `createSprint`, `closeSprint`, `getSprint`, `listSprintsByBoard`, `getActiveSprint`. No raw SQL outside the repo.
  - [x] Routes: `POST /api/boards/:id/sprints` (creates with `status=planning`, auto-increments `number` per board), `PATCH /api/sprints/:id` (status transitions only: `planning → active → closed`, no skip), `GET /api/boards/:id/sprints?status=`.
  - [x] Shared types updated in `packages/shared/src/types.ts`: `Sprint`, `SprintStatus`, additions to `Task`.
  - [x] Vitest unit + integration tests for repo + routes (Miniflare D1, no mocks). Status-transition guard tested. Number-uniqueness tested.
  - [x] `pnpm build && pnpm tsc --noEmit && npx vitest run` exits zero.
  - [x] Bandit PASS.
- [x] **S8-T2:**
  - [x] `ak sprint open <theme> [--board <id>]` — POSTs to `/api/boards/:id/sprints`, transitions immediately to `active`. Prints the resulting `S{number}` label.
  - [x] `ak sprint close [<id>] [--board <id>]` — closes the active sprint (no id needed if exactly one active sprint on the board).
  - [x] `ak sprint list [--board <id>] [--status <s>]` — table output, `-o json` supported.
  - [x] `bash scripts/install-cli.sh` refreshes the local CLI; smoke `ak sprint list` against a running stack.
  - [x] Vitest unit tests for command parsers.
  - [x] Bandit PASS.
- [x] **S8-T3:**
  - [x] **TODO → TRACKS:** column header rename in `apps/web/src/components/Column.tsx` and any dependent strings in `apps/web/src/routes/BoardPage.tsx`. `task.status` enum value remains `todo` in the DB — UI label only.
  - [x] `apps/web/src/components/SprintHeader.tsx` — new component. Banner above the columns showing active sprint theme, status badge, and a **Close Sprint** button visible only when status=active and all tracks are in `done` or `cancelled`. Empty state when no active sprint (CTA: "Open a sprint via `ak sprint open`").
  - [x] `apps/web/src/hooks/useSprint.ts` — `useActiveSprint(boardId)` (TanStack Query, `["sprint", boardId, "active"]`), `useCloseSprint`.
  - [x] `apps/web/src/components/TaskCard.tsx` — display `S{sprint.number}-T{track_number}` chip when both are set; fall back to existing rendering otherwise.
  - [x] Playwright E2E: open sprint via API, render board, verify TRACKS column header + S8-T1 chip on a seeded task.
  - [x] `pnpm build && pnpm tsc --noEmit && npx vitest run` exits zero.
  - [x] Bandit PASS.
- [x] All three tracks merged to `main` via PR.

---

## Sprint 8 Bridges

### HANDOFF BRIDGE — S8-T1
**Topic:** Backend foundation — `sprints` table, task FK, backfill, repo + routes
**Track:** S8-T1
**Specialist:** Skylar
**Static DNA Check:** Aligned with AGENTIC.md (D1 migrations, repo layer pattern, Hono routes, Miniflare-backed tests). New table; no auth changes; no new identity types. Owner scoping via `boards.owner_id` (sprints inherit through board_id).
**Dynamic DNA State:**
- **Product Context:** Today, "sprint" is a doc concept in `tracks.md`. We need it as a row so the UI can show a banner, the CLI can open/close one, and tasks can carry a per-sprint track number. Backfilling 4–7 makes the next sprint number 8 (matching the archive).
- **Current Plan:** Sprint 8 → S8-T1 in this file.
- **Execution Files:**
  - `apps/web/migrations/NNNN_sprints.sql` — new migration (next ordinal)
  - `apps/web/server/sprintRepo.ts` — new
  - `apps/web/server/routes/sprints.ts` — new (or wire into existing routes index)
  - `apps/web/worker/index.ts` — register routes
  - `packages/shared/src/types.ts` — add `Sprint`, `SprintStatus`; extend `Task`
  - `tests/sprintRepo.test.ts`, `tests/sprintRoutes.test.ts` — new

**Worktree Setup:** `bash scripts/worktree-add.sh .worktrees/s8-t1-backend track/s8-t1-sprints-foundation`

**Verification:**
1. `pnpm build && pnpm tsc --noEmit && npx vitest run` — all green.
2. Migration applied locally; `sqlite3 .wrangler/state/.../db.sqlite "SELECT number, theme, status FROM sprints ORDER BY number;"` shows synthetic 4–7 rows.
3. `curl -X POST .../api/boards/<id>/sprints -d '{"theme":"foo"}'` returns a sprint with `number=8`.
4. Bandit QA.

**Next Step:** Skylar — start by reading `apps/web/migrations/` for naming/style and `apps/web/server/taskRepo.ts` for repo conventions. Draft the migration first, get the schema right, then build the repo + routes on top.

---

### HANDOFF BRIDGE — S8-T2
**Topic:** CLI sprint commands (`open`, `close`, `list`)
**Track:** S8-T2
**Specialist:** Skylar
**Depends on:** S8-T1 merged
**Static DNA Check:** Aligned — `packages/cli/` is the right home; existing `ak get/create board` commands set the pattern. No daemon work, no auth change.
**Dynamic DNA State:**
- **Product Context:** A human or Peaches needs a one-line way to spin up Sprint N (and close it later). The CLI is the lowest-friction entry point until the Backlog/Plan UI lands in Sprint 9–10.
- **Execution Files:**
  - `packages/cli/src/commands/sprint.ts` — new
  - `packages/cli/src/index.ts` — register subcommand tree
  - `tests/cli-sprint.test.ts` — new

**Worktree Setup:** `bash scripts/worktree-add.sh .worktrees/s8-t2-cli track/s8-t2-cli-sprint`

**Verification:**
1. `bash scripts/install-cli.sh` then `ak sprint open "Sprints + Tracks foundation"` returns `S8`.
2. `ak sprint list -o json` shows the active sprint.
3. `ak sprint close` closes it; second invocation errors cleanly.
4. Bandit QA.

**Next Step:** Skylar — model the commands on `packages/cli/src/commands/board.ts`. Reuse the existing API client + auth (machine API key from `~/.config/agent-kanban/`).

---

### HANDOFF BRIDGE — S8-T3
**Topic:** Frontend foundation — TRACKS column, SprintHeader banner, S{n}-T{m} chip
**Track:** S8-T3
**Specialist:** Skylar
**Depends on:** S8-T1 merged (consumes routes)
**Static DNA Check:** Aligned — pure frontend (React + Tailwind + shadcn/ui + TanStack Query). No drag-and-drop, no claim/release buttons (UI principle: agents drive lifecycle). Sprint header's Close Sprint button is the only new lifecycle action surfaced in the UI; that's intentional and Tim-approved per north-star.md (it's a sprint-level, not task-level, action).
**Dynamic DNA State:**
- **Product Context:** Users land on the board view. Today they see TODO/IN PROGRESS/IN REVIEW/DONE columns and a board name. After this track they see a sprint banner (theme + status) and a TRACKS column; cards show their `S8-T1`-style label.
- **Execution Files:**
  - `apps/web/src/components/Column.tsx` — TRACKS rename
  - `apps/web/src/components/SprintHeader.tsx` — new
  - `apps/web/src/components/TaskCard.tsx` — chip
  - `apps/web/src/hooks/useSprint.ts` — new
  - `apps/web/src/routes/BoardPage.tsx` — mount `SprintHeader`
  - `apps/web/src/lib/api.ts` — `api.sprints.*`
  - E2E spec under `tests/e2e/` (Playwright)

**Worktree Setup:** `bash scripts/worktree-add.sh .worktrees/s8-t3-frontend track/s8-t3-frontend-sprint-ui`

**Verification:**
1. `pnpm build && pnpm tsc --noEmit && npx vitest run` — green.
2. Browser: open a board with an active sprint → banner renders theme + status; column reads TRACKS; card chip reads `S8-T1`.
3. Close Sprint button greys out until all tracks are done/cancelled (manually verify with seeded data).
4. Playwright E2E green; clean-code-reviewer + Bandit PASS.

**Next Step:** Skylar — read `Column.tsx` and `BoardPage.tsx` first to understand the layout. Implement the hook before the components so the data shape is locked.

---

## Future Backlog (post-Sprint 8)

Items not in Sprint 8. Some are gated by Sprint 8 landing (e.g. UI work waits on the data model); others are pre-existing and unrelated. Peaches will fold these into Sprint 9+ planning per `north-star.md`'s sequence.

- **T22 (re-scoped)** — CLI daemon end-to-end smoke test. Original T22 was an operational "run the smoke" track; cold-run on 2026-05-21 found prerequisite gaps (missing `gpg`, broken `set -u` cleanup in script, opaque `json_query` errors, mandatory `<runtime>` argument undocumented). Re-scoped to: stand up local stack → harden script (3 specific bugs) → run twice green for idempotency → Bandit on script diff only.
- **GPG prerequisite** — `ak start` requires `gpg` (signing agent commits) but it isn't installed on Tim's workstation and there's no preflight check or setup doc. Add either a `scripts/install-cli.sh`-style preflight or an `ak doctor` command that verifies daemon prerequisites.
- **Peaches task-refinement workflow** — when Tim describes a task in non-engineering language, Peaches should refine it into engineering-aligned cards before Skylar executes. Concept; needs scoping. Board task `d5kv1hfw1d2v`.
- **Lift `useBoardSSE` into shared provider** — surfaced during T24. `useBoard` and `useAgentPresence` each open their own EventSource per board mount; Chrome caps at ~6 per origin. Lift to a `BoardSSEContext` provider in `BoardPage.tsx` so consumers share one connection.
- ~~**`useAgentPresence` choreography for `released`/`timed_out`**~~ — DROPPED 2026-05-21. Card movement already works via T24's `STATUS_CHANGING_ACTIONS` invalidation in `useBoard.ts`; agent-drag animation is not required.

---

## Archive: Sprint 7 — UI Polish (CLOSED 2026-05-21)

**Objective:** Ship UI polish across three fronts: (1) commit and track the informal session work that accumulated in the working tree, (2) surface `board.theme` as a subtitle on the board view, (3) restyle `plan_url` as a chip in TaskDetail, and (4) run the first end-to-end daemon smoke test against a live Sprint 7 board.

---

## Tracks

| Track | Goal | Status |
|---|---|---|
| T18 | Cleanup: commit informal session work + AGENTIC.md DoD migration | DONE — Bandit PASS |
| T19 | Frontend: board theme subtitle on BoardPage (Option A — subdued subtitle) | DONE — Bandit PASS |
| T20 | Frontend: plan_url chip styling in TaskDetail | DONE — Bandit PASS |
| T22 | CLI: daemon end-to-end smoke test | DEFERRED to Sprint 8 (re-scoped — see Sprint 8 Backlog) |
| T23 | Docs: formal Sprint 7 open (plan.md + tracks.md) — Peaches track | DONE — Bandit PASS |
| T24 | Frontend: real-time board updates via SSE invalidation | DONE — Bandit PASS |

**T21 DROPPED** — absorbed into T19 (Option A selected by Tim; no banner/collapsible needed).

---

## Dependency order

```
T18 → T19 (needs clean tree)
T18 → T20 (needs clean tree)
T18 → T22 (smoke test runs after tree is clean)
T23 — no dependencies (Peaches, done on sprint open)
```

---

## Definition of Done (Sprint 7)

- [x] T18: Four dirty files committed; `api.ts` has `theme?: string | null` on `api.boards.update`; board task `djpjbua8dzi4`; Bandit PASS
- [x] T19: `board.theme` renders as a subdued subtitle beneath board name in `BoardPage.tsx`; board task `wgs05lo6su3c`; Bandit PASS
- [x] T20: `plan_url` and `pr_url` fields in `TaskDetail.tsx` use consistent chip styling; board task `m87r7tx6go9l`; Bandit PASS
- [~] T22: DEFERRED to Sprint 8 — cold-run found prerequisite gaps (missing `gpg`, script bugs, undocumented runtime arg). Re-scoped track in Sprint 8 Backlog above.
- [x] T23: `plan.md` + `tracks.md` updated to Sprint 7; board task `od2z7r2ejz3d`
- [x] T24: Real-time SSE invalidation in `useBoard`; `refetchInterval` 30s → 60s; board task `87ocfjs35xo5`; Bandit PASS
- [x] `pnpm build` exits zero (verified per-track)
- [x] `pnpm tsc --noEmit` exits zero (verified per-track)
- [x] Bandit QA: PASS on every executed track

---

*Last updated: 2026-05-21 (Sprint 7 CLOSED — T18/T19/T20/T23/T24 done; T22 deferred to Sprint 8 due to gpg prerequisite + script bugs; Sprint 8 Backlog seeded)*

---

## Sprint 7 Bridges

### HANDOFF BRIDGE — T18
**Topic:** Cleanup: commit informal session work (BoardSwitcher, Header, useBoard, BoardSettingsPage, api.ts, AGENTIC.md)
**Track:** T18
**Board task:** `djpjbua8dzi4`
**Specialist:** Skylar
**Static DNA Check:** Aligned — T18 is a commit-only cleanup track. No schema migration, no auth changes, no new features. The dirty files are theme-related UI work already done informally; committing them properly makes them trackable and unblocks T19/T20/T22.
**Dynamic DNA State:**
- **Product Context:** Six files have uncommitted changes from informal session work. They need to land in a clean tracked commit before any Sprint 7 work can branch off.
- **Current Plan:** Sprint 7 → T18 in `docs/context/plan.md`
- **Execution Files (all modified, no new files):**
  - `apps/web/src/components/BoardSwitcher.tsx` — replaced dev/ops type toggle with Theme textarea; updated `onCreate` prop signature to `(name: string, theme?: string)`
  - `apps/web/src/components/Header.tsx` — updated `handleBoardCreate` to pass `theme`; added `toast.error` catch block; imports `toast` from `sonner`
  - `apps/web/src/hooks/useBoard.ts` — added `theme?: string | null` to `useUpdateBoard` mutation input type
  - `apps/web/src/routes/BoardSettingsPage.tsx` — added `theme` field to `BoardSettingsBoard` interface; added `theme` state + input in `BoardDetailsSection`; passes `theme` to `updateBoard.mutateAsync`
  - `apps/web/src/lib/api.ts` — add `theme?: string | null` and `default_repository_id?: string | null` to `api.boards.update` body type (currently `Record<string, unknown>` pattern — tighten it)
  - `AGENTIC.md` — added DoD migration checkpoint bullet: "If track includes a migration file: dev server restarted after merge and migration confirmed applied to `.wrangler/state` DB"

**Worktree Setup:** T18 commits directly to the current branch (`track/1-fork-and-clone`) — NO worktree needed. The working tree is already the right place. Do NOT create a separate worktree for this track.

**Verification:**
1. `git diff HEAD` — confirm only the six files above are changed; no extra files
2. `pnpm build && pnpm tsc --noEmit && npx vitest run` — all must exit zero
3. `git add apps/web/src/components/BoardSwitcher.tsx apps/web/src/components/Header.tsx apps/web/src/hooks/useBoard.ts apps/web/src/routes/BoardSettingsPage.tsx apps/web/src/lib/api.ts AGENTIC.md`
4. `git commit -m "feat(ui): theme field in board create/settings UI; tighten api.boards.update type; AGENTIC.md DoD checkpoint"` (or equivalent)
5. `git log --oneline -3` — confirm commit is present
6. Invoke Bandit for QA gate

**Next Step:** Skylar — read the six files in full to confirm you understand the existing changes. Make the one remaining source change in `api.ts` (tighten `boards.update` body type to include `theme?: string | null`). Then stage exactly the six files listed and commit. Do NOT commit `docs/context/plan.md` or `docs/context/tracks.md` — those are Peaches' files and will be committed separately. Run the verification checklist. Invoke Bandit.

---

### HANDOFF BRIDGE — T19
**Topic:** Frontend: board theme subtitle on BoardPage
**Track:** T19
**Board task:** `wgs05lo6su3c`
**Specialist:** Skylar
**Static DNA Check:** Aligned — React + Vite + Tailwind frontend. Pure UI, read-only display. No schema, no auth changes. T18 must be committed first. Tim chose Option A: subdued subtitle line beneath the board name, no collapsible banner.
**Dynamic DNA State:**
- **Product Context:** `board.theme` already exists as a field (set during board creation or via settings). Boards have it populated — the Sprint 7 board (`eelil1mu`) has `theme: "UI enhancements"`. The board view doesn't display it yet.
- **Current Plan:** Sprint 7 → T19 in `docs/context/plan.md`
- **Execution Files:**
  - `apps/web/src/routes/BoardPage.tsx` — only file to modify

**Worktree Setup:** `bash scripts/worktree-add.sh .worktrees/track-19 track/19-board-theme-subtitle`

**Exact implementation for Skylar:**

In `BoardPage.tsx`, locate the board header area where the board name is displayed. The board name is currently the primary heading. Immediately after it, add a conditional subtitle:

```tsx
{board.theme && (
  <p className="text-sm text-content-tertiary mt-0.5 leading-snug">{board.theme}</p>
)}
```

Placement: directly beneath the board name `<h1>` (or equivalent heading element) in the board header. No collapsible, no banner, no icon. Just a subdued single-line paragraph. The exact parent element and class names depend on what you find in `BoardPage.tsx` — read it first, then place the subtitle in the right spot.

**Constraints:**
- Conditional render only: do not render the subtitle element at all when `board.theme` is null, undefined, or empty string
- Read-only: no edit affordance
- Styling must be subdued — `text-content-tertiary` or equivalent muted color; smaller than the board name

**Verification:**
1. `pnpm build && pnpm tsc --noEmit && npx vitest run` — all must exit zero
2. `pnpm dev` — navigate to board `eelil1mu` (which has `theme: "UI enhancements"`)
3. Confirm subtitle "UI enhancements" appears beneath the board name in a muted, smaller style
4. Create or navigate to a board with no theme — confirm no subtitle renders (no empty line)
5. Invoke Bandit for QA gate

**Next Step:** Skylar — create the worktree, read `BoardPage.tsx` in full to locate the board name heading, then add the conditional subtitle in the correct location. Run the verification checklist. Invoke Bandit.

---

### HANDOFF BRIDGE — T20
**Topic:** Frontend: plan_url chip styling in TaskDetail
**Track:** T20
**Board task:** `m87r7tx6go9l`
**Specialist:** Skylar
**Static DNA Check:** Aligned — React + Tailwind + shadcn/ui frontend. UI-only change. No schema, no auth, no API changes. T18 must be committed first (no direct file conflict, but clean tree is protocol).
**Dynamic DNA State:**
- **Product Context:** The "Plan" field in `TaskDetail` currently renders as a plain anchor link (identical to the original "PR" field implementation). The goal is to restyle it — and the PR field alongside it — as small badge/chip elements that look distinct from plain prose links. Sprint 7 added `plan_url` in T15; now we polish the visual treatment.
- **Current Plan:** Sprint 7 → T20 in `docs/context/plan.md`
- **Execution Files:**
  - `apps/web/src/components/TaskDetail.tsx` — only file to modify

**Worktree Setup:** `bash scripts/worktree-add.sh .worktrees/track-20 track/20-plan-url-chip`

**Exact implementation for Skylar:**

Read `TaskDetail.tsx` in full first. Locate the PR and Plan `<Field>` blocks. Currently both render as plain `<a>` links. Restyle both to use a small inline badge/chip treatment. A chip looks like:

```tsx
<a
  href={task.pr_url}
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-surface-secondary text-content-secondary hover:bg-surface-tertiary hover:text-content-primary transition-colors border border-border"
>
  {formatPrLabel(task.pr_url)}
</a>
```

Apply the same chip class treatment to the Plan link. The Plan chip label text should be `"Plan"` (literal string, since plan docs don't have a parseable short form like GitHub PR numbers do).

**Constraints:**
- Both PR and Plan chips must be visually consistent with each other
- The chip should be visually distinct from plain inline links elsewhere in TaskDetail
- Do not change any other field; do not add new fields; do not touch the edit icon or other controls
- Keep the `— ` empty state rendering unchanged (when `task.pr_url` is null, still show `<span className="text-content-tertiary">—</span>`)

**Verification:**
1. `pnpm build && pnpm tsc --noEmit && npx vitest run` — all must exit zero
2. `pnpm dev` — open a task that has both `pr_url` and `plan_url` set
3. Confirm both fields render as chips (pill/badge style), not plain links
4. Confirm empty state (null url) still shows `—`
5. Invoke Bandit for QA gate

**Next Step:** Skylar — create the worktree, read `TaskDetail.tsx` in full to locate the PR and Plan field blocks, then restyle both with the chip class treatment above. Run the verification checklist. Invoke Bandit.

---

### HANDOFF BRIDGE — T22
**Topic:** CLI: daemon end-to-end smoke test
**Track:** T22
**Board task:** `7lqed55p3yxl`
**Specialist:** Skylar
**Static DNA Check:** Aligned — operational track. Uses `ak` CLI against the local dev server. No source code changes expected. T18 must be committed first (clean tree required before starting daemon work).
**Dynamic DNA State:**
- **Product Context:** The daemon (`ak start`) has never been run against the Sprint 7 board. This track validates the full lifecycle: daemon starts, discovers a board task, an agent claims it, the agent updates status, and `ak get task` reflects the change. The goal is to surface any bugs in the current daemon implementation.
- **Current Plan:** Sprint 7 → T22 in `docs/context/plan.md`
- **Execution Files:** None expected — operational track. Document findings in a comment on board task `7lqed55p3yxl`.

**Worktree Setup:** N/A — operational track; no source changes. Work on the main checkout.

**Pre-flight steps for Skylar:**

1. **Refresh CLI:** `bash scripts/install-cli.sh` — rebuild and link `ak` locally
2. **Discover board and repo:**
   ```bash
   node packages/cli/dist/index.js get board -o json   # find board eelil1mu
   node packages/cli/dist/index.js get repo -o json    # find slink or any registered repo
   node packages/cli/dist/index.js get agent -o json   # list registered agents
   ```
3. **Configure ak for local dev:**
   ```bash
   node packages/cli/dist/index.js config set --api-url http://localhost:5173 --api-key <machine-key>
   ```
   The machine API key must start with `ak_`. If none is configured, create one via the UI (Machines page) or `POST /api/machines` with a machine API key.

4. **Run `ak start`** against board `eelil1mu`:
   ```bash
   ak start --board eelil1mu
   ```

5. **Observe and document:**
   - Does the daemon start without errors?
   - Does it discover `todo` tasks on the board?
   - Does task claim succeed and status transition to `in_progress`?
   - Does `ak get task <id>` show the updated status?
   - Does the agent reach `done` or `in_review`?
   - Any error messages, crashes, or stuck states?

6. **Surface bugs:** For each bug found, note the error message, the command that triggered it, and the expected vs. actual behavior. Document in `task_logs` via `ak task log` or in the board task description.

**Verification (success criteria):**
- `ak start` runs without crashing on startup
- At least one task goes through the full `todo → in_progress → in_review/done` lifecycle
- `ak get task <id>` reflects the final status correctly
- No unhandled exceptions in the daemon logs

**Next Step:** Skylar — first confirm T18 is committed (run `git log --oneline -1` and verify). Then run `bash scripts/install-cli.sh` to get a fresh `ak` binary. Discover the board/repo/agent resources, configure credentials, and run the smoke test. Document all findings on board task `7lqed55p3yxl`.

---

## Archive: Sprint 6 — Board Polish

**Objective:** Polish the board creation and view experience. Add theme support to boards, clean up the Kanban column set, improve task editing ergonomics, and seed planning labels automatically.

---

## Tracks

| Track | Goal | Status |
|---|---|---|
| T9 | Schema + Backend: `theme` column on boards | DONE — Bandit PASS |
| T10 | Frontend: update create board form (add Theme field, remove type selector) | READY — unblocked (T9 merged 2026-05-21) |
| T11 | Frontend: remove Cancelled column from board view | DONE — Bandit PASS |
| T12 | Frontend: edit icon in TaskDetail for todo tasks | DONE — Bandit PASS |
| T13 | Backend: seed `ready-for-planning` label on board creation | DONE — Bandit PASS |
| T14 | Agent OS: AI-assisted planning workflow | IN PROGRESS — Bridge issued 2026-05-21 |
| T15 | Backend: `plan_url` column on tasks | IN PROGRESS — Bridge issued 2026-05-21 |
| T17 | Docs: AGENTIC.md board-as-authoritative-ledger protocol | DONE — Bandit PASS |

---

## Definition of Done (Sprint 6)

- [x] T9: `theme TEXT` nullable column on `boards`; wired through `boardRepo`, `routes.ts`, and `shared/types.ts`; migration `0023_board_theme.sql` applied
- [ ] T10: Create board form removes type selector, hardcodes `type: "dev"`, adds Theme textarea; `POST /api/boards` with `theme` succeeds
- [x] T11: `"cancelled"` removed from `TASK_STATUSES` in `BoardPage.tsx`, `SharePage.tsx`, and `KanbanColumn.tsx`; `DemoBoard.tsx` updated
- [x] T12: Pencil icon renders in `TaskDetail` header when `task.status === "todo"` and `onEdit` prop is provided; wired from `BoardPage`
- [x] T13: `ready-for-planning` label (color `#6366F1`) seeded automatically on every new board creation
- [ ] T14: Agent OS planning workflow — `skills/agent-kanban/CLAUDE.md` updated with full planning behavior rules; agent correctly silences on new todo, defers on ready-for-planning label after ~1 minute, proceeds immediately on explicit request, writes plan doc and sets `plan_url` on approval
- [ ] T15: `plan_url TEXT` nullable column on `tasks`; migration `0024_task_plan_url.sql` applied; wired through `taskRepo.ts`, `routes.ts`, `shared/types.ts`, `TaskDetail.tsx`; CLI `output.ts` and `describe.ts` display it — Tim schema sign-off: RECEIVED 2026-05-21
- [ ] `pnpm build` exits zero
- [ ] `pnpm tsc --noEmit` exits zero
- [ ] Bandit QA: PASS

---

*Last updated: 2026-05-21 (T9/T11/T12/T13 marked DONE; T10 unblocked; T10 Bridge issued 2026-05-21; T15 Bridge issued 2026-05-21; T14 Bridge issued 2026-05-21) — ARCHIVED: Sprint 7 is now current*

---

## Archive: Sprint 5 — Human-Editable Backlog

**Objective:** Allow Tim to manage a product backlog directly from the browser UI. Tim can create, edit, and delete tasks in the `todo` column (the backlog). Once tasks are kicked off (agents are working them — any status past `todo`), Tim cannot unilaterally edit them. The model is: backlog (human-editable) → kick off → locked execution. Agents continue to own the execution layer exclusively.

**Updated UI principles for Sprint 5:**
- The `todo` column is now human-editable: Tim can add/edit/delete tasks from the browser.
- Tasks in `in_progress`, `in_review`, `done`, or `cancelled` remain read-only in the UI.
- No drag-and-drop, no status transition buttons (those still belong to agents/machines).
- The two existing review actions (reject, complete) in `in_review` are unchanged.
- No sprint concept. The model is always: backlog → active → done.

---

## Tracks

### Track 5 — Auth: allow `user` identity to create/edit/delete backlog tasks

**Goal:** Extend the API ACL so a browser session (`user` identity) can create, update, and delete tasks that are still in `todo` status. Tasks in any other status remain agent/machine-only for mutations.

**Owner:** Skylar
**Working directory:** `/Users/I826932/Developer/agent-kanban/`
**Branch:** `track/5-user-backlog-api`

**Constraint analysis:**
Current `ROUTE_RULES` in `auth.ts` (line 43-45):
- `POST /api/tasks` → `agent:worker`, `agent:leader` only
- `PATCH /api/tasks/:id` → `agent:worker`, `agent:leader` only
- `DELETE /api/tasks/:id` → `agent:worker`, `agent:leader` only

The `createTask` handler also requires `assigned_to` (line 768 in `routes.ts`). For user-created backlog tasks, `assigned_to` should be optional (null = unassigned backlog item).

**Files to touch:**
1. `apps/web/server/auth.ts` — add `"user"` to the allow list for `POST /api/tasks`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id`. Add a new route rule that blocks `user` identity from mutating tasks not in `todo` status (enforced in the route handler, not here — see below).
2. `apps/web/server/routes.ts` — make `assigned_to` optional in `POST /api/tasks` when the caller is `user` identity. Add a guard in `PATCH /api/tasks/:id` and `DELETE /api/tasks/:id`: if identity is `user`, check that the task's current status is `todo` — reject with 403 if not.
3. `apps/web/server/taskRepo.ts` — make `assigned_to` optional in `createTask` (it already accepts it as optional in the type, but the route enforces it). Also make the `dev` board's `repository_id` requirement optional for user-created tasks (or enforce that user-created tasks are only for `ops` boards — see T6 for board type decision).

**Schema changes:** None — the existing tasks table has `assigned_to` as nullable and status defaults to `todo`. No migration needed.

**Auth risk:** This track touches `ROUTE_RULES` in `auth.ts`. Tim's sign-off required before Bridge issuance per security protocol.

**Verification:**
- `POST /api/tasks` with a browser session cookie creates a task with `status=todo`, `assigned_to=null`.
- `PATCH /api/tasks/:id` with a browser session succeeds for a `todo` task and fails with 403 for an `in_progress` task.
- `DELETE /api/tasks/:id` with a browser session succeeds for a `todo` task and fails with 403 for any other status.
- Existing agent/machine task creation is unaffected.

**Migration Safety:** Reversible (auth rule changes are in-code, not schema).
**Security Review:** **AUTH** — requires Tim's explicit sign-off before Bridge issuance.

---

### Track 6 — Backend: backlog task creation without `assigned_to` / board-level default repo (B2)

**Goal:** Refine the `createTask` backend to support user-created backlog items with board-level repo auto-assignment:
- `assigned_to` is nullable (unassigned backlog item — agent picks it up later via assign/claim).
- Add `default_repository_id` nullable column to the `boards` table. When a user creates a task without specifying `repository_id`, the backend reads the board's `default_repository_id` and applies it automatically.
- `POST /api/boards` and `PATCH /api/boards/:id` accept optional `default_repository_id` so Tim can configure this per board once.

**Owner:** Skylar
**Working directory:** `/Users/I826932/Developer/agent-kanban/`
**Branch:** `track/6-backlog-create` (depends on T5 branch — can be developed on top of it or in parallel if the API surface is stable)

**Files to touch:**
1. New migration file in `apps/web/migrations/` — `ALTER TABLE boards ADD COLUMN default_repository_id TEXT REFERENCES repositories(id)` (nullable).
2. `apps/web/server/routes.ts` — (a) remove the hard `assigned_to` 400 requirement when `identityType === "user"`; (b) remove the `dev board requires repository_id` guard when `identityType === "user"`; (c) in `POST /api/tasks` when identity is `user` and `repository_id` is absent, look up board's `default_repository_id` and attach it; (d) accept `default_repository_id` in `POST /api/boards` and `PATCH /api/boards/:id`.
3. `apps/web/server/taskRepo.ts` — `createTask`: when `actorType === "user"`, skip the `assertAssignableWorkerAgent` call and the `isRuntimeAvailable` check.
4. `apps/web/server/boardRepo.ts` — store and return `default_repository_id` on board reads and writes.
5. `packages/shared/` — add `default_repository_id?: string | null` to board types; verify `CreateTaskInput.assigned_to` is typed as optional.

**Schema changes:** One nullable column addition on `boards`. Reversible (drop column to roll back).

**Migration Safety:** Reversible — Tim schema sign-off: YES (2026-05-20)
**Security Review:** SCHEMA — Tim acceptance: YES (2026-05-20)

---

### Track 7 — Frontend: backlog create/edit/delete UI

**Goal:** Add task creation and edit capability to the board UI, scoped to `todo` column only. No repo picker — repo is board-level and applied automatically by the backend.

**Owner:** Skylar
**Working directory:** `/Users/I826932/Developer/agent-kanban/`
**Branch:** `track/7-backlog-ui` (depends on T5 + T6)

**UI spec:**
- "Add task" button at the bottom (or top) of the `todo` column. Clicking opens a minimal inline form or modal with exactly three fields: `title` (required), `description` (optional textarea), `labels` (multi-select from board labels). No `assigned_to` picker. No `repository_id` picker — this is handled server-side via the board's `default_repository_id`.
- Task cards in `todo` have an edit (pencil) icon that opens the same form pre-filled. No edit icon on cards in other columns.
- Task cards in `todo` have a delete (trash) icon with a confirmation step. No delete icon on cards in other columns.
- Submit calls `POST /api/tasks` or `PATCH /api/tasks/:id` via the existing `api` client in `apps/web/src/lib/api.ts`.

**Files to touch:**
1. `apps/web/src/components/KanbanColumn.tsx` — add "Add task" button when `column.status === 'todo'`.
2. `apps/web/src/components/TaskCard.tsx` — conditionally render edit/delete icons when `status === 'todo'`.
3. `apps/web/src/components/BacklogTaskForm.tsx` — new component: controlled form for create/edit. Fields: title, description, labels (no repo picker). Calls `api.createTask` or `api.updateTask`. Dismisses on success and calls `onRefresh`.
4. `apps/web/src/lib/api.ts` — add `createTask`, `updateTask`, and `deleteTask` methods if not already present.
5. `apps/web/src/routes/BoardPage.tsx` — wire up create/edit/delete state and pass `onRefresh` callback.

**Schema changes:** None (repo is handled by T6's `default_repository_id` on boards).
**Migration Safety:** Reversible.
**Security Review:** N/A.

---

### Track 8 — CLAUDE.md: update UI principles

**Goal:** Bring the project's `CLAUDE.md` UI principles in line with Sprint 5 reality. Remove the four blanket "no X" rules that no longer apply; replace with the nuanced backlog-edit model.

**Owner:** Skylar
**Working directory:** `/Users/I826932/Developer/agent-kanban/`
**Branch:** `track/8-ui-principles` (can be done in parallel with T5–T7 or after)

**Files to touch:**
1. `CLAUDE.md` — replace the four UI Principles bullets:
   - **Remove:** "Read-only board — the web UI is for observation and review, not task management"
   - **Remove:** "No task creation UI — tasks are created exclusively by agents via CLI/API"
   - **Add:** "Backlog is human-editable: Tim can create, edit, and delete tasks in the `todo` column from the browser."
   - **Add:** "Once a task leaves `todo` (agents are working it), it is locked for mutation in the UI — no inline edit, no delete."
   - **Keep:** "No status transition buttons" (still true — no claim/cancel/release/assign in UI)
   - **Keep:** "No drag-and-drop"
   - **Keep:** "Only two review actions in UI: reject and complete"

**Migration Safety:** Reversible (doc change only).
**Security Review:** N/A.

---

## Red Flag Analysis

**Title:** Sprint 5 — Human-Editable Backlog
**Top Risk Factors:**
1. **Auth ACL extension (T5):** Adding `user` to task mutation routes is the highest-risk change. The status guard (only `todo` tasks editable) must be enforced on the backend, not just the frontend — a motivated caller could send a PATCH directly. Getting this right requires careful ordering: route-rule change in `auth.ts` + status guard in `routes.ts` handler must land together in the same commit.
2. **`assigned_to` / `repository_id` relaxation (T6):** The existing `createTask` logic has two guards that assume agent identity. Removing them for `user` identity is low-risk if isolated cleanly by an `if (actorType === 'user')` branch. Risk: subtle bugs if `actorType` is not reliably set when the route is hit via browser session (need to verify `resolveActor` returns `"user"` for cookie-authenticated calls).
3. **Board-level `default_repository_id` (T6):** Tim has approved a nullable `default_repository_id` column on `boards` (schema sign-off 2026-05-20). Migration is reversible. The backend looks up the board's default repo when a user creates a task without specifying one — this is now the sole repo resolution path for user-created tasks. **RESOLVED.**

**Risk:** **MEDIUM** — the UI change is well-bounded, but the auth ACL extension in T5 is security-sensitive and must be reviewed carefully. The board type decision in T6 needs explicit Tim input.

**Premortem (2 weeks out):** Failure looks like: T5 auth change is too broad (allows user to mutate in-progress tasks via direct API call because the status guard was forgotten); or: Tim can't create tasks because his board is `dev` type and `repository_id` is enforced — the UI appears to work but all POSTs 400. Either way the feature feels broken even if code is present.

**Fallback Options:**
- **If board type is blocking:** Create a new `ops` board for the product backlog (or change Tim's existing board to `ops` via `PATCH /api/boards/:id`). No schema change needed.
- **If status guard complexity is too high in T5:** Restrict user task mutations to `todo` at the route-rule level using a new dedicated pattern (e.g., add a middleware that checks status before delegating to the main handler). Cleaner separation of concerns.
- **If frontend form complexity balloons:** Use a simple inline text input for title only in T7, defer description/labels editing to a later sprint. Ship thin, iterate.

**Migration Safety:** Reversible at the sprint level — all changes are on feature branches. T6 includes a schema migration (nullable column addition — reversible; Tim sign-off: YES 2026-05-20).

**Security Implications:** **AUTH** (T5) — explicit Tim sign-off received 2026-05-20. **SCHEMA** (T6) — explicit Tim sign-off received 2026-05-20.

**Product decision — RESOLVED (2026-05-20):**
- **B2 chosen:** Board-level `default_repository_id`. Tim sets this once per board; all user-created tasks on that board inherit the repo automatically. No per-task repo picker in the UI. Schema migration required (nullable column on `boards`).

---

## Definition of Done (Sprint 5)

- [x] T5: `user` identity can `POST /api/tasks`, `PATCH /api/tasks/:id` (todo only), `DELETE /api/tasks/:id` (todo only); all other statuses blocked with 403
- [x] T6: User-created tasks work without `assigned_to`; board-level `default_repository_id` is stored and applied automatically on task create (schema migration landed, `boardRepo` + `routes.ts` updated)
- [x] T7: "Add task" button in `todo` column; edit/delete icons on `todo` cards; form creates/updates via API; other columns unchanged
- [x] T8: `CLAUDE.md` UI Principles updated to reflect backlog-edit model
- [ ] `pnpm build` exits zero
- [ ] `pnpm tsc --noEmit` exits zero
- [ ] Bandit QA: PASS
- [ ] Tim has given explicit sign-off on T5 auth changes (security review)
- [ ] Tim has answered the board type product question (T6 prerequisite) — **RESOLVED: B2 (board-level default repo) chosen 2026-05-20**

---

*Last updated: 2026-05-21 (Sprint 6 section added; T9/T11/T12/T13 marked DONE; T10 unblocked; T5/T6/T7/T8 Sprint 5 DONE Bandit PASS)*

---

---

## Sprint 6 Bridges

### HANDOFF BRIDGE — T10
**Topic:** Frontend: update create board form (add Theme field, remove type selector)
**Track:** T10
**Specialist:** Skylar
**Static DNA Check:** Aligned — React + Vite + Tailwind + shadcn/ui frontend. Pure UI track; no schema migration, no auth changes. T9 merged to main; `packages/shared/src/types.ts` already has `theme?: string` on `CreateBoardInput` and `theme?: string | null` on `Board`.
**Dynamic DNA State:**
- **Product Context:** The board creation form currently exposes a dev/ops type toggle that users should not need to see. All boards are `dev`. The form needs a Theme textarea so users can describe the sprint purpose when creating a board.
- **Current Plan:** Sprint 6 → Track 10 section in `docs/context/plan.md`
- **Execution Files:**
  - `apps/web/src/routes/NewBoardPage.tsx` — primary change file (remove type selector, add theme textarea)
  - `apps/web/src/hooks/useBoard.ts` — update `useCreateBoard` mutation input type to include `theme?: string`
  - `apps/web/src/lib/api.ts` — update `api.boards.create` signature to include `theme?: string`

**Migration Safety:** Reversible — UI-only change, no schema or auth impact
**Security Review:** N/A
**Worktree Setup:** `bash scripts/worktree-add.sh .worktrees/track-10 track/10-board-form-update`

**Exact implementation steps for Skylar:**

**Step 1 — Worktree setup**
```bash
bash scripts/worktree-add.sh .worktrees/track-10 track/10-board-form-update
cd .worktrees/track-10
```

**Step 2 — `apps/web/src/routes/NewBoardPage.tsx`**

Five targeted edits, in order:

1. **Remove `boardType` state** — delete:
   ```ts
   const [boardType, setBoardType] = useState<"dev" | "ops">("dev");
   ```

2. **Add `boardTheme` state** — add after the `boardName` state line:
   ```ts
   const [boardTheme, setBoardTheme] = useState("");
   ```

3. **Update `handleCreateBoard` payload** — change:
   ```ts
   await createBoard.mutateAsync({ name: boardName, type: boardType });
   ```
   to:
   ```ts
   await createBoard.mutateAsync({ name: boardName, type: "dev", theme: boardTheme || undefined });
   ```

4. **Add `Textarea` import** — add to the existing import block:
   ```ts
   import { Textarea } from "../components/ui/textarea";
   ```

5. **Replace the board type UI block with the Theme textarea** — in the `step === 0` JSX, remove:
   ```tsx
   <label className="block text-xs font-medium text-content-tertiary uppercase tracking-wide">Board type</label>
   <div className="flex gap-2">
     {(["dev", "ops"] as const).map((t) => (
       <button
         key={t}
         onClick={() => setBoardType(t)}
         className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
           boardType === t ? "bg-accent text-white" : "bg-surface-tertiary text-content-secondary hover:text-content-primary"
         }`}
       >
         {t === "dev" ? "Dev" : "Ops"}
         <span className="block text-xs font-normal mt-0.5 opacity-70">{t === "dev" ? "Git / PR workflow" : "No repo required"}</span>
       </button>
     ))}
   </div>
   ```
   Replace with:
   ```tsx
   <label className="block text-xs font-medium text-content-tertiary uppercase tracking-wide">Theme</label>
   <Textarea
     value={boardTheme}
     onChange={(e) => setBoardTheme(e.target.value)}
     placeholder="Describe the purpose of this sprint."
     rows={3}
   />
   ```

**Step 3 — `apps/web/src/hooks/useBoard.ts`**

Update the `useCreateBoard` mutation input type to allow `theme`:

Change:
```ts
mutationFn: (input: { name: string; type: "dev" | "ops"; description?: string }) => api.boards.create(input),
```
To:
```ts
mutationFn: (input: { name: string; type: "dev" | "ops"; description?: string; theme?: string }) => api.boards.create(input),
```

**Step 4 — `apps/web/src/lib/api.ts`**

Update `api.boards.create` signature to accept `theme`:

Change:
```ts
create: (input: { name: string; type: "dev" | "ops"; description?: string }) => request<any>("POST", "/boards", input),
```
To:
```ts
create: (input: { name: string; type: "dev" | "ops"; description?: string; theme?: string }) => request<any>("POST", "/boards", input),
```

No other change to `api.ts` — the `request()` function passes the full input object as the JSON body, so `theme` will be included automatically. `POST /api/boards` in `routes.ts` already accepts and passes `theme` to `boardRepo.createBoard` (confirmed — no backend change required).

**Verification:**
1. `pnpm build && pnpm tsc --noEmit && npx vitest run` — must all exit zero
2. `pnpm dev` — open `/boards/new` in the browser
3. Confirm the dev/ops type toggle is gone
4. Confirm the Theme textarea appears with placeholder "Describe the purpose of this sprint."
5. Fill in board name + optional theme → click "Create Board" → board is created and you land on the board view
6. Confirm the created board has a `theme` value (check via `GET /api/boards/:id` or inspect the board page)
7. Create a board with no theme → confirm the payload omits `theme` (no error)
8. Invoke Bandit for QA gate

**Next Step:** Skylar — create the worktree, then work through the three files in order: `NewBoardPage.tsx` → `useBoard.ts` → `api.ts`. Run the verification checklist. Invoke Bandit.

---

### HANDOFF BRIDGE — T15
**Topic:** Backend + Frontend: `plan_url` column on tasks
**Track:** T15
**Specialist:** Skylar
**Static DNA Check:** Aligned — D1/SQLite migration, Hono API repo layer, `packages/shared` types, React TaskDetail component. Mirrors the `pr_url` pattern exactly. Schema sign-off on record (Tim, 2026-05-21).
**Dynamic DNA State:**
- **Product Context:** Agents need to attach a planning document URL to a task (analogous to `pr_url` for PRs). The field is agent-settable via `PATCH /api/tasks/:id`; the UI displays it read-only in `TaskDetail` alongside the existing PR field. No edit affordance in the browser.
- **Current Plan:** Sprint 6 → T15 in `docs/context/plan.md`
- **Execution Files:**
  - `apps/web/migrations/0024_task_plan_url.sql` — NEW migration
  - `packages/shared/src/types.ts` — add `plan_url` to `Task` interface
  - `apps/web/server/taskRepo.ts` — four sites: INSERT, `updateTask` type + allowedFields, `createTask` return object, `reviewTask` return object
  - `apps/web/server/routes.ts` — no body-parsing change needed (PATCH body is passed through directly to `updateTask`; `plan_url` will be accepted automatically once `allowedFields` includes it)
  - `apps/web/src/components/TaskDetail.tsx` — add `plan_url` display Field alongside the PR Field
  - `packages/cli/src/commands/describe.ts` — add `plan_url` display line after `pr_url` line
  - `packages/cli/src/output.ts` — add `plan_url` to `formatTaskList`, `formatTaskListWide`, and the detailed task block
  - `packages/cli/src/apply/parser.ts` — add `planUrl: "plan_url"` to `CAMEL_TO_SNAKE` map

**Migration Safety:** Reversible — nullable column addition; `DROP COLUMN` to roll back. Tim schema sign-off: RECEIVED 2026-05-21
**Security Review:** SCHEMA — Tim acceptance: YES (2026-05-21)
**Worktree Setup:** `bash scripts/worktree-add.sh .worktrees/track-15 track/15-task-plan-url`

---

#### Exact implementation steps for Skylar

**Step 1 — Worktree setup**
```bash
bash scripts/worktree-add.sh .worktrees/track-15 track/15-task-plan-url
cd .worktrees/track-15
```

---

**Step 2 — Migration file**

Create `apps/web/migrations/0024_task_plan_url.sql` with exactly:
```sql
ALTER TABLE tasks ADD COLUMN plan_url TEXT;
```

---

**Step 3 — `packages/shared/src/types.ts`**

On the `Task` interface, add `plan_url` immediately after `pr_url` (line 45):
```ts
plan_url: string | null;
```

---

**Step 4 — `apps/web/server/taskRepo.ts`**

Four targeted edits:

1. **`createTask` INSERT statement** (line ~103) — the INSERT column list currently reads:
   ```sql
   INSERT INTO tasks (id, board_id, seq, status, title, description, repository_id, labels, created_by, assigned_to, result, pr_url, input, created_from, scheduled_at, position, created_at, updated_at)
   VALUES (?, ?, ?, 'todo', ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?)
   ```
   Change to:
   ```sql
   INSERT INTO tasks (id, board_id, seq, status, title, description, repository_id, labels, created_by, assigned_to, result, pr_url, plan_url, input, created_from, scheduled_at, position, created_at, updated_at)
   VALUES (?, ?, ?, 'todo', ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?)
   ```

2. **`createTask` return object** (line ~153) — after `pr_url: null,` add:
   ```ts
   plan_url: null,
   ```

3. **`updateTask` type signature** (line ~270) — the `Partial<Pick<Task, ...>>` currently lists `"pr_url"`. Add `"plan_url"`:
   ```ts
   updates: Partial<Pick<Task, "title" | "description" | "repository_id" | "labels" | "pr_url" | "plan_url" | "input" | "position" | "scheduled_at">> & {
   ```

4. **`updateTask` allowedFields** (line ~293) — the `allowedFields` array currently reads:
   ```ts
   const allowedFields = ["title", "description", "repository_id", "labels", "pr_url", "input", "position", "scheduled_at"] as const;
   ```
   Add `"plan_url"` after `"pr_url"`:
   ```ts
   const allowedFields = ["title", "description", "repository_id", "labels", "pr_url", "plan_url", "input", "position", "scheduled_at"] as const;
   ```

   Note: `reviewTask` does not need a change — it only sets `pr_url` on `in_review` transition and its return object uses spread (`{ ...task, ... }`), which will include `plan_url` from the fetched row automatically once the column exists.

---

**Step 5 — `apps/web/server/routes.ts`**

No change required. The `PATCH /api/tasks/:id` handler passes the raw request body directly to `updateTask`. Once `allowedFields` in `taskRepo.ts` includes `"plan_url"`, agents can set it via:
```bash
curl -X PATCH .../api/tasks/<id> -d '{"plan_url": "https://..."}'
```

---

**Step 6 — `apps/web/src/components/TaskDetail.tsx`**

Add a `Plan` field display alongside the existing `PR` field. In the `detailsContent` grid (around line 178), the current PR field block is:
```tsx
<Field
  label="PR"
  value={
    task.pr_url ? (
      <a href={task.pr_url} target="_blank" rel="noopener noreferrer" className="font-mono text-[13px] text-accent hover:underline">
        {formatPrLabel(task.pr_url)}
      </a>
    ) : (
      <span className="text-content-tertiary">—</span>
    )
  }
/>
```

Add immediately after it:
```tsx
<Field
  label="Plan"
  value={
    task.plan_url ? (
      <a href={task.plan_url} target="_blank" rel="noopener noreferrer" className="font-mono text-[13px] text-accent hover:underline">
        Plan
      </a>
    ) : (
      <span className="text-content-tertiary">—</span>
    )
  }
/>
```

No edit affordance. Display only. No helper function needed (unlike `formatPrLabel`, plans don't have a standard URL pattern to parse a short label from — use the literal text "Plan" as the link label).

---

**Step 7 — `packages/cli/src/commands/describe.ts`**

After line 24 (`if (task.pr_url) lines.push(...)`), add:
```ts
if (task.plan_url) lines.push(`${pad("Plan")} ${task.plan_url}`);
```

---

**Step 8 — `packages/cli/src/output.ts`**

Three edits — mirror the `pr_url` pattern at each site:

1. `formatTaskList` (around line 58): after `const pr = t.pr_url ? \`PR: ${t.pr_url}\` : "";`, add:
   ```ts
   const plan = t.plan_url ? `Plan: ${t.plan_url}` : "";
   ```
   And append ` ${plan}` to the return template string.

2. `formatTaskListWide` (around line 75): same pattern — add `plan` variable and append to template.

3. Detailed task block (around line 182): after `if (task.pr_url) lines.push(\`  PR:          ${task.pr_url}\`);`, add:
   ```ts
   if (task.plan_url) lines.push(`  Plan:        ${task.plan_url}`);
   ```

---

**Step 9 — `packages/cli/src/apply/parser.ts`**

In the `CAMEL_TO_SNAKE` map (line 18), after `prUrl: "pr_url",` add:
```ts
planUrl: "plan_url",
```

This allows `ak apply` YAML/JSON files to use `planUrl` in the spec and have it map to `plan_url` on the wire.

---

**Verification:**
1. `pnpm build && pnpm tsc --noEmit && npx vitest run` — must all exit zero
2. Apply migration: `npx wrangler d1 execute agent-kanban --local --file=apps/web/migrations/0024_task_plan_url.sql`
3. Set `plan_url` on a task via PATCH and confirm it round-trips through `GET /api/tasks/:id`
4. Open TaskDetail in the browser — confirm "Plan" field appears (shows "—" when null, link when set)
5. Run `ak get task <id>` — confirm `plan_url` appears in describe output
6. Invoke Bandit for QA gate

**Next Step:** Skylar — create the worktree, then work through the eight files in order: migration → shared types → taskRepo → TaskDetail → describe → output → parser. Routes needs no change. Run the verification checklist. Invoke Bandit.

---

### HANDOFF BRIDGE — T14
**Topic:** Agent OS: AI-assisted planning workflow
**Track:** T14
**Specialist:** Skylar (Agent OS config only — no `apps/web/` or `packages/` source changes)
**Static DNA Check:** Aligned — T14 touches only `skills/agent-kanban/SKILL.md` (renamed to `CLAUDE.md` with skill frontmatter, or a new `PLANNING.md` appended to the skill). No schema, no auth, no frontend code. T13 (label seeded on boards) and T15 (`plan_url` column on tasks) are both merged — all runtime dependencies are live.
**Dynamic DNA State:**
- **Product Context:** When a task is marked `ready-for-planning`, a board agent should eventually ask Tim "Would you like me to create a plan?" — but not immediately on every tick. On approval, the agent writes a plan document and stamps the task with its URL via `PATCH /api/tasks/:id { "plan_url": "..." }`. Tasks stay in `todo` until the agent claims them after the plan is approved.
- **Current Plan:** Sprint 6 → T14 section in `docs/context/plan.md`
- **Execution Files:**
  - `skills/agent-kanban/SKILL.md` — **primary and only file to modify**; add a new `## AI-Assisted Planning Workflow` section (do not touch any other section)

**Migration Safety:** Reversible — config/doc change only. No schema or auth impact.
**Security Review:** N/A
**Worktree Setup:** `bash scripts/worktree-add.sh .worktrees/track-14 track/14-planning-workflow`

---

#### Exact implementation steps for Skylar

**Step 1 — Worktree setup**
```bash
bash scripts/worktree-add.sh .worktrees/track-14 track/14-planning-workflow
cd .worktrees/track-14
```

---

**Step 2 — `skills/agent-kanban/SKILL.md` — add planning workflow section**

Append the following section to the bottom of `skills/agent-kanban/SKILL.md`, before the `## Error Handling` section (insert it between `## Output Format` and `## Rules`):

```markdown
## AI-Assisted Planning Workflow

This section governs how a board-watching agent behaves when tasks move through the planning lifecycle.

### Task Recognition (Silent)

When a new task appears in the `todo` column (you see it in `ak get task --board <id> --status todo`), **do not prompt Tim**. Silently note its existence. No message, no question, no announcement. Recognition is internal only.

### `ready-for-planning` Label Trigger (Deferred Prompt)

When a task has the `ready-for-planning` label applied, the agent must not ask Tim immediately. Instead:

1. Record the wall-clock timestamp when you first observe the label on the task.
2. On your **next invocation** after ~1 minute has elapsed since you first observed the label, ask once:
   > "Task #N **[title]** is marked `ready-for-planning`. Would you like me to create a plan?"
3. If Tim says **no** or does not respond within the session, do not ask again for that task.
4. If Tim says **yes**, proceed immediately to the [Plan Creation](#plan-creation) steps below.

**Elapsed-time check, not a timer:** This is checked opportunistically on each invocation — you are not running a background timer. If your first invocation after 1 minute has passed, ask. If less than 1 minute has passed, stay silent and check next time.

**One ask per task:** Never ask about the same task more than once across separate invocations. Track which task IDs you have already asked about in your working memory for the session.

### Explicit Planning Request (Immediate)

If Tim says anything matching "plan task N", "create a plan for this task", "let's plan", or similar explicit requests referencing a specific task — proceed immediately to [Plan Creation](#plan-creation) without the 1-minute deferral.

### Plan Creation

When planning is approved (either via `ready-for-planning` deferral or explicit request):

1. **Read the task in full:**
   ```bash
   ak get task <id>
   ak get note --task <id>
   ```

2. **Write the plan document** — create a markdown file at a path you choose (e.g., a local file, a GitHub Gist, or a file committed to the repository's `docs/plans/` directory). The plan must include:
   - **Objective:** one-sentence goal
   - **Scope:** what is in-scope and out-of-scope
   - **Implementation steps:** ordered list of concrete actions
   - **Verification:** how to confirm the work is correct (commands, manual checks)
   - **Risks:** any blockers, dependencies, or ambiguities to resolve before claiming

3. **Get Tim's approval** — present the plan inline or share the document URL. Wait for explicit "looks good", "approved", "go ahead", or equivalent. Do not proceed without approval.

4. **Stamp the task with the plan URL** — once approved, set `plan_url` on the task:
   ```bash
   # If the plan is a file committed to the repo, use the GitHub raw URL or PR preview URL.
   # If the plan is inline text, write it to docs/plans/<task-id>.md and commit it,
   # then use the GitHub blob URL.
   curl -X PATCH <API_BASE>/api/tasks/<id> \
     -H "Authorization: Bearer $AK_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"plan_url": "<url>"}'
   ```
   Or via apply:
   ```yaml
   kind: Task
   spec:
     id: <id>
     planUrl: <url>
   ```
   ```bash
   ak apply -f task-plan.yaml
   ```

5. **Leave the task in `todo`** — do not claim the task yet. The task remains `todo` until Tim or a machine daemon assigns it and the agent claims it via `ak task claim <id>`. Plan approval is not a claim signal.

### State to Track Per Session

To implement the deferred-prompt behavior correctly, maintain this lightweight state in working memory:

```
planning_observations:
  <task-id>:
    first_seen_ready: <ISO timestamp>
    asked: <true|false>
```

Reset this state at the start of each fresh session. If you re-enter a session where you already asked about a task (asked: true), do not ask again.
```

---

**Step 3 — Verification**

1. Read the updated `skills/agent-kanban/SKILL.md` and confirm:
   - The new `## AI-Assisted Planning Workflow` section appears cleanly between `## Output Format` and `## Rules`
   - All four behaviors are present: silent recognition, deferred label prompt, explicit request path, plan creation with `plan_url` stamp
   - No other section is modified
2. `git diff` — confirm only `skills/agent-kanban/SKILL.md` is changed
3. Invoke Bandit for QA gate

**Verification (runtime behavior — manual)**
Load the skill into a Claude session that is watching a board. Apply the `ready-for-planning` label to a `todo` task. Confirm:
- First invocation (< 1 min elapsed): no prompt
- Next invocation (> 1 min elapsed): agent asks "Task #N [title] is marked `ready-for-planning`. Would you like me to create a plan?"
- Reply "yes": agent reads task, produces a plan, waits for approval
- Approve plan: agent runs `PATCH /api/tasks/:id` with `plan_url`; task stays `todo`
- `ak get task <id>` shows `plan_url` populated

**Next Step:** Skylar — create the worktree, open `skills/agent-kanban/SKILL.md`, and append the `## AI-Assisted Planning Workflow` section exactly as specified in Step 2. Confirm the section order is correct (`Output Format` → `AI-Assisted Planning Workflow` → `Rules`). Run `git diff` to verify only one file changed. Invoke Bandit.

---

## Sprint 5 Bridges

### HANDOFF BRIDGE — T5
**Topic:** Allow `user` identity to create/edit/delete backlog tasks (auth ACL + status guard)
**Track:** T5
**Specialist:** Skylar
**Static DNA Check:** Aligned — Hono backend on Cloudflare Workers, auth via Better Auth, repo layer pattern. Security-sensitive change follows sign-off protocol.
**Dynamic DNA State:**
- **Product Context:** Browser-session users must be able to POST/PATCH/DELETE tasks that are in `todo` status; all other statuses remain agent/machine-only for mutations.
- **Current Plan:** Sprint 5 → Track 5 section in `docs/context/plan.md`
- **Execution Files:**
  - `apps/web/server/auth.ts` — add `"user"` to the allow list for `POST /api/tasks`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id` in `ROUTE_RULES`
  - `apps/web/server/routes.ts` — (a) make `assigned_to` optional when `identityType === 'user'` in POST handler; (b) add status guard in PATCH handler: if `identityType === 'user'` and task's current `status !== 'todo'`, return 403; (c) add same status guard in DELETE handler
**Migration Safety:** Reversible — auth rule changes are in-code, no schema migration
**Security Review:** AUTH — Tim acceptance: YES (2026-05-20)
**Worktree Setup:** `git worktree add .worktrees/track-5 track/5-user-backlog-api` — use worktree; T8 may run in parallel
**Verification:**
1. `pnpm build && npx vitest run` — must exit zero
2. Manual curl test (replace `<cookie>` with a valid browser session cookie):
   - `curl -X POST http://localhost:8787/api/tasks -H "Cookie: <cookie>" -d '{"board_id":"...","title":"Test backlog item","status":"todo"}' -H "Content-Type: application/json"` → expect 201
   - `curl -X PATCH http://localhost:8787/api/tasks/<todo-id> -H "Cookie: <cookie>" -d '{"title":"Updated"}' -H "Content-Type: application/json"` → expect 200
   - `curl -X PATCH http://localhost:8787/api/tasks/<in-progress-id> -H "Cookie: <cookie>" -d '{"title":"Blocked"}' -H "Content-Type: application/json"` → expect 403
   - `curl -X DELETE http://localhost:8787/api/tasks/<in-progress-id> -H "Cookie: <cookie>"` → expect 403
**Next Step:** Skylar — read `apps/web/server/auth.ts` and `apps/web/server/routes.ts` in full before touching anything. Implement the three changes above atomically in a single commit on `track/5-user-backlog-api`. Run verification. Then invoke Bandit for QA gate before merging.

---

### HANDOFF BRIDGE — T6
**Topic:** Backend: backlog task creation without `assigned_to` / board-level default repo (B2)
**Track:** T6
**Specialist:** Skylar
**Static DNA Check:** Aligned — Hono API on Cloudflare Workers, D1/SQLite schema migration, repo-layer pattern (boardRepo, taskRepo), auth via Better Auth. Schema-touching track; Tim sign-off on record (2026-05-20).
**Dynamic DNA State:**
- **Product Context:** User-created tasks must work without `assigned_to` (null = unassigned backlog item); boards gain a `default_repository_id` nullable column so Tim sets the repo once per board and all user-created tasks on that board inherit it automatically — no per-task repo picker needed.
- **Current Plan:** Sprint 5 → Track 6 section in `docs/context/plan.md`
- **Execution Files:**
  - `apps/web/migrations/0022_board_default_repo.sql` — NEW FILE: `ALTER TABLE boards ADD COLUMN default_repository_id TEXT REFERENCES repositories(id);`
  - `apps/web/server/routes.ts` — four targeted edits (see Next Step below)
  - `apps/web/server/taskRepo.ts` — skip `assertAssignableWorkerAgent` and `isRuntimeAvailable` when `actorType === 'user'`; skip dev-board `repository_id` required guard when `actorType === 'user'`
  - `apps/web/server/boardRepo.ts` — store and return `default_repository_id` on board reads and writes
  - `packages/shared/src/types.ts` — add `default_repository_id?: string | null` to `Board` interface; add `default_repository_id?: string | null` to `CreateBoardInput`

**Migration Safety:** Reversible — nullable column addition; drop column to roll back. Tim schema sign-off: YES (2026-05-20)
**Security Review:** SCHEMA — Tim acceptance: YES (2026-05-20)
**Worktree Setup:** `git worktree add .worktrees/track-6 track/6-backlog-create` — create this branch from `track/5-user-backlog-api` so T5 changes are the base.

**Exact implementation steps for Skylar:**

1. **Migration file** — create `apps/web/migrations/0022_board_default_repo.sql` with exactly:
   ```sql
   ALTER TABLE boards ADD COLUMN default_repository_id TEXT REFERENCES repositories(id);
   ```

2. **`packages/shared/src/types.ts`** — two additions:
   - On `Board` interface: add `default_repository_id?: string | null;` after `share_slug`.
   - On `CreateBoardInput` interface: add `default_repository_id?: string | null;` after `type`.

3. **`apps/web/server/boardRepo.ts`** — four edits:
   - `createBoard` signature: add `defaultRepositoryId?: string | null` parameter. Add it to the INSERT statement and bind list.
   - `updateBoard` `updates` type: add `default_repository_id?: string | null`. Add a `if (updates.default_repository_id !== undefined)` block that pushes `"default_repository_id = ?"` and the value to the sets/values arrays. Allow explicit `null` (to unset).
   - `POST /api/boards` in `routes.ts` will pass `body.default_repository_id` — `boardRepo.createBoard` must accept and persist it.
   - No changes needed to `getBoard`, `listBoards`, `getDefaultBoard`, or `getBoardBySlug` — `SELECT *` already returns the new column once the migration runs.

4. **`apps/web/server/routes.ts`** — four targeted edits:
   a. `POST /api/tasks` (line ~768, T5 branch): The T5 line reads:
      ```ts
      if (!body.assigned_to && c.get("identityType") !== "user") throw new HTTPException(400, { message: "assigned_to is required" });
      ```
      Keep this line as-is (T5 already made `assigned_to` optional for users).
      Add below it (before `resolveActor`):
      ```ts
      if (c.get("identityType") === "user" && !body.repository_id && body.board_id) {
        const boardRow = await c.env.DB.prepare("SELECT default_repository_id FROM boards WHERE id = ?")
          .bind(body.board_id)
          .first<{ default_repository_id: string | null }>();
        if (boardRow?.default_repository_id) {
          body.repository_id = boardRow.default_repository_id;
        }
      }
      ```
   b. `POST /api/boards` (line ~959): Extend the body type to include `default_repository_id?: string`. Pass `body.default_repository_id` as the new parameter to `createBoard(...)`.
   c. `PATCH /api/boards/:id` (line ~985): Extend the body type to include `default_repository_id?: string | null`. Pass through to `updateBoard(...)`.
   d. **Remove dev-board `repository_id` required guard in `taskRepo.ts`** (see step 5) — no route change needed here; the guard is in `taskRepo.ts`.

5. **`apps/web/server/taskRepo.ts`** — `createTask` function (lines ~48–140):
   - At line ~59, the current guard:
     ```ts
     if (board.type === "dev" && !input.repository_id) {
       throw new HTTPException(400, { message: "repository_id is required for dev board tasks" });
     }
     ```
     Change to:
     ```ts
     if (board.type === "dev" && !input.repository_id && actorType !== "user") {
       throw new HTTPException(400, { message: "repository_id is required for dev board tasks" });
     }
     ```
   - At line ~88, the current guard:
     ```ts
     if (input.assigned_to) {
       await assertAssignableWorkerAgent(db, ownerId, input.assigned_to, 400);
     }
     ```
     Change to:
     ```ts
     if (input.assigned_to && actorType !== "user") {
       await assertAssignableWorkerAgent(db, ownerId, input.assigned_to, 400);
     }
     ```
     (User-created tasks have `assigned_to = null`; no agent lookup needed.)
   - `isRuntimeAvailable` is only called inside `assertAssignableWorkerAgent`, so skipping that call is sufficient — no further change needed.

**Verification:**
1. `pnpm build && pnpm tsc --noEmit && npx vitest run` — must all exit zero
2. Apply migration to local D1: `npx wrangler d1 execute agent-kanban --local --file=apps/web/migrations/0022_board_default_repo.sql`
3. Set a board's default repo via `curl`:
   ```
   curl -X PATCH http://localhost:8787/api/boards/<board-id> \
     -H "Cookie: <session-cookie>" \
     -H "Content-Type: application/json" \
     -d '{"default_repository_id":"<repo-id>"}'
   ```
   → expect 200 with `default_repository_id` in the response body
4. Create a user task without `repository_id` on that board:
   ```
   curl -X POST http://localhost:8787/api/tasks \
     -H "Cookie: <session-cookie>" \
     -H "Content-Type: application/json" \
     -d '{"board_id":"<board-id>","title":"Test backlog item"}'
   ```
   → expect 201; response task should have `repository_id` matching the board's `default_repository_id`
5. Create a user task without `assigned_to` — expect 201 with `assigned_to: null`
6. Verify existing agent/machine `POST /api/tasks` still requires `assigned_to` and `repository_id` for dev boards (no regression)
7. Invoke Bandit for QA gate before considering T6 done

**Next Step:** Skylar — create branch `track/6-backlog-create` from `track/5-user-backlog-api`. Create the migration file first, then work through the five files in order: shared types → boardRepo → routes (boards) → routes (tasks) → taskRepo. Run verification. Invoke Bandit.

---

### HANDOFF BRIDGE — T7
**Topic:** Frontend: backlog create/edit/delete UI
**Track:** T7
**Specialist:** Skylar
**Static DNA Check:** Aligned — React + Vite + Tailwind + shadcn/ui frontend. Pure UI track; no schema migration, no auth changes. T5 + T6 are both DONE (Bandit PASS), so all backend API surface this track depends on is stable and merged into `track/6-backlog-create`.
**Dynamic DNA State:**
- **Product Context:** Tim needs to manage a product backlog from the browser: create tasks in the `todo` column, edit them inline, and delete them with a confirmation step — all scoped to `todo` status only; all other columns remain read-only.
- **Current Plan:** Sprint 5 → Track 7 section in `docs/context/plan.md`
- **Execution Files:**
  - `apps/web/src/components/BacklogTaskForm.tsx` — NEW FILE (create/edit form, dialog-based)
  - `apps/web/src/components/KanbanColumn.tsx` — add "Add task" button (todo column only) and thread `onAddTask` / `onEditTask` / `onDeleteTask` callbacks
  - `apps/web/src/components/TaskCard.tsx` — add conditional edit/delete icon buttons (todo status only)
  - `apps/web/src/routes/BoardPage.tsx` — add form state (`formMode`, `editingTask`), wire callbacks, pass `onRefresh`
  - `apps/web/src/lib/api.ts` — NO CHANGES NEEDED (`api.tasks.create`, `api.tasks.update`, `api.tasks.delete` already exist)

**Migration Safety:** Reversible — UI-only change, no schema or auth impact
**Security Review:** N/A
**Worktree Setup:** `git worktree add .worktrees/track-7 track/7-backlog-ui` — create this branch from `track/6-backlog-create` so T5+T6 changes are the base. T7 is the only active track.

---

#### Exact implementation steps for Skylar

**Step 0 — Branch setup**

```bash
# From the working directory root
git checkout track/6-backlog-create
git checkout -b track/7-backlog-ui
# Or via worktree:
git worktree add .worktrees/track-7 -b track/7-backlog-ui track/6-backlog-create
```

---

**Step 1 — `apps/web/src/lib/api.ts` — Confirm no changes needed**

All three required methods already exist on `api.tasks`:
- `api.tasks.create(input)` → `POST /api/tasks` — accepts `{ board_id, title, description?, labels? }`
- `api.tasks.update(id, body)` → `PATCH /api/tasks/:id` — accepts `{ title?, description?, labels? }`
- `api.tasks.delete(id)` → `DELETE /api/tasks/:id` — returns `{ ok: true }`

No edits to `api.ts`. Read it to confirm, then proceed.

---

**Step 2 — `apps/web/src/components/BacklogTaskForm.tsx` — NEW FILE**

Create a Dialog-based form component. Use the existing `BoardLabelDialogs.tsx` as a reference pattern (Dialog + DialogContent + DialogHeader + DialogFooter + Button). Use shadcn/ui primitives already installed: `Dialog`, `Input`, `Label`, `Button`, `Textarea` (for description), and a multi-select chip area for labels (no Select — render label chips as toggles using `LabelChip` + click-to-toggle pattern).

**Props interface:**

```ts
interface BacklogTaskFormProps {
  mode: "create" | "edit";
  open: boolean;
  boardId: string;
  initialTask?: { id: string; title: string; description?: string | null; labels?: string[] } | null;
  boardLabels: { name: string; color: string; description: string }[];
  onClose: () => void;
  onSuccess: () => void;   // calls refresh on the board
}
```

**Form fields (exactly three — no repo picker per B2 decision):**
1. `title` — `<Input>` — required. Disable submit if empty.
2. `description` — `<Textarea>` — optional. A few rows tall.
3. `labels` — optional. Render each board label as a clickable `LabelChip`. Clicking a chip toggles its inclusion. Selected labels are tracked in local state as `string[]`.

**Behavior:**
- `mode === "create"`: title/description/labels all start empty. On submit → `api.tasks.create({ board_id: boardId, title, description: description || undefined, labels: selectedLabels.length ? selectedLabels : undefined })`. On 201 → call `onSuccess()` then `onClose()`.
- `mode === "edit"`: form pre-fills from `initialTask`. On submit → `api.tasks.update(initialTask.id, { title, description: description || null, labels: selectedLabels })`. On 200 → call `onSuccess()` then `onClose()`.
- Error state: catch API errors, display error message inside the dialog (same pattern as `BoardLabelDialogs.tsx` — `{error && <p className="text-xs text-error">{error}</p>}`).
- Pending state: disable submit button and show "Saving..." while the request is in-flight.
- Reset form state when `open` transitions from false to true (use `useEffect([open])` — same pattern as `LabelFormDialog`).

---

**Step 3 — `apps/web/src/components/TaskCard.tsx` — conditional edit/delete icons**

**New props to add:**

```ts
interface TaskCardProps {
  task: any;
  labels?: { name: string; color: string; description: string }[];
  onClick: () => void;
  onAgentClick?: (task: any) => void;
  onEdit?: (task: any) => void;       // NEW — only provided for todo tasks
  onDelete?: (task: any) => void;     // NEW — only provided for todo tasks
  isNew?: boolean;
}
```

**Where to render the icons:**

In the bottom row (`<div className="mt-2 flex items-center justify-between gap-2">`), add a small icon group on the right side — only when `task.status === 'todo'` AND the `onEdit` / `onDelete` props are present. Use lucide-react icons: `Pencil` (edit) and `Trash2` (delete). Icons should be small (`size-3.5`), styled as ghost icon-buttons, and must call `event.stopPropagation()` before invoking the callback to prevent the card click from firing.

```tsx
{task.status === 'todo' && (onEdit || onDelete) && (
  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
    {onEdit && (
      <button
        type="button"
        aria-label="Edit task"
        className="p-1 rounded text-content-tertiary hover:text-content-primary transition-colors"
        onClick={(e) => { e.stopPropagation(); onEdit(task); }}
      >
        <Pencil className="size-3.5" />
      </button>
    )}
    {onDelete && (
      <button
        type="button"
        aria-label="Delete task"
        className="p-1 rounded text-content-tertiary hover:text-error transition-colors"
        onClick={(e) => { e.stopPropagation(); onDelete(task); }}
      >
        <Trash2 className="size-3.5" />
      </button>
    )}
  </div>
)}
```

Import `Pencil` and `Trash2` from `lucide-react`.

---

**Step 4 — `apps/web/src/components/KanbanColumn.tsx` — "Add task" button + callback props**

**New props:**

```ts
interface KanbanColumnProps {
  column: any;
  labels?: { name: string; color: string; description: string }[];
  onTaskClick: (taskId: string) => void;
  onAgentClick?: (task: any) => void;
  onAddTask?: () => void;        // NEW — only provided for todo column
  onEditTask?: (task: any) => void;   // NEW — passed through to TaskCard
  onDeleteTask?: (task: any) => void; // NEW — passed through to TaskCard
}
```

**"Add task" button:**

Render after the card list (inside the scroll container, below the `AnimatePresence` block) when `column.status === 'todo'` AND `onAddTask` is provided:

```tsx
{column.status === 'todo' && onAddTask && (
  <button
    type="button"
    onClick={onAddTask}
    className="mt-1 w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-content-tertiary hover:text-content-secondary hover:bg-surface-secondary transition-colors"
  >
    <Plus className="size-3.5" />
    Add task
  </button>
)}
```

Import `Plus` from `lucide-react`.

**Pass callbacks to `TaskCard`:**

```tsx
<TaskCard
  task={task}
  labels={labels}
  onClick={() => onTaskClick(task.id)}
  onAgentClick={onAgentClick}
  onEdit={task.status === 'todo' ? onEditTask : undefined}
  onDelete={task.status === 'todo' ? onDeleteTask : undefined}
/>
```

---

**Step 5 — `apps/web/src/routes/BoardPage.tsx` — state + delete confirmation + wire callbacks**

**New state:**

```ts
const [formOpen, setFormOpen] = useState(false);
const [formMode, setFormMode] = useState<"create" | "edit">("create");
const [editingTask, setEditingTask] = useState<any | null>(null);
const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
const [deletePending, setDeletePending] = useState(false);
const [deleteError, setDeleteError] = useState<string | null>(null);
```

**Handlers:**

```ts
function handleAddTask() {
  setEditingTask(null);
  setFormMode("create");
  setFormOpen(true);
}

function handleEditTask(task: any) {
  setEditingTask(task);
  setFormMode("edit");
  setFormOpen(true);
}

function handleDeleteTask(task: any) {
  setDeleteTarget(task);
  setDeleteError(null);
  setDeleteConfirmOpen(true);
}

async function confirmDelete() {
  if (!deleteTarget) return;
  setDeletePending(true);
  setDeleteError(null);
  try {
    await api.tasks.delete(deleteTarget.id);
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
    refresh();
  } catch (err: any) {
    setDeleteError(err.message ?? "Delete failed");
  } finally {
    setDeletePending(false);
  }
}
```

**Wire `KanbanColumn` — both desktop and mobile column renders:**

```tsx
<KanbanColumn
  key={col.status}
  column={col}
  labels={board.labels ?? []}
  onTaskClick={setSelectedTask}
  onAgentClick={setChatTask}
  onAddTask={col.status === 'todo' ? handleAddTask : undefined}
  onEditTask={handleEditTask}
  onDeleteTask={handleDeleteTask}
/>
```

Apply the same props to both the desktop grid and the mobile single-column renders.

**Import and render `BacklogTaskForm`** (after the `AgentAvatarOverlay` line, alongside other overlays):

```tsx
import { BacklogTaskForm } from "../components/BacklogTaskForm";
// ...
{board && (
  <BacklogTaskForm
    mode={formMode}
    open={formOpen}
    boardId={board.id}
    initialTask={editingTask}
    boardLabels={board.labels ?? []}
    onClose={() => setFormOpen(false)}
    onSuccess={() => { setFormOpen(false); refresh(); }}
  />
)}
```

**Delete confirmation dialog** — use the existing `DeleteLabelDialog` pattern from `BoardLabelDialogs.tsx` as reference. Render a small Dialog with a destructive confirm button:

```tsx
<Dialog open={deleteConfirmOpen} onOpenChange={(open) => !open && setDeleteConfirmOpen(false)}>
  <DialogContent className="sm:max-w-sm" showCloseButton={false}>
    <DialogHeader>
      <DialogTitle>Delete task</DialogTitle>
      <DialogDescription>
        Delete "{deleteTarget?.title}"? This cannot be undone.
      </DialogDescription>
    </DialogHeader>
    {deleteError && <p className="text-xs text-error">{deleteError}</p>}
    <DialogFooter className="flex-col sm:flex-row">
      <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
      <Button variant="destructive" onClick={confirmDelete} disabled={deletePending}>
        {deletePending ? "Deleting..." : "Delete"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

Import `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `Button` from their existing shadcn/ui paths (already used elsewhere in the codebase).

---

**Verification:**

1. `pnpm build && pnpm tsc --noEmit && npx vitest run` — must all exit zero
2. `pnpm dev` — open the board in the browser
3. Todo column shows "Add task" button at the bottom; no other column shows it
4. Clicking "Add task" opens the form in create mode with empty fields
5. Fill title (required) → submit → task appears in todo column; form closes
6. Submit with empty title → button stays disabled (no API call)
7. Click edit icon on a todo card → form opens pre-filled; save → card updates
8. Click delete icon on a todo card → confirmation dialog appears; confirm → card disappears
9. Edit/delete icons do NOT appear on cards in `in_progress`, `in_review`, `done`, or `cancelled` columns
10. Existing card click (opens `TaskDetail`) still works — `stopPropagation` on edit/delete icons prevents interference
11. Invoke Bandit for QA gate

**Next Step:** Skylar — create branch `track/7-backlog-ui` from `track/6-backlog-create`. Work through the five files in order: confirm `api.ts` (no changes) → create `BacklogTaskForm.tsx` → patch `TaskCard.tsx` → patch `KanbanColumn.tsx` → patch `BoardPage.tsx`. Run the verification checklist. Invoke Bandit.

---

## Archive: Sprint 4 — Local Agent-Kanban Companion Service

**Objective:** Stand up a locally-running fork of `saltbo/agent-kanban` as a separate repo, stripped of all Cloudflare/cloud dependencies, so Tim can manage Agent OS backlog and per-track task status from a browser tab. Goal is a working local board — nothing more.

**Status: COMPLETE as of 2026-05-20**

**Repo relationship (Static DNA — non-negotiable for this sprint):**
- **This repo (`agent-skills-private`):** Source of truth for Agent OS — skills, agents, sprint plans. Untouched by this sprint's code work; only `docs/context/` is edited (by Peaches).
- **New repo (forked locally):** `agent-kanban` (Tim's GitHub fork of `saltbo/agent-kanban`). Lives as a sibling directory under `~/Developer/`. Uses `pnpm`, not `bun` — this is intentional and acceptable because it is a separate repo.
- **Cross-repo discipline:** Skylar's edits in this sprint happen inside the new `agent-kanban` clone. No source code is added to `agent-skills-private`.

**Scope guard:** All code work occurs in the new `agent-kanban` clone. Inside `agent-skills-private`, only `docs/context/plan.md` and `docs/context/tracks.md` are touched (by Peaches). No edits to `claude/skills/`, `claude/agents/`, `AGENTIC.md`, or settings.

**Tracks:**
- T1: Fork & local clone — DONE
- T2: Strip Cloudflare/cloud bindings — DONE
- T3: Configure GitHub OAuth for local dev — DONE
- T4: Smoke test — DONE

**Known gaps carried forward to Sprint 5:**
- Task creation requires `agent:worker` identity (machine API key) — user session cannot create tasks
- Status transitions require API calls with agent/machine identity — the web UI is read-only by design
- No end-to-end `ak start` daemon flow was tested (CLI builds but daemon wasn't run against the board)

*Full Sprint 4 plan details preserved in git history.*
