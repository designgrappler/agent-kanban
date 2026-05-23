# S14 — Agent OS Diagnostic Findings

**Date:** 2026-05-23  
**Scope:** Three-way comparison — canonical Agent OS (`agent-skills`), working reference (`project-tracker`), subject (`agent-kanban`)  
**Method:** Direct file inspection across all three repos  
**Verdict:** agent-kanban has significant, specific drift from canonical. Several gaps are in the install process itself.

---

## 1. Canonical Agent OS — What It Produces

The canonical source lives at `/Users/I826932/Developer/agent-skills/` (mirrors the GitHub repo).

### Structure it deploys to a target project:
```
.claude/
  agents/
    architect.md     ← renamed per project (e.g. peaches.md)
    qa.md            ← renamed per project (e.e. bandit.md)
    fullstack.md     ← or frontend/backend/database per team shape
  settings.json      ← minimal Stop hook + project-specific Bash allowlist
docs/context/
  plan.md
  tracks.md
  product.md         ← REQUIRED by canonical Peaches init
AGENTIC.md
CLAUDE.md
```

### Canonical agent frontmatter shape (from `claude/agents/`):
```yaml
# architect.md
model: opus              ← SHORT form
tools:
  - Read
  - Write
  - Edit
  - Bash              ← BLOCK-LIST format

# qa.md
model: sonnet            ← SHORT form
tools:
  - Read
  - Bash              ← BLOCK-LIST format

# fullstack.md
model: claude-sonnet-4-6 ← LONG form (inconsistency within canonical)
tools:
  - Read
  - Write
  - Edit
  - Bash
```

**Note:** The canonical templates are internally inconsistent — architect/qa use short model names (`opus`, `sonnet`), but specialist templates use long names (`claude-sonnet-4-6`). The `install-agent-scaffold` SKILL.md specifies `model: claude-opus-4-7` for architect and `model: claude-sonnet-4-6` for all others — contradicting the `claude/agents/architect.md` template which uses `model: opus`. **This inconsistency is a bug in canonical Agent OS, not in agent-kanban.**

### Canonical skills — what exists vs. what is user-level installable:

| Skill file | Invocation name | Install target |
|---|---|---|
| `open-sprint.md` | `/open-sprint` | `~/.claude/skills/open-sprint.md` |
| `start-sprint.md` | `/start-sprint` | `~/.claude/skills/start-sprint.md` (legacy name, still present) |
| `report-track-status.md` | `/report-track-status` | `~/.claude/skills/report-track-status.md` |
| `clean-context/` (dir) | `/clean-context` | `~/.claude/skills/clean-context/` |
| `remind/` (dir) | `/remind` | `~/.claude/skills/remind/` |
| `install-agent-scaffold.md` | `/install-agent-scaffold` | `~/.claude/skills/install-agent-scaffold.md` |
| `onboard-existing-project.md` | `/onboard-existing-project` | `~/.claude/skills/onboard-existing-project.md` |
| `minify-context.md` | `/minify-context` | `~/.claude/skills/minify-context.md` |
| `streamline-approvals.md` | `/streamline-approvals` | `~/.claude/skills/streamline-approvals.md` |
| `sync-vercel-env.md` | `/sync-vercel-env` | `~/.claude/skills/sync-vercel-env.md` |
| `sync-design.md` | `/sync-design` | `~/.claude/skills/sync-design.md` |
| `audit-security` (dir) | `/audit-security` | `~/.claude/skills/audit-security/` |

---

## 2. project-tracker — Reference Install State

A working Agent OS installation. Key observations:

### Agents
All 5 agent files use **inline `tools:`** format and **long model names** (`claude-sonnet-4-6`). No `color:` field. Example:
```yaml
name: peaches
model: claude-sonnet-4-6
tools: Read, Write, Edit, Bash
```
This contradicts the canonical template (which uses block-list). Yet project-tracker agents work correctly. This confirms **`tools:` format (inline vs. block-list) does not affect agent loading**.

### Skills
One project-level skill: `.claude/skills/start-approval/SKILL.md` — a project-specific mobile approval gate. Not from canonical.

### `docs/context/`
Has `product.md` ✓, `plan.md` ✓, `tracks.md` ✓, `CONVENTIONS.md` (project-specific). Also uses **per-sprint plan files** (`t22-plan.md`, `t23-plan.md`, etc.) and **per-track handoff files** (`handoff-t1.md`, etc.) — keeping `plan.md` lean and context-efficient.

### Hooks
Has a full `.claude/hooks/pre-tool-use.sh` (mobile approval gate) wired via `settings.local.json`. Not canonical — project-specific.

### Verdict: project-tracker is a healthy, customized Agent OS install. All canonical pieces are present; additions are project-specific and well-scoped.

---

## 3. agent-kanban — Current Install State

### Agents

| File | `model:` | `tools:` format | `color:` | Matches canonical? |
|---|---|---|---|---|
| `peaches.md` | `claude-opus-4-7` (long) | block-list | none | No — model should be `opus` per canonical qa/architect pattern |
| `skylar.md` | `claude-sonnet-4-6` (long) | block-list | none | Acceptable (canonical specialists use long names) |
| `bandit.md` | `claude-sonnet-4-6` (long) | block-list | none | No — model should be `sonnet` per canonical qa template |
| `playwright-test-generator.md` | `sonnet` (short) | inline | `blue` | N/A — not an Agent OS agent; installed by Playwright MCP |
| `playwright-test-healer.md` | `sonnet` (short) | inline | `red` | N/A |
| `playwright-test-planner.md` | `sonnet` (short) | inline | `green` | N/A |

**Key finding on subagent loading:** The Playwright agents and team agents coexist in the same directory and both are accessible via `subagent_type`. The observed "playwright works, team agents don't" concern is **not a loading failure** — all six agents appear in the FleetView subagent roster in the current session. The concern was likely about **role fidelity under drift** (agents load but gradually lose role adherence as conversations grow), not about binary load/no-load failure.

The frontmatter differences (short vs. long model names, inline vs. block-list tools, presence of `color:`) affect model selection and aesthetics but do **not** appear to gate `subagent_type` invocation in the current Claude Code version.

### Skills — THE MOST CRITICAL GAP

#### User-level (`~/.claude/skills/`):

| File | Invocation | Status |
|---|---|---|
| `start-sprint.md` | `/start-sprint` | ✓ Installed — but **wrong name** |
| `open-sprint.md` | `/open-sprint` | ✗ NOT installed |
| `report-track-status.md` | `/report-track-status` | ✗ NOT installed |
| `clean-context/` | `/clean-context` | ✓ Installed |
| `remind/` | `/remind` | ✓ Installed |
| `install-agent-scaffold.md` | `/install-agent-scaffold` | ✓ Installed |
| `onboard-existing-project.md` | `/onboard-existing-project` | ✓ Installed |
| `streamline-approvals.md` | `/streamline-approvals` | ✓ Installed |
| `sync-vercel-env.md` | `/sync-vercel-env` | ✓ Installed |
| `minify-context.md` | `/minify-context` | ✗ NOT installed |
| `sync-design.md` | `/sync-design` | ✗ NOT installed |

#### Project-level (`.claude/skills/`):

| Directory | Invocation | Status |
|---|---|---|
| `close-sprint/` | `/close-sprint` | ✓ Present — project-specific, not from canonical |

#### CLAUDE.md auto-trigger wiring:

| CLAUDE.md references | Points to | Actual invokable skill | Match? |
|---|---|---|---|
| `/sprint-open` | nothing | `/start-sprint` (old) or `/open-sprint` (canonical) | **✗ BROKEN** |
| `/track-status` | nothing | `/report-track-status` (canonical) | **✗ BROKEN** |

**Triple mismatch on sprint-open:** canonical calls it `open-sprint`, the installed file is `start-sprint`, and CLAUDE.md references `/sprint-open`. None of the three match each other. The auto-trigger for "start planning / new sprint" has never worked on this project.

### `docs/context/`

| File | agent-kanban | project-tracker | canonical | Gap? |
|---|---|---|---|---|
| `plan.md` | ✓ — 2400+ lines, all sprint history embedded | ✓ — lean, delegates to per-sprint files | ✓ | Structural — plan.md is overloaded |
| `tracks.md` | ✓ | ✓ | ✓ | OK |
| `product.md` | ✗ MISSING | ✓ | ✓ | **Gap** |
| `north-star.md` | ✓ (project-specific) | ✗ | ✗ | Non-canonical substitute |

`product.md` is absent. The canonical Peaches initialization reads it (with an "if it exists" guard in agent-kanban's `peaches.md`, so it doesn't hard-fail — but the product context is missing from every Peaches session).

### settings.json comparison

| Feature | agent-kanban | project-tracker | canonical |
|---|---|---|---|
| Stop hook | ✓ (DNA hygiene reminder) | ✓ (DNA check reminder) | ✓ |
| PreToolUse hook | ✗ | ✓ (type-check gate on git push) | ✗ (project-specific) |
| `hooks/` directory | ✗ | ✓ `pre-tool-use.sh` | ✗ (not canonical) |
| permissions allow | 8 entries | 15 entries | 3 entries |

agent-kanban's PreToolUse hook is absent. This isn't a canonical gap — project-tracker's type-check gate is project-specific. But agent-kanban could benefit from a similar gate.

### AGENTIC.md — documented incorrectly in §5

AGENTIC.md §5 Sprint Planning Protocol states:
> "Board task creation uses the existing machine token (`AK_TOKEN`) — the same credential used by the daemon."

**This is wrong.** Machine tokens (identity type `machine`) are FORBIDDEN from creating tasks — the route requires `user` or `agent:worker` or `agent:leader`. The API also uses `POST /api/tasks` with `board_id` in the body, not `POST /api/boards/:id/tasks` as documented. This accumulated through sprint planning sessions where the documentation was never tested against the live API.

---

## 4. Delta Table

| Dimension | Canonical | project-tracker | agent-kanban | agent-kanban gap |
|---|---|---|---|---|
| `peaches.md` model | `opus` (short) | `claude-sonnet-4-6` | `claude-opus-4-7` | Wrong short-name equivalent |
| `bandit.md` model | `sonnet` (short) | `claude-sonnet-4-6` | `claude-sonnet-4-6` | Not using canonical short name |
| tools format | block-list | inline | block-list | OK per canonical; project-tracker is the outlier |
| `/open-sprint` skill | `open-sprint.md` | not referenced | `/sprint-open` (CLAUDE.md) | **Triple mismatch — broken** |
| `/track-status` skill | `report-track-status.md` | not referenced | `/track-status` (CLAUDE.md) | **Not installed, wrong name** |
| `/minify-context` | installed | not referenced | **not installed** | Missing |
| `docs/context/product.md` | required | ✓ present | **absent** | Missing |
| `plan.md` size discipline | lean | lean + per-sprint files | 2400+ lines monolith | Context rot |
| Board task auth | N/A | N/A | documented wrong | AGENTIC.md §5 is incorrect |
| `hooks/` directory | absent | ✓ present | absent | project-tracker added, not canonical |

---

## 5. Root Cause Analysis

### Gap 1: `/sprint-open` never worked
**What:** CLAUDE.md auto-trigger references `/sprint-open`. The installed skill is `start-sprint.md` → `/start-sprint`. The canonical current name is `open-sprint.md` → `/open-sprint`. All three differ.

**Why it matters:** Every "start planning / new sprint" trigger in this project has silently fallen through to manual handling. The session before this sprint Tim said "let's open sprint 14" and the auto-trigger fired but found no skill — I had to manually invoke Peaches. This has been true for every sprint.

**Hypothesis:** The `onboard-existing-project` skill's "never overwrite" policy means the CLAUDE.md generated during the original onboard was later edited by Claude in-session across many sprints. Each edit accumulated project-specific references without synchronizing against the canonical skill names. Separately, the canonical skill was renamed from `start-sprint` to `open-sprint` at some point — the user-level install was never refreshed.

**Remediation:** (1) Install `open-sprint.md` to `~/.claude/skills/open-sprint.md`. (2) Update CLAUDE.md auto-trigger from `/sprint-open` to `/open-sprint`.

---

### Gap 2: `/track-status` never worked
**What:** CLAUDE.md auto-trigger references `/track-status`. The canonical skill is `report-track-status.md` → `/report-track-status`. The skill is not installed at all.

**Why it matters:** "Catch me up / what's the status" auto-triggers silently fail.

**Hypothesis:** Same as Gap 1 — CLAUDE.md was edited in-session and accumulated a shorthand name that never matched any real skill.

**Remediation:** (1) Install `report-track-status.md` to `~/.claude/skills/report-track-status.md`. (2) Update CLAUDE.md auto-trigger from `/track-status` to `/report-track-status`.

---

### Gap 3: `docs/context/product.md` absent
**What:** Canonical Peaches reads `docs/context/product.md` at init. The file doesn't exist. agent-kanban uses `north-star.md` as its product vision doc (not the canonical filename).

**Why it matters:** Peaches starts every session without the product context she's supposed to have. The "if it exists" guard prevents a hard failure but means product direction is absent from architectural decisions unless explicitly referenced.

**Hypothesis:** The file was never created during onboarding. `north-star.md` was authored manually as a project-specific artifact, without being mapped to the canonical `product.md` path.

**Remediation:** Either rename `north-star.md` → `product.md`, or create `product.md` that points/summarizes `north-star.md`. Update Peaches init to read `north-star.md` explicitly.

---

### Gap 4: `plan.md` context rot
**What:** `plan.md` is 2400+ lines containing every sprint's full objective, DoD, and all Handoff Bridges ever issued. project-tracker uses `t22-plan.md`, `t23-plan.md` (per-sprint files) and `handoff-t##.md` (per-track bridge files), keeping `plan.md` lean.

**Why it matters:** Peaches reads `plan.md` at init. Reading 2400 lines of archived sprint data on every session is expensive, slow, and increases the chance of the model attending to stale context. The "context rot" memory flag was tracking this.

**Hypothesis:** No one ever migrated to the per-sprint file pattern used by project-tracker. Bridges were appended in-place as the easiest path.

**Remediation:** Migrate to the project-tracker pattern: one `plan.md` with the current sprint objective only, archived sprints moved to `docs/context/archive/`. Bridges move to `handoff-s##-t##.md` files referenced from plan.md. This is a Sprint 15 candidate.

---

### Gap 5: AGENTIC.md §5 board task auth is wrong
**What:** §5 documents that machine tokens create tasks via `POST /api/boards/:id/tasks`. Both the endpoint and the auth are wrong (correct: `POST /api/tasks` with `board_id` body, requiring user/agent identity).

**Why it matters:** Every sprint's board task creation step has been broken by design — we've been trying to automate something that requires manual browser action.

**Hypothesis:** The protocol was written speculatively ("machines should be able to do this") and never tested against the live API before being committed to AGENTIC.md.

**Remediation:** Update AGENTIC.md §5 to reflect reality: board tasks require a user session or are created manually from the browser. Document the correct endpoint and auth requirement.

---

### Gap 6: `subagent_type` role fidelity (the real concern behind D1)
**What:** The team agents (peaches/skylar/bandit) ARE loadable via `subagent_type` — they appear in the FleetView roster and have produced correct output throughout this project. The "why don't they load" framing was imprecise.

**The real concern** (from memory `project_agent_os_role_drift`): agents load but drift from their defined roles over time. Peaches has written source code in past sessions (violating "zero-code"). Skylar has started work without a Bridge. Bandit has issued PASS without running the full verification chain.

**Root cause:** This is not a loading gap — it's a behavioral enforcement gap. The agent file content defines role constraints as *instructions*, but Claude Code does not structurally enforce them at the tool level (unlike Antigravity's agent manager which enforces architecturally). The "Tier 3 Tactical" header, the tool lists, and the mandate text are suggestions, not locks.

The stronger mitigation is hooks + settings (blocking certain tools outside of appropriate agents) rather than relying on instruction-following.

---

## 6. Gaps in the Agent OS Install Process

These are weaknesses in canonical Agent OS itself, not just in agent-kanban:

### 6a. `onboard-existing-project` never-overwrite policy creates permanent divergence
When `CLAUDE.md` already exists, the onboard skill won't overwrite it. But `CLAUDE.md` is the file that wires auto-triggers to skill names. If it pre-dates the canonical auto-trigger pattern (or if the canonical skill names change), the project's wiring silently goes stale. There is no mechanism to diff and re-sync.

**Impact on agent-kanban:** The `/sprint-open` and `/track-status` mismatches almost certainly originated here — the onboard ran, didn't overwrite CLAUDE.md, and the canonical auto-trigger names were never installed.

### 6b. No sync mechanism for user-level skills after initial install
When canonical renames a skill (`start-sprint` → `open-sprint`), existing installs are not notified. User-level `~/.claude/skills/start-sprint.md` remains as the old version, silently stale.

**Impact on agent-kanban:** `start-sprint.md` is installed but the current canonical name is `open-sprint.md`. Any project that references `/open-sprint` (which CLAUDE.md should reference per canonical) silently fails.

### 6c. The scaffold generates inconsistent model names
`install-agent-scaffold` SKILL.md specifies `model: claude-opus-4-7` for architect, but the canonical `claude/agents/architect.md` template uses `model: opus`. These will produce different behavior when Claude Code maps model names to actual models. This inconsistency makes it impossible to know which format is "correct" without testing.

### 6d. `product.md` is required but the install doesn't enforce it
The canonical Peaches init reads `product.md`. The `onboard-existing-project` skill notes it as a file to look for during discovery, but does not guarantee it's created if absent. Projects onboarded from a lean starting point may never get this file.

### 6e. No install verification checklist that's kept alive
`install-agent-scaffold` produces an `INSTALL_CHECKLIST.md` — but it's a one-shot artifact that gets deleted when setup completes. There's no durable "health check" that can be re-run later to detect drift between the install and the current state.

---

## 7. Recommended Remediation (Prioritized)

### Immediate (Sprint 15, low effort):

1. **Install `open-sprint.md`** to `~/.claude/skills/open-sprint.md` (copy from `~/Developer/agent-skills/claude/skills/open-sprint.md`)
2. **Install `report-track-status.md`** to `~/.claude/skills/report-track-status.md`
3. **Update CLAUDE.md** — change auto-trigger from `/sprint-open` → `/open-sprint` and `/track-status` → `/report-track-status`
4. **Create `docs/context/product.md`** — either copy/summarize from `north-star.md`, or symlink. Update Peaches init to read both.
5. **Fix AGENTIC.md §5** — correct the board task auth and endpoint documentation.

### Medium effort (Sprint 15):

6. **Migrate `plan.md` to per-sprint files** — adopt the project-tracker pattern. Archive S1–S14 to `docs/context/archive/`, create lean `plan.md` for S15 onwards.
7. **Normalize `bandit.md` model** — change `model: claude-sonnet-4-6` → `model: sonnet` to match canonical QA template.
8. **Install `minify-context.md`** for context compression capability.

### Agent OS upstream (for Tim to raise with the canonical repo):

9. **Canonical inconsistency: model name format** — architect/qa templates use short names but specialist templates and scaffold instructions use long names. Canonical should pick one.
10. **Add a `/refresh-agent-os` skill** — diffs current project's CLAUDE.md, agent files, and skills against the current canonical and surfaces stale items. Solves the never-overwrite silent drift problem.
11. **`onboard-existing-project` should produce `product.md`** if absent, not just check for it.

---

*Findings authored: 2026-05-23 by Claude (Orchestrator) via direct file inspection*  
*Files read: 6 agent files, 11 skill files, 5 settings files, 4 CLAUDE.md files, 4 AGENTIC.md files, 3 docs/context/ trees, README.md, GUIDE.md, install-agent-scaffold SKILL.md, onboard-existing-project SKILL.md*
