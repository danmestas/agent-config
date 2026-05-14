---
name: using-spec-kit
version: 1.0.0
targets: [claude-code]
type: skill
description: Use when the user wants spec-driven development on a non-trivial change (e.g. "let's spec this", "write a constitution", "/speckit.*", or any staff-tier workflow starting from "what should this be" rather than "what should this do"). Drives spec → plan → tasks → impl via GitHub spec-kit, with artifacts in .agent-config/specs/.
category:
  primary: workflow
---

# Using Spec-Kit

## Overview

Spec-kit (github.com/github/spec-kit) is GitHub's spec-driven development toolkit. The philosophy: write the spec before the plan, the plan before the tasks, the tasks before the code — and treat each artifact as a reviewable hand-off, not a throwaway scratchpad. Reach for spec-kit when the change is large enough that "what is this, exactly?" is a question worth answering on paper first.

**Announce at start:** "I'm using the using-spec-kit skill — running spec-driven workflow."

## Trigger conditions

Activate when any of the following hold:

- User invokes a `/speckit.*` slash command directly
- Session is staff-tier and the task involves architectural decisions, system design, public API shape, or cross-cutting changes
- User says "let's spec this", "write a constitution for X", "draft a PRD", "spec-driven this", or asks for the spec → plan → tasks flow by name
- The brief is fuzzy enough that authoring the spec is itself part of the work

Do **not** activate for tight, well-scoped changes where a plan or direct execution is sufficient. Spec-kit is heavy; reserve it for work where the upfront artifact pays for itself.

## Fit check (push back if mismatched)

If the session is in a junior or general `engineer` fit, push back gently before proceeding — spec-kit is meant for staff-flavored work where the agent owns the spec-shape decisions. Surface the mismatch in one sentence and let the user redirect or override.

## First-time setup (lazy)

If `.specify/` does not exist at the repo root, install the toolkit before invoking any `/speckit.*` command:

```bash
uvx --from git+https://github.com/github/spec-kit.git specify-cli init . --integration claude
```

This installs `.claude/commands/speckit.*.md` (the slash commands) plus the `.specify/` scaffolding (templates, constitution, integration.json, bash helpers). Verify success by checking for `.specify/integration.json`.

If `uv` / `uvx` is not installed, fail fast with a clear message — point the user at https://docs.astral.sh/uv/ and stop. Do not try to work around it.

## Artifact location override

Spec-kit defaults to `<repo_root>/specs/<NNN-slug>/`. Wardrobe wants spec artifacts gitignored. **Always** set `SPECIFY_FEATURE_DIRECTORY` before invoking specify commands:

```bash
FEATURE_SLUG="<descriptive-kebab-slug>"
export SPECIFY_FEATURE_DIRECTORY=".agent-config/specs/$(echo "$FEATURE_SLUG" | tr ' ' '-' | tr 'A-Z' 'a-z')"
mkdir -p "$SPECIFY_FEATURE_DIRECTORY"
```

The env var takes precedence over spec-kit's auto-numbering. Confirm `.agent-config/specs/` is in `.gitignore`; add it if not.

`.specify/` itself (templates, constitution, integration.json) **must** stay at the repo root — it is spec-kit's project marker and cannot be relocated. Gitignore it if you don't want it tracked.

## The five-step flow

Run these in order. Each writes its artifact into `$SPECIFY_FEATURE_DIRECTORY` (or `.specify/memory/` for the constitution).

- `/speckit.constitution` — establish project-wide principles (rules the agent should always honor). One-time per repo. Skip if the constitution already exists and still reflects the project.
- `/speckit.specify` — author the spec for this feature (problem, goals, non-goals, requirements, acceptance criteria). Required.
- `/speckit.plan` — derive an implementation plan from the spec (architecture, file structure, sequencing). Required.
- `/speckit.tasks` — break the plan into individually-executable tasks. Required for any non-trivial feature; skip only when the plan is a single small task.
- `/speckit.implement` — execute task-by-task. Optional — the user may prefer to hand tasks off to a different execution skill (e.g. `executing-plans`, `subagent-driven-development`) or run them manually.

Optional: `/speckit.taskstoissues` if the user wants tasks materialized as GitHub issues for a separate execution flow.

## Caveats

- **Do not wrap or shadow the `/speckit.*` slash commands.** They're well-designed and self-describing. This skill teaches *when* and *how* to use them, not what they do internally. Invoke them directly.
- **`.specify/` must live at repo root.** Project marker; not relocatable. Gitignore it (and `.agent-config/specs/`) rather than fight it.
- **`uv` / `uvx` required.** Spec-kit is Python-tooled. Fail with a clear message if absent; do not silently degrade.
- **Spec-kit assumes one feature in flight per slug.** If the user is iterating on multiple features in parallel, give each its own `SPECIFY_FEATURE_DIRECTORY`.
- **The agent authors the artifacts; the bundled scripts handle plumbing** (numbering, branching, path conventions). Trust the scripts — don't second-guess paths or filenames they emit.
- **Don't conflate spec-kit's plan with wardrobe's `writing-plans` skill.** Spec-kit's plan is the architectural shape derived from the spec; `writing-plans` produces a bite-sized task graph for bones execution. They can compose (spec-kit plan → wardrobe plan), but they are not the same artifact.

## Handoff

After `/speckit.tasks` produces the task list, the user may want to execute via:

1. `/speckit.implement` — spec-kit's built-in execution loop
2. `executing-plans` / `subagent-driven-development` — wardrobe's execution skills, if the tasks have been materialized into bones
3. Manual execution by the user

Ask which mode they want; default to `/speckit.implement` if no preference.
