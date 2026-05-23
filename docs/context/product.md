# Product — Agent Kanban

> Canonical product summary for Peaches. Read at init alongside AGENTIC.md.
> For the full architectural target and data model, see `north-star.md`.

**Last updated:** 2026-05-23

---

## Vision

Agent Kanban is a kanban board that mirrors the Agent OS process: **Backlog → Plan → Sprint → Tracks → Done**. It works in tandem with Agent OS (auto-populated agent role-cards, planning kicked off from selected backlog items) and degrades cleanly when used standalone.

**Model-agnostic.** Not tied to any specific LLM. Claude and Gemini are the primary tested examples, but any tool that supports reading Markdown at session start, role-scoped agents, and structured handoff artifacts can drive it.

**Single-tenant, single-machine assumption.** One human operator drives role-played agents in their local AI coding session. Auth is user session + machine API key. Cryptographic agent identity is gated behind a feature flag for future revival.

---

## Primary User

A solo developer or small team using an AI coding assistant (Claude Code, Gemini, etc.) as their engineering team. The human acts as Conductor — approving, reviewing, and steering. Agents execute tracks and drive task lifecycle. The browser is the human's window into sprint progress.

---

## Core User Value

- **Structured sprint execution.** Backlog → sprint plan → tracks with clear ownership. Eliminates ad-hoc prompting; every piece of work has a track, a task, and an agent assignment.
- **Auditability.** Every task has logs, PR link, and a chat thread. The kanban board is the ground truth for what is in progress, blocked, or done.
- **Human in the loop without friction.** Humans review (accept or reject) but never drive task state transitions. Agents handle their own lifecycle via CLI/API. The browser shows what's happening without requiring the human to manage it.

---

## Core Loop

```
Backlog → Plan → Sprint → Tracks → Sprint Closed → Backlog
```

1. **Backlog** — User (or agent) adds ideas: title, description, priority.
2. **Plan** — User selects backlog items and triggers planning. The UI builds a structured prompt delivered to the active AI coding session. Peaches collaborates to produce the sprint plan.
3. **Sprint** — Sprint created with theme + tracks. Sprints have statuses: `planning → active → closed`.
4. **Tracks** — Each track maps 1:1 to a board task. Track number format: `S{sprint}-T{track}` (e.g. `S15-T1`). Tasks move through columns as agents work.
5. **Close** — All tracks done → sprint closes. Consumed backlog items marked done. Loop restarts.

---

## Key Constraints

- **UI is human-readable, not human-operable for task state.** No drag-and-drop, no status buttons, no claim/assign UI.
- **Only two human review actions:** reject (back to agent) and complete (accept).
- **Board = workspace unit.** Repositories are tenant-level. Tasks belong to boards and optionally link to a repo.
- **Machine tokens cannot create tasks.** Task creation requires a user browser session or an `agent:worker`/`agent:leader` JWT.
- **No server-side LLM calls.** The kanban server never calls a model directly.

---

## Tech Stack Summary

- React SPA + Hono API on Cloudflare Workers + D1
- Monorepo: pnpm workspaces
- Auth: Better Auth — user sessions, machine API keys, agent JWTs (crypto-gated)
- Real-time: SSE (TransformStream, 2s poll, 25s CF limit)
- CLI: `ak` — daemon, board/task/repo CRUD, sprint management

---

## Current Sprint Context

See `docs/context/plan.md` for the active sprint objective and `docs/context/tracks.md` for track status. See `north-star.md` for the full architectural target (sprints, backlog, agent-definitions data model, UI roadmap).
