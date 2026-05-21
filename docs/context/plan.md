# Agent Kanban — Sprint Plan

---

## Current Sprint: Sprint 5 — Human-Editable Backlog

**Objective:** Allow Tim to manage a product backlog directly from the browser UI. Tim can create, edit, and delete tasks in the `todo` column (the backlog). Once tasks are kicked off (agents are working them — any status past `todo`), Tim cannot unilaterally edit them. The model is: backlog (human-editable) → kick off → locked execution. Agents continue to own the execution layer exclusively.

**Updated UI principles for Sprint 5:**
- The `todo` column is now human-editable: Tim can add/edit/delete tasks from the browser.
- Tasks in `in_progress`, `in_review`, `done`, or `cancelled` remain read-only in the UI.
- No drag-and-drop, no status transition buttons (those still belong to agents/machines).
- The two existing review actions (reject, complete) in `in_review` are unchanged.
- No sprint concept. The model is always: backlog → active → done.

---

## Tracks

### Track 5 — Auth: allow `user` identity to create/edit/delete backlog tasks

**Goal:** Extend the API ACL so a browser session (`user` identity) can create, update, and delete tasks that are still in `todo` status. Tasks in any other status remain agent/machine-only for mutations.

**Owner:** Skylar
**Working directory:** `/Users/I826932/Developer/agent-kanban/`
**Branch:** `track/5-user-backlog-api`

**Constraint analysis:**
Current `ROUTE_RULES` in `auth.ts` (line 43-45):
- `POST /api/tasks` → `agent:worker`, `agent:leader` only
- `PATCH /api/tasks/:id` → `agent:worker`, `agent:leader` only
- `DELETE /api/tasks/:id` → `agent:worker`, `agent:leader` only

The `createTask` handler also requires `assigned_to` (line 768 in `routes.ts`). For user-created backlog tasks, `assigned_to` should be optional (null = unassigned backlog item).

**Files to touch:**
1. `apps/web/server/auth.ts` — add `"user"` to the allow list for `POST /api/tasks`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id`. Add a new route rule that blocks `user` identity from mutating tasks not in `todo` status (enforced in the route handler, not here — see below).
2. `apps/web/server/routes.ts` — make `assigned_to` optional in `POST /api/tasks` when the caller is `user` identity. Add a guard in `PATCH /api/tasks/:id` and `DELETE /api/tasks/:id`: if identity is `user`, check that the task's current status is `todo` — reject with 403 if not.
3. `apps/web/server/taskRepo.ts` — make `assigned_to` optional in `createTask` (it already accepts it as optional in the type, but the route enforces it). Also make the `dev` board's `repository_id` requirement optional for user-created tasks (or enforce that user-created tasks are only for `ops` boards — see T6 for board type decision).

**Schema changes:** None — the existing tasks table has `assigned_to` as nullable and status defaults to `todo`. No migration needed.

**Auth risk:** This track touches `ROUTE_RULES` in `auth.ts`. Tim's sign-off required before Bridge issuance per security protocol.

**Verification:**
- `POST /api/tasks` with a browser session cookie creates a task with `status=todo`, `assigned_to=null`.
- `PATCH /api/tasks/:id` with a browser session succeeds for a `todo` task and fails with 403 for an `in_progress` task.
- `DELETE /api/tasks/:id` with a browser session succeeds for a `todo` task and fails with 403 for any other status.
- Existing agent/machine task creation is unaffected.

**Migration Safety:** Reversible (auth rule changes are in-code, not schema).
**Security Review:** **AUTH** — requires Tim's explicit sign-off before Bridge issuance.

---

### Track 6 — Backend: backlog task creation without `assigned_to` / board-level default repo (B2)

**Goal:** Refine the `createTask` backend to support user-created backlog items with board-level repo auto-assignment:
- `assigned_to` is nullable (unassigned backlog item — agent picks it up later via assign/claim).
- Add `default_repository_id` nullable column to the `boards` table. When a user creates a task without specifying `repository_id`, the backend reads the board's `default_repository_id` and applies it automatically.
- `POST /api/boards` and `PATCH /api/boards/:id` accept optional `default_repository_id` so Tim can configure this per board once.

**Owner:** Skylar
**Working directory:** `/Users/I826932/Developer/agent-kanban/`
**Branch:** `track/6-backlog-create` (depends on T5 branch — can be developed on top of it or in parallel if the API surface is stable)

**Files to touch:**
1. New migration file in `apps/web/migrations/` — `ALTER TABLE boards ADD COLUMN default_repository_id TEXT REFERENCES repositories(id)` (nullable).
2. `apps/web/server/routes.ts` — (a) remove the hard `assigned_to` 400 requirement when `identityType === "user"`; (b) remove the `dev board requires repository_id` guard when `identityType === "user"`; (c) in `POST /api/tasks` when identity is `user` and `repository_id` is absent, look up board's `default_repository_id` and attach it; (d) accept `default_repository_id` in `POST /api/boards` and `PATCH /api/boards/:id`.
3. `apps/web/server/taskRepo.ts` — `createTask`: when `actorType === "user"`, skip the `assertAssignableWorkerAgent` call and the `isRuntimeAvailable` check.
4. `apps/web/server/boardRepo.ts` — store and return `default_repository_id` on board reads and writes.
5. `packages/shared/` — add `default_repository_id?: string | null` to board types; verify `CreateTaskInput.assigned_to` is typed as optional.

**Schema changes:** One nullable column addition on `boards`. Reversible (drop column to roll back).

**Migration Safety:** Reversible — Tim schema sign-off: YES (2026-05-20)
**Security Review:** SCHEMA — Tim acceptance: YES (2026-05-20)

---

### Track 7 — Frontend: backlog create/edit/delete UI

**Goal:** Add task creation and edit capability to the board UI, scoped to `todo` column only. No repo picker — repo is board-level and applied automatically by the backend.

**Owner:** Skylar
**Working directory:** `/Users/I826932/Developer/agent-kanban/`
**Branch:** `track/7-backlog-ui` (depends on T5 + T6)

**UI spec:**
- "Add task" button at the bottom (or top) of the `todo` column. Clicking opens a minimal inline form or modal with exactly three fields: `title` (required), `description` (optional textarea), `labels` (multi-select from board labels). No `assigned_to` picker. No `repository_id` picker — this is handled server-side via the board's `default_repository_id`.
- Task cards in `todo` have an edit (pencil) icon that opens the same form pre-filled. No edit icon on cards in other columns.
- Task cards in `todo` have a delete (trash) icon with a confirmation step. No delete icon on cards in other columns.
- Submit calls `POST /api/tasks` or `PATCH /api/tasks/:id` via the existing `api` client in `apps/web/src/lib/api.ts`.

**Files to touch:**
1. `apps/web/src/components/KanbanColumn.tsx` — add "Add task" button when `column.status === 'todo'`.
2. `apps/web/src/components/TaskCard.tsx` — conditionally render edit/delete icons when `status === 'todo'`.
3. `apps/web/src/components/BacklogTaskForm.tsx` — new component: controlled form for create/edit. Fields: title, description, labels (no repo picker). Calls `api.createTask` or `api.updateTask`. Dismisses on success and calls `onRefresh`.
4. `apps/web/src/lib/api.ts` — add `createTask`, `updateTask`, and `deleteTask` methods if not already present.
5. `apps/web/src/routes/BoardPage.tsx` — wire up create/edit/delete state and pass `onRefresh` callback.

**Schema changes:** None (repo is handled by T6's `default_repository_id` on boards).
**Migration Safety:** Reversible.
**Security Review:** N/A.

---

### Track 8 — CLAUDE.md: update UI principles

**Goal:** Bring the project's `CLAUDE.md` UI principles in line with Sprint 5 reality. Remove the four blanket "no X" rules that no longer apply; replace with the nuanced backlog-edit model.

**Owner:** Skylar
**Working directory:** `/Users/I826932/Developer/agent-kanban/`
**Branch:** `track/8-ui-principles` (can be done in parallel with T5–T7 or after)

**Files to touch:**
1. `CLAUDE.md` — replace the four UI Principles bullets:
   - **Remove:** "Read-only board — the web UI is for observation and review, not task management"
   - **Remove:** "No task creation UI — tasks are created exclusively by agents via CLI/API"
   - **Add:** "Backlog is human-editable: Tim can create, edit, and delete tasks in the `todo` column from the browser."
   - **Add:** "Once a task leaves `todo` (agents are working it), it is locked for mutation in the UI — no inline edit, no delete."
   - **Keep:** "No status transition buttons" (still true — no claim/cancel/release/assign in UI)
   - **Keep:** "No drag-and-drop"
   - **Keep:** "Only two review actions in UI: reject and complete"

**Migration Safety:** Reversible (doc change only).
**Security Review:** N/A.

---

## Red Flag Analysis

**Title:** Sprint 5 — Human-Editable Backlog
**Top Risk Factors:**
1. **Auth ACL extension (T5):** Adding `user` to task mutation routes is the highest-risk change. The status guard (only `todo` tasks editable) must be enforced on the backend, not just the frontend — a motivated caller could send a PATCH directly. Getting this right requires careful ordering: route-rule change in `auth.ts` + status guard in `routes.ts` handler must land together in the same commit.
2. **`assigned_to` / `repository_id` relaxation (T6):** The existing `createTask` logic has two guards that assume agent identity. Removing them for `user` identity is low-risk if isolated cleanly by an `if (actorType === 'user')` branch. Risk: subtle bugs if `actorType` is not reliably set when the route is hit via browser session (need to verify `resolveActor` returns `"user"` for cookie-authenticated calls).
3. **Board-level `default_repository_id` (T6):** Tim has approved a nullable `default_repository_id` column on `boards` (schema sign-off 2026-05-20). Migration is reversible. The backend looks up the board's default repo when a user creates a task without specifying one — this is now the sole repo resolution path for user-created tasks. **RESOLVED.**

**Risk:** **MEDIUM** — the UI change is well-bounded, but the auth ACL extension in T5 is security-sensitive and must be reviewed carefully. The board type decision in T6 needs explicit Tim input.

**Premortem (2 weeks out):** Failure looks like: T5 auth change is too broad (allows user to mutate in-progress tasks via direct API call because the status guard was forgotten); or: Tim can't create tasks because his board is `dev` type and `repository_id` is enforced — the UI appears to work but all POSTs 400. Either way the feature feels broken even if code is present.

**Fallback Options:**
- **If board type is blocking:** Create a new `ops` board for the product backlog (or change Tim's existing board to `ops` via `PATCH /api/boards/:id`). No schema change needed.
- **If status guard complexity is too high in T5:** Restrict user task mutations to `todo` at the route-rule level using a new dedicated pattern (e.g., add a middleware that checks status before delegating to the main handler). Cleaner separation of concerns.
- **If frontend form complexity balloons:** Use a simple inline text input for title only in T7, defer description/labels editing to a later sprint. Ship thin, iterate.

**Migration Safety:** Reversible at the sprint level — all changes are on feature branches. T6 includes a schema migration (nullable column addition — reversible; Tim sign-off: YES 2026-05-20).

**Security Implications:** **AUTH** (T5) — explicit Tim sign-off received 2026-05-20. **SCHEMA** (T6) — explicit Tim sign-off received 2026-05-20.

**Product decision — RESOLVED (2026-05-20):**
- **B2 chosen:** Board-level `default_repository_id`. Tim sets this once per board; all user-created tasks on that board inherit the repo automatically. No per-task repo picker in the UI. Schema migration required (nullable column on `boards`).

---

## Definition of Done (Sprint 5)

- [x] T5: `user` identity can `POST /api/tasks`, `PATCH /api/tasks/:id` (todo only), `DELETE /api/tasks/:id` (todo only); all other statuses blocked with 403
- [x] T6: User-created tasks work without `assigned_to`; board-level `default_repository_id` is stored and applied automatically on task create (schema migration landed, `boardRepo` + `routes.ts` updated)
- [ ] T7: "Add task" button in `todo` column; edit/delete icons on `todo` cards; form creates/updates via API; other columns unchanged
- [x] T8: `CLAUDE.md` UI Principles updated to reflect backlog-edit model
- [ ] `pnpm build` exits zero
- [ ] `pnpm tsc --noEmit` exits zero
- [ ] Bandit QA: PASS
- [ ] Tim has given explicit sign-off on T5 auth changes (security review)
- [ ] Tim has answered the board type product question (T6 prerequisite) — **RESOLVED: B2 (board-level default repo) chosen 2026-05-20**

---

*Last updated: 2026-05-20 (T5 DONE Bandit PASS; T8 DONE Bandit PASS; T6 DONE Bandit PASS 2026-05-20)*

---

## Sprint 5 Bridges

### HANDOFF BRIDGE — T5
**Topic:** Allow `user` identity to create/edit/delete backlog tasks (auth ACL + status guard)
**Track:** T5
**Specialist:** Skylar
**Static DNA Check:** Aligned — Hono backend on Cloudflare Workers, auth via Better Auth, repo layer pattern. Security-sensitive change follows sign-off protocol.
**Dynamic DNA State:**
- **Product Context:** Browser-session users must be able to POST/PATCH/DELETE tasks that are in `todo` status; all other statuses remain agent/machine-only for mutations.
- **Current Plan:** Sprint 5 → Track 5 section in `docs/context/plan.md`
- **Execution Files:**
  - `apps/web/server/auth.ts` — add `"user"` to the allow list for `POST /api/tasks`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id` in `ROUTE_RULES`
  - `apps/web/server/routes.ts` — (a) make `assigned_to` optional when `identityType === 'user'` in POST handler; (b) add status guard in PATCH handler: if `identityType === 'user'` and task's current `status !== 'todo'`, return 403; (c) add same status guard in DELETE handler
**Migration Safety:** Reversible — auth rule changes are in-code, no schema migration
**Security Review:** AUTH — Tim acceptance: YES (2026-05-20)
**Worktree Setup:** `git worktree add .worktrees/track-5 track/5-user-backlog-api` — use worktree; T8 may run in parallel
**Verification:**
1. `pnpm build && npx vitest run` — must exit zero
2. Manual curl test (replace `<cookie>` with a valid browser session cookie):
   - `curl -X POST http://localhost:8787/api/tasks -H "Cookie: <cookie>" -d '{"board_id":"...","title":"Test backlog item","status":"todo"}' -H "Content-Type: application/json"` → expect 201
   - `curl -X PATCH http://localhost:8787/api/tasks/<todo-id> -H "Cookie: <cookie>" -d '{"title":"Updated"}' -H "Content-Type: application/json"` → expect 200
   - `curl -X PATCH http://localhost:8787/api/tasks/<in-progress-id> -H "Cookie: <cookie>" -d '{"title":"Blocked"}' -H "Content-Type: application/json"` → expect 403
   - `curl -X DELETE http://localhost:8787/api/tasks/<in-progress-id> -H "Cookie: <cookie>"` → expect 403
**Next Step:** Skylar — read `apps/web/server/auth.ts` and `apps/web/server/routes.ts` in full before touching anything. Implement the three changes above atomically in a single commit on `track/5-user-backlog-api`. Run verification. Then invoke Bandit for QA gate before merging.

---

### HANDOFF BRIDGE — T6
**Topic:** Backend: backlog task creation without `assigned_to` / board-level default repo (B2)
**Track:** T6
**Specialist:** Skylar
**Static DNA Check:** Aligned — Hono API on Cloudflare Workers, D1/SQLite schema migration, repo-layer pattern (boardRepo, taskRepo), auth via Better Auth. Schema-touching track; Tim sign-off on record (2026-05-20).
**Dynamic DNA State:**
- **Product Context:** User-created tasks must work without `assigned_to` (null = unassigned backlog item); boards gain a `default_repository_id` nullable column so Tim sets the repo once per board and all user-created tasks on that board inherit it automatically — no per-task repo picker needed.
- **Current Plan:** Sprint 5 → Track 6 section in `docs/context/plan.md`
- **Execution Files:**
  - `apps/web/migrations/0022_board_default_repo.sql` — NEW FILE: `ALTER TABLE boards ADD COLUMN default_repository_id TEXT REFERENCES repositories(id);`
  - `apps/web/server/routes.ts` — four targeted edits (see Next Step below)
  - `apps/web/server/taskRepo.ts` — skip `assertAssignableWorkerAgent` and `isRuntimeAvailable` when `actorType === 'user'`; skip dev-board `repository_id` required guard when `actorType === 'user'`
  - `apps/web/server/boardRepo.ts` — store and return `default_repository_id` on board reads and writes
  - `packages/shared/src/types.ts` — add `default_repository_id?: string | null` to `Board` interface; add `default_repository_id?: string | null` to `CreateBoardInput`

**Migration Safety:** Reversible — nullable column addition; drop column to roll back. Tim schema sign-off: YES (2026-05-20)
**Security Review:** SCHEMA — Tim acceptance: YES (2026-05-20)
**Worktree Setup:** `git worktree add .worktrees/track-6 track/6-backlog-create` — create this branch from `track/5-user-backlog-api` so T5 changes are the base.

**Exact implementation steps for Skylar:**

1. **Migration file** — create `apps/web/migrations/0022_board_default_repo.sql` with exactly:
   ```sql
   ALTER TABLE boards ADD COLUMN default_repository_id TEXT REFERENCES repositories(id);
   ```

2. **`packages/shared/src/types.ts`** — two additions:
   - On `Board` interface: add `default_repository_id?: string | null;` after `share_slug`.
   - On `CreateBoardInput` interface: add `default_repository_id?: string | null;` after `type`.

3. **`apps/web/server/boardRepo.ts`** — four edits:
   - `createBoard` signature: add `defaultRepositoryId?: string | null` parameter. Add it to the INSERT statement and bind list.
   - `updateBoard` `updates` type: add `default_repository_id?: string | null`. Add a `if (updates.default_repository_id !== undefined)` block that pushes `"default_repository_id = ?"` and the value to the sets/values arrays. Allow explicit `null` (to unset).
   - `POST /api/boards` in `routes.ts` will pass `body.default_repository_id` — `boardRepo.createBoard` must accept and persist it.
   - No changes needed to `getBoard`, `listBoards`, `getDefaultBoard`, or `getBoardBySlug` — `SELECT *` already returns the new column once the migration runs.

4. **`apps/web/server/routes.ts`** — four targeted edits:
   a. `POST /api/tasks` (line ~768, T5 branch): The T5 line reads:
      ```ts
      if (!body.assigned_to && c.get("identityType") !== "user") throw new HTTPException(400, { message: "assigned_to is required" });
      ```
      Keep this line as-is (T5 already made `assigned_to` optional for users).
      Add below it (before `resolveActor`):
      ```ts
      if (c.get("identityType") === "user" && !body.repository_id && body.board_id) {
        const boardRow = await c.env.DB.prepare("SELECT default_repository_id FROM boards WHERE id = ?")
          .bind(body.board_id)
          .first<{ default_repository_id: string | null }>();
        if (boardRow?.default_repository_id) {
          body.repository_id = boardRow.default_repository_id;
        }
      }
      ```
   b. `POST /api/boards` (line ~959): Extend the body type to include `default_repository_id?: string`. Pass `body.default_repository_id` as the new parameter to `createBoard(...)`.
   c. `PATCH /api/boards/:id` (line ~985): Extend the body type to include `default_repository_id?: string | null`. Pass through to `updateBoard(...)`.
   d. **Remove dev-board `repository_id` required guard in `taskRepo.ts`** (see step 5) — no route change needed here; the guard is in `taskRepo.ts`.

5. **`apps/web/server/taskRepo.ts`** — `createTask` function (lines ~48–140):
   - At line ~59, the current guard:
     ```ts
     if (board.type === "dev" && !input.repository_id) {
       throw new HTTPException(400, { message: "repository_id is required for dev board tasks" });
     }
     ```
     Change to:
     ```ts
     if (board.type === "dev" && !input.repository_id && actorType !== "user") {
       throw new HTTPException(400, { message: "repository_id is required for dev board tasks" });
     }
     ```
   - At line ~88, the current guard:
     ```ts
     if (input.assigned_to) {
       await assertAssignableWorkerAgent(db, ownerId, input.assigned_to, 400);
     }
     ```
     Change to:
     ```ts
     if (input.assigned_to && actorType !== "user") {
       await assertAssignableWorkerAgent(db, ownerId, input.assigned_to, 400);
     }
     ```
     (User-created tasks have `assigned_to = null`; no agent lookup needed.)
   - `isRuntimeAvailable` is only called inside `assertAssignableWorkerAgent`, so skipping that call is sufficient — no further change needed.

**Verification:**
1. `pnpm build && pnpm tsc --noEmit && npx vitest run` — must all exit zero
2. Apply migration to local D1: `npx wrangler d1 execute agent-kanban --local --file=apps/web/migrations/0022_board_default_repo.sql`
3. Set a board's default repo via `curl`:
   ```
   curl -X PATCH http://localhost:8787/api/boards/<board-id> \
     -H "Cookie: <session-cookie>" \
     -H "Content-Type: application/json" \
     -d '{"default_repository_id":"<repo-id>"}'
   ```
   → expect 200 with `default_repository_id` in the response body
4. Create a user task without `repository_id` on that board:
   ```
   curl -X POST http://localhost:8787/api/tasks \
     -H "Cookie: <session-cookie>" \
     -H "Content-Type: application/json" \
     -d '{"board_id":"<board-id>","title":"Test backlog item"}'
   ```
   → expect 201; response task should have `repository_id` matching the board's `default_repository_id`
5. Create a user task without `assigned_to` — expect 201 with `assigned_to: null`
6. Verify existing agent/machine `POST /api/tasks` still requires `assigned_to` and `repository_id` for dev boards (no regression)
7. Invoke Bandit for QA gate before considering T6 done

**Next Step:** Skylar — create branch `track/6-backlog-create` from `track/5-user-backlog-api`. Create the migration file first, then work through the five files in order: shared types → boardRepo → routes (boards) → routes (tasks) → taskRepo. Run verification. Invoke Bandit.

---

## Archive: Sprint 4 — Local Agent-Kanban Companion Service

**Objective:** Stand up a locally-running fork of `saltbo/agent-kanban` as a separate repo, stripped of all Cloudflare/cloud dependencies, so Tim can manage Agent OS backlog and per-track task status from a browser tab. Goal is a working local board — nothing more.

**Status: COMPLETE as of 2026-05-20**

**Repo relationship (Static DNA — non-negotiable for this sprint):**
- **This repo (`agent-skills-private`):** Source of truth for Agent OS — skills, agents, sprint plans. Untouched by this sprint's code work; only `docs/context/` is edited (by Peaches).
- **New repo (forked locally):** `agent-kanban` (Tim's GitHub fork of `saltbo/agent-kanban`). Lives as a sibling directory under `~/Developer/`. Uses `pnpm`, not `bun` — this is intentional and acceptable because it is a separate repo.
- **Cross-repo discipline:** Skylar's edits in this sprint happen inside the new `agent-kanban` clone. No source code is added to `agent-skills-private`.

**Scope guard:** All code work occurs in the new `agent-kanban` clone. Inside `agent-skills-private`, only `docs/context/plan.md` and `docs/context/tracks.md` are touched (by Peaches). No edits to `claude/skills/`, `claude/agents/`, `AGENTIC.md`, or settings.

**Tracks:**
- T1: Fork & local clone — DONE
- T2: Strip Cloudflare/cloud bindings — DONE
- T3: Configure GitHub OAuth for local dev — DONE
- T4: Smoke test — DONE

**Known gaps carried forward to Sprint 5:**
- Task creation requires `agent:worker` identity (machine API key) — user session cannot create tasks
- Status transitions require API calls with agent/machine identity — the web UI is read-only by design
- No end-to-end `ak start` daemon flow was tested (CLI builds but daemon wasn't run against the board)

*Full Sprint 4 plan details preserved in git history.*
