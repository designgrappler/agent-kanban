### HANDOFF BRIDGE
**Topic:** Daemon spawn-at-create (S16-T3)
**Track:** S16-T3
**Specialist:** Skylar
**Static DNA Check:** Confirmed alignment with AGENTIC.md — React UI + existing CLI (`ak start`). No daemon internals change. Closes the TODO left by S13-T4 in the create-board flow. DESIGN.md applies for any visual decisions in the modal.

**Dynamic DNA State:**
- **Product Context:** When a user creates a brand-new board, today there is a TODO: prompt them to start the daemon. Without a daemon, agents can't claim tasks. This track lands the handoff: post-create modal that either (a) shows the exact `ak start --board <id>` command with a copy-to-clipboard button, or (b) routes to Settings → Daemon connection if no machine is registered. **The browser cannot spawn local processes** (Workers-served SPA) — clipboard handoff is the correct boundary.
- **Current Plan:** `docs/context/plan.md § Current Sprint: Sprint 16 § Tracks → S16-T3` and the T3 DoD checklist.
- **Execution Files:**
  - `apps/web/src/pages/CreateBoardPage.tsx` (or wherever the create-board flow lives — find via `grep -r "AddMachineSteps\|create.*board" apps/web/src | head`). Locate the TODO left by S13-T4 — this is the anchor point.
  - `apps/web/src/components/board/DaemonHandoffModal.tsx` — NEW. shadcn/ui Dialog. Two branches by props/state:
    - **Has registered machine** (`/api/machines` returns at least one): show the heading "Start the daemon to begin working", the command block `ak start --board <id>` with a "Copy command" button (`navigator.clipboard.writeText(...)`), a brief explainer ("Run this in your terminal to start auto-claiming tasks for this board"), and a "Close" action.
    - **No machine**: show heading "No machine registered", body explaining a machine is needed before the daemon can run, and a primary "Open Daemon connection settings" button that routes to the Settings → Daemon connection tab landed in S13-T3.
  - `apps/web/src/hooks/useMachines.ts` — extend if needed, or use existing. The modal needs a list (or count) of registered machines to choose its branch. Read-only call; no new endpoints.
  - `tests/createBoardDaemonHandoff.test.tsx` — NEW vitest with React Testing Library. Coverage:
    - Render with `machines=[<one>]` → command block visible, copy button works (mock clipboard), Settings link absent.
    - Render with `machines=[]` → "No machine registered" heading visible, command block absent, Settings link present and points to the right route.
  - `tests/e2e/create-board.spec.ts` — extend existing E2E (or create if missing). After successful board create, modal appears; assert correct branch based on test fixtures.

- **DESIGN.md** — read for the modal styling. Match existing dialog patterns in the codebase (shadcn/ui Dialog, the same one used for the create-board form itself).

**Migration Safety:** Reversible. UI only — no schema changes, no daemon internal changes, no new endpoints.

**Security Review:** N/A. Reads existing `/api/machines` endpoint (already auth-gated). No new auth surface.

**Worktree Setup:** `bash scripts/worktree-add.sh .worktrees/s16-t3 track/s16-t3-daemon-spawn` (mandatory). Fully parallel-safe with T1 and T2 — disjoint files (T1 = backlog data, T2 = backlog page, T3 = create-board flow + machines hook).

**Verification:**
- `pnpm build && pnpm tsc --noEmit && npx vitest run` — clean.
- `npx playwright test tests/e2e/create-board.spec.ts` — green.
- Manual smoke in browser:
  - With at least one registered machine: create a new board → modal appears with `ak start --board <id>` command, copy button writes the command to clipboard verbatim.
  - With zero machines (delete or use a fresh user): create a new board → modal shows "No machine registered" branch, Settings link routes to the daemon connection tab.
- `git diff` on the create-board flow file — confirm the S13-T4 TODO is removed/replaced (not just augmented).

**Next Step:** Skylar — (1) `bash scripts/worktree-add.sh .worktrees/s16-t3 track/s16-t3-daemon-spawn`. (2) Find the S13-T4 TODO in the create-board flow and read context around it. (3) Read `DESIGN.md` for modal aesthetic. (4) Build modal, hook, tests. (5) Run verification. (6) Hand back to Tim for Bandit review.

**Reminder:** The board task for S16-T3 (`T3: Daemon spawn-at-create`) must be created by Tim in the browser before work begins.
