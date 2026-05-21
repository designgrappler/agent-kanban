# Agent Kanban — Active Tracks

## Current Sprint: Sprint 5 — Human-Editable Backlog

> **Working directory for all tracks:** `/Users/I826932/Developer/agent-kanban/`
> **Specialist:** Skylar
> **Worktree protocol:** T5–T7 have a dependency chain (T7 depends on T5+T6). T8 is independent. If T5 and T8 run in parallel, use worktrees per AGENTIC.md §4. Single sequential execution is the default path.

---

### Track 5 — Auth: allow `user` identity to create/edit/delete backlog tasks
- **Status:** DONE — Bandit PASS. Branch: `track/5-user-backlog-api`
- **Specialist:** Skylar
- **Branch:** `track/5-user-backlog-api`
- **Goal:** Extend `ROUTE_RULES` in `auth.ts` so a browser session (`user` identity) can `POST /api/tasks`, `PATCH /api/tasks/:id`, and `DELETE /api/tasks/:id`. Add a status guard in `routes.ts` handlers so `user` identity can only mutate tasks with `status=todo`; any other status returns 403.
- **Primary files:**
  - `apps/web/server/auth.ts` — extend `ROUTE_RULES` allow lists
  - `apps/web/server/routes.ts` — add `identityType === 'user'` status guards in PATCH and DELETE handlers; make `assigned_to` optional when identity is `user`
- **Migration Safety:** Reversible
- **Security Review:** **AUTH — Tim acceptance: YES (2026-05-20)**
- **Depends on:** (unblocked)

---

### Track 6 — Backend: backlog task creation without `assigned_to` / board-level default repo (B2)
- **Status:** DONE — Bandit PASS 2026-05-20
- **Specialist:** Skylar
- **Branch:** `track/6-backlog-create` (builds on T5)
- **Goal:** Allow user-created tasks to omit `assigned_to` (unassigned backlog item). Add a `default_repository_id` nullable column to the `boards` table. When a user creates a task without specifying `repository_id`, the backend looks up the board's `default_repository_id` and applies it automatically. No repo picker needed in the frontend.
- **Tim's product decision (Option B + B2):** Board-level default repo. If a board has a `default_repository_id` set, all user-created tasks on that board automatically inherit the repo. Tim sets this once per board (via `PATCH /api/boards/:id`) rather than selecting it per task.
- **Schema migration:** `ALTER TABLE boards ADD COLUMN default_repository_id TEXT REFERENCES repositories(id)` (nullable). New migration file required in `apps/web/migrations/`.
- **Primary files:**
  - New migration file in `apps/web/migrations/` — add `default_repository_id` column to `boards`
  - `apps/web/server/routes.ts` — (a) remove hard `assigned_to` 400 for user identity; (b) remove `dev board requires repository_id` guard for user identity; (c) in `POST /api/tasks` when `identityType === 'user'` and `repository_id` is absent, look up board's `default_repository_id` and use it; (d) accept optional `default_repository_id` in `POST /api/boards` and `PATCH /api/boards/:id`
  - `apps/web/server/taskRepo.ts` — skip `assertAssignableWorkerAgent` and `isRuntimeAvailable` when `actorType === 'user'`
  - `apps/web/server/boardRepo.ts` — store and return `default_repository_id` on board read/write
  - `packages/shared/` — add `default_repository_id?: string | null` to board types; verify `CreateTaskInput.assigned_to` is typed as optional
- **Migration Safety:** Reversible — drop the column to roll back. Tim schema sign-off: YES (2026-05-20)
- **Security Review:** SCHEMA — Tim acceptance: YES (2026-05-20)
- **Depends on:** T5 merged

---

### Track 7 — Frontend: backlog create/edit/delete UI
- **Status:** DONE — Bandit PASS 2026-05-20
- **Specialist:** Skylar
- **Branch:** `track/7-backlog-ui` (builds on T5 + T6, created from `track/6-backlog-create`)
- **Goal:** Add "Add task" button to `todo` column. Show edit/delete icons on `todo` cards only. New `BacklogTaskForm` component handles create and edit. Delete has a confirmation step.
- **B2 — Board-level repo (Tim decision 2026-05-20):** No repo picker in the form. `repository_id` is managed at the board level (`default_repository_id`) and applied automatically by the backend. The form has exactly three fields: title (required), description (optional), labels/tags (optional).
- **Primary files:**
  - `apps/web/src/components/KanbanColumn.tsx` — "Add task" button (todo column only)
  - `apps/web/src/components/TaskCard.tsx` — conditional edit/delete icons (todo only)
  - `apps/web/src/components/BacklogTaskForm.tsx` — new form component (title, description, labels — no repo picker)
  - `apps/web/src/lib/api.ts` — add `createTask`, `updateTask`, `deleteTask` if missing
  - `apps/web/src/routes/BoardPage.tsx` — wire state + refresh
- **Migration Safety:** Reversible
- **Security Review:** N/A
- **Depends on:** T5 + T6

---

### Track 8 — CLAUDE.md: update UI principles
- **Status:** DONE — committed on `track/8-ui-principles` (e2fcc49)
- **Specialist:** Skylar
- **Branch:** `track/8-ui-principles`
- **Goal:** Update CLAUDE.md UI Principles section to reflect the backlog-edit model. Remove blanket "read-only board" and "no task creation UI" rules. Add nuanced rules: todo column is human-editable; tasks in any other status are locked in the UI.
- **Primary files:**
  - `CLAUDE.md` — UI Principles section only
- **Migration Safety:** Reversible
- **Security Review:** N/A
- **Depends on:** Tim's approval of the Sprint 5 plan

---

### Track 11 — Frontend: remove Cancelled column from board view
- **Status:** DONE — Bandit PASS
- **Specialist:** Skylar
- **Branch:** `track/11-remove-cancelled-column`
- **Goal:** Remove the Cancelled column from the Kanban board UI (BoardPage, SharePage, KanbanColumn, DemoBoard). Backend cancel endpoint and daemon handling remain untouched. Demo updated to 4-column layout.
- **Primary files:**
  - `apps/web/src/routes/BoardPage.tsx`
  - `apps/web/src/routes/SharePage.tsx`
  - `apps/web/src/components/KanbanColumn.tsx`
  - `apps/web/src/components/DemoBoard.tsx`
- **Migration Safety:** Reversible — UI-only change
- **Security Review:** N/A
- **Depends on:** (unblocked)

---

## Worktree Note

If T5 and T8 run in parallel (they are independent):
```bash
git worktree add .worktrees/track-5 track/5-user-backlog-api
git worktree add .worktrees/track-8 track/8-ui-principles
```
Otherwise, sequential execution T5 → T6 → T7 → T8 is fine.

---

## Backlog (deferred)

- **CLI daemon end-to-end:** Run `ak start` against the local board; register Skylar/Bandit/Peaches as board agents; have them update task status via `ak`. Deferred from Sprint 4.
- **AI-assisted planning prompt:** A board-level "kick off" action that sends current `todo` tasks to an agent for planning/ordering and then locks them. Deferred — Sprint 5 lays the foundation.
- **P2 — Domain Judgment → Capabilities rename:** Standardize section heading in `claude/agents/frontend.md`, `backend.md`, `fullstack.md`, `database.md`. Non-blocking.
- **Expand agent types post-sprint:** Broaden agent templates beyond dev roles to cover content, design, research, ops.
- **Non-code artifact reviewer:** A skill (not an agent) for completeness/traceability/format checks on document artifacts.

---

## Archive: Sprint 4 Tracks (COMPLETE — 2026-05-20)

| Track | Goal | Status |
|---|---|---|
| T1 | Fork & local clone | DONE |
| T2 | Strip Cloudflare/cloud bindings | DONE |
| T3 | Configure GitHub OAuth for local dev | DONE |
| T4 | Smoke test (board renders, all 5 columns verified) | DONE |

Known gaps carried to Sprint 5: user session cannot create tasks; UI is fully read-only; daemon not tested end-to-end.

---

*Last updated: 2026-05-20 (T5 → DONE Bandit PASS; T8 → DONE Bandit PASS; T6 → DONE Bandit PASS; T7 → DONE Bandit PASS 2026-05-20; T11 → DONE Bandit PASS 2026-05-20)*
