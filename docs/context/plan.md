# Agent Kanban — Sprint Plan

---

## Current Sprint: Sprint 15 — Agent OS Remediation (OPEN 2026-05-23)

### Objective

Close the Agent OS gaps surfaced by the Sprint 14 diagnostic (`docs/context/findings/s14-agent-os-diagnostic.md`). Three workstreams: (1) fix concrete drift inside agent-kanban, (2) restructure `plan.md` to a per-sprint pattern so context stops rotting, (3) author a clean upstream report for the canonical Agent OS team.

### Tracks

| Track  | Goal                                                                                                                                                                                                                                                                                                          | Type            | Owner              | Status     |
|--------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------|--------------------|------------|
| S15-T1 | agent-kanban config fixes — install canonical skills (`open-sprint`, `report-track-status`, `minify-context`) to `~/.claude/skills/`; rewire CLAUDE.md auto-triggers (`/sprint-open` → `/open-sprint`, `/track-status` → `/report-track-status`); create `docs/context/product.md` from `north-star.md`; correct AGENTIC.md §5 board task endpoint+auth; normalize `bandit.md` model to `sonnet` | Code close-gate | Skylar              | DONE — Bandit PASS, merged 2026-05-23 |
| S15-T2 | plan.md context migration — archive S1–S13 to `docs/context/archive/plan-archive-s1-s13.md`, archive S14 to `docs/context/archive/plan-s14-diagnostic.md`, leave `plan.md` with current sprint only; create `docs/context/handoffs/` for current/future bridges; update `peaches.md` init to reference the archive path | Code close-gate | Skylar (worktree)   | In progress |
| S15-T3 | Agent OS upstream issue report — clean external-facing bug/improvement report at `docs/context/findings/s14-agent-os-upstream-report.md` covering 5 canonical-install gaps from findings §6 with reproduction, severity, proposed fix, backward-compat note | Paper           | Peaches (no Skylar) | DONE — authored 2026-05-23 |

### Dependency Order

```
S15-T1 (config fixes)        ──┐
S15-T2 (plan.md migration)     ├── parallel-safe; T1 and T2 touch disjoint files
S15-T3 (upstream report)     ──┘  paper-only, no merge gate, runs alongside
```

T1 and T2 are independently mergeable. T1 changes user-level skill installs + scoped project files. T2 is structurally destructive to `plan.md` and lives behind a worktree. T3 is paper authored by Peaches in this session — no Skylar, no Bandit, no merge gate.

### Definition of Done

- [ ] **S15-T1 (config fixes):**
  - [ ] `~/.claude/skills/open-sprint.md` present (copied from `~/Developer/agent-skills/claude/skills/open-sprint.md`); `/open-sprint` invokable.
  - [ ] `~/.claude/skills/report-track-status.md` present; `/report-track-status` invokable.
  - [ ] `~/.claude/skills/minify-context.md` present; `/minify-context` invokable.
  - [ ] `CLAUDE.md` auto-trigger table rewritten: `/sprint-open` → `/open-sprint`, `/track-status` → `/report-track-status`.
  - [ ] `docs/context/product.md` exists, summarized from `north-star.md`; `north-star.md` remains in place unchanged.
  - [ ] `AGENTIC.md §5` corrected: endpoint is `POST /api/tasks` with `board_id` in body; machine tokens cannot create tasks (requires user session via browser).
  - [ ] `.claude/agents/bandit.md` frontmatter `model:` line equals `sonnet` (matches canonical QA template).
  - [ ] `pnpm build` and `pnpm tsc --noEmit` clean.
  - [ ] Bandit PASS on the project-tracked files (user-level skills are not git-tracked; Bandit verifies `CLAUDE.md`, `AGENTIC.md`, `.claude/agents/bandit.md`, `docs/context/product.md`).
- [ ] **S15-T2 (plan.md migration):**
  - [ ] `docs/context/archive/plan-archive-s1-s13.md` written first, contains S1–S13 sections (and any pre-S14 bridges) verbatim from `plan.md`.
  - [ ] `docs/context/archive/plan-s14-diagnostic.md` written, contains the S14 section verbatim.
  - [ ] Both archive files committed BEFORE `plan.md` is truncated.
  - [ ] `docs/context/handoffs/` directory created; current S15 bridges (`s15-t01-bridge.md`, `s15-t02-bridge.md`) live there going forward.
  - [ ] `plan.md` reduced to current-sprint-only (this S15 section + a small pointer to archive paths).
  - [ ] `.claude/agents/peaches.md` initialization step updated to reference `docs/context/archive/` so historical context is discoverable.
  - [ ] `pnpm build` and `pnpm tsc --noEmit` unchanged (docs only — should be no-op for code).
  - [ ] Bandit PASS — verifies archive files contain the migrated content and `plan.md` is lean.
- [ ] **S15-T3 (upstream report):**
  - [ ] `docs/context/findings/s14-agent-os-upstream-report.md` written by Peaches in this session.
  - [ ] Each of the 5 canonical-install gaps (findings §6a–6e) documented with: reproduction steps, severity (Critical/High/Medium), proposed fix, backward-compat note.
  - [ ] Document is external-facing — no agent-kanban-specific assumptions, references upstream paths.
  - [ ] No Bandit review (paper track).

### Circuit-Breaker Risk

**LOW–MEDIUM.** T1 is mechanical (copies + small text edits). T3 is authored prose. T2 is the only meaningful risk: truncating `plan.md` is irreversible without git, and we lose history if the archive files aren't written and verified first. Mitigation in the T2 Bridge: archive-then-truncate ordering is mandatory; Tim must explicitly approve before Skylar begins; work runs in a worktree so the main branch is never partially mutated. Any T2 step failure stops the sprint immediately.

### Board Task Creation

Per the AGENTIC.md §5 correction landing in T1: machine tokens cannot create tasks. **Tim will create three S15 board tasks manually in the browser** (S15-T1, S15-T2, S15-T3) before Skylar begins T1/T2. This is itself documentation that the bug we are fixing is real.

### Migration Safety + Security Review

- **T1:** Reversible (skill copies are idempotent; doc edits are git-tracked). No auth/payments/schema surface.
- **T2:** Irreversible without git (archive then truncate). No auth/payments/schema surface. Tim approval granted 2026-05-23.
- **T3:** Paper only. N/A.

---

## Archive Pointer

Sprint history (S1–S13) is archived at `docs/context/archive/plan-archive-s1-s13.md`. Sprint 14 diagnostic is archived at `docs/context/archive/plan-s14-diagnostic.md`. The S14 findings doc remains at `docs/context/findings/s14-agent-os-diagnostic.md`. Current and future Handoff Bridges live in `docs/context/handoffs/`.
