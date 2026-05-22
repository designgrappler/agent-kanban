# Agent Kanban — Active Tracks

## Current Sprint: Sprint 11 — Dev-Experience Hardening + Drift Prevention (OPEN 2026-05-21)

Full plan in `docs/context/plan.md` § "Current Sprint: Sprint 11". Bridges issued for all 5 tracks 2026-05-21.

| Track  | Goal                                                                                              | Type        | Status  |
|--------|---------------------------------------------------------------------------------------------------|-------------|---------|
| S11-T1 | `ak doctor` CLI command verifying gpg, D1 migration state, `.dev.vars` presence, worktree symlinks | Code        | DONE — Bandit PASS (re-run with full lefthook chain), merged + pushed to origin/main 2026-05-21 (`7436063`) |
| S11-T2 | D1 migration auto-apply via `predev` hook + `postinstall` + `scripts/daemon-smoke-test.sh` preflight | Code      | DONE — Bandit PASS (lefthook chain), merged + pushed to origin/main 2026-05-21 (`5e6b4af`) |
| S11-T3 | Pre-push Playwright gate (lefthook, `main` only) + `/close-sprint` skill (Playwright + fully clean tree) | Code + skill | DONE — Bandit PASS, merged + pushed to origin/main 2026-05-22 (`5356a0a`) |
| S11-T4 | T22 daemon E2E smoke twice-green; harden 3 documented script bugs (`set -u` cleanup, opaque `json_query`, undocumented `<runtime>` arg) | Code  | DONE — Bandit PASS on testable scope, merged + pushed to origin/main 2026-05-22 (`3b07d97`). Twice-green deferred to first real operator run (env needed gpg + ak + .dev.vars symlink, exactly the gaps the new preflight surfaces). |
| S11-T5 | Design spec ONLY for kanban-level non-cryptographic team agents (Peaches/Skylar/Bandit as in-board team members). No code. | Design | Bridge issued — parallel; zero merge requirement (slip ≠ block) |

**Circuit-breaker note:** 5-track sprint is at the upper edge of stability rule. Mitigation: T5 is design-only with zero merge requirement — if it slips it carries forward to Sprint 12 and does NOT block sprint close. Hard close gate is T1+T2+T3+T4 merged green.

---

## Future Backlog (Sprint 12 Candidates)

Items deferred from Sprint 11 planning. Some are pre-existing; others surfaced during Sprint 10 close.

### Carry-forward from Sprint 11

- **[P1] Investigate Agent OS install gap (team-as-UI-agents)** — **ABSORBED into S11-T5 design scope.** S11-T5 produces the design spec for kanban-level non-cryptographic team agents in Sprint 11. Sprint 12 implements on top of that spec. Original diagnosis at `/Users/I826932/.claude/projects/-Users-I826932-Developer-agent-kanban/memory/project_agent_os_role_drift.md` remains the source for the (a) symptom investigation; the longer-term migration to in-board team members is being designed in S11-T5.

### Longstanding

- **Peaches task-refinement workflow** — when Tim describes a task in non-engineering language, Peaches should refine it into engineering-aligned cards before Skylar executes. Concept; needs scoping. Board task `d5kv1hfw1d2v`.
- ~~**`useAgentPresence` choreography for `released`/`timed_out`**~~ — DROPPED 2026-05-21. Card movement for both actions already works via T24's `STATUS_CHANGING_ACTIONS` invalidation in `useBoard.ts`. Tim confirmed agent-drag animation is not required: cards move on their own as close to real time as the SSE poll allows. No further work needed.

---

*Last updated: 2026-05-21 (Sprint 11 OPEN — five tracks: S11-T1 `ak doctor`, S11-T2 D1 migrate auto-apply, S11-T3 pre-push Playwright gate + `/close-sprint` skill, S11-T4 daemon smoke twice-green + 3 script bugs, S11-T5 design spec for kanban team agents. Bridges issued for all 5. [P1] Agent OS install gap absorbed into S11-T5. [P2] D1 migration drift becomes S11-T2.)*

---

## Worktree Note

**MANDATORY: Always use `scripts/worktree-add.sh`, never raw `git worktree add`.**
See AGENTIC.md §4 for the full explanation. pnpm's hoisted `node_modules` are not present in raw worktrees — the script symlinks them.

---

## Archive: Sprint 10 Tracks (CLOSED 2026-05-21)

| Track  | Goal                                                                                                                            | Status      |
|--------|---------------------------------------------------------------------------------------------------------------------------------|-------------|
| S10-T1 | Playwright auth helper repair — fix `tests/helpers/auth.ts:120-122` via Better Auth admin API or test-mailer; do NOT gate `requireEmailVerification` on env | DONE — Bandit PASS, merged + pushed to origin/main 2026-05-21 |
| S10-T2 | Full E2E baseline restoration — sweep every test-code failure surfaced by S10-T1 unblock; circuit breaker at >5 distinct source bugs | DONE — Bandit PASS (independent), merged + pushed to origin/main 2026-05-21. 0 source bugs found across 17 surfaced failures; 16 test files +81/-51; circuit breaker not tripped. |
| S10-T3 | Biome warning cleanup — `biome.json` `$schema` → 2.4.10; drop `/**` suffix on `!.worktrees` and `!.claude` per `useBiomeIgnoreFolder` | DONE — Bandit PASS, merged + pushed to origin/main 2026-05-21 |
| S10-T4 | `useBoardSSE` shared provider lift — single `EventSource` per board mount via `BoardSSEContext` mounted on `BoardPage` | DONE — Bandit PASS, merged + pushed to origin/main 2026-05-21 |

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
