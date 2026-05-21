# Agent Kanban — Active Tracks

## Current Sprint: Sprint 6 — Board Polish

> **Working directory for all tracks:** `/Users/I826932/Developer/agent-kanban/`
> **Specialist:** Skylar
> **Worktree protocol:** T9, T11, T12, T13 can all run in parallel (independent). T10 depends on T9. T14 is blocked on Tim decisions. Use worktrees per AGENTIC.md §4 when running 2+ tracks simultaneously.

---

### Track 9 — Schema + Backend: `theme` column on boards

- **Status:** READY — Tim schema sign-off received (2026-05-20)
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

- **Status:** BLOCKED on T9
- **Specialist:** Skylar
- **Branch:** `track/10-board-form-update` (builds on T9)
- **Goal:** Remove board type UI selector from `NewBoardPage.tsx`. Hardcode `type: "dev"` in the create payload. Add Theme textarea with placeholder "Describe the purpose of this sprint."
- **Primary files:**
  - `apps/web/src/routes/NewBoardPage.tsx` — remove `boardType` state + type selector UI; add `boardTheme` state + Textarea; update `handleCreateBoard` payload
- **Migration Safety:** Reversible
- **Security Review:** N/A
- **Depends on:** T9 (shared types must include `theme` on `CreateBoardInput`)

---

### Track 11 — Frontend: remove Cancelled column from board view

- **Status:** READY — Tim confirmed: remove from DemoBoard.tsx too (2026-05-20)
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

- **Status:** READY — unblocked, no open questions
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

### Track 14 — Agent OS: AI-assisted planning workflow

- **Status:** PENDING — blocked on Tim's decision on plan_url column (Q5)
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

T9 and T11 can run in parallel (no shared files):
```bash
git worktree add .worktrees/track-9 -b track/9-board-theme-schema
git worktree add .worktrees/track-11 -b track/11-remove-cancelled-column
```
T12 and T13 are also independent and can run in parallel with T9/T11:
```bash
git worktree add .worktrees/track-12 -b track/12-task-detail-edit-icon
git worktree add .worktrees/track-13 -b track/13-seed-planning-label
```
T10 must be created from T9 once T9 is merged (or from the T9 branch if running sequentially):
```bash
git worktree add .worktrees/track-10 -b track/10-board-form-update track/9-board-theme-schema
```
T14 is blocked until Tim answers Open Question 5 (plan_url column).

---

## Open Questions (blocking)

1. **T11 — Orphaned cancelled tasks:** Once the Cancelled column is removed, tasks cancelled by agents are invisible in the board UI. Is that acceptable, or should we add a "tombstone" view (e.g., TaskDetail accessible via direct link)? The current TaskDetail panel already shows task status — so cancelled tasks can be viewed if you know their ID.
2. **T14/T15 — Plan document link:** Tim selected Option A (`plan_url TEXT` column on `tasks` table). Schema sign-off still **required** before T15 Bridge issuance.

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

*Last updated: 2026-05-20 (T13 DONE — Bandit PASS; Sprint 6 tracks updated by Peaches — Tim's answers applied: T9 READY, T11 READY, T14 wait behavior resolved; Bridges issued for T9/T11/T12/T13; T14 still pending plan_url sign-off)*
