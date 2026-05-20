# Agent Skills Private — Sprint Plan

## Current Sprint: Local Agent-Kanban Companion Service

**Objective:** Stand up a locally-running fork of `saltbo/agent-kanban` as a separate repo, stripped of all Cloudflare/cloud dependencies, so Tim can manage Agent OS backlog and per-track task status from a browser tab. Goal is a working local board — nothing more.

**Repo relationship (Static DNA — non-negotiable for this sprint):**
- **This repo (`agent-skills-private`):** Source of truth for Agent OS — skills, agents, sprint plans. Untouched by this sprint's code work; only `docs/context/` is edited (by Peaches).
- **New repo (forked locally):** `agent-kanban` (Tim's GitHub fork of `saltbo/agent-kanban`). Lives as a sibling directory under `~/Developer/`. Uses `pnpm`, not `bun` — this is intentional and acceptable because it is a separate repo.
- **Cross-repo discipline:** Skylar's edits in this sprint happen inside the new `agent-kanban` clone. No source code is added to `agent-skills-private`.

**Scope guard:** All code work occurs in the new `agent-kanban` clone. Inside `agent-skills-private`, only `docs/context/plan.md` and `docs/context/tracks.md` are touched (by Peaches). No edits to `claude/skills/`, `claude/agents/`, `AGENTIC.md`, or settings.

**Specialist scope expansion notice (per AGENTIC.md §3 "Uncovered layers"):** Skylar's declared scope is the Agent OS skill/agent library. This sprint's code work is in a sibling repo — outside Skylar's documented scope. Since no other specialist exists, Skylar executes under a one-sprint scope expansion. Tim must explicitly accept this expansion at Bridge issuance.

**Guiding principle:** Strip aggressively. Anything cloud-only that we do not need to run locally gets removed or stubbed. Don't keep dead code around "just in case" — we can re-add features later by pulling from upstream if needed.

---

## Tracks

### Track 1 — Fork & local clone
**Goal:** Tim's GitHub account hosts a fork of `saltbo/agent-kanban`. The fork is cloned to `~/Developer/agent-kanban/` on this machine. Initial install succeeds far enough to confirm the toolchain is functional, even if the app does not yet run end-to-end.

**Owner:** Skylar (with Tim performing the fork-via-GitHub step if required)
**Working directory:** `~/Developer/agent-kanban/` (NOT inside `agent-skills-private`)
**Branch:** `track/1-fork-and-clone` in the new repo

**Work:**
1. Tim forks `saltbo/agent-kanban` → his account via GitHub UI (or `gh repo fork saltbo/agent-kanban --clone=false`). Skylar can run the `gh` command if Tim's CLI is authenticated.
2. Skylar clones the fork to `~/Developer/agent-kanban/`.
3. Skylar runs `pnpm install` to confirm the toolchain works. Note any warnings or peer-dep issues.
4. Skylar attempts `pnpm --filter @agent-kanban/shared build` and reports the result.
5. Skylar writes a brief `LOCAL_NOTES.md` in the new repo capturing the upstream commit SHA at fork time and any install issues observed.
6. Skylar runs the `onboard-existing-project` skill from inside `~/Developer/agent-kanban/` to generate a `CLAUDE.md` tailored to the agent-kanban stack (pnpm, Vite, Hono, React). This gives the fork Agent OS team protocols from the start. Runs **after** the pnpm install and build attempt, and **before** step 7.
7. Skylar seeds the fork with the current Sprint 4 context so Tim can continue the sprint from the new repo:
   - Create `~/Developer/agent-kanban/docs/context/` (mkdir -p).
   - Write `~/Developer/agent-kanban/docs/context/plan.md` containing **only** the Sprint 4 section (the "Current Sprint: Local Agent-Kanban Companion Service" block through "Definition of Done (Sprint 4)") copied verbatim from `/Users/I826932/Developer/agent-skills-private/docs/context/plan.md`. Do **not** copy the Sprint 3/2/1 archive sections or the agent-skills-private backlog.
   - Write `~/Developer/agent-kanban/docs/context/tracks.md` containing the current Sprint 4 tracks copied verbatim from `/Users/I826932/Developer/agent-skills-private/docs/context/tracks.md`.
   - Note: agent-skills-private keeps its own `plan.md` / `tracks.md` intact for future Agent OS work. This is a **copy**, not a move.

**Verification:**
- `~/Developer/agent-kanban/.git/config` shows the remote pointing to Tim's fork.
- `~/Developer/agent-kanban/node_modules/` exists.
- `git log -1` in the clone matches the upstream HEAD at fork time.
- `cat ~/Developer/agent-kanban/CLAUDE.md` confirms the file exists and references the Agent OS team.
- `cat ~/Developer/agent-kanban/docs/context/plan.md` shows Sprint 4 content (Local Agent-Kanban Companion Service objective + T1–T4 + Sprint 4 DoD).
- `cat ~/Developer/agent-kanban/docs/context/tracks.md` shows the current Sprint 4 tracks (T1–T4 with their statuses).

**Exit criteria:** Repo cloned, deps installed, baseline state captured, fork seeded with Sprint 4 context. Failures running the app are expected at this point — they are addressed in T2/T3.

**Workspace handoff:** After Bandit approves T1, Tim closes the agent-skills-private workspace and opens `~/Developer/agent-kanban/` to continue the sprint.

---

### Track 2 — Strip Cloudflare/cloud bindings
**Goal:** `wrangler.toml` and any related config carry only the bindings needed for **local** Wrangler emulation (local D1 SQLite). Cloud-only features are removed or commented out with a clear marker. App still boots after the strip.

**Owner:** Skylar
**Working directory:** `~/Developer/agent-kanban/`
**Branch:** `track/2-strip-cloud`

**Items to remove or disable:**
- Cloudflare Analytics Engine binding
- Mailchannels (email) — disable any send paths or stub them to no-op
- Durable Objects (tunnel relay) — remove binding; stub any code path that imports it
- Any `[env.production]` / deploy-only blocks in `wrangler.toml`
- The daemon (auto-spawning agents) — leave code in place but ensure it's not started by `pnpm dev`
- Cryptographic agent identity — leave code in place; if it blocks local boot, stub the verification call

**What stays:**
- Local D1 binding (`.wrangler/state/v3/d1` persistence)
- Vite dev server
- Hono API
- React UI + shadcn/ui board

**Work:**
1. Inventory all Wrangler bindings and Cloudflare imports. Capture as a checklist in `LOCAL_NOTES.md`.
2. For each cloud-only binding/import, decide: remove, stub, or comment-out with `// LOCAL-ONLY: <reason>` marker. Prefer remove > stub > comment.
3. Update `wrangler.toml` to local-only.
4. Run `pnpm --filter @agent-kanban/web db:migrate` to confirm local D1 still initializes.
5. Run `pnpm dev` and confirm the dev server starts without throwing on missing cloud bindings. App may still error on auth — that's T3.

**Verification:**
- `pnpm dev` starts the Vite + Wrangler dev server without unhandled binding errors.
- `.wrangler/state/v3/d1/` exists and contains the migrated schema.
- `grep -ri "analytics\|mailchannels\|durable" wrangler.toml` returns no active (uncommented) bindings.

**Migration Safety:** Reversible (all changes are in the new repo on a feature branch; can be discarded with `git checkout`).
**Security Review:** N/A (no auth, payments, or schema changes — schema is upstream-defined and we are only running its existing migrations against local SQLite).

---

### Track 3 — Configure GitHub OAuth for local dev
**Goal:** App boots and the board UI is reachable via real GitHub OAuth running entirely on localhost. No stubbing, no auth bypass — a team member can sign in with their GitHub identity and collaborate on the board.

**Owner:** Skylar (with a Tim prerequisite — see "Tim prerequisite" below)
**Working directory:** `~/Developer/agent-kanban/`
**Branch:** `track/3-local-auth`

**Rationale for the new approach:** GitHub OAuth works locally without any deployed server — GitHub will happily redirect back to a `http://localhost:<port>` callback URL configured on a personal OAuth app. Keeping real auth means the board can be used collaboratively by anyone with a GitHub account. Stubbing or disabling auth would close that door for no real benefit, since the configuration cost is small.

**Tim prerequisite (must complete before Skylar starts T3):**
1. Tim navigates to `https://github.com/settings/developers` → "OAuth Apps" → "New OAuth App".
2. Tim creates an OAuth app with:
   - **Application name:** any (e.g. `agent-kanban-local`).
   - **Homepage URL:** `http://localhost:<port>` (port matches what `pnpm dev` serves — confirm during T2).
   - **Authorization callback URL:** `http://localhost:<port>/<callback path expected by better-auth>` (Skylar confirms the exact callback path from the upstream config and reports it back so Tim can register the right URL).
3. Tim captures the resulting **Client ID** and generates a **Client Secret**, then hands both to Skylar via a secure channel.

**Skylar work (after Tim's prerequisite):**
1. Read upstream `better-auth` config to confirm the expected env var names (typically `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`) and the exact callback path. Report the callback path to Tim if not already known when the OAuth app was created.
2. Create `.dev.vars` in the new repo's root (or the appropriate Wrangler-recognized location) with the Client ID and Client Secret. Confirm `.dev.vars` is gitignored — add to `.gitignore` if not.
3. Document the env var names and OAuth app expectations in `LOCAL_NOTES.md` (without writing the secrets themselves to that file).
4. Start `pnpm dev`, complete a real GitHub OAuth sign-in flow in the browser, and confirm the board UI loads with the logged-in GitHub identity.

**Verification:**
- `.dev.vars` exists, contains `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` (or whatever names better-auth expects), and is gitignored.
- Browser at `http://localhost:<port>` performs a real GitHub OAuth round-trip and lands on the board UI authenticated as Tim's GitHub user.
- API requests from the UI succeed (no 401).
- `LOCAL_NOTES.md` records the OAuth setup steps (env var names, callback path) but not the secret values.

**Migration Safety:** Reversible (configuration-only; revoke the OAuth app or delete `.dev.vars` to undo).
**Security Review:** **AUTH** — this is real auth configuration, not a stub or bypass. Lower risk than the previous stub-based approach. Tim's 2026-05-20 acceptance for T3 covers this updated scope (per Tim's note when redirecting T3 from "stub" to "configure properly").

---

### Track 4 — Smoke test
**Goal:** Confirm end-to-end usability: board renders, a task can be created, a task can be moved across all five columns (todo → in_progress → in_review → done → cancelled), and state persists across a dev server restart.

**Owner:** Skylar
**Working directory:** `~/Developer/agent-kanban/`
**Branch:** `track/4-smoke-test` (or rolled into T3's branch if changes are minimal)

**Work:**
1. With `pnpm dev` running, open the board in a browser.
2. Create a task titled "smoke-test-task-1" in the `todo` column.
3. Drag (or use the UI's status control) to move the task through each column: `todo → in_progress → in_review → done → cancelled`. Capture a screenshot or note of each transition.
4. Stop and restart `pnpm dev`. Confirm the task is still present in `cancelled`.
5. Run `ak --help` (the CLI) and confirm it executes. Full CLI registration flow is **out of scope** for this sprint — we only verify the binary is callable.
6. Append a "Smoke Test Results" section to `LOCAL_NOTES.md` with the date, screenshots/notes, and any observed issues.

**Verification:**
- All five column transitions succeed.
- Task survives dev server restart (D1 persistence works).
- `LOCAL_NOTES.md` has a dated smoke test entry.

**Exit criteria:** Tim can open the board in a browser tab and use it as a personal Kanban view. CLI integration with Agent OS agents (registering Skylar/Bandit/Peaches as board agents) is **deferred** to a follow-up sprint.

---

## Red Flag Analysis

**Title:** Local Agent-Kanban Companion Service
**Top Risk Factors:**
1. **Auth configuration friction (`better-auth` + GitHub OAuth):** Configuring real OAuth locally is well-trodden, but if the upstream callback path or env var names diverge from defaults, the round-trip can fail in confusing ways. Lower risk than the previous "strip auth" framing, but still the most likely time-sink.
2. **Wrangler local emulation quirks:** Local D1 + Hono + Vite is a finicky combo. Removing Durable Objects can cascade into runtime errors if the API references them at boot. Migrations may behave differently against local SQLite vs. Cloudflare D1.
3. **Cross-repo / scope expansion:** Skylar's declared scope is Agent OS skills/agents. This sprint asks Skylar to operate in a sibling repo with a different package manager and stack. Risk of confusion about source-of-truth boundaries and accidental edits to `agent-skills-private`.

**Risk:** **MEDIUM** — the scope is well-bounded (local-only, no deployment) but the surface area of cloud-stripping is wider than typical skill-update sprints, and auth is the classic landmine.

**Premortem (2 weeks out):** Failure looks like Skylar spending three sessions chasing OAuth callback or env-var mismatches, never reaching T4. The board never loads. Tim closes the sprint without a working tool. Or: the app boots but has hidden cloud calls that fail silently in the background, leaving Tim unsure whether to trust it.

**Fallback Options:**
- **If GitHub OAuth proves intractable in the existing better-auth config:** Pin a known-good upstream commit, or temporarily fall back to a local dev bypass (the previous T3 Option B) until the OAuth integration can be revisited.
- **If Wrangler local D1 misbehaves:** Bypass Wrangler in dev — run the Hono API on plain Node + `better-sqlite3`, accepting that we lose some upstream parity. This is a larger change and would be its own sprint.
- **If the fork strategy proves too tangled:** Drop the fork; build a minimal Kanban from scratch using the same column model. Last-resort option.

**Migration Safety:** Reversible at the sprint level — all work is in a separate repo on feature branches. No migrations touch `agent-skills-private`. No production system is involved.

**Security Implications:** **AUTH** (T3 only). T3 now configures real GitHub OAuth for local dev (no stub, no bypass). The change is bounded to a personal OAuth app with a `localhost` callback and gitignored `.dev.vars`. Tim's 2026-05-20 acceptance covers the updated scope.

**Specialist scope expansion:** This sprint operates outside Skylar's declared scope (sibling repo, different stack). Tim must accept the one-sprint expansion at Bridge issuance.

**Cross-repo hygiene rules (binding for the sprint):**
- No `git commit` inside `agent-skills-private` for code changes from this sprint. Only Peaches edits to `docs/context/` are committed here.
- All `agent-kanban` work happens on feature branches in the `agent-kanban` clone.
- `LOCAL_NOTES.md` in the new repo is the running log for this sprint's decisions.

---

## Definition of Done (Sprint 4)

- [ ] T1: `agent-kanban` forked to Tim's GitHub, cloned to `~/Developer/agent-kanban/`, deps installed
- [ ] T2: `wrangler.toml` and config carry only local-required bindings; `pnpm dev` starts without binding errors
- [ ] T3: GitHub OAuth app created by Tim; `.dev.vars` populated by Skylar; board UI loads in browser via real GitHub OAuth round-trip; setup recorded in `LOCAL_NOTES.md` (without secrets)
- [ ] T4: Task moves across all five columns and survives dev server restart
- [ ] No source code added or modified inside `agent-skills-private`
- [ ] No work performed in the `agent-skills` public mirror
- [ ] `LOCAL_NOTES.md` exists in the new repo and captures: upstream SHA at fork, install issues, cloud-stripping inventory, OAuth setup notes (env var names + callback path, no secrets), smoke test results
- [ ] Bandit QA: APPROVED verdict (read-only review of the new repo's diff against upstream)
- [ ] Tim has accepted the **Auth security review** (T3 — real GitHub OAuth for local dev, accepted 2026-05-20) and the **specialist scope expansion** at Bridge issuance

---

*Last updated: 2026-05-20 (T1 extended with step 7: seed `~/Developer/agent-kanban/docs/context/` with Sprint 4 plan + tracks so Tim can close the agent-skills-private workspace and continue the sprint from the new repo after Bandit approves T1; T3 scope changed earlier same day: stub/disable auth → configure real GitHub OAuth for local dev; Tim's 2026-05-20 AUTH acceptance still stands)*
