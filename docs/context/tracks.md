# Agent Kanban — Active Tracks

## Current Sprint: NONE — Sprint 7 closed 2026-05-21; Sprint 8 not yet opened

> When Tim is ready to open Sprint 7's successor, Peaches will plan the next sprint from the Sprint 8 Backlog below plus any new directives from Tim.

---

## Sprint 8 Backlog (not yet opened)

Items deferred from Sprint 7 or surfaced during Sprint 7 execution. Peaches will formally plan when Sprint 8 opens — these are seeds, not committed tracks.

- **T22 (re-scoped)** — CLI daemon end-to-end smoke test. Cold-run on 2026-05-21 found prerequisite gaps (missing `gpg`, broken `set -u` cleanup in script, opaque `json_query` errors, mandatory `<runtime>` argument undocumented). Re-scoped to: stand up local stack → harden script (3 specific bugs) → run twice green for idempotency → Bandit on script diff only. Original board task `7lqed55p3yxl` carries forward.
- **GPG prerequisite track (NEW)** — `ak start` requires `gpg` for signing agent commits but it isn't installed on Tim's workstation and there's no preflight check or setup doc. Add either a preflight check in `scripts/install-cli.sh` or a new `ak doctor` command that verifies daemon prerequisites. Blocks T22.
- **Peaches task-refinement workflow** — when Tim describes a task in non-engineering language, Peaches should refine it into engineering-aligned cards before Skylar executes. Concept; needs scoping. Board task `d5kv1hfw1d2v`.
- **Lift `useBoardSSE` into shared provider** (from T24 follow-up) — `useBoard` and `useAgentPresence` each open their own EventSource per board mount; Chrome caps at ~6 per origin. Lift to a `BoardSSEContext` provider in `BoardPage.tsx` so consumers share one connection.
- **`useAgentPresence` choreography for `released`/`timed_out`** (from T24 follow-up) — choreography animates `claimed`/`review_requested`/`completed`/`rejected`/`cancelled` but skips `released` and `timed_out` even though those move cards. Define a release/timeout sequence.

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

---

*Last updated: 2026-05-21 (Sprint 7 CLOSED — T18/T19/T20/T23/T24 done with Bandit PASS; T22 deferred to Sprint 8 due to gpg prerequisite + script bugs; Sprint 8 Backlog seeded; T24 merged to main)*
