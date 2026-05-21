# Agent Kanban — Active Tracks

## Current Sprint: Sprint 7 — UI Polish

> **Working directory for all tracks:** `/Users/I826932/Developer/agent-kanban/`
> **Specialist:** Skylar
> **Worktree protocol:** T18 must land before T19/T20/T22 can start. Use `bash scripts/worktree-add.sh` — never raw `git worktree add`.

---

### Track 18 — Cleanup: commit informal session work

- **Status:** todo
- **Board task:** `djpjbua8dzi4`
- **Specialist:** Skylar
- **Branch:** `track/18-cleanup-session-work`
- **Goal:** Commit the four dirty files (`BoardSwitcher.tsx`, `Header.tsx`, `useBoard.ts`, `BoardSettingsPage.tsx`) plus `AGENTIC.md` DoD migration checkpoint as a single tracked Sprint 7 commit. Also add `theme?: string | null` to `api.boards.update` body type in `api.ts`.
- **Primary files:**
  - `apps/web/src/components/BoardSwitcher.tsx`
  - `apps/web/src/components/Header.tsx`
  - `apps/web/src/hooks/useBoard.ts`
  - `apps/web/src/routes/BoardSettingsPage.tsx`
  - `apps/web/src/lib/api.ts`
  - `AGENTIC.md`
- **Migration Safety:** N/A — no schema migration
- **Security Review:** N/A
- **Depends on:** nothing — execute first

---

### Track 19 — Frontend: board theme subtitle on BoardPage

- **Status:** todo
- **Board task:** `wgs05lo6su3c`
- **Specialist:** Skylar
- **Branch:** `track/19-board-theme-subtitle`
- **Goal:** Show `board.theme` as a subdued subtitle line beneath the board name in the board view. Conditional render — only shown when `board.theme` is non-null/non-empty. Read-only. Option A (Tim's decision 2026-05-21) — subdued subtitle, no collapsible banner.
- **Primary files:**
  - `apps/web/src/routes/BoardPage.tsx`
- **Migration Safety:** Reversible — UI-only change
- **Security Review:** N/A
- **Depends on:** T18

---

### Track 20 — Frontend: plan_url chip styling in TaskDetail

- **Status:** todo
- **Board task:** `m87r7tx6go9l`
- **Specialist:** Skylar
- **Branch:** `track/20-plan-url-chip`
- **Goal:** Restyle the "Plan" field in `TaskDetail` from plain link text to a small badge/chip consistent with the PR link treatment. Check and harmonize PR link styling at the same time.
- **Primary files:**
  - `apps/web/src/components/TaskDetail.tsx`
- **Migration Safety:** Reversible — UI-only change
- **Security Review:** N/A
- **Depends on:** T18

---

### Track 21 — DROPPED

**T21 DROPPED** — absorbed into T19. Tim chose Option A (subdued subtitle beneath board name); no collapsible banner track needed.

---

### Track 22 — CLI: daemon end-to-end smoke test

- **Status:** todo
- **Board task:** `7lqed55p3yxl`
- **Specialist:** Skylar
- **Branch:** N/A — operational track, no source changes expected
- **Goal:** Run `ak start` against board `eelil1mu`, register Skylar/Bandit/Peaches as agents, verify task claim → status transitions → `ak get task` all work. Surface any bugs found; document findings.
- **Primary files:** none expected (operational; document findings in track notes)
- **Migration Safety:** N/A
- **Security Review:** N/A
- **Depends on:** T18

---

### Track 23 — Docs: formal Sprint 7 open

- **Status:** done
- **Board task:** `od2z7r2ejz3d`
- **Specialist:** Peaches
- **Branch:** `track/1-fork-and-clone` (current working branch)
- **Goal:** Update `docs/context/plan.md` and `docs/context/tracks.md` to reflect Sprint 7. Peaches track — executed as part of sprint opening.
- **Primary files:**
  - `docs/context/plan.md`
  - `docs/context/tracks.md`
- **Migration Safety:** N/A
- **Security Review:** N/A
- **Depends on:** nothing

---

### Track 24 — Frontend: real-time board updates via SSE invalidation

- **Status:** in progress (Skylar implementation done; pending Bandit)
- **Board task:** `87ocfjs35xo5`
- **Specialist:** Skylar
- **Branch:** `track/24-sse-task-events`
- **Goal:** When an agent (or any actor) changes a task's status, browser cards must move columns within ~2s instead of waiting for the 30s React Query polling interval. Subscribe `useBoard` to the existing board SSE stream and invalidate the `["board", boardId]` query on status-changing actions; bump polling to 60s as a safety net.
- **Primary files:**
  - `apps/web/src/hooks/useBoard.ts`
- **Migration Safety:** Reversible — frontend-only, no schema changes
- **Security Review:** N/A
- **Depends on:** nothing

---

## Worktree Note

**MANDATORY: Always use `scripts/worktree-add.sh`, never raw `git worktree add`.**
See AGENTIC.md §4 for the full explanation. pnpm's hoisted `node_modules` are not present in raw worktrees — the script symlinks them.

T18 is the gate — T19, T20, and T22 cannot start until T18 commits the dirty working tree.

---

## Archive: Sprint 6 Tracks (COMPLETE)

| Track | Goal | Status |
|---|---|---|
| T9 | Schema + Backend: `theme` column on boards | DONE — Bandit PASS |
| T10 | Frontend: update create board form (add Theme field, remove type selector) | DONE — Bandit PASS |
| T11 | Frontend: remove Cancelled column from board view | DONE — Bandit PASS |
| T12 | Frontend: edit icon in TaskDetail for todo tasks | DONE — Bandit PASS |
| T13 | Backend: seed `ready-for-planning` label on board creation | DONE — Bandit PASS |
| T14 | Agent OS: AI-assisted planning workflow | DONE — Bandit PASS |
| T15 | Backend: `plan_url` column on tasks | DONE — Bandit PASS |
| T16 | Infra: worktree support for pnpm monorepo | DONE — Bandit PASS |
| T17 | Docs: AGENTIC.md board-as-authoritative-ledger protocol | DONE — Bandit PASS |

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

*Last updated: 2026-05-21 (T24 added — real-time SSE board invalidation; Skylar implementation done, pending Bandit)*

*Last updated: 2026-05-21 (Sprint 7 opened; T18/T19/T20/T22/T23 created; T21 dropped; Handoff Bridges issued for T18/T19/T20/T22)*

*Last updated: 2026-05-20 (T9/T10/T11/T12/T13/T14/T15/T16/T17 DONE — Bandit PASS all)*
