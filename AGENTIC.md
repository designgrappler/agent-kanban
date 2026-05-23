# AGENTIC DNA — agent-kanban

Agent-first kanban board. React SPA + Hono API on Cloudflare Workers + D1. Agents claim tasks via CLI; humans review via browser.

This document is the root source of truth for this project. All agents read it before any work begins. Edit via your primary agent — do not edit directly.

---

## 2. Tech Stack

### Backend
- **Runtime:** Cloudflare Workers
- **Framework:** Hono
- **Database:** Cloudflare D1 (SQLite) — local emulation via Wrangler at `.wrangler/state/v3/d1/`
- **Transport:** HTTP + SSE

### Frontend
- **Framework:** React + Vite
- **Styling:** Tailwind CSS
- **Design System:** shadcn/ui

### Quality & Automation
- **Type Checking:** pnpm tsc --noEmit
- **Build:** pnpm build
- **Linting:** Biome

---

## 3. Project Team

- **Tim (Conductor):** Vision & Approval.
- **Claude (Orchestrator):** Coordinates specialists, no direct execution.
- **Peaches (Lead Architect):** Context Owner. Zero-code. Plans and produces Handoff Bridges.
- **Skylar (Fullstack Specialist):** Owns full-stack feature work — Hono API routes, React UI, D1 schema, CLI, Agent OS config layer.
- **Bandit (QA):** Build verification and quality gate. Read-only.

---

## 7. Definition of Done

A track is **Done** only when ALL of the following are true:

- [ ] `pnpm build` exits with zero errors
- [ ] All changes are within the declared track scope (no scope drift)
- [ ] No `console.log`, `debugger`, or hardcoded secrets in the diff
- [ ] `docs/context/plan.md` and `tracks.md` updated to reflect the completed track
- [ ] Board task for this track was created before the Handoff Bridge was issued (or retroactively before work began)
- [ ] **If track includes a migration file:** dev server restarted after merge and migration confirmed applied to `.wrangler/state` DB (Wrangler applies pending migrations on startup — tests use fresh Miniflare and do not validate the live dev DB)
- [ ] Bandit has issued a **PASS** verdict
- [ ] Tim has given final approval (for tracks touching auth, schema, or payments)

---
---

# How Your Agents Operate

> **For reference only.** The sections below describe how your agents behave.

---

## 1. DNA Taxonomy
- **Static DNA:** Foundational tech, team roles, and protocol constraints (this file).
- **Dynamic DNA:** High-churn task state, roadmap, and requirements (`docs/context/`).

---

## 4. Worktree Protocol

Each track gets an isolated git worktree to prevent cross-track contamination:

```bash
# Open a new track
git worktree add .worktrees/track-N track/N-short-description

# Specialist works inside that worktree only
# QA reviews the diff before merge back to main branch
git worktree remove .worktrees/track-N
```

- Worktrees live in `.worktrees/` (gitignored)
- Branch naming: `track/N-short-description`
- Never work directly on the main branch when 2+ tracks are active in parallel
- Worktree removed only after QA issues PASS verdict

---

## 5. Conductor Protocols

### Stability Rules
- **Circuit Breaker:** 3 consecutive failures with the same root cause → STOP and escalate to the Conductor. Any single destructive or security-related failure triggers an immediate stop regardless of count.
- **Git Hygiene:** No commits unless directed. Use `git add` for staging only.
- **Sentinel Proof:** Never trust an agent's verbal summary. Verify with `git diff` or direct file reads.

### Handoff Logic
- **Phase 0 (Board Setup):** Before issuing any Handoff Bridge, create a board task for the track via `POST /api/tasks` (with `board_id` in the request body). Discover the active board ID via `ak get board -o json`. Title format: `T<N>: <track short description>`. Description: one sentence from the track goal. Status: `todo`. Note: machine tokens (`AK_TOKEN`) cannot create tasks — task creation requires a user browser session or an `agent:worker`/`agent:leader` JWT. If only machine credentials are available, create the board task manually from the browser before issuing the Bridge. The board is the authoritative source of truth — a track without a board task does not exist.
- **Phase 1 (Verify):** Downstream specialist verifies upstream interface before any implementation begins.
- **Phase 2 (Align):** Synchronize with `AGENTIC.md` and `tracks.md`.
- **Phase 3 (Draft):** Architect drafts implementation plan.
- **Phase 4 (Bridge):** Architect compresses Dynamic DNA into a Handoff Bridge for the Specialist.

### Sprint Planning Protocol

When Peaches opens a new sprint:

1. **Board first.** For each track in the sprint, call `POST /api/tasks` (with `board_id` in the request body) to create a board task before issuing any Handoff Bridges. Discover the board ID via `ak get board -o json`. Title: `T<N>: <short description>`. Description: one sentence stating the track goal. Status: `todo`. Note: machine tokens (`AK_TOKEN`) cannot create tasks — task creation requires a user browser session or an `agent:worker`/`agent:leader` JWT. If only machine credentials are available, create board tasks manually from the browser before proceeding.
2. **1:1 mapping.** Every track maps to exactly one board task. No track exists only in `tracks.md`. No board task exists without a corresponding `tracks.md` entry.
3. **Board is authoritative.** The kanban board is the sprint's source of truth for work status. `plan.md` and `tracks.md` remain planning artifacts but are subordinate to the board.
4. **Retroactive fix rule.** If a Handoff Bridge is issued without a board task (due to error or interruption), the board task must be created before Skylar begins work — not after.
5. **API auth.** Board task creation requires a user browser session or an `agent:worker`/`agent:leader` JWT. Machine tokens (`AK_TOKEN`) cannot create tasks — use the browser when only machine credentials are available.

---

## 6. Commit Convention

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

feat(auth): add OAuth redirect handler
fix(items): correct rounding on split calculation
chore(deps): upgrade dependency
refactor(ui): extract component into standalone file
```

**Types:** `feat` · `fix` · `chore` · `refactor` · `docs` · `style` · `perf` · `test`
**Breaking changes:** append `!` after type and include `BREAKING CHANGE:` in the body.

---

## 8. Handoff Bridge Template

```markdown
### HANDOFF BRIDGE
**Topic:** [Feature/Bug Name]
**Track:** [ID from tracks.md]
**Static DNA Check:** [Confirm alignment with AGENTIC.md tech/roles]
**Dynamic DNA State:**
- **Product Context:** [1-sentence summary of requirement]
- **Current Plan:** [step in plan.md]
- **Execution Files:** [list of files to modify]
**Worktree Setup:** [git worktree command, or "N/A — single active track"]
**Verification:** [specific command or URL]
**Next Step:** [specific task for the Specialist]
```
