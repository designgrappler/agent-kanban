# Sprint 14 Archive — Agent OS Install Diagnostic

This file contains the Sprint 14 section verbatim as it appeared in `docs/context/plan.md` before the S15-T2 context migration on 2026-05-23. Sprint 14 was an investigation-only sprint (no code tracks) that produced the findings document at `docs/context/findings/s14-agent-os-diagnostic.md`. Sprint 15 is the remediation sprint that follows. This archive is a permanent record; do not edit it.

---

## Archive (pending S15-T2 migration): Sprint 14 — Agent OS Install Diagnostic (CLOSED 2026-05-23)

### Objective

Determine whether the Agent OS install on this fork was successful, and if not, identify exactly where it went wrong. **Investigation only — zero source-code changes, zero migrations, zero schema, zero auth surface, zero config edits to executable files.** The only writes Sprint 14 produces are findings in `docs/context/` and (optionally) a memory note. Outcomes are inputs to Sprint 15 scope; remediation tracks are NOT planned in Sprint 14.

**Why now (Tim's pivot):** Sprint 13 (the originally-planned diagnostic) was redirected to UX polish on team_members — the kanban now visibly reflects the team-as-first-class direction. Sprint 14 returns to the deferred diagnostic. Two memory items frame the investigation:
- `agent-os-role-drift-investigation` — Peaches/Skylar/Bandit live as Claude Code subagents in `.claude/agents/` instead of as kanban-level agents; the install layer is suspected wrong.
- `execution-tightness-gaps` — looseness has structural causes (some now fixed in S11/S12/S13). The diagnostic checks whether residual looseness is install-drift or independent.

### Tracks (investigation tasks, not code tracks)

| Track  | Goal                                                                                              | Type             | Status |
|--------|---------------------------------------------------------------------------------------------------|------------------|--------|
| S14-D1 | Subagent loader diagnosis — why don't `peaches.md|skylar.md|bandit.md` register as `subagent_type` invocations on this fork while `playwright-test-*` agents in the same dir do? Compare frontmatter shapes, surface the delta, document the load contract Claude Code is enforcing | Diagnostic | Open |
| S14-D2 | Skill install audit — `~/.claude/skills/start-sprint.md` exists at the user level but `/sprint-open` is not callable; project-level `.claude/skills/close-sprint/` works. Determine whether this is the same root cause as D1 (frontmatter / install layer) or independent | Diagnostic | Open |
| S14-D3 | Canonical install comparison — what does a known-good Agent OS install produce on disk (file paths, frontmatter shapes, registration calls) that this fork is missing? Tim provides one reference project; output is a side-by-side delta | Diagnostic | Open |
| S14-D4 | Looseness attribution — re-read the four causes in `execution-tightness-gaps` against current main: (1) E2E gating, (2) `ak doctor` preflight, (3) role isolation, (4) drift sweep, plus (5) dirty-tree, (6) Bandit chain. Mark each cause as "fixed by S11/S12/S13", "still open and explained by install drift", or "still open and independent of install" | Diagnostic | Open |

### Dependency Order

```
S14-D1 (subagent loader)  ──┐
S14-D2 (skill install)      ├── parallel; all four can run independently
S14-D3 (canonical compare)  │   (D3 can absorb evidence from D1+D2)
S14-D4 (looseness audit)    ──┘
```

D1/D2/D3 produce the technical install findings. D4 ties findings back to the looseness pattern and determines what remains for Sprint 15. None of the four touch source code or executable config.

### No Skylar Handoff

Sprint 14 has no Handoff Bridges. The investigation is driven by Tim and Claude (Orchestrator) — Peaches frames the questions and writes the findings; Tim decides what becomes Sprint 15 scope. Skylar is not engaged this sprint. Bandit is not engaged this sprint (no code surface to QA).

### Circuit-Breaker Risk

**LOW** — investigation only, no merge gates, no migrations, no auth changes. The risk is not technical failure; it is investigation drift (chasing tangents instead of answering the four surfacing questions). Mitigation: each diagnostic track has explicit pass/fail criteria in §Definition of Done so we can call a finding "done" without scope creep.

### Definition of Done (Sprint 14)

- [ ] **S14-D1 (subagent loader diagnosis):**
  - [ ] Frontmatter delta documented — confirmed shapes for both team agents and playwright agents (preliminary read 2026-05-23: team agents use YAML block-list `tools:`, single-string `model: claude-opus-4-7|claude-sonnet-4-6`, no `color`; playwright agents use comma-inline `tools:`, short-form `model: sonnet`, includes `color`).
  - [ ] Test performed: edit one team-agent file (e.g., bandit.md) to mirror the playwright frontmatter shape exactly (block→inline tools, model→short-form, add color), reload Claude Code, attempt `subagent_type: bandit` invocation. PASS = subagent registers and is callable. FAIL = registers but doesn't load / silently dropped / different error.
  - [ ] Root cause hypothesis written to findings doc with evidence (which frontmatter field is the trigger).
  - [ ] **No code changes land in main from this diagnostic.** If a frontmatter edit is made for the test, it is reverted before sprint close (or kept only if Tim explicitly approves it as the remediation, which moves it to Sprint 15 scope).
- [ ] **S14-D2 (skill install audit):**
  - [ ] On-disk shape documented for both layers — user-level `~/.claude/skills/*.md` (flat .md files: install-agent-scaffold, onboard-existing-project, start-sprint, streamline-approvals, sync-vercel-env) vs project-level `.claude/skills/<name>/SKILL.md` (close-sprint is the only one).
  - [ ] Test performed: invoke `/sprint-open` (the missing skill) and confirm the failure mode (skill not found vs. skill found but not callable). Then invoke `/close-sprint` from the project-level dir and confirm it loads.
  - [ ] Determination written: is `/sprint-open` missing because (a) it was never installed, (b) it was installed at the wrong layer, or (c) flat-.md vs. directory format matters? Note: `~/.claude/skills/start-sprint.md` exists but the slash-command name is `/sprint-open` — possible name mismatch is itself a finding.
  - [ ] Cross-reference with D1: does the skill loader use the same registration mechanism that's failing for team subagents, or are they independent?
- [ ] **S14-D3 (canonical install comparison):**
  - [ ] Tim names one reference project where Agent OS install is known-good.
  - [ ] Side-by-side comparison documented: `.claude/agents/` contents, `.claude/skills/` contents (or absence), `~/.claude/skills/` contents, and any product-level kanban registration (do team members exist as kanban entities in the reference project's DB? Was `seedBuiltinTeamMembers` called there too?).
  - [ ] Delta named explicitly: which files / paths / frontmatter fields / DB rows exist in the reference project that don't exist (or differ) here.
  - [ ] **Sentinel:** the diagnostic does NOT modify the reference project. Read-only inspection (`ls`, `cat`, `git log`, `sqlite3 SELECT`).
- [ ] **S14-D4 (looseness attribution):**
  - [ ] Each of the six structural causes from `execution-tightness-gaps` rated against current main:
    1. E2E sprint-close gating — fixed by S11-T3 (lefthook pre-push gate + `/close-sprint` skill)? **VERIFY** by reading `lefthook.yml` and the close-sprint skill.
    2. `ak doctor` preflight — fixed by S11-T1? **VERIFY** by running `ak doctor` and confirming all four checks fire.
    3. Role isolation — STILL OPEN per D1 finding (subagents don't load); team_members landed in S12 as kanban entities but the subagent loader gap is its own issue. Confirm this read.
    4. Drift sweep — partially fixed (S10-T2 swept 17 failures); no automated check exists for orphan modules. Mark as still open.
    5. Dirty-tree at session start — fixed by `/close-sprint` strict gate (zero unstaged + zero untracked). Confirm.
    6. Bandit verification chain — partially fixed by Bandit prompt updates? Confirm by reading current `.claude/agents/bandit.md` for the lefthook-mirror language, OR mark still open.
  - [ ] Each cause tagged: FIXED / OPEN-EXPLAINED-BY-INSTALL / OPEN-INDEPENDENT.
  - [ ] Output feeds Sprint 15 scope: items tagged "OPEN-EXPLAINED-BY-INSTALL" become candidate tracks; items tagged "OPEN-INDEPENDENT" stay in the Sprint 15 carry-forward backlog.
- [ ] **Findings document written** at `docs/context/findings/s14-agent-os-diagnostic.md` (or a path Tim names). Single source of truth for all four diagnostic outputs. **No source files modified.**
- [ ] **Sprint close gate:** all four diagnostic tracks have a written finding (PASS or "could not determine — escalate"). The findings doc is reviewed by Tim. Sprint closes via `/close-sprint` only after the findings doc is committed and the working tree is clean.

### Board Task Creation Status

Per AGENTIC.md §5 Sprint Planning Protocol, board tasks are created before any work begins. **2026-05-23 status: BLOCKED on machine token refresh.** Both stored API keys in `~/.config/agent-kanban/config.json` (for `localhost:5173` and `localhost:5178`) return `INVALID_API_KEY` against the running dev server — the local D1 was reset since the keys were issued. Tim must (a) ensure the dev server has a current valid api-key in the DB, then (b) update `~/.config/agent-kanban/config.json` via `ak login` or equivalent, then (c) Peaches creates four `S14-D{1..4}` board tasks via `POST /api/boards/:id/tasks`. Until then, the four tracks above are the authoritative work units; the board mirror lands as soon as the token is valid.

### Carries to Sprint 15

Sprint 15 absorbs the Sprint 11/12/13 carry-forward backlog (already enumerated in `tracks.md` Future Backlog § Sprint 15) PLUS any items D4 tags as OPEN-EXPLAINED-BY-INSTALL or OPEN-INDEPENDENT. Specifically expected to land in S15:

- `/sprint-open` skill — likely consumed by D2 finding (install at wrong layer, never installed, or name-mismatch).
- Subagent loader fix — consumed by D1 finding (frontmatter shape OR loader path). Could be a one-line frontmatter normalization or a deeper Agent OS install rerun.
- Env hygiene combo, FATAL stderr/stdout, refinement scoping, team_members Phase 2, daemon spawn-at-create, Login/SSO, Labels global promotion — unaffected by S14 outcome; carry forward as planned.

---
