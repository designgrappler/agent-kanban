# Agent Kanban — Active Tracks

## Current Sprint: Sprint 9 — Backlog Tab (OPENED 2026-05-21)

> Per north-star architecture (`docs/context/north-star.md` §UI Changes / §Data Model). Adds the **Backlog** tab as the entry point of the core loop: `Backlog → Plan → Sprint → Tracks → Done`. Introduces `backlog_items` table, board-scoped backlog CRUD, and a Backlog tab in the global header. Multi-select + "Create plan" trigger lands in Sprint 10.

| Track | Goal | Status |
|---|---|---|
| S9-T1 | Backend + Schema: `backlog_items` migration, repo, Hono routes, auth rules, shared types | DONE — Bandit PASS |
| S9-T2 | CLI: `ak backlog add\|list\|update\|delete` (depends on S9-T1) | DONE — Bandit PASS |
| S9-T3 | Frontend: `/boards/:id/backlog` page, components, `useBacklogItems` hook, Playwright spec | VERIFIED — awaiting commit (E2E waived; helper broken since 2026-05-04, see Sprint 10 P0) |

See `docs/context/plan.md` for Definition of Done, Dependency Order, and the three Handoff Bridges issued 2026-05-21.

---

## Future Backlog (post-Sprint 9)

Items not in Sprint 9. Some unblock once S9 lands; others are pre-existing.

### Sprint 10 Candidates

- **[P0] Fix Playwright auth helper for `requireEmailVerification`** — the helper at `tests/helpers/auth.ts:120-122` writes `emailVerified=1` via the external `sqlite3` CLI; Miniflare's open D1 handle does not see those writes, so every spec calling `signUpAndGetBoard` (and the `signUpVerified` variant) fails with `EMAIL_NOT_VERIFIED` 403. Affected: every Playwright spec calling `signUpAndGetBoard` since 2026-05-04 (confirmed via sibling spec `tests/header/header-elements.spec.ts` failing identically to S9-T3's `tests/e2e/backlog.spec.ts`). Causal commit: `a4f8f76 feat(auth): require email verification` — `requireEmailVerification: true` hardcoded at `apps/web/server/betterAuth.ts:25`. Recommended fix path: replace external sqlite3 write with Better Auth admin-API call, or harvest the verification token via a test mailer. Do NOT gate `requireEmailVerification` on env — that changes production behavior. Blocked S9-T3 from producing E2E proof; landing this unblocks every E2E spec going forward.
- **[P1] Investigate Agent OS install gap (team-as-UI-agents)** — surfaced 2026-05-21. Two related symptoms: (a) the project's `.claude/agents/peaches.md|skylar.md|bandit.md` are not loading as Claude Code `subagent_type` invocations, while the playwright agents in the same directory do load (diagnostic gap); (b) Tim's longer-term direction is for the team to appear in the Agents UI of the kanban board itself as non-cryptographic project-team members, not as Claude Code subagents at all. Investigation scope, not a fix-it ticket — confirm the diagnostic asymmetry, then decide whether to repair the local subagent loader, migrate to in-board agents, or both. Full diagnosis at `/Users/I826932/.claude/projects/-Users-I826932-Developer-agent-kanban/memory/project_agent_os_role_drift.md`.

### Longstanding

- **T22 (re-scoped)** — CLI daemon end-to-end smoke test. Cold-run on 2026-05-21 found prerequisite gaps (missing `gpg`, broken `set -u` cleanup in script, opaque `json_query` errors, mandatory `<runtime>` argument undocumented). Re-scoped to: stand up local stack → harden script (3 specific bugs) → run twice green for idempotency → Bandit on script diff only. Original board task `7lqed55p3yxl` carries forward.
- **GPG prerequisite track (NEW)** — `ak start` requires `gpg` for signing agent commits but it isn't installed on Tim's workstation and there's no preflight check or setup doc. Add either a preflight check in `scripts/install-cli.sh` or a new `ak doctor` command that verifies daemon prerequisites. Blocks T22.
- **Peaches task-refinement workflow** — when Tim describes a task in non-engineering language, Peaches should refine it into engineering-aligned cards before Skylar executes. Concept; needs scoping. Board task `d5kv1hfw1d2v`.
- **Lift `useBoardSSE` into shared provider** (from T24 follow-up) — `useBoard` and `useAgentPresence` each open their own EventSource per board mount; Chrome caps at ~6 per origin. Lift to a `BoardSSEContext` provider in `BoardPage.tsx` so consumers share one connection.
- ~~**`useAgentPresence` choreography for `released`/`timed_out`**~~ — DROPPED 2026-05-21. Card movement for both actions already works via T24's `STATUS_CHANGING_ACTIONS` invalidation in `useBoard.ts`. Tim confirmed agent-drag animation is not required: cards move on their own as close to real time as the SSE poll allows. No further work needed.

---

*Last updated: 2026-05-21 (S9-T1/S9-T2 DONE Bandit PASS, merged; S9-T3 VERIFIED gates green, E2E waived per Tim, awaiting merge — Playwright helper repair queued as Sprint 10 P0; Agent OS install gap queued as Sprint 10 P1. Sprint 8 CLOSED — all three tracks DONE Bandit PASS, merged to main.)*

---

## Worktree Note

**MANDATORY: Always use `scripts/worktree-add.sh`, never raw `git worktree add`.**
See AGENTIC.md §4 for the full explanation. pnpm's hoisted `node_modules` are not present in raw worktrees — the script symlinks them.

---

## Archive: Sprint 8 Tracks (CLOSED 2026-05-21)

| Track | Goal | Status |
|---|---|---|
| S8-T1 | Backend: `sprints` table + `tasks.sprint_id` + `track_number`; backfill 4–7; sprint repo + routes | DONE — Bandit PASS |
| S8-T2 | CLI: `ak sprint open|close|list` | DONE — Bandit PASS |
| S8-T3 | Frontend: TRACKS rename, SprintHeader banner, S{n}-T{m} chip, `useSprint` hook | DONE — Bandit PASS |

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
