### HANDOFF BRIDGE
**Topic:** Backlog data model + repo + API (S16-T1)
**Track:** S16-T1
**Specialist:** Skylar
**Static DNA Check:** Confirmed alignment with AGENTIC.md — Hono on Cloudflare Workers + D1; thin repo layer per CLAUDE.md (`taskRepo.ts`, `boardRepo.ts`, etc.); owner-scoped auth via existing middleware. New table `backlog_items` is additive and matches the data-access pattern already in place.

**Dynamic DNA State:**
- **Product Context:** Land the data half of the north-star backlog: a typed table, a thin repo, and REST endpoints so the Backlog tab UI (T2) has a real API to call. No sprint entity yet — only the backlog half lands this sprint.
- **Current Plan:** `docs/context/plan.md § Current Sprint: Sprint 16 § Tracks → S16-T1` and the T1 DoD checklist.
- **Execution Files:**
  - `apps/web/migrations/<NNNN>_backlog_items.sql` — NEW migration. Pick the next sequential migration number by reading existing files in `apps/web/migrations/`. Schema below.
  - `apps/web/server/repos/backlogItemRepo.ts` — NEW thin repo. Follow the pattern in `apps/web/server/repos/taskRepo.ts`. Functions: `list({ board_id, owner_id })`, `get(id, owner_id)`, `create(input)`, `update(id, owner_id, patch)`, `del(id, owner_id)`, `bulkMarkInPlanning(ids, owner_id)`.
  - `apps/web/server/routes/backlogItems.ts` — NEW Hono router. Endpoints:
    - `GET /api/backlog-items?board_id=…` — list, owner-scoped via auth middleware.
    - `POST /api/backlog-items` — create. Body: `{ board_id, title, description, priority }`. Server fills `id`, `created_at`, `created_by`, `status='idea'`. Auth: user session OR `agent:worker`/`agent:leader` JWT. Machine tokens DENY (mirrors task creation rule from AGENTIC.md §5).
    - `PATCH /api/backlog-items/:id` — update. Body: any of `{ title, description, priority, status }`. Status transitions allowed: `idea → in_planning`, `in_planning → idea` (revert), `in_planning → consumed`, `* → dropped`. Server enforces.
    - `DELETE /api/backlog-items/:id` — delete. Allowed only when `status = idea` (mirrors locked-once-claimed UI principle).
    - `POST /api/backlog-items/bulk-mark-in-planning` — body: `{ ids: string[] }`. Bulk update to `status = in_planning`. Used by the T2 Create plan flow.
  - Register the router in the main router file (find it via `grep -r "app.route" apps/web/server | head`).
  - `tests/backlogItems.test.ts` — NEW vitest. Cover: create requires `board_id` belonging to authed owner; list returns only owner's items; machine token can read but not write; delete denied when status != idea; bulk-mark-in-planning transitions multiple items.
  - `packages/shared/` — if a shared types package emits `BacklogItem` types, add them. Otherwise emit types inline in the route file.

- **Schema (from `docs/context/north-star.md § Data Model`, with the FK note from the DoD):**

```sql
CREATE TABLE backlog_items (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL CHECK (priority IN ('P0','P1','P2','P3')),
  status TEXT NOT NULL CHECK (status IN ('idea','in_planning','consumed','dropped')) DEFAULT 'idea',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by TEXT NOT NULL,
  consumed_by_sprint_id TEXT NULL  -- FK to sprints(id) added when sprints table lands; nullable, no constraint yet
);

CREATE INDEX idx_backlog_items_board_id ON backlog_items(board_id);
CREATE INDEX idx_backlog_items_status ON backlog_items(status);
```

The `owner_id` is not on this table — owner scoping flows through `boards.owner_id`. All queries must JOIN through `boards` and filter by `boards.owner_id = ?` (mirrors how `tasks` does it via `boards`). Document this in the repo file's top comment.

**Migration Safety:** Reversible. Additive only — new table, no alters to `tasks`, `boards`, or auth tables. Rollback = `DROP TABLE backlog_items`. Tim accepted schema 2026-05-23.

**Security Review:** Schema. Tim accepted 2026-05-23. New endpoints reuse existing owner-scoped auth middleware — same machine-token-denied rule as task creation. No new auth surface; no payments.

**Worktree Setup:** `bash scripts/worktree-add.sh .worktrees/s16-t1 track/s16-t1-backlog-api` (mandatory per `tracks.md § Worktree Note`; raw `git worktree add` will fail because pnpm hoisted `node_modules` aren't symlinked).

**Verification:**
- After migration: restart dev server (CLAUDE.md migration-restart rule) and confirm `backlog_items` table exists in `.wrangler/state/v3/d1/` via `wrangler d1 execute --local <DB> --command="SELECT name FROM sqlite_master WHERE name='backlog_items'"`.
- `npx vitest run tests/backlogItems.test.ts` — clean.
- `pnpm build && pnpm tsc --noEmit && npx vitest run` — clean.
- Manual smoke: `curl -X POST http://localhost:5173/api/backlog-items -H 'Content-Type: application/json' -d '{"board_id":"<id>","title":"test","description":"","priority":"P2"}'` with a user session cookie returns 200 + the created item.

**Next Step:** Skylar — (1) `bash scripts/worktree-add.sh .worktrees/s16-t1 track/s16-t1-backlog-api`. (2) Read `apps/web/server/repos/taskRepo.ts` for the repo pattern; read `apps/web/server/routes/tasks.ts` for the route + auth pattern. (3) Write the migration, repo, routes, tests in that order. (4) Run the verification commands above. (5) Hand back to Tim for board-task creation (manual, browser) and Bandit review.

**Reminder:** The board task for S16-T1 (`T1: Backlog data model + repo + API`) must be created by Tim in the browser before work begins. Skylar — confirm board task exists before opening the worktree.
