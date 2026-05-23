# Agent OS — Upstream Issue Report

**Date:** 2026-05-23  
**From:** agent-kanban (Tim Rechin / designgrappler)  
**Re:** Gaps identified in the canonical Agent OS install process  
**Source:** Sprint 14 diagnostic — three-way comparison of agent-skills, project-tracker, and agent-kanban  
**Scope:** This report covers weaknesses in canonical Agent OS itself (the `agent-skills` repo), not agent-kanban-specific configuration errors.

---

## Executive Summary

A structured diagnostic comparing a fresh canonical Agent OS output, a working reference installation (project-tracker), and a production installation (agent-kanban) surfaced five weaknesses in the canonical install process. These weaknesses share a common shape: the install succeeds, the project appears healthy, but invisible drift accumulates between sessions. Silent failures — auto-triggers that never fire, product context that never loads, model names that behave differently than expected — are the result. None of these cause loud errors; they erode the reliability of the workflow over time.

The five issues are reported below in declining severity. Each entry includes a description, reproduction steps, a proposed fix, and a backward-compatibility assessment.

---

## Issue 1: `onboard-existing-project` never-overwrite policy creates permanent, silent auto-trigger drift

**Severity:** High  
**Type:** Bug (behavioral regression risk)

### Description

When `CLAUDE.md` already exists in a project, `onboard-existing-project` preserves it unchanged. This is generally correct — the file may contain project-specific configuration that should not be clobbered. However, `CLAUDE.md` is also the file that wires auto-trigger patterns to skill invocation names (e.g., `"start planning"` → `/open-sprint`). If:

1. `CLAUDE.md` was created before the auto-trigger pattern was established, or
2. A canonical skill was renamed after the project was onboarded (e.g., `start-sprint` → `open-sprint`),

then the project's CLAUDE.md will permanently reference a skill name that does not exist, and the auto-trigger will silently fail on every invocation. The user sees the model handle the trigger manually, assumes everything is working, and never discovers the failure.

### Reproduction

1. Onboard a project that already has a `CLAUDE.md` without an auto-trigger table.
2. Verify the onboard completes without error.
3. Trigger an auto-trigger pattern (e.g., say "what's the status of the sprint").
4. Observe that no skill is invoked; the model handles it via general reasoning instead.

**Concrete instance:** agent-kanban CLAUDE.md references `/sprint-open` (auto-trigger for "start planning"). The canonical skill is `open-sprint.md` → invokable as `/open-sprint`. Neither match. The auto-trigger has never fired in 15+ sprints of development.

### Proposed Fix

When `onboard-existing-project` preserves an existing CLAUDE.md, it should:
1. Emit a **diff report** between the existing auto-trigger table and the canonical auto-trigger table, identifying any names that don't match a currently-installed skill.
2. Offer to patch only the auto-trigger table (leaving all other content intact).

This gives users visibility without clobbering project-specific content.

### Backward Compatibility

Non-breaking. The change adds an optional remediation step to an existing flow. Existing projects are not affected unless the user accepts the patch.

---

## Issue 2: No sync mechanism for user-level skills after initial install

**Severity:** High  
**Type:** Missing feature (install lifecycle gap)

### Description

User-level skills installed to `~/.claude/skills/` are installed once and never updated. When a canonical skill is renamed (e.g., `start-sprint.md` → `open-sprint.md`), existing installs retain the old filename. Any project whose CLAUDE.md references the new canonical name (`/open-sprint`) will silently find no skill. Any project whose CLAUDE.md references the old name (`/start-sprint`) will invoke stale skill content.

There is no mechanism to:
- Detect that an installed skill's filename is outdated relative to the canonical repo.
- Notify the user that a rename has occurred.
- Offer a re-install or rename of the local copy.

### Reproduction

1. Install `start-sprint.md` to `~/.claude/skills/start-sprint.md` (as was canonical at time of agent-kanban onboarding).
2. Canonical repo renames `start-sprint.md` → `open-sprint.md`.
3. User never learns of the rename.
4. Any project that consumes `/open-sprint` (the new canonical name) fails silently.

**Concrete instance:** `~/.claude/skills/start-sprint.md` is installed. `~/.claude/skills/open-sprint.md` does not exist. agent-kanban's CLAUDE.md references `/sprint-open` (a third name). All three names differ.

### Proposed Fix

Two options, in order of preference:

**Option A — `/refresh-agent-os` skill:** A user-level skill that compares the current `~/.claude/skills/` contents against the canonical repo and surfaces a diff: new skills available, renamed skills, and removed skills. Presents options to install/rename/remove. Does not auto-apply without user confirmation.

**Option B — Deprecation shim:** When a skill is renamed in canonical, leave a `start-sprint.md` shim that invokes the new skill and prints a deprecation warning directing the user to reinstall.

Option A is preferred because it works for all future renames without requiring per-rename maintenance.

### Backward Compatibility

Option A: Non-breaking (new skill, no changes to existing content).  
Option B: Non-breaking (shim preserves old invocation name).

---

## Issue 3: Model name format is inconsistent across canonical templates

**Severity:** Medium  
**Type:** Bug (behavioral inconsistency)

### Description

Canonical Agent OS templates use two different model name formats for the same role tier:

| Template file | `model:` value | Format |
|---|---|---|
| `claude/agents/architect.md` | `opus` | Short |
| `claude/agents/qa.md` | `sonnet` | Short |
| `claude/agents/fullstack.md` | `claude-sonnet-4-6` | Long |
| `install-agent-scaffold` SKILL.md (instructions) | `claude-opus-4-7` | Long |
| `install-agent-scaffold` SKILL.md (instructions) | `claude-sonnet-4-6` | Long |

The template files and the scaffold instructions contradict each other. When a practitioner follows the scaffold instructions (which are procedurally authoritative as the "what to type" guide), they produce a different result than the template files would produce.

Additionally, it is unclear whether short names (`opus`, `sonnet`) and long names (`claude-opus-4-7`, `claude-sonnet-4-6`) behave identically in Claude Code. If short names are aliases that resolve to a specific version, they will not auto-update when new model versions are released. If long names are pinned to a specific checkpoint, they will fall behind. The canonical recommendation should make this tradeoff explicit.

### Reproduction

1. Follow `install-agent-scaffold` SKILL.md instructions to scaffold an architect agent. Note that instructions specify `model: claude-opus-4-7`.
2. Compare to `claude/agents/architect.md` template. Note it specifies `model: opus`.
3. Both paths claim to produce the architect agent. The results are not identical.

**Concrete instance:** agent-kanban `peaches.md` has `model: claude-opus-4-7` (from following scaffold instructions). Canonical template `architect.md` specifies `model: opus`. It is not clear which is "correct" for this project.

### Proposed Fix

1. Align all templates and SKILL.md instructions to use a single format.
2. Add a comment in the templates documenting the short-vs-long tradeoff (e.g., "Use `opus` to track the best-available Opus model, or `claude-opus-4-7` to pin to a specific version").
3. Recommended canonical choice: short names (`opus`, `sonnet`, `haiku`) for generalist roles (architect, qa, specialist), with explicit pinning only when a specific model version is required for a project.

### Backward Compatibility

Template change: Non-breaking for existing installs (agent files in projects are not auto-updated). Breaking only if a project reads model values dynamically, which is not a supported pattern.

---

## Issue 4: `product.md` is required by canonical Peaches but is not guaranteed by the install process

**Severity:** Medium  
**Type:** Missing feature (incomplete install contract)

### Description

The canonical `peaches.md` agent reads `docs/context/product.md` at initialization to load product context for architectural decisions. This file is marked as required in the canonical `docs/context/` structure (`§1. Canonical Agent OS — What It Produces`).

However, `onboard-existing-project` only checks for `product.md` during its discovery phase — it does not guarantee the file is created when absent. If a project is onboarded from a lean starting point (no existing product vision doc), `product.md` will never be created. Peaches will start every session without product context, degrading the quality of architectural decisions silently.

The failure mode is subtle: Peaches does not error. She proceeds with reduced context. If the project has a product vision doc under a different name (e.g., `north-star.md`), there is no mechanism to map it to `product.md`.

### Reproduction

1. Run `onboard-existing-project` on a project with no existing product vision document.
2. Verify onboard completes successfully.
3. Start a new session and invoke Peaches.
4. Observe that Peaches has no product context loaded.

**Concrete instance:** agent-kanban has `docs/context/north-star.md` (authored manually). `docs/context/product.md` does not exist. Peaches reads neither in her current init, relying on session context alone for product direction.

### Proposed Fix

`onboard-existing-project` should enforce `docs/context/product.md` as a required output, not just an optional discovery item. Concretely:

1. During onboarding, if `product.md` does not exist, prompt the user for 2–3 sentences describing the product and generate a minimal `product.md` from the response.
2. If a candidate file exists under a non-canonical name (e.g., `north-star.md`, `README.md`, `vision.md`), surface it to the user and offer to create `product.md` from it (either as a copy, summary, or symlink).

### Backward Compatibility

Non-breaking. Change only affects the `onboard-existing-project` flow for projects that currently lack `product.md`. Existing installs with `product.md` are unaffected.

---

## Issue 5: No durable install health check

**Severity:** Low  
**Type:** Missing feature (observability gap)

### Description

`install-agent-scaffold` generates an `INSTALL_CHECKLIST.md` that is deleted when setup completes. After initial install, there is no artifact that can be re-run to verify the install is still healthy. As time passes:

- User-level skills drift (renames, new skills not installed).
- `CLAUDE.md` auto-trigger table diverges from installed skill names.
- Agent frontmatter model names fall behind canonical recommendations.
- `product.md` gets deleted, moved, or never created.

None of these conditions produce errors. The install appears healthy until a practitioner manually compares files.

A one-shot checklist that is consumed on setup and then discarded cannot detect post-install drift.

### Reproduction

1. Complete a fresh install via `install-agent-scaffold`.
2. Delete `INSTALL_CHECKLIST.md` (as the flow instructs).
3. Six months later, attempt to verify the install is still correct. There is no mechanism to do so.

### Proposed Fix

Replace (or supplement) the one-shot `INSTALL_CHECKLIST.md` with a persistent `/check-agent-os` skill that can be invoked at any time. It should:

1. Verify all canonical user-level skills are installed and under their current canonical names.
2. Verify CLAUDE.md auto-trigger table entries map to installed skill names.
3. Verify required `docs/context/` files exist (`product.md`, `plan.md`, `tracks.md`).
4. Verify agent frontmatter model names are in the canonical format.
5. Produce a pass/fail report with remediation steps for each failure.

This turns install health from a one-time event into a repeatable, automatable check.

### Backward Compatibility

Non-breaking (new skill only).

---

## Summary Table

| # | Issue | Severity | Type | Effort |
|---|---|---|---|---|
| 1 | `onboard-existing-project` never-overwrite causes permanent auto-trigger drift | High | Bug | Medium |
| 2 | No sync mechanism for user-level skills after renames | High | Missing feature | Medium |
| 3 | Model name format inconsistent across canonical templates | Medium | Bug | Low |
| 4 | `product.md` required but not enforced by install | Medium | Missing feature | Low |
| 5 | No durable install health check | Low | Missing feature | Medium |

All five issues share a root pattern: the install process is a one-shot event with no lifecycle management. The Agent OS install works correctly at time-of-install, but has no mechanism to detect or correct drift. Issues 1 and 2 are the most impactful and the most urgent to address.

---

*Authored: 2026-05-23*  
*Source diagnostic: `docs/context/findings/s14-agent-os-diagnostic.md`*
