---
name: close-sprint
description: Close the current sprint — refuses unless Playwright is green AND the working tree is fully clean (zero unstaged + zero untracked).
Abbreviation: Cs
Category: Release Gate
Type: Tier 3
Capabilities: [fs_read, fs_write]
---

# Skill: Close Sprint

## Description
Sprint-closure release gate. Refuses to flip sprint status in `docs/context/tracks.md` and `docs/context/plan.md` unless **both** of these are green:

1. The full Playwright suite (`npx playwright test`) exits zero.
2. `git status --porcelain` produces zero output (no unstaged tracked changes AND no untracked files).

This is the strictest possible "working tree is empty" gate. It is intentional: Sprint 9–10 closed with experimental files, `LOCAL_NOTES.md`, and unstaged drift in the tree. Closing the sprint flips a status flag — that flag must mean "everything is committed and the test suite is green," not "everything *I remembered* to commit."

## Operational Rules
- **🛡️ TACTICAL EXECUTION (MANDATORY)**: Specialist-tier release gate. Run the verification, refuse on any failure, and only edit context files when both gates are green.
- **Identity (Global Standard)**: Every message MUST lead with the Identity Header:
    > **[Name] ([Role])**
- **Zero auto-commit**: this skill never commits. After flipping the status, instruct the user to review with `git diff` and commit manually. Tim's locked rule: no commits without his direction.
- **Verification order matters**: run the cheap check first (`git status --porcelain`) so we don't burn minutes on Playwright when the tree is dirty.

## Procedure

### Step 1 — Detect the current open sprint

```bash
grep -m1 "^## Current Sprint:" docs/context/tracks.md
```

Parse the sprint number (e.g. `Sprint 11` → `11`). If the line says `None — Sprint N CLOSED ...` or no sprint is open, abort with: "No open sprint to close. Suggest `/sprint-open` to start a new one."

### Step 2 — Working-tree gate (cheap, run first)

```bash
git status --porcelain
```

If the output is non-empty, abort with:

```
Refusing to close the sprint. Working tree must be empty (zero unstaged + zero untracked):

<paste each line of git status --porcelain output here>

Commit, stash, or remove these files, then re-run /close-sprint.
```

Do NOT proceed to Step 3.

### Step 3 — Playwright gate (expensive, run only if Step 2 passed)

```bash
npx playwright test
```

If exit code is non-zero, abort with:

```
Refusing to close the sprint. Playwright suite is not green.

<paste the failing test names from the playwright output>

Fix the failing E2E specs (or invoke playwright-test-healer), then re-run /close-sprint.
```

Do NOT proceed to Step 4.

### Step 4 — Flip sprint status (only when both gates are green)

Today's date:

```bash
TODAY=$(date +%Y-%m-%d)
```

1. Edit `docs/context/tracks.md`:
   - Change the `## Current Sprint: ...` header to `## Current Sprint: None — Sprint N CLOSED <TODAY>; Sprint <N+1> not yet opened` (preserving the project's existing closed-sprint header convention — verify by checking how prior sprints were closed in git history).
   - Move the active sprint's track table to a new `## Archive: Sprint N Tracks (CLOSED <TODAY>)` section, in archive order (newest first below the most-recent archive).
   - Update the `*Last updated: ...*` line at the bottom.

2. Edit `docs/context/plan.md`:
   - Move the active sprint's full plan block (objective, tracks, dependency order, DoD, Bridges) into the `## Archive:` region with header `## Archive: Sprint N — <theme> (CLOSED <TODAY>)`.
   - Replace the current-sprint pointer with `## Current Sprint: None — Sprint N CLOSED <TODAY>; Sprint <N+1> not yet opened`.
   - Update the `*Last updated: ...*` line.

3. Do **not** auto-commit. Print:

```
Sprint N closed. Status flipped in tracks.md and plan.md (uncommitted).

Review with `git diff` and commit when ready. Then invoke `/sprint-open` to begin Sprint <N+1>.
```

## Verification (How to test if this skill is working)
1. **Untracked-file refusal**: With a stray `LOCAL_NOTES.md` in the tree, the skill must abort at Step 2 without running Playwright.
2. **Unstaged-modification refusal**: With a tracked file modified but unstaged, the skill must abort at Step 2 without running Playwright.
3. **Playwright-failure refusal**: With a clean tree but a failing E2E spec, the skill must abort at Step 3 without editing context files.
4. **Clean close**: With a clean tree AND green Playwright, the skill flips status in both context files and instructs the user to commit manually.
5. **Identity Check**: Confirm the "Clean Color Bar" (blockquote) header is present.

## Stats
- **Overhead**: High when both gates are run (Playwright is expensive); the working-tree check is instant. Front-load the cheap gate.
- **Operational Level**: Level 3 (Tactical Release Gate)
- **Benefit**: Eliminates the "sprint closed with drift in the tree" pattern. Eliminates the "sprint closed while E2E was broken" pattern.

## Trigger
Tell Specialist: "Close the current sprint."
