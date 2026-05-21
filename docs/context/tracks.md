# Agent Kanban — Active Tracks

## Current Sprint: Sprint 8 — Sprints + Tracks Foundation (OPENED 2026-05-21)

> Foundation sprint for the north-star architecture (`docs/context/north-star.md`). Establishes `Sprint` as a first-class entity with `S{n}-T{m}` track numbering and renames the TODO column to TRACKS. Backlog tab, planning trigger, and agent-definition sync arrive in Sprints 9–11.

| Track | Goal | Status |
|---|---|---|
| S8-T1 | Backend: `sprints` table + `tasks.sprint_id` + `track_number`; backfill 4–7; sprint repo + routes | PLANNED |
| S8-T2 | CLI: `ak sprint open|close|list` | PLANNED — depends on S8-T1 |
| S8-T3 | Frontend: TRACKS rename, SprintHeader banner, S{n}-T{m} chip, `useSprint` hook | PLANNED — depends on S8-T1 |

See `docs/context/plan.md` for Definition of Done and Handoff Bridges.

---

## Future Backlog (post-Sprint 8)

Items not in Sprint 8. Some unblock once S8 lands; others are pre-existing.

- **T22 (re-scoped)** — CLI daemon end-to-end smoke test. Cold-run on 2026-05-21 found prerequisite gaps (missing `gpg`, broken `set -u` cleanup in script, opaque `json_query` errors, mandatory `<runtime>` argument undocumented). Re-scoped to: stand up local stack → harden script (3 specific bugs) → run twice green for idempotency → Bandit on script diff only. Original board task `7lqed55p3yxl` carries forward.
- **GPG prerequisite track (NEW)** — `ak start` requires `gpg` for signing agent commits but it isn't installed on Tim's workstation and there's no preflight check or setup doc. Add either a preflight check in `scripts/install-cli.sh` or a new `ak doctor` command that verifies daemon prerequisites. Blocks T22.
- **Peaches task-refinement workflow** — when Tim describes a task in non-engineering language, Peaches should refine it into engineering-aligned cards before Skylar executes. Concept; needs scoping. Board task `d5kv1hfw1d2v`.
- **Lift `useBoardSSE` into shared provider** (from T24 follow-up) — `useBoard` and `useAgentPresence` each open their own EventSource per board mount; Chrome caps at ~6 per origin. Lift to a `BoardSSEContext` provider in `BoardPage.tsx` so consumers share one connection.
- ~~**`useAgentPresence` choreography for `released`/`timed_out`**~~ — DROPPED 2026-05-21. Card movement for both actions already works via T24's `STATUS_CHANGING_ACTIONS` invalidation in `useBoard.ts`. Tim confirmed agent-drag animation is not required: cards move on their own as close to real time as the SSE poll allows. No further work needed.

---

*Last updated: 2026-05-21 (Sprint 8 OPENED — Sprints + Tracks foundation. Three tracks planned: S8-T1 backend, S8-T2 CLI, S8-T3 frontend. Backfill strategy approved for synthetic Sprints 4–7.)*

---

## Worktree Note

**MANDATORY: Always use `scripts/worktree-add.sh`, never raw `git worktree add`.**
See AGENTIC.md §4 for the full explanation. pnpm's hoisted `node_modules` are not present in raw worktrees — the script symlinks them.

---

## Archive: Sprint 7 Tracks (CLOSED 2026-05-21)

| Track | Goal | Status |
|---|---|---|
| T18 | Cleanup: commit informal session work + AGENTIC.md DoD migration | DONE — Bandit PASS |
| T19 | Frontend: board theme subtitle on BoardPage (Option A — subdued subtitle) | DONE — Bandit PASS |
| T20 | Frontend: plan_url chip styling in TaskDetail | DONE — Bandit PASS |
| T21 | DROPPED — absorbed into T19 | DROPPED |
| T22 | CLI: daemon end-to-end smoke test | DEFERRED to Sprint 8 (re-scoped) |
| T23 | Docs: formal Sprint 7 open (plan.md + tracks.md) | DONE — Bandit PASS |
| T24 | Frontend: real-time board updates via SSE invalidation | DONE — Bandit PASS |

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
