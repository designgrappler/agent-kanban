# AGENTIC DNA — agent-kanban (Local Companion Service)

This document contains the foundational constraints, identities, and protocols for the local agent-kanban fork. It is the root "Source of Truth" (Static DNA) and must be ingested by all agents before any actions are taken.

---

## 1. DNA Taxonomy

- **Static DNA:** Foundational tech, team roles, and protocol constraints (this file).
- **Dynamic DNA:** High-churn task state, roadmap, and requirements (`docs/context/` plan, tracks).

---

## 2. Tech Stack (Static DNA)

### Package Manager
- **pnpm** (v10.33.0 lockfile baseline)

### Application Stack
- **Frontend:** React + Vite + Tailwind + shadcn/ui (`apps/web/src/`)
- **Backend:** Hono API on Cloudflare Workers (`apps/web/server/`, `apps/web/worker/`)
- **Database:** Cloudflare D1 (SQLite) — local emulation via Wrangler
- **CLI:** TypeScript package at `packages/cli/`
- **Shared types:** `packages/shared/` (must be built before web)

### Commands
- **Dev server:** `pnpm dev` (Vite + Wrangler together)
- **Build:** `pnpm build` (builds shared then web)
- **Shared-only build:** `pnpm --filter @agent-kanban/shared build`
- **DB migrate (local):** `pnpm --filter @agent-kanban/web db:migrate`
- **Tests:** `npx vitest run`

### Local emulation
- Wrangler `wrangler dev` — local D1 at `.wrangler/state/v3/d1/`
- Env vars for local dev: `.dev.vars` (gitignored — never commit)

---

## 3. Team Architecture

### Org Chart
- **Tim (Owner):** Vision & Approval.
- **Peaches (Lead Architect):** Context Owner. Zero-code. Plans, Red Flag Analysis, Handoff Bridges.
- **Skylar (Specialist):** Executes tracks. This sprint: agent-kanban code + Agent OS config layer.
- **Bandit (QA):** Zero-write quality gate. Blocks bad merges.

### Execution Chain
```
Tim → Peaches (plan + Bridge) → Skylar (execute) → Bandit (gate)
```

### Specialist Scope (this repo)

| Scenario | Specialist |
|---|---|
| Agent OS config (CLAUDE.md, AGENTIC.md, .claude/) | skylar |
| Sprint 4 code work (cloud stripping, OAuth, smoke test) | skylar |
| Planning, context docs | peaches |
| QA review | bandit |

---

## 4. Branch Protocol

Each Track gets a feature branch:

```bash
git checkout -b track/N-short-description
```

- Branch naming: `track/N-short-description`
- No parallel worktrees needed — T1→T4 are sequenced.
- Never work directly on `main` for active tracks.
- Branches are merged after Bandit issues APPROVED verdict.

---

## 5. Conductor Protocols

### Stability Rules
- **Circuit Breaker:** 3 consecutive failures with the **same root cause** = STOP & escalate to Tim. Different error types reset the counter.
- **Git Hygiene:** No commits unless directed by Tim. Use `git add` for staging only.

### Handoff Logic
All work requires a Handoff Bridge from Peaches before execution begins.

---

## 6. Commit Convention

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(board): add column filtering
fix(api): correct task claim race condition
chore(deps): upgrade dependencies
refactor(auth): extract token validation helper
```

**Types:** `feat` · `fix` · `chore` · `refactor` · `docs` · `style` · `perf` · `test`

---

## 7. Definition of Done (DoD)

A track is **Done** only when ALL of the following are true:

- [ ] `pnpm build` exits with zero errors
- [ ] All changes are within the declared track scope (no scope drift)
- [ ] No `console.log`, `debugger`, or hardcoded secrets in the diff
- [ ] `.dev.vars` is gitignored — never in the diff
- [ ] `docs/context/plan.md` and `tracks.md` updated
- [ ] Bandit has issued an **APPROVED** verdict
- [ ] Tim has given final approval for tracks touching auth, schema, or payments

---

## 8. Repo Relationship

- **Source of truth for Agent OS skills/agents:** `~/Developer/agent-skills-private/` — do not modify from within this repo.
- **This repo (`agent-kanban`):** Fork of `saltbo/agent-kanban`. Local companion Kanban service for Tim. All Sprint 4 code work lives here.
- **Upstream:** `https://github.com/saltbo/agent-kanban` — pull upstream changes only when explicitly directed.

---

*Last Refined: 2026-05-20 by Skylar (T1 onboarding)*
