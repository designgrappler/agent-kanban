# Agent Kanban — North Star

> The architectural target the system is migrating toward. This is a living document; revise as decisions evolve. Sprint plans should reference this file.

**Authored:** 2026-05-21
**Status:** Approved direction. Migration sequenced across Sprints 8–13.

---

## Vision

Agent Kanban is a kanban app that mirrors the Agent OS process: **Backlog → Plan → Sprint → Tracks → Done**. It works in tandem with Agent OS (auto-populated agent role-cards, planning kicked off from selected backlog items) and degrades cleanly when used standalone.

**Model-agnostic.** Like Agent OS, the system is not tied to any specific LLM. Claude and Gemini are the primary tested examples (matching Agent OS's "split model" and "single model" patterns), but any tool that supports reading Markdown at session start, role-scoped agents, and structured handoff artifacts can drive it.

**Single-tenant, single-machine assumption.** The original architecture envisioned multiple autonomous agents on different machines authenticating via cryptographic identity (a "dark factory" model). The new model assumes one human operator driving role-played agents in their local AI coding session. Auth simplifies to user session + machine API key. Cryptographic agent identity is gated behind a feature flag for future revival of the distributed model.

---

## Core Loop

```
Backlog → Plan → Sprint → Tracks → Sprint Closed → Backlog
```

1. **Backlog** — User (or agent) adds unfleshed ideas as backlog items: title, description, priority. Lives in a new **Backlog** tab in the global header.
2. **Plan** — User multi-selects backlog items and clicks **Create plan**. The UI builds a structured prompt and delivers it to the user's active AI coding session (Claude Code, Gemini, or any tool the user is driving). Architect (Peaches) reads the prompt and collaborates with the user to produce a sprint plan.
3. **Sprint** — Once the plan is agreed, a sprint is created: theme + tracks. Sprints are first-class entities with statuses `planning → active → closed`.
4. **Tracks** — Each track has a number (T-N), title, description, assigned agent (a role-card), plus existing fields (PR link, plan link, dependencies, DoD checklist). Tracks move through columns as work progresses.
5. **Close** — When all tracks are done and merged, the sprint closes. Backlog items consumed by the sprint are marked done. Loop restarts.

---

## Data Model

### New tables

**`sprints`**
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | |
| `board_id` | TEXT FK | board_id → boards.id |
| `number` | INTEGER | sprint sequence number per board (e.g. 8). Used in track display as `S8-T1`. Unique per board |
| `theme` | TEXT | sprint goal |
| `status` | TEXT | `planning` \| `active` \| `closed` |
| `opened_at` | TEXT | |
| `closed_at` | TEXT NULL | |
| `created_by` | TEXT | actor id |

**`backlog_items`**
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | |
| `board_id` | TEXT FK | |
| `title` | TEXT | |
| `description` | TEXT | |
| `priority` | TEXT | `P0` \| `P1` \| `P2` \| `P3` |
| `status` | TEXT | `idea` \| `in_planning` \| `consumed` \| `dropped` |
| `created_at` | TEXT | |
| `created_by` | TEXT | actor id |
| `consumed_by_sprint_id` | TEXT NULL FK | when status = consumed |

**`agent_definitions`**
| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PK | |
| `owner_id` | TEXT | tenant scope |
| `name` | TEXT | from .md frontmatter |
| `description` | TEXT | from .md frontmatter |
| `model` | TEXT NULL | from .md frontmatter (optional) |
| `file_path` | TEXT | relative to repo root, e.g. `.claude/agents/peaches.md` |
| `last_synced_at` | TEXT | |

### Schema changes to existing tables

**`tasks`** gains:
- `sprint_id` (TEXT NULL FK → sprints.id) — null = legacy / unsorted
- `track_number` (INTEGER NULL) — per-sprint track counter (1, 2, 3 …). Combined with `sprints.number` for display: `S{sprint.number}-T{track_number}` (e.g. `S8-T1`). Unique within a sprint.
- `assigned_agent_definition_id` (TEXT NULL FK → agent_definitions.id) — soft assignment, replaces today's hard-typed agent FK

**`boards`**: no schema change, but `theme` column moves conceptually to sprints (board.theme retained for backward-compat / standalone mode).

### Deprecations (gated behind feature flag, not deleted)

- Ed25519 agent registration (`POST /api/agents` with public_key)
- Agent JWT verification middleware (`@better-auth/agent-auth`)
- `agents.public_key`, `agents.fingerprint` columns

These remain in code behind `ENABLE_AGENT_CRYPTO_AUTH=false` (default off) so the dark-factory concept can be revived without resurrection work.

---

## UI Changes

### Global header

| Tab | Status | Source |
|---|---|---|
| Boards | existing | unchanged |
| Backlog | **new** | `backlog_items` table, scoped to current board |
| Agents | **repurposed** | `agent_definitions` table (was: cryptographic agent registry) |
| Settings | existing | gains user-level Machines + Labels |

### Board view

- Sprint header banner: theme + status + Close Sprint button (visible when status = active and all tracks done)
- Column rename: **TODO** → **TRACKS**
- Demo board removed (screenshots taken later for README)

### Settings reorganization

- **Move to user/owner-level settings:**
  - Add Machine
  - Labels (today board-scoped; become global)
- **Stays board-level:**
  - Sharing / visibility
  - Theme (legacy; sprints take over once migrated)
  - Danger zone (delete board)

### Agents tab

Each role-card shows:
- Name
- Description
- Model (if set)
- Link to the source `.md` file
- Last synced timestamp

Empty state when `.claude/agents/` doesn't exist (standalone mode).

### Backlog tab

Cards in a kanban-style list (priority-grouped or flat sortable).
- Multi-select via checkboxes
- **Create plan** button at top: builds prompt, delivers via clipboard or `.claude/sprint-prompt.md`
- Card fields: title, description, priority, status badge

---

## CLI Changes

### New commands

- `ak agent sync` — parse `.claude/agents/*.md` frontmatter, push to `/api/agent-definitions`. Run on planning kickoff (Tim's preference) and on demand.
- `ak sprint open <theme>` — create a new sprint
- `ak sprint close <id>` — close current sprint
- `ak backlog add <title>` — optional CLI-side input

### Unchanged

- `ak start` — daemon poll loop
- `ak get/create board` — board CRUD

---

## Planning Trigger Flow

1. User multi-selects backlog items in Backlog tab → clicks **Create plan**
2. UI marks selected items `status=in_planning`
3. UI builds prompt:
   ```
   Plan a sprint covering these backlog items:

   [item 1 title]
   [item 1 description]

   [item 2 title]
   ...

   Use the Architect skill (Peaches). Confirm sprint theme with the user before producing the plan.
   ```
4. UI delivers via user-chosen method (settings):
   - **Clipboard** (default): copy prompt; user pastes into their active AI coding session
   - **File**: write to `.claude/sprint-prompt.md` (or `.gemini/`, etc., matching the active tool); user opens it in their session
5. Peaches executes (read backlog → propose theme + tracks → user agrees)
6. Peaches creates the sprint via `ak sprint open` and tracks via existing task API
7. Backlog items get `consumed_by_sprint_id` set; status → `consumed`

Out of scope: server-side LLM integration. The kanban server never calls a model directly.

---

## Standalone Mode (no Agent OS)

Functions that work without `.claude/agents/`:
- Boards, sprints, tracks, backlog, settings
- "Create plan" delivery (clipboard only; file write requires `.claude/` to exist)

Functions that degrade:
- Agents tab is empty / hidden
- Track assignment is a free-text label rather than an agent FK
- Sprint planning happens manually (user types the plan)

---

## Migration Strategy

Existing tasks from Sprints 4–7 are pre-sprint-entity. On migration:
- Backfill: create a synthetic `Sprint 7 (archived)` row matching `tracks.md`; assign T18–T24 tasks to it
- Earlier sprints (4–6) remain documentation-only in `tracks.md` archive (no data migration; not worth the effort)
- New tasks created post-migration must have `sprint_id`

---

## Resolved Decisions

| # | Decision | Outcome |
|---|---|---|
| D1 | Backlog priority scale | `P0` / `P1` / `P2` / `P3` |
| D2 | Track number scheme | `S#-T#` combo. `sprints.number` is global per board; `tasks.track_number` resets each sprint. Display format `S8-T1`, `S8-T2`, `S9-T1`, … Chosen for archival/tracking clarity |
| D3 | Sprint statuses | `planning → active → closed`. No `draft` state |
| D4 | Crypto deprecation | Feature flag `ENABLE_AGENT_CRYPTO_AUTH=false` (default off). Code retained for future revival |
| D5 | Backlog tab scope | Per-board (board = project) |
