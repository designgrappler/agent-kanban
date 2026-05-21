# Agent Kanban — Active Tracks

## Current Sprint: Sprint 6 — Board Polish

> **Working directory for all tracks:** `/Users/I826932/Developer/agent-kanban/`
> **Specialist:** Skylar
> **Worktree protocol:** T10 is now unblocked (T9 merged). T14 is blocked on Tim decisions. Use worktrees per AGENTIC.md §4 when running 2+ tracks simultaneously.

---

### Track 9 — Schema + Backend: `theme` column on boards

- **Status:** DONE — Bandit PASS
- **Specialist:** Skylar
- **Branch:** `track/9-board-theme-schema`
- **Goal:** Add `theme TEXT` nullable column to `boards` table. Wire through `boardRepo.createBoard`, `boardRepo.updateBoard`, `routes.ts` (POST and PATCH /api/boards), and `shared/types.ts` (`Board`, `CreateBoardInput`).
- **Primary files:**
  - `apps/web/migrations/0023_board_theme.sql` — NEW: `ALTER TABLE boards ADD COLUMN theme TEXT;`
  - `packages/shared/src/types.ts` — add `theme?: string | null` to `Board`; add `theme?: string` to `CreateBoardInput`
  - `apps/web/server/boardRepo.ts` — `createBoard`: add `theme` param + INSERT; `updateBoard`: add `theme` to updates type + set/bind block
  - `apps/web/server/routes.ts` — `POST /api/boards` body: add `theme?`; pass to `createBoard`; `PATCH /api/boards/:id` body: add `theme?`; pass to `updateBoard`
- **Migration Safety:** Reversible — nullable column addition; drop column to roll back
- **Security Review:** SCHEMA — **Tim acceptance REQUIRED before Bridge issuance**
- **Depends on:** (unblocked)

---

### Track 10 — Frontend: update create board form

- **Status:** DONE — Bandit PASS
- **Specialist:** Skylar
- **Branch:** `track/10-board-form-update`
- **Goal:** Remove board type UI selector from `NewBoardPage.tsx`. Hardcode `type: "dev"` in the create payload. Add Theme textarea with placeholder "Describe the purpose of this sprint."
- **Primary files:**
  - `apps/web/src/routes/NewBoardPage.tsx` — remove `boardType` state + type selector UI; add `boardTheme` state + Textarea; update `handleCreateBoard` payload
- **Migration Safety:** Reversible
- **Security Review:** N/A
- **Depends on:** T9 (shared types must include `theme` on `CreateBoardInput`)

---

### Track 11 — Frontend: remove Cancelled column from board view

- **Status:** DONE — Bandit PASS
- **Specialist:** Skylar
- **Branch:** `track/11-remove-cancelled-column`
- **Goal:** Remove `"cancelled"` from `TASK_STATUSES` in `BoardPage.tsx` and `SharePage.tsx`. Remove `cancelled: Ban` from `KanbanColumn.tsx` COLUMN_ICONS. No backend changes.
- **Primary files:**
  - `apps/web/src/routes/BoardPage.tsx` — remove `"cancelled"` from `TASK_STATUSES` array and `TASK_STATUS_LABELS`
  - `apps/web/src/routes/SharePage.tsx` — same removal
  - `apps/web/src/components/KanbanColumn.tsx` — remove `cancelled: Ban` from `COLUMN_ICONS`; remove `Ban` import if unused elsewhere
  - `apps/web/src/components/DemoBoard.tsx` — Tim confirmed: remove Cancelled column from demo too
- **Migration Safety:** Reversible
- **Security Review:** N/A
- **Depends on:** (unblocked — independent of T9/T10)

---

---

### Track 12 — Frontend: edit icon in TaskDetail read-only view

- **Status:** DONE — Bandit PASS
- **Specialist:** Skylar
- **Branch:** `track/12-task-detail-edit-icon`
- **Goal:** Add optional `onEdit` prop to `TaskDetail`. Render a Pencil icon button in the header when `task.status === "todo" && onEdit`. Wire `onEdit={handleEditTask}` from `BoardPage`.
- **Primary files:**
  - `apps/web/src/components/TaskDetail.tsx` — add `onEdit?` prop to interface; add Pencil button in header; import `Pencil` from lucide-react
  - `apps/web/src/routes/BoardPage.tsx` — pass `onEdit={handleEditTask}` to `<TaskDetail>`
- **Migration Safety:** Reversible
- **Security Review:** N/A
- **Depends on:** (unblocked — independent of T9/T10/T11)

---

### Track 13 — Backend: seed `ready-for-planning` label on board creation

- **Status:** DONE — Bandit PASS
- **Specialist:** Skylar
- **Branch:** `track/13-seed-planning-label`
- **Goal:** After `createBoard()` inserts the board row, call `createBoardLabel()` to seed the `ready-for-planning` label. No schema migration required.
- **Primary files:**
  - `apps/web/server/boardRepo.ts` — add `createBoardLabel(db, id, { name: "ready-for-planning", color: "#6366F1", description: "Marks a task as ready for AI-assisted planning." })` inside `createBoard()` after `seedBuiltinAgents`
- **Migration Safety:** Reversible (label deleteable via existing DELETE endpoint)
- **Security Review:** N/A
- **Depends on:** (unblocked — independent of all other tracks)

---

### Track 15 — Backend + Frontend: `plan_url` column on tasks

- **Status:** DONE — Bandit PASS
- **Specialist:** Skylar
- **Branch:** `track/15-task-plan-url`
- **Goal:** Add `plan_url TEXT` nullable column to `tasks` table. Mirror `pr_url` pattern throughout: migration, shared types, taskRepo (INSERT + updateTask allowedFields), TaskDetail display, CLI output and describe, apply parser CAMEL_TO_SNAKE map.
- **Primary files:**
  - `apps/web/migrations/0024_task_plan_url.sql` — NEW: `ALTER TABLE tasks ADD COLUMN plan_url TEXT;`
  - `packages/shared/src/types.ts` — add `plan_url: string | null` to `Task` interface (after `pr_url`)
  - `apps/web/server/taskRepo.ts` — add `plan_url` to INSERT column list (NULL default); add to `updateTask` Pick type and `allowedFields` array
  - `apps/web/src/components/TaskDetail.tsx` — add read-only "Plan" Field after "PR" Field in the details grid
  - `packages/cli/src/commands/describe.ts` — add `plan_url` display line after `pr_url` line
  - `packages/cli/src/output.ts` — add `plan_url` to `formatTaskList`, `formatTaskListWide`, and detailed task block
  - `packages/cli/src/apply/parser.ts` — add `planUrl: "plan_url"` to `CAMEL_TO_SNAKE` map
- **Migration Safety:** Reversible — nullable column addition; Tim schema sign-off: YES (2026-05-21)
- **Security Review:** SCHEMA — Tim acceptance: YES (2026-05-21)
- **Depends on:** (unblocked — independent of all other active tracks)

---



- **Status:** READY — T15 merged; unblocked 2026-05-21
- **Specialist:** Skylar (Agent OS config only — no `apps/web/` or `packages/` source changes)
- **Branch:** `track/14-planning-workflow`
- **Goal:** Define AI-assisted planning behavior in Agent OS skill config. Silent task recognition, `ready-for-planning` label trigger with ~1-minute deferred prompt, explicit planning request path.
- **Primary files:**
  - `skills/agent-kanban/CLAUDE.md` (or equivalent skill behavior file) — document planning workflow rules
  - Agent soul/CLAUDE.md updates for board agent behavior
- **Migration Safety:** Reversible (config changes)
- **Security Review:** N/A
- **Depends on:** T13 (label must exist on boards); Tim decision on plan_url (Q5)

---

## Worktree Note

**MANDATORY: Always use `scripts/worktree-add.sh`, never raw `git worktree add`.**
See AGENTIC.md §4 for the full explanation. pnpm's hoisted `node_modules` are not present in raw worktrees — the script symlinks them.

T10 is complete — DONE. T15 Bridge issued 2026-05-21 (Tim schema sign-off received). T14 unblocked once T15 lands.

---

### Track 16 — Infra: worktree support for pnpm monorepo

- **Status:** DONE — Bandit PASS
- **Specialist:** Skylar
- **Branch:** `track/16-worktree-support`
- **Goal:** Make `pnpm build`, `pnpm tsc --noEmit`, `npx vitest run`, and `npx biome` work inside git worktrees. Three deliverables: (1) `scripts/worktree-add.sh` that symlinks all `node_modules` dirs from root into the new worktree; (2) add `@agent-kanban/shared` path alias to `apps/web/tsconfig.json` to resolve from source instead of `dist/`; (3) AGENTIC.md §4 already updated by Peaches.
- **Primary files:**
  - `scripts/worktree-add.sh` — NEW: wrapper around `git worktree add` that symlinks `node_modules`, `apps/web/node_modules`, `packages/shared/node_modules`, `packages/cli/node_modules` from root into the new worktree
  - `apps/web/tsconfig.json` — add `"@agent-kanban/shared": ["../../packages/shared/src/index.ts"]` to `compilerOptions.paths`
- **Already done (Peaches):** `AGENTIC.md §4` updated to mandate `scripts/worktree-add.sh`; worktree commands in this file updated
- **Migration Safety:** N/A — no schema, no app source
- **Security Review:** N/A
- **Depends on:** (unblocked — independent of all Sprint 6 tracks)

---

## Open Questions (blocking)

1. **T11 — Orphaned cancelled tasks:** Once the Cancelled column is removed, tasks cancelled by agents are invisible in the board UI. Is that acceptable, or should we add a "tombstone" view (e.g., TaskDetail accessible via direct link)? The current TaskDetail panel already shows task status — so cancelled tasks can be viewed if you know their ID.
2. **T14/T15 — Plan document link:** Tim selected Option A (`plan_url TEXT` column on `tasks` table). Schema sign-off **RECEIVED 2026-05-21**. T15 Bridge issued. T15 merged 2026-05-21; T14 now unblocked.

**Resolved (no longer blocking):**
- T9 schema sign-off: APPROVED — Tim confirmed `ALTER TABLE boards ADD COLUMN theme TEXT` (2026-05-20)
- T11 DemoBoard.tsx: CONFIRMED — remove Cancelled column from `DemoBoard.tsx` too (2026-05-20)
- T13 existing boards migration: N/A — test boards deleted from D1; Sprint 6 board `bf8h6r9r` is the only board (2026-05-20)
- T13 label color: CONFIRMED — use default `#6366F1` (indigo-500) as planned (2026-05-20)
- T14 wait behavior: CONFIRMED — check elapsed time (not immediate prompt) (2026-05-20)

---

## Backlog (deferred from Sprint 5)

- **CLI daemon end-to-end:** Run `ak start` against the local board; register Skylar/Bandit/Peaches as board agents; have them update task status via `ak`. Deferred from Sprint 4/5.
- **AI-assisted planning prompt:** Board-level "kick off" action that sends current `todo` tasks to an agent for planning/ordering. Deferred — Sprint 5 lays the foundation.
- **P2 — Domain Judgment → Capabilities rename:** Standardize section heading in agent files.
- **Expand agent types post-sprint:** Broaden agent templates beyond dev roles.
- **Non-code artifact reviewer:** A skill for completeness/traceability/format checks on document artifacts.

---

## Archive: Sprint 5 Tracks (COMPLETE — 2026-05-20)

| Track | Goal | Status |
|---|---|---|
| T5 | Auth: allow `user` identity to create/edit/delete backlog tasks | DONE — Bandit PASS |
| T6 | Backend: backlog task creation without `assigned_to` / board-level default repo | DONE — Bandit PASS |
| T7 | Frontend: backlog create/edit/delete UI | DONE — Bandit PASS |
| T8 | CLAUDE.md: update UI principles | DONE — Bandit PASS |

---

## Archive: Sprint 4 Tracks (COMPLETE — 2026-05-20)

| Track | Goal | Status |
|---|---|---|
| T1 | Fork & local clone | DONE |
| T2 | Strip Cloudflare/cloud bindings | DONE |
| T3 | Configure GitHub OAuth for local dev | DONE |
| T4 | Smoke test (board renders, all 5 columns verified) | DONE |

---

*Last updated: 2026-05-21 (T9/T10/T11/T12/T13/T15/T16 DONE — Bandit PASS all; T14 unblocked, pending T15 merge)*
