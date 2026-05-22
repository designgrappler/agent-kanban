# Team Agents — Design Spec (S11-T5)

**Status:** Settled — open questions resolved 2026-05-22
**Author:** Peaches
**Date:** 2026-05-21 (draft); 2026-05-22 (decisions folded in)
**Related memory:** [agent-os-role-drift-investigation], [feedback-always-plan-first]
**Scope:** Design only. No code, no migrations, no CLI changes. Implementation is a separate sprint.

---

## 1. Problem statement

On 2026-05-21, mid-S9-T3, the main agent on this fork drifted out of its Conductor role and began executing infrastructure work directly (editing `biome.json`, copying it into a worktree, running `pnpm check`) without routing through Peaches → Skylar → Bandit. The text-only "No execution without a Handoff Bridge" rule failed because role separation lives only in `.claude/agents/*.md` Markdown files loaded as Claude Code subagents — and on this fork those files don't even reliably register with Claude Code's `subagent_type` system (only the playwright agents do). Other Agent OS projects don't see this drift because their team is registered as **kanban agents** (`POST /api/agents`, Ed25519 keys, daemon-spawned processes with their own JWTs and tool allowlists); the daemon enforces role separation as a hard process boundary. Tim has explicitly chosen not to model Peaches/Skylar/Bandit as cryptographic agents — they shouldn't claim tasks via the daemon, shouldn't have their own keypairs, and shouldn't appear in handoff/`assigned_to` fields next to real worker agents. Instead, the team should appear in the kanban Agents UI as **non-cryptographic, in-board team members**: visible, addressable, configurable, but without the crypto identity layer or daemon lifecycle. The design problem is: where does that entity live in the data model, how does it surface in the UI, and how does authn/authz work for it?

---

## 2. Data model

### Options

**Option A — `kind` discriminator on existing `agents` table.** Add `kind = 'team'` to the existing `worker | leader` enum (or a parallel `class` column: `'crypto' | 'team'`). Make `public_key`, `private_key`, `fingerprint`, `runtime`, `gpg_subkey_id` nullable for team rows. Reuse `agentRepo.ts`, `AgentsPage.tsx`, `useAgents`, all session/usage queries.

- **Pros:** maximum reuse — name/username/role/bio/soul/skills/handoff_to/builtin/version snapshots are all the same fields; the AgentsPage grid, `AgentCard`, `AgentDetailPage`, `useAgents` hook, and `agentRepo.listAgents` already work; `handoff_to` already lets workers hand off to `team` rows by username with no schema change; the existing snapshot/version system (`0019_agent_versions.sql`) carries over for team-member edits.
- **Cons:** the `agents` table grows nullable columns that previously had `NOT NULL` semantics in code (`public_key`, `private_key`, `fingerprint`, `runtime`); every query that reads agents must learn about `kind = 'team'` to avoid trying to compute `runtime_available`, `agent_sessions` aggregations, `task_actions` for `actor_id`, or fingerprint identicons against a NULL public key; subtle bugs from "I forgot team members exist" are likely; the `auth.ts` `IdentityType` model (`agent:worker | agent:leader`) is already discriminating on `kind`, so a third value muddies that.

**Option B — separate `team_members` table.** Sibling to `agents`/`subagents`/`machines`. Owns its own columns (`id`, `owner_id`, `name`, `username`, `bio`, `soul`, `role`, `skills`, `handoff_to`, `builtin`, `version`, `created_at`, `updated_at`) and **no** crypto/runtime columns by construction.

- **Pros:** no nullable-column ambiguity; existing `agents` queries are untouched; the type system in `packages/shared/src/types.ts` cleanly separates `Agent` (has crypto identity) from `TeamMember` (doesn't); future divergence (presence model, conversation participation, etc.) can land on `team_members` without touching the workhorse `agents` table; mirrors the `subagents` precedent (separate non-crypto entity table created in `0021_subagents.sql`).
- **Cons:** AgentsPage UI needs a merge step to render both; `handoff_to` resolution (currently a list of agent usernames) needs a namespace strategy or unified username uniqueness; `useAgents` becomes `useAgents() + useTeamMembers()` with merging at the call site; some duplication of CRUD endpoints and snapshot logic.

**Option C — extend `subagents` table.** The `subagents` table already exists (0021), already has no crypto columns, and already covers `name/username/bio/soul/role/skills/models`.

- **Pros:** no schema change at all; UI tab already exists.
- **Cons:** `subagents` semantically means "tool/skill that another agent invokes" — they're not lifecycle participants, they don't have handoff edges, they don't appear as actors in the board, and Claude Code subagents are the natural mapping. Conflating Peaches/Skylar/Bandit (peer team members in the same hierarchy as worker agents) with subagents (invoked tools) is wrong. Reject.

### Recommendation: **Option B — separate `team_members` table**

The deciding factor is the `agents` table's existing `NOT NULL` shape. The crypto-agent code paths assume `public_key`, `private_key`, `fingerprint`, `runtime` are always present; the AgentsPage `AgentCard` builds an `AgentIdenticon` from `public_key` and renders fingerprint chips; `agentRepo.listAgents` does subqueries against `agent_sessions` and `task_actions` keyed by agent ID. Punching holes in those invariants (Option A) creates a long tail of "did you remember to handle the team-member case?" bugs. Option B preserves the "an agent always has crypto" invariant — the existing data model stays clean — and mirrors the existing pattern of using sibling tables (`subagents`, `machines`) for entities that don't fit the crypto-agent shape.

### Illustrative schema (NOT a migration)

```sql
-- Illustrative only. Real migration would be assigned a number and reviewed in the implementation sprint.
CREATE TABLE team_members (
  id           TEXT PRIMARY KEY,
  owner_id     TEXT NOT NULL,
  name         TEXT NOT NULL,
  username     TEXT NOT NULL,
  display_name TEXT,                        -- parsed from .md front-matter `name:` (human-readable label)
  description  TEXT,                        -- parsed from .md front-matter `description:` (one-liner)
  bio          TEXT,
  soul         TEXT,                        -- parsed from .md body (the prompt body / role essence)
  role         TEXT,                        -- 'architect' | 'specialist' | 'reviewer' | free-form
  handoff_to   TEXT,                        -- JSON array of usernames (team_member or agent)
  skills       TEXT,                        -- JSON array of skill names (parsed where present)
  capabilities TEXT,                        -- JSON array of capability tags from .md (e.g. allowed tools)
  md_path      TEXT,                        -- relative path to .claude/agents/<role>.md, e.g. ".claude/agents/peaches.md"
  builtin      INTEGER NOT NULL DEFAULT 0,
  version      TEXT NOT NULL DEFAULT 'latest',
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_team_members_owner ON team_members(owner_id);
CREATE UNIQUE INDEX idx_team_members_owner_username_version ON team_members(owner_id, username, version);
```

At seed time, `seedBuiltinTeamMembers(db, ownerId)` reads each `.claude/agents/{role}.md` file and parses it into typed columns rather than storing the raw markdown. The mapping:

- Front-matter `name:` → `display_name`
- Front-matter `description:` → `description`
- Front-matter `tools:` (and any `capabilities:` list) → `capabilities` (JSON array)
- Markdown body → `soul`
- Relative path of the source file → `md_path` (so the UI can offer a convenience "open file on disk" link without ever storing the markdown blob in the DB)

Mirroring the `agents` table's typed-column style is deliberate: query consumers can read structured fields directly, no unstructured blob is shipped through the API, and the on-disk `.md` file remains the single source of truth for the prompt body.

### Owner-scoping

`owner_id` matches the multi-tenant primitive used by `agents`, `boards`, `repositories`, `machines`. A team member belongs to an owner (user or org). `seedBuiltinTeamMembers(db, ownerId)` mirrors `seedBuiltinAgents` and is invoked at the same point in the new-owner flow. Because team members are owner-scoped (not board-scoped), one Peaches per workspace serves all of that owner's boards — matching how Peaches actually behaves in this Agent OS install.

### Username collisions across `agents` and `team_members`

Risk: a team member named `peaches` and a worker agent named `peaches` produce ambiguous `handoff_to`. **Resolution: usernames are globally unique within `(owner_id, username)` across BOTH `agents` and `team_members`.** No prefix namespace (`team:` / `agent:`) is used — `handoff_to` references resolve by username alone.

SQLite cannot express a cross-table `UNIQUE` constraint declaratively, so the constraint is enforced at the application layer in the repo functions that create or rename rows in either table:

- `agentRepo.createAgent` and any rename path check for an existing row in `team_members` with the same `(owner_id, username)`.
- `teamMemberRepo.createTeamMember` (new) and rename path check for an existing row in `agents` with the same `(owner_id, username)`.
- A collision returns a `409 Conflict` with the centralized error envelope.

Each table also keeps its own `UNIQUE` index on `(owner_id, username, version)` (see schema above) to catch intra-table duplicates at the DB layer. The cross-table check is application-level by necessity, not preference; it should live in the repo layer (no raw SQL in route handlers, per existing convention).

---

## 3. UI surface

### Single Agents tab, grouped — not a separate "Team" tab

The current `AgentsPage` already uses `Tabs` with `Agents` and `Sub-agents`. Adding a third top-level `Team` tab fragments the mental model: the user opens Agents to see "everyone working on this," and team members are part of "everyone." Better to keep one **Agents** tab and group within it:

```
┌─ Tabs: [Agents] [Sub-agents] ────────────────────────┐
│                                                       │
│  Section: Team (3)        ← team_members rows         │
│  ┌─────────┬─────────┬─────────┐                      │
│  │ Peaches │ Skylar  │ Bandit  │  ← TeamCard          │
│  └─────────┴─────────┴─────────┘                      │
│                                                       │
│  Section: Workers (N)      ← agents.kind = 'worker'   │
│  ┌─────────┬─────────┬─────────┐                      │
│  │ AgentA  │ AgentB  │ AgentC  │  ← AgentCard         │
│  └─────────┴─────────┴─────────┘                      │
│                                                       │
│  Section: Leaders (M)      ← agents.kind = 'leader'   │
│  ...                                                  │
└───────────────────────────────────────────────────────┘
```

Rendered as collapsible `<section>` blocks, each with a header `{Team|Workers|Leaders} <count>`. Existing `AgentCard` is unchanged. New `TeamCard` is a sibling component.

### Visual treatment for `TeamCard` (vs `AgentCard`)

The crypto identity is what makes `AgentCard` look like `AgentCard`: the `AgentIdenticon` (60px shape derived from the public key), the colored top stripe (`agentColor(public_key)`), and the fingerprint chip (`agentFingerprint(fingerprint)`). A team member has none of those, so the card needs a different visual language:

| Element | `AgentCard` (crypto) | `TeamCard` (team) |
|---|---|---|
| Top stripe | 3px, color from public key | 3px, dashed/striped or muted accent (`bg-accent/30`) — signals "no key" |
| Avatar | `AgentIdenticon` from public key | Initials in a rounded square, on `bg-surface-primary`; **role-glyph** badge in corner (compass for Architect, wrench for Specialist, shield for Reviewer) |
| Status dot | online/offline (from `agent_sessions`) | none — team members render without a status indicator (presence is not modeled in Phase 1) |
| Fingerprint chip | shown | replaced with `team` pill in `border-accent/40` |
| Runtime/model chip | shown | hidden (no runtime) |
| Footer stats | `active / queued / tokens / cost` | `handoff_to: [a, b]` and attribution count |
| Builtin badge | shown if `builtin = 1` | shown |

Crucially: **never call `AgentIdenticon publicKey={null}`** — fall back to a different component (`TeamAvatar`) so a missing key never produces a default-seeded identicon (which would look like a real crypto identity). The card should also drop the `boxShadow` glow, since glow is reserved for online crypto agents with active sessions.

Detail pages use a **routing split**: `/agents/:id` for cryptographic agents, `/team/:username` for team members. Each page renders only the affordances that apply to its kind — the agents page shows sessions, tokens, GPG key, and mailbox; the team page shows handoff edges, attribution count, and a convenience "open `.md` source" link via `md_path`. The route shape encodes the entity type so neither page has to branch on `kind` internally.

The `/team/:username` page is backed by `GET /api/team-members/:username`, which is owner-scoped (resolved via the standard auth middleware), returns 404 for an unknown username in the caller's owner scope, and mirrors the response shape of `GET /api/agents/:id` minus the crypto-only fields. The list endpoint `GET /api/team-members` powers the AgentsPage Team section.

---

## 4. Auth model

### Options

**(a) Inherit from user.** A team member is a "role costume" worn by a real `user` row. Creating a team member binds it to a user; actions taken "as Peaches" are still authenticated by that user's session.

**(b) First-class entity, no auth credential.** Team members exist in the DB but cannot themselves authenticate. Every action attributed to a team member is performed by a `user` (or `agent:leader`) on the team member's behalf, and `actor_user_id` + `attributed_team_member_id` are recorded together.

**(c) Flag on `user`.** Some users have a `team_role` column. Doesn't generalize: Tim is a single user wearing all team roles; this would require multiple users per human.

### Recommendation: **(b) First-class entity, no auth credential**

Rationale:

- Team members are a **labeling and routing layer over user actions**, not principals. They never call APIs themselves; they have no daemon, no JWT, no API key. The action is always performed by Tim (the user behind a Better Auth session) — the team member is metadata on that action.
- (a) sounds elegant but creates a confusing 1:N user-to-team-member relationship and forces a "switch to Peaches" mode in the UI that no one needs in a one-human Agent OS install.
- (c) requires inventing a multi-user fiction for a single user.

Concretely:

- **Who can create team members:** the `user` identity that owns the workspace (`owner_id`). Same surface as `POST /api/agents` for builtins (`auth.ts` route rule scoped to `user`).
- **Who can set `attributed_team_member_id`:** **only two principals**: the `user` (Better Auth session) and the **orchestrator** — the primary AI session in a kanban context that talks directly to the user. Cryptographic worker agents (and any other `agent:*` identity) **cannot** attribute. This is deliberate: it preserves the role-drift fix by making "speaking as Peaches" a conscious act of the human or the orchestrator session, not something a worker agent's log writer can spoof.
- **Cannot be impersonated by a daemon or worker agent.** A worker agent's `task_actions` row will always carry its own `actor_id` and a NULL `attributed_team_member_id`. There is no API path by which a worker agent's request can populate the column.
- **No `IdentityType` extension.** Auth keeps `user | machine | agent:worker | agent:leader`. There is no `team` identity type because team members never authenticate.

### Action attribution

A new nullable column on `task_actions`, `messages`, and `tasks`:

```sql
ALTER TABLE task_actions ADD COLUMN attributed_team_member_id TEXT REFERENCES team_members(id) ON DELETE SET NULL;
ALTER TABLE messages     ADD COLUMN attributed_team_member_id TEXT REFERENCES team_members(id) ON DELETE SET NULL;
ALTER TABLE tasks        ADD COLUMN attributed_team_member_id TEXT REFERENCES team_members(id) ON DELETE SET NULL;
```

`tasks.attributed_team_member_id` captures the role under which a task was filed (e.g., a planning task created "as Peaches"). `task_actions` carries it for individual lifecycle events; `messages` carries it for chat. Per-table placement (rather than a single side table) keeps the attribution visible in every query that already reads these tables.

The board UI can then render "Tim (as Peaches)" on log entries, task headers, and message threads, making role separation **visible** even though it's not enforced cryptographically.

---

## 5. Lifecycle

### Crypto agents (today)

`idle → working → idle → offline` (stale timeout via `taskStale.ts`, write-on-read). `working` is implied by an active row in `agent_sessions`. `offline` is "no active session and last heartbeat older than 2h."

### Team members — no lifecycle

Team members are **persistent labels**, not session participants. They don't claim tasks, don't spawn processes, don't have heartbeats, and — by Phase 1 design — don't have presence either. There is no state machine; a team member exists from the moment it is seeded and remains visible until deleted. The only mutable surface is its metadata (name, bio, soul, handoff_to, etc.) via the existing snapshot/version pattern.

This is a deliberate scope choice for Phase 1: borrowing crypto-agent presence (`available`/`busy`/`away`, last-seen timestamps, auto-away) would invent a state model that has no enforcement layer behind it. If a real use case for presence emerges later (e.g., "Peaches is mid-plan, hold messages"), it can be added without churning the Phase 1 schema.

### Surfaces

- **AgentsPage** Team section: card with no status indicator. Footer shows `handoff_to` edges and an attribution count derived from `task_actions.attributed_team_member_id`.
- **Task detail / message thread:** "as Peaches" badge appears next to the user's name; clicking it opens the team member's detail page (`/team/:username`).
- **Handoff Bridge rendering** (separate sprint, but worth noting): when a Bridge text mentions `Peaches` as the planning role, the kanban can lift the team member from `team_members` and show their identicon-substitute in a Bridge widget.

### Explicitly NOT modeled

- **No "online" state.** Team members don't authenticate, so liveness has no meaning. Presence (any status dot at all) is out of Phase 1 — see §7.
- **No active-task counts.** Tasks aren't claimed by team members. A team member's stats are: **handoff edges, attribution count.**

---

## 6. Migration path

### Today

```
.claude/agents/peaches.md   ← Markdown subagent file (broken loading)
.claude/agents/skylar.md
.claude/agents/bandit.md
.claude/agents/playwright-test-{generator,healer,planner}.md
```

Claude Code's `subagent_type` system reads this directory at session start. Per the role-drift memory, only the playwright agents register as subagent_types on this fork; Peaches/Skylar/Bandit silently fail to load and the main agent ends up speaking for them.

### Target

```
team_members table: peaches, skylar, bandit (builtin = 1, owner_id = Tim)
.claude/agents/peaches.md  ← STAYS as the source of truth for the prompt body (soul)
                           and serves as Claude Code's subagent_type loader
```

### Sync model — keep .md, parse into typed columns

Keep the `.md` files. They serve two consumers:

1. **Claude Code session at the terminal** (this session, where the conversation is happening). Claude Code's subagent loader is the only mechanism that can spawn a Peaches subagent inline. We can't move that to the DB — Claude Code doesn't read D1.
2. **The kanban product itself.** Renders Peaches as a team member on the Agents page, attributes actions, exposes the source `.md` for editing.

A small sync mechanism resolves both:

- At seed time, the seeder reads each `.claude/agents/{role}.md` file, parses front-matter (`name`, `description`, `tools`) and the body (the soul), and writes the result into the typed columns described in §2 (`display_name`, `description`, `capabilities`, `soul`). The relative path is stored in `md_path` so the team detail page can offer an "open file on disk" link — no markdown blob is persisted in the DB.
- A CLI command (`ak team sync`, future sprint, NOT this design) re-runs the same parse against the same `.md` files and upserts. Idempotent. Snapshots on change via the existing `version` mechanism copied from `agentRepo`.
- AGENTIC.md / CLAUDE.md keep listing `Peaches`/`Skylar`/`Bandit` and pointing at `.claude/agents/<role>.md` as the authoritative prompt; the kanban entry is a **visibility and attribution** layer over that.

### Cutover

- **Phase 1 (this implementation sprint, future):** Add `team_members` table, ship a `BUILTIN_TEAM_MEMBERS` constant in `packages/shared/src/templates.ts` enumerating the three roles (`peaches`, `skylar`, `bandit`). `seedBuiltinTeamMembers(db, ownerId)` reads each `.claude/agents/{role}.md`, parses front-matter and body into the typed columns, sets `md_path`, and inserts. Render in AgentsPage. The parse step is part of Phase 1 — there is no "raw blob then parse later" intermediate.
- **Phase 2:** Add `ak team sync` to re-ingest `.md` changes into the DB on demand. Run when a team member's `.md` is edited on disk.
- **Phase 3 (optional, far future):** Editing a team member in the kanban writes back to the `.md` file via the CLI or a worker tool. Probably never needed; manual edit of `.md` + `ak team sync` is enough.

### Coexistence with the broken Claude Code subagent loader

This is **out of scope** for this design (see Non-goals §7). The kanban team-member entity does NOT fix the loader. If Claude Code can't spawn Peaches as a subagent_type, the main agent still has to wear the costume. What this design **does** fix is the **visibility** of role drift: when Tim looks at the Agents tab, he sees the team there, and when he looks at task action logs, he sees `Tim (as Peaches)` versus `Tim (no team attribution)` — making drift detectable post-hoc even when it can't be prevented in-session.

---

## 7. Non-goals

- **Cryptographic identity for team members.** No Ed25519 keypair, no JWT, no API key, no GPG subkey, no fingerprint, no identicon-from-pubkey. Explicitly chosen by Tim.
- **Daemon process spawn for team members.** The CLI daemon (`ak start`, `processManager.ts`) is not modified. Team members are not claimed, not assigned, not executed as processes.
- **Presence (status dot, busy/away indicators) for team members.** NOT in Phase 1. No `presence` column, no `last_seen_at`, no auto-away. May be revisited if a real use case emerges; until then, team members render without any liveness indicator.
- **Raw markdown blob storage on `team_members`.** NOT in Phase 1. The originally proposed `source_md TEXT` column is dropped; Phase 1 parses metadata into typed columns and stores only the relative path (`md_path`).
- **Replacing the existing crypto agents.** The `agents` table, `agent_sessions`, GPG signing, daemon claim flow, three-identity auth (`user | machine | agent`) all remain. The two models coexist; team members are additive.
- **Implementation.** This document is design only. CREATE TABLE / ALTER TABLE statements above are illustrative; no migration is to be filed under this ticket.
- **Solving the Claude Code subagent loader gap.** The fact that Peaches/Skylar/Bandit don't register as `subagent_type` on this fork is a **separate ticket**. Reference: role-drift memory. The team-member kanban entity does not require the loader to work, and does not fix it. Tracked as a follow-up sprint candidate.
- **Conversation history / chat threads with team members.** Out of scope. Existing `messages` table can carry `attributed_team_member_id`; richer chat-with-Peaches UX is a future sprint.
- **Bridge templating / enforcement.** The "No execution without a Handoff Bridge" rule is still text-only. Making Bridges first-class artifacts in the kanban is a separate design.

---

## 8. Decisions log

The eight design questions originally raised against this draft were resolved by Tim on 2026-05-22. Recorded here for traceability:

1. **Username uniqueness:** GLOBAL within `(owner_id, username)` across `agents` and `team_members`. No prefix namespace. Enforced application-side in the repo layer (SQLite cannot express cross-table UNIQUE).
2. **Worker-agent attribution:** NOT ALLOWED. Only `user` (Better Auth session) and the orchestrator (the primary AI session that talks to the user) may set `attributed_team_member_id`. Cryptographic worker agents cannot — preserves the role-drift fix.
3. **Builtin team-member set:** SHIP THREE — `peaches` (architect), `skylar` (specialist), `bandit` (reviewer). Mirrors `.claude/agents/*.md`; shipping all three (vs. collapsing to one orchestrator) is what makes role-isolation visible in the UI.
4. **Scope:** PER-OWNER. `owner_id` column on `team_members`, no `board_id`. One Peaches per workspace serving all boards.
5. **Presence:** DROPPED from Phase 1 entirely. No `presence` column, no `last_seen_at`, no status dot. May be revisited later.
6. **Detail-page routes:** SPLIT. `/agents/:id` for cryptographic agents; `/team/:username` for team members. Each page renders only the affordances that apply to its kind.
7. **`source_md` column:** REPLACED. No raw-markdown blob. Instead: typed metadata columns (`display_name`, `description`, `capabilities`, `soul`) parsed at seed time from `.claude/agents/{role}.md`, plus an `md_path` column for the convenience "open file" link.
8. **Action attribution placement:** `attributed_team_member_id` lives on `task_actions`, `messages`, AND `tasks`. Per-table, nullable, FK to `team_members.id`.

---

## References

- `apps/web/migrations/0001_initial.sql` — original `agents` table
- `apps/web/migrations/0013_agent_identity.sql` — username + GPG subkey
- `apps/web/migrations/0019_agent_versions.sql` — snapshot versioning pattern
- `apps/web/migrations/0021_subagents.sql` — non-crypto sibling-table precedent
- `apps/web/server/agentRepo.ts` — listAgents query shape (subqueries against `agent_sessions`, `task_actions`)
- `apps/web/server/auth.ts` — `IdentityType` union and route rules
- `apps/web/src/routes/AgentsPage.tsx` — current Agents tab layout, `AgentCard`
- `apps/web/src/components/AgentIdenticon.tsx` — public-key-derived avatar
- `packages/shared/src/templates.ts` — `BUILTIN_TEMPLATES` for builtin seeding
- `.claude/agents/peaches.md`, `skylar.md`, `bandit.md` — current role .md files
- Memory: `project_agent_os_role_drift.md` — root-cause for this work
- Memory: `feedback_always_plan_first.md` — process rule this design supports
