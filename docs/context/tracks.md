# Agent Kanban — Active Tracks

## Current Sprint: None — Sprint 12 CLOSED 2026-05-22; Sprint 13 not yet opened

Sprint 12 closed 2026-05-22 with both close-gate tracks (T1 paper + T2 code) merged to main. `/close-sprint` skill dogfooded: working-tree clean + Playwright 80 passed / 8 skipped at close.

**Strategic note:** Sprint 13 is the dedicated Agent OS install diagnostic per Tim's pivot — investigation only, no code changes. Sprint 14 reacts to S13 findings and absorbs deferred items.

See `Sprint 13 — Agent OS install diagnostic` and `Sprint 14 — Carry-forward` sections below.

---

## Future Backlog

### Sprint 13 (planned) — Agent OS install diagnostic

A dedicated investigation sprint following S12 close. Goal: determine whether the Agent OS install on this fork was successful, and if not, identify where it went wrong. Investigation only — no code changes. Outcomes inform Sprint 14 scope.

Surfacing questions for the diagnostic (preliminary, not exhaustive):
- Why don't `.claude/agents/peaches.md|skylar.md|bandit.md` load as `subagent_type` invocations on this fork, while `playwright-test-*` agents in the same directory do?
- Is the install of `~/.claude/skills/start-sprint.md` and the missing `/sprint-open` skill a symptom of the same root cause, or independent?
- What does the canonical Agent OS install produce that we're missing here?
- Is the looseness named in [[execution-tightness-gaps]] explained by install drift, or is it independent?

Reference memory: [[agent-os-role-drift-investigation]].

### Sprint 14 (provisional) — Carry-forward from S11/S12

Items deferred from Sprint 12's original plan; will be re-prioritized after the S13 diagnostic lands. Some may become moot or reshape based on diagnostic findings.

- **`/sprint-open` skill** (was S12-T3) — project-level skill mirroring `/close-sprint`. Symmetric gap surfaced when `/close-sprint` referenced it.
- **Env hygiene combo** (was S12-T4) — (a) diagnose + fix `prepare: lefthook install` failure on `pnpm install --frozen-lockfile`; (b) extend `json_query` redaction filter (`refresh_token` + `x-api-key`).
- **Twice-green proof for daemon smoke** (was S12-T5; was S11 carry-forward) — first real operator run; verification, not code.
- **FATAL stderr/stdout consistency** in `scripts/daemon-smoke-test.sh` (was S12-T6) — pre-existing inconsistency at lines 148, 395, 400, 409, 424, 543.
- **Peaches task-refinement workflow scoping** (was S12-T7; longstanding board task `d5kv1hfw1d2v`) — design-only doc.
- **team_members Phase 2** — `attributed_team_member_id` columns on `task_actions`/`messages`/`tasks`; `ak team sync` CLI command; richer chat-with-team-member UX. Gated by S12-T2 Phase 1 landing.
- **Claude Code subagent loader gap** — separate from team_members work. The fact that Peaches/Skylar/Bandit don't register as `subagent_type` on this fork is its own concern; team_members entity does NOT fix the loader. Likely consumed by S13 diagnostic.

### Longstanding

- ~~**`useAgentPresence` choreography for `released`/`timed_out`**~~ — DROPPED 2026-05-21. Card movement for both actions already works via T24's `STATUS_CHANGING_ACTIONS` invalidation in `useBoard.ts`. Tim confirmed agent-drag animation is not required: cards move on their own as close to real time as the SSE poll allows. No further work needed.

---

*Last updated: 2026-05-22 (Sprint 12 CLOSED — both close-gate tracks (S12-T1 design merge `a9732c3`, S12-T2 team_members Phase 1 `0ce67d0`) merged green. `/close-sprint` skill dogfooded: working-tree clean + Playwright 80/0/8.)*

---

## Worktree Note

**MANDATORY: Always use `scripts/worktree-add.sh`, never raw `git worktree add`.**
See AGENTIC.md §4 for the full explanation. pnpm's hoisted `node_modules` are not present in raw worktrees — the script symlinks them.

---

## Archive: Sprint 12 Tracks (CLOSED 2026-05-22)

| Track  | Goal                                                                                              | Status  |
|--------|---------------------------------------------------------------------------------------------------|---------|
| S12-T1 | Review/finalize/merge S11-T5 design draft to `docs/designs/team-agents.md` (Tim resolves §8 open questions; Peaches edits to reflect calls; doc merges) | DONE — Tim approved 2026-05-22; doc landed at `docs/designs/team-agents.md` (paper only, no Bandit) (`a9732c3`) |
| S12-T2 | `team_members` Phase 1 — migration, `BUILTIN_TEAM_MEMBERS` seed, `teamMemberRepo.ts`, list endpoint, `TeamCard` component, Team section in `AgentsPage` | DONE — Bandit PASS (3 flags addressed in `e0d33ef`: bio column, `:username` endpoint documented, reverse cross-table check), merged + pushed to origin/main 2026-05-22 (`0ce67d0`) |

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
