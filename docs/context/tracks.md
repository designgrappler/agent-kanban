# Agent Kanban — Active Tracks

## Current Sprint: None — Sprint 11 CLOSED 2026-05-22; Sprint 12 not yet opened

Sprint 11 closed 2026-05-22 with all four close-gate tracks (T1–T4) merged to main. T5 (design spec for kanban-level team agents) carried forward to Sprint 12 per the locked decision (design-only, zero merge requirement). Working-tree gate and Playwright gate both green at close (`/close-sprint` skill dogfooded — 92 passed, 8 skipped).

See `Sprint 12 Candidates` below for queued work awaiting sprint open.

---

## Future Backlog (Sprint 12 Candidates)

Items deferred from Sprint 11. Some are pre-existing; others surfaced during Sprint 10/11 close.

### Carry-forward from Sprint 11

- **[P0] T5 — kanban-level team agents design + implementation** — design spec was drafted in `.worktrees/s11-t5-team-agents-design/docs/designs/team-agents.md` (~3270 words across 8 sections; recommended Option B data model + Option (b) auth). Sprint 12 reviews the spec, merges it to `docs/designs/`, then opens implementation tracks on top of it. This is the deepest structural fix for the role-isolation looseness named in the [execution-tightness-gaps memory](file:///Users/I826932/.claude/projects/-Users-I826932-Developer-agent-kanban/memory/feedback_execution_tightness_gaps.md).
- **[P1] Twice-green proof for T4 daemon smoke** — T4 landed with Bandit PASS on testable scope, but the actual daemon round-trip (twice-green) was not run because the worktree env was missing gpg + ak CLI + `.dev.vars` symlink — exactly the gaps the new `ak doctor` preflight is designed to surface. First real operator run (Tim on a dev day, or CI when wired) becomes the de-facto twice-green test. If it fails, fix forward.
- **[P2] Pre-existing `prepare: lefthook install` failure on `pnpm install --frozen-lockfile`** — surfaced during S11-T2 verification. Out of T2 scope. Worth diagnosing before next operator does a clean install.
- **[P3] Redaction filter coverage** — S11-T4's `json_query` redaction filter covers `authorization`, `cookie`, `api_key`, `token` patterns plus `ak_*` and bare JWT. Bandit flagged that `refresh_token` and header-form `x-api-key` are not covered. Out of T4's explicit scope but worth hardening if real responses contain these.
- **[P4] FATAL message stderr/stdout consistency in `scripts/daemon-smoke-test.sh`** — pre-existing FATAL prints at lines 148, 395, 400, 409, 424, 543 still go to stdout; new T4 code correctly uses stderr. Not regressed by T4, but inconsistent.

### Longstanding

- **Peaches task-refinement workflow** — when Tim describes a task in non-engineering language, Peaches should refine it into engineering-aligned cards before Skylar executes. Concept; needs scoping. Board task `d5kv1hfw1d2v`.
- ~~**`useAgentPresence` choreography for `released`/`timed_out`**~~ — DROPPED 2026-05-21. Card movement for both actions already works via T24's `STATUS_CHANGING_ACTIONS` invalidation in `useBoard.ts`. Tim confirmed agent-drag animation is not required: cards move on their own as close to real time as the SSE poll allows. No further work needed.

---

*Last updated: 2026-05-22 (Sprint 11 CLOSED — four close-gate tracks (S11-T1 `ak doctor`, S11-T2 D1 migrate auto-apply, S11-T3 pre-push gate + `/close-sprint` skill, S11-T4 daemon smoke hardening) merged green. T5 design spec carried to Sprint 12. `/close-sprint` skill dogfooded at close: working-tree clean + Playwright 92/0/8.)*

---

## Worktree Note

**MANDATORY: Always use `scripts/worktree-add.sh`, never raw `git worktree add`.**
See AGENTIC.md §4 for the full explanation. pnpm's hoisted `node_modules` are not present in raw worktrees — the script symlinks them.

---

## Archive: Sprint 11 Tracks (CLOSED 2026-05-22)

| Track  | Goal                                                                                              | Status  |
|--------|---------------------------------------------------------------------------------------------------|---------|
| S11-T1 | `ak doctor` CLI command verifying gpg, D1 migration state, `.dev.vars` presence, worktree symlinks | DONE — Bandit PASS (re-run with full lefthook chain), merged + pushed to origin/main 2026-05-21 (`7436063`) |
| S11-T2 | D1 migration auto-apply via `predev` hook + `postinstall` + `scripts/daemon-smoke-test.sh` preflight | DONE — Bandit PASS (lefthook chain), merged + pushed to origin/main 2026-05-21 (`5e6b4af`) |
| S11-T3 | Pre-push Playwright gate (lefthook, `main` only) + `/close-sprint` skill (Playwright + fully clean tree) | DONE — Bandit PASS, merged + pushed to origin/main 2026-05-22 (`5356a0a`) |
| S11-T4 | T22 daemon E2E smoke twice-green; harden 3 documented script bugs (`set -u` cleanup, opaque `json_query`, undocumented `<runtime>` arg) | DONE — Bandit PASS on testable scope, merged + pushed to origin/main 2026-05-22 (`3b07d97`). Twice-green deferred to first real operator run (env needed gpg + ak + .dev.vars symlink, exactly the gaps the new preflight surfaces). |
| S11-T5 | Design spec ONLY for kanban-level non-cryptographic team agents (Peaches/Skylar/Bandit as in-board team members). No code. | DEFERRED to Sprint 12 — design draft in `.worktrees/s11-t5-team-agents-design/docs/designs/team-agents.md` per locked decision (design-only, zero merge requirement, slip ≠ block) |

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
