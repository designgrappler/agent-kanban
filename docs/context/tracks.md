# Agent Skills Private — Active Tracks

## Current Sprint Tracks (Sprint 4 — Local Agent-Kanban Companion Service)

> **Cross-repo notice:** Code work for all four tracks happens in `~/Developer/agent-kanban/` (Tim's fork of `saltbo/agent-kanban`), NOT in `agent-skills-private`. This repo holds the plan only. The new repo uses `pnpm`; that is intentional.

### Track 1 — Fork & local clone
- **Status:** OPEN
- **Specialist:** skylar (one-sprint scope expansion — Tim acceptance required at Bridge)
- **Working directory:** `~/Developer/agent-kanban/`
- **Branch:** `track/1-fork-and-clone`
- **Goal:** Fork `saltbo/agent-kanban` to Tim's GitHub; clone locally; `pnpm install` succeeds; capture upstream SHA in `LOCAL_NOTES.md`; run `onboard-existing-project` skill inside the fork to generate a `CLAUDE.md` tailored to the agent-kanban stack (pnpm, Vite, Hono, React) — runs **after** pnpm install/build attempt. Then seed the fork with Sprint 4 context: create `~/Developer/agent-kanban/docs/context/plan.md` (Sprint 4 section only, copied from agent-skills-private) and `~/Developer/agent-kanban/docs/context/tracks.md` (current Sprint 4 tracks, copied from agent-skills-private). agent-skills-private keeps its own copies intact — this is a copy, not a move.
- **Verification:** `.git/config` points to Tim's fork; `node_modules/` exists; baseline state recorded; `cat ~/Developer/agent-kanban/CLAUDE.md` confirms the file exists and references the Agent OS team; `cat ~/Developer/agent-kanban/docs/context/plan.md` shows Sprint 4 content; `cat ~/Developer/agent-kanban/docs/context/tracks.md` shows current tracks.
- **Workspace handoff:** After Bandit approves T1, Tim closes the agent-skills-private workspace and opens `~/Developer/agent-kanban/` to continue the sprint.
- **Migration Safety:** Reversible
- **Security Review:** N/A

### Track 2 — Strip Cloudflare/cloud bindings
- **Status:** OPEN (depends on T1)
- **Specialist:** skylar
- **Working directory:** `~/Developer/agent-kanban/`
- **Branch:** `track/2-strip-cloud`
- **Goal:** Remove or stub Analytics Engine, Mailchannels, Durable Objects, deploy-only Wrangler env blocks, daemon auto-spawn, cryptographic identity (if blocking). Keep local D1, Vite, Hono, React UI. `pnpm dev` starts without binding errors.
- **Verification:** `pnpm dev` boots; `.wrangler/state/v3/d1/` populated; cloud bindings absent from `wrangler.toml`.
- **Migration Safety:** Reversible
- **Security Review:** N/A

### Track 3 — Configure GitHub OAuth for local dev
- **Status:** OPEN (depends on T2; blocked on Tim prerequisite — see below)
- **Specialist:** skylar
- **Working directory:** `~/Developer/agent-kanban/`
- **Branch:** `track/3-local-auth`
- **Tim prerequisite (BLOCKING):** Tim creates a GitHub OAuth app at `https://github.com/settings/developers` with a `http://localhost:<port>` callback URL, then hands the Client ID and Client Secret to Skylar via a secure channel. Skylar cannot start T3 until this is done.
- **Goal:** Configure real GitHub OAuth for local dev. Skylar drops `CLIENT_ID` / `CLIENT_SECRET` into a gitignored `.dev.vars`. Browser sign-in via GitHub completes the round-trip and lands on the board UI authenticated as the GitHub user. No stubbing, no auth bypass.
- **Verification:** `.dev.vars` exists with the OAuth env vars and is gitignored; browser performs a real GitHub OAuth flow at `http://localhost:<port>` and shows the board UI logged in; API calls succeed (no 401); `LOCAL_NOTES.md` records OAuth setup notes (env var names, callback path) without secrets.
- **Migration Safety:** Reversible
- **Security Review:** **AUTH** — real OAuth configuration (lower risk than the prior stub approach). Tim's 2026-05-20 acceptance covers this updated scope.

### Track 4 — Smoke test
- **Status:** OPEN (depends on T3)
- **Specialist:** skylar
- **Working directory:** `~/Developer/agent-kanban/`
- **Branch:** `track/4-smoke-test` (may roll into T3's branch if minimal)
- **Goal:** Create a task; move it through all five columns (todo → in_progress → in_review → done → cancelled); confirm persistence across `pnpm dev` restart; `ak --help` runs.
- **Verification:** All transitions succeed; task survives restart; `LOCAL_NOTES.md` has dated smoke test entry.
- **Migration Safety:** Reversible
- **Security Review:** N/A

---

## Worktree Note

AGENTIC.md §4 worktree protocol applies **inside `agent-skills-private`** for parallel tracks here. This sprint's code work is in a separate repo (`agent-kanban`), so worktrees are unnecessary — Skylar uses ordinary feature branches in the new clone. Tracks T1→T4 are sequenced (each depends on the prior), so parallel execution is not expected.

---

## Backlog

- **CLI integration with Agent OS agents:** Register Skylar/Bandit/Peaches as board agents and have them update task status via `ak`. Deferred from Sprint 4.
- **P2 — Domain Judgment → Capabilities rename:** Standardize section heading in `claude/agents/frontend.md`, `backend.md`, `fullstack.md`, `database.md`. Non-blocking.
- **Expand agent types post-sprint:** Broaden agent templates beyond dev roles to cover content, design, research, ops.
- **Non-code artifact reviewer:** A skill (not an agent) for completeness/traceability/format checks on document artifacts. Complements Critic.
- **VS Code Sprint Tab Automation:** `/start-sprint` skill emits a tab config; companion VS Code extension fires `workbench.action.chat.open` once per OPEN track. Natural owner: Max.

---
*Last updated: 2026-05-20 (T1 extended: Skylar seeds `~/Developer/agent-kanban/docs/context/plan.md` and `tracks.md` with current Sprint 4 content so Tim can close agent-skills-private workspace after Bandit approves T1 and continue the sprint from the new repo; T3 scope changed earlier same day: stub/disable auth → configure real GitHub OAuth for local dev; Tim prerequisite — create OAuth app — now blocking T3 start)*
