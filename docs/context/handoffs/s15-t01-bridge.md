### HANDOFF BRIDGE
**Topic:** Agent OS config fixes (S15-T1)
**Track:** S15-T1
**Specialist:** Skylar
**Static DNA Check:** Confirmed alignment with AGENTIC.md — Skylar is the fullstack specialist; this track edits Agent OS config layer (CLAUDE.md, AGENTIC.md, agent frontmatter) plus user-level skill installs. No app source under `apps/`, `packages/`, or `skills/` is touched.

**Dynamic DNA State:**
- **Product Context:** Close the concrete drift identified by S14 — install canonical skills, rewire CLAUDE.md auto-triggers, create `product.md`, fix the AGENTIC.md §5 board-task documentation that has been wrong every sprint, and normalize the bandit.md model name.
- **Current Plan:** `docs/context/plan.md § Current Sprint: Sprint 15 § Tracks → S15-T1` and DoD checklist for T1.
- **Execution Files:**
  - **User-level installs (NOT git-tracked, NOT in this repo):**
    - copy `~/Developer/agent-skills/claude/skills/open-sprint.md` → `~/.claude/skills/open-sprint.md`
    - copy `~/Developer/agent-skills/claude/skills/report-track-status.md` → `~/.claude/skills/report-track-status.md`
    - copy `~/Developer/agent-skills/claude/skills/minify-context.md` → `~/.claude/skills/minify-context.md`
    - leave the existing `~/.claude/skills/start-sprint.md` in place; the new `open-sprint.md` lives alongside it. Do not delete `start-sprint.md`.
  - **Project files (git-tracked):**
    - `CLAUDE.md` — Auto-Invocations table: `/sprint-open` → `/open-sprint`; `/track-status` → `/report-track-status`. No other edits.
    - `AGENTIC.md` §5 Sprint Planning Protocol — fix the board task endpoint (`POST /api/tasks` with `board_id` in body, NOT `POST /api/boards/:id/tasks`) and fix the auth claim (machine tokens cannot create tasks; this requires a user session via the browser, or an `agent:worker`/`agent:leader` JWT). Phase 0 in the same file refers to `POST /api/boards/:id/tasks` — fix it there too.
    - `docs/context/product.md` — NEW file. Summarize from `docs/context/north-star.md` (do NOT delete or rename `north-star.md`). The product.md should be a concise canonical product doc that Peaches reads at init; it can reference `north-star.md` for the deep-dive sections.
    - `.claude/agents/bandit.md` — change frontmatter `model: claude-sonnet-4-6` → `model: sonnet`. No other edits to bandit.md in this track.

**Migration Safety:** Reversible. All project file changes are git-tracked. User-level skill installs are idempotent copies; rerunning is safe. No DB migrations, no schema changes.

**Security Review:** N/A. No auth surface, no payments, no schema. The AGENTIC.md §5 edit is documentation-only — it documents existing auth behavior, does not change it.

**Worktree Setup:** N/A — single active code track at this moment from T1's perspective. T2 lives in a separate worktree and touches disjoint files (`docs/context/plan.md`, `docs/context/archive/`, `peaches.md`), so cross-track contamination risk is zero. If Tim opens T1 and T2 in parallel, use `bash scripts/worktree-add.sh .worktrees/s15-t1 track/s15-t1-config-fixes` for T1 to be safe.

**Verification:**
- After install: in a fresh Claude Code session, type "let's open sprint 16" — `/open-sprint` should auto-trigger. Type "what's the status" — `/report-track-status` should auto-trigger. (Reporting back: paste the auto-trigger header line.)
- `cat ~/.claude/skills/open-sprint.md ~/.claude/skills/report-track-status.md ~/.claude/skills/minify-context.md | head -5` — confirm all three files exist.
- `pnpm build && pnpm tsc --noEmit` — must exit clean.
- `git diff CLAUDE.md AGENTIC.md .claude/agents/bandit.md docs/context/product.md` — verify scope and that no other files changed.

**Next Step:** Skylar — execute the seven file operations above in this order: (1) three user-level skill copies, (2) `CLAUDE.md` auto-trigger rewrite, (3) `AGENTIC.md` §5 + Phase 0 corrections, (4) `bandit.md` model normalization, (5) `docs/context/product.md` creation. Run `pnpm build && pnpm tsc --noEmit` as a final check. Hand back to Tim for board-task creation (manual, browser) and Bandit review of the project-tracked files.
