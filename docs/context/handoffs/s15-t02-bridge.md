### HANDOFF BRIDGE
**Topic:** plan.md context migration to per-sprint pattern (S15-T2)
**Track:** S15-T2
**Specialist:** Skylar
**Static DNA Check:** Confirmed alignment with AGENTIC.md — Skylar is the fullstack specialist; this track is docs-only (no `apps/`, `packages/`, `skills/` source touched). Worktree protocol from §4 applies because the operation is irreversible without git.

**Dynamic DNA State:**
- **Product Context:** `docs/context/plan.md` is 2496 lines — every sprint's full objective, DoD, and bridge log accumulated since S5. Peaches re-reads this on every session init. Migrate to the per-sprint file pattern used by `project-tracker` so `plan.md` stays lean (~150 lines, current sprint only).
- **Current Plan:** `docs/context/plan.md § Current Sprint: Sprint 15 § Tracks → S15-T2` and DoD checklist for T2.
- **Execution Files (in this strict order):**
  1. `docs/context/archive/plan-archive-s1-s13.md` — NEW file. Contains all content from `plan.md` line ~87 (`## Archive: Sprint 13 — UX Polish on team_members (CLOSED 2026-05-23)`) through end-of-file. This includes the S13 archive, all `## Sprint 13 Bridges` / S12 / S11 / S10 / S9 / S8 / S7 / S6 / S5 sections, the `## Tracks`, `## Dependency order`, `## Definition of Done` sub-sections per sprint, the `## Sprint 6 Bridges`, `## AI-Assisted Planning Workflow` tail, and any other historical content below S14. Verbatim copy. Begin the file with a one-paragraph header explaining what it is and the date of migration.
  2. `docs/context/archive/plan-s14-diagnostic.md` — NEW file. Contains the S14 section verbatim (currently lines ~88–183 of `plan.md`, the `## Archive (pending S15-T2 migration): Sprint 14 — Agent OS Install Diagnostic (CLOSED 2026-05-23)` block down through `### Carries to Sprint 15` and the `---` separator). Begin with a one-paragraph header.
  3. `git diff docs/context/archive/` to confirm both archive files are written and contain the expected line counts. **Stop here and verify with Tim before step 4.**
  4. `docs/context/plan.md` — TRUNCATE. After truncation the file contains only:
     - The `# Agent Kanban — Sprint Plan` H1
     - The current Sprint 15 section (objective, tracks, dependency order, DoD, circuit breaker, board-task creation, migration safety) — currently lines 1–80 of `plan.md`
     - The `## Archive Pointer` section (rewritten to point at the two new archive files; remove the parenthetical "until T2 lands" since after this commit, T2 has landed)
     - Nothing else. The S14 archive block and everything below it is removed.
  5. `docs/context/handoffs/` — already created by Peaches; verify the directory exists and contains `s15-t01-bridge.md` + `s15-t02-bridge.md` (this file). No further action unless directory is missing.
  6. `.claude/agents/peaches.md` — update the initialization step list. Add a fourth bullet referencing `docs/context/archive/` so future Peaches sessions know where historical sprint context lives. Do NOT make Peaches read all archive files at init (that would re-introduce the context rot we are removing) — the bullet says "discover historical sprints in `docs/context/archive/` if a question requires it." Keep the existing `product.md` "if it exists" bullet if present, or upgrade it to a hard requirement now that T1 creates the file (coordinate with T1 ordering — if T1 ships first, this bullet becomes a hard read; if T2 ships first, leave the `if it exists` guard).

**Migration Safety:** **IRREVERSIBLE without git.** The truncation of `plan.md` permanently removes ~2400 lines from that file. The archive files MUST be written and verified BEFORE step 4. Any failure or interruption between step 1 and step 4 leaves the repo in a recoverable state (archive files exist, plan.md still has originals); a failure during step 4 itself is recoverable via `git checkout docs/context/plan.md`. Tim acceptance: REQUIRED before Skylar begins. Do not proceed without explicit approval. (Tim acceptance date will be filled in here once given.)

**Security Review:** N/A. Documentation-only. No auth, payments, or schema surface.

**Worktree Setup:** REQUIRED. `bash scripts/worktree-add.sh .worktrees/s15-t2 track/s15-t2-plan-migration`. Work entirely inside the worktree. Do not modify `docs/context/plan.md` on `main` until the worktree branch is reviewed and merged.

**Verification:**
- After step 1: `wc -l docs/context/archive/plan-archive-s1-s13.md` — expect ~2200+ lines.
- After step 2: `wc -l docs/context/archive/plan-s14-diagnostic.md` — expect ~100 lines.
- After step 3 (sentinel before truncation): `git diff --stat docs/context/archive/` and confirm with Tim that the archive content looks complete.
- After step 4: `wc -l docs/context/plan.md` — expect <200 lines. `head -5 docs/context/plan.md` — expect the H1 and the S15 heading.
- After step 6: `grep -A2 'docs/context/archive' .claude/agents/peaches.md` — confirm the new bullet exists.
- `pnpm build && pnpm tsc --noEmit` — must exit clean (docs only — no-op for code).
- `git status` — only the four files (two new archives, modified plan.md, modified peaches.md) should be staged. Anything else is scope drift.

**Next Step:** Skylar — wait for explicit Tim approval on the irreversible truncation. Once approved, set up the worktree, execute steps 1→6 in strict order, run verification, hand back to Tim. Bandit reviews the resulting `plan.md` (verifies leanness + S15 content intact) and one archive file at random (verifies content integrity).
