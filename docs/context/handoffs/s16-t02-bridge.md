### HANDOFF BRIDGE
**Topic:** Backlog tab UI + planning trigger (S16-T2)
**Track:** S16-T2
**Specialist:** Skylar
**Static DNA Check:** Confirmed alignment with AGENTIC.md — React + Vite + Tailwind + shadcn/ui per project tech stack. UI principles per CLAUDE.md: human-editable backlog (this is exactly what the backlog tab is for), no drag-and-drop, locked once status leaves `idea`. **DESIGN.md is the visual source of truth — read it first; flag any deviation.**

**Dynamic DNA State:**
- **Product Context:** Ship the Backlog tab — the human-facing entry point of the north-star core loop. Multi-select backlog items, click Create plan, get the prompt on the clipboard, paste into Claude Code/Gemini, and Peaches plans the sprint. The kanban server never calls a model.
- **Current Plan:** `docs/context/plan.md § Current Sprint: Sprint 16 § Tracks → S16-T2` and the T2 DoD checklist.
- **Execution Files:**
  - `DESIGN.md` — **READ FIRST.** All font, color, spacing, and aesthetic decisions are defined there. No deviation without explicit Tim approval. In QA, Bandit will flag mismatches.
  - `apps/web/src/pages/BacklogPage.tsx` — NEW page. Route mounted via the existing router (find via `grep -r "createBrowserRouter\|<Route" apps/web/src | head`). Path: `/boards/:id/backlog`.
  - `apps/web/src/components/backlog/BacklogItemCard.tsx` — NEW component. Card per item: checkbox (multi-select), title, description, priority badge, status badge, edit/delete affordances visible **only** when `status === 'idea'`.
  - `apps/web/src/components/backlog/BacklogItemFormDialog.tsx` — NEW. shadcn/ui Dialog with title/description/priority fields. Used for both create and edit.
  - `apps/web/src/components/backlog/CreatePlanButton.tsx` — NEW. Disabled until at least one `idea` item is selected. On click: (1) `POST /api/backlog-items/bulk-mark-in-planning` with selected IDs, (2) build prompt per `north-star.md § Planning Trigger Flow` step 3, (3) `navigator.clipboard.writeText(prompt)`, (4) toast "Plan prompt copied to clipboard. Paste into your AI coding session." File-write delivery is **deferred** — clipboard only this sprint.
  - `apps/web/src/hooks/useBacklog.ts` — NEW. React Query hooks: `useBacklogList(boardId)`, `useCreateBacklogItem`, `useUpdateBacklogItem`, `useDeleteBacklogItem`, `useBulkMarkInPlanning`. Mirrors `useBoard.ts` patterns.
  - **Board view header** — find the existing tab/nav above the kanban columns (likely `apps/web/src/pages/BoardPage.tsx` or a header component). Add a "Backlog" link next to "Tracks". Match existing tab styling per DESIGN.md.
  - `tests/e2e/backlog.spec.ts` — NEW Playwright spec. Coverage:
    - Add a backlog item (P2, "test idea", description) — appears in P2 group.
    - Edit the item — change title to "test idea v2".
    - Delete the item — confirm gone.
    - Create three items, multi-select two, click Create plan — toast shows, both items now show `in_planning` badge and edit/delete affordances are gone, clipboard contains the expected prompt.

- **Prompt format (verbatim from `north-star.md § Planning Trigger Flow` step 3):**

```
Plan a sprint covering these backlog items:

[item 1 title]
[item 1 description]

[item 2 title]
...

Use the Architect skill (Peaches). Confirm sprint theme with the user before producing the plan.
```

Build it from the selected items in order. Trim trailing whitespace.

**Migration Safety:** Reversible. UI only — no schema changes, no DB writes outside the T1 endpoints.

**Security Review:** N/A. UI consumes the T1 endpoints which already enforce owner-scoped auth. No new auth surface.

**Worktree Setup:** `bash scripts/worktree-add.sh .worktrees/s16-t2 track/s16-t2-backlog-ui` (mandatory). T2 cannot begin until T1 endpoints exist; coordinate with Tim — either wait for T1 merge or rebase the T2 worktree onto T1's branch when the API contract stabilizes.

**Verification:**
- `pnpm build && pnpm tsc --noEmit && npx vitest run` — clean.
- `npx playwright test tests/e2e/backlog.spec.ts` — green.
- Manual smoke in browser: navigate to `/boards/<id>/backlog`, add three items at different priorities, multi-select two, click Create plan, paste into a text editor — confirm the prompt matches the format above and the two items now have `in_planning` badges.
- DESIGN.md compliance: side-by-side compare the new tab against an existing board view; font, spacing, color, button shapes must match.

**Next Step:** Skylar — (1) **Read `DESIGN.md`** before any visual work. (2) `bash scripts/worktree-add.sh .worktrees/s16-t2 track/s16-t2-backlog-ui`. (3) Wait for T1 endpoints to be available (or rebase onto T1 branch). (4) Build the page, components, hooks, E2E in that order. (5) Run verification commands. (6) Hand back to Tim for Bandit review with explicit DESIGN.md compliance call-out.

**Reminder:** The board task for S16-T2 (`T2: Backlog tab UI + planning trigger`) must be created by Tim in the browser before work begins.
