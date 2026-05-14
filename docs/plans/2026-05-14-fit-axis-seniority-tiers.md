---
title: Fit axis — seniority-tier component for the wardrobe
status: Accepted
date: 2026-05-14
owner: dan
---

# Fit axis — seniority-tier component for the wardrobe

## Summary

Add a fourth wardrobe axis — `fit` — that expresses **seniority tier**, orthogonal to outfit (role), cut (work-shape), and accessory (context bundles). Ship four fits in this PR: `junior-engineer`, `engineer`, `senior-engineer`, `staff-engineer`. The fit composes with whatever outfit/cut/accessory the session already picked, layering tier-specific skill loadout and a posture prompt body.

Architectural note: seniority is acknowledged as a semantic stretch on the wardrobe "fit" metaphor (clothes fit; engineers don't). Decision recorded in [open question 1](#composition-semantics) — kept for vocab consistency with outfit/cut/accessory.

## Architectural decisions

**Upstream (suit) change required — small.** `fit` is a new component type. Suit already runs set-algebra composition across outfit/cut/accessory; the ask is just to **register `fit` as a fourth input to the existing pipeline**. Concretely: parse `--fit <name>` CLI flag, resolve `fits/<name>/fit.md`, feed into the same compose-and-dedupe step. No new architecture in suit, just one more axis registered. Per upstream-fix policy, files at github.com/danmestas/suit first; wardrobe PR is blocked on suit landing.

**Wardrobe schema.** Fit YAML frontmatter mirrors cut's shape:

```yaml
---
name: senior-engineer
version: 1.0.0
type: fit                  # NEW component type
description: Seniority overlay for fluent engineers — adds philosophy, language tooling, and design judgment.
targets: [claude-code, codex, gemini, pi]
categories: [economy, workflow, backpressure, evolution, context-management]
enable:
  plugins: [gopls-lsp]     # LSP loadout per tier
  mcps: []
  hooks: []
skill_include: [...]
skill_exclude: [...]
include:
  rules: []
  hooks: []
  agents: []
  commands: []
---
```

**Composition semantics — Option A (decided).** Fit is a strict overlay layered onto outfit/cut/accessory composition. Set-algebra dedup (already implemented in suit) handles overlap. `--outfit engineer --fit engineer-fit` is allowed and harmlessly redundant. A fit alone (no outfit) is allowed but uncommon. B/C alternatives discussed in the prior revision are deferred indefinitely — revisit only if real friction emerges.

## Skill loadout per fit

### junior-engineer

**Posture (prompt body):** Heavy guardrails. Ask before destructive ops. Run every verification rail. Default to test-first. Explain reasoning explicitly. Trust the model to call `ExitPlanMode` when it judges a plan helps (no meta-skill needed for plan-vs-no-plan).

**Skills (in addition to core4 — writing-plans, brainstorming, subagent-driven-development, systematic-debugging):**
- `test-driven-development` (rule-heavy, force learning)
- `verification-before-completion` (don't claim done early — this is the "simple code verifier")
- `stuck-detector` (off-ramp from doom loops)
- `course-correct` (mid-task pivot)
- `pocock-caveman` (terse, decisive — rule-heavy communication)
- `pocock-handoff` (clean handoff structure — explicit reasoning trail)
- `pocock-diagnose` (reproduce → minimize → hypothesize → fix → regression — rule-heavy debugging)
- `pocock-git-guardrails` (only loads if git is present — fails closed otherwise)
- `pocock-setup-pre-commit` (optional, only on TS/JS projects)

**Explicitly skipped:** `ousterhout`, `hipp`, `tigerstyle`, `farley` — these demand mature taste-judgment. Wrong for a novice. Wardrobe-existing `tigerstyle` is the user's explicit "not tigerstyle" call.

### engineer

**Posture:** The standard. Apply rigor uniformly. Tighter than junior, less philosophy than senior.

**Skills:** The full refreshed `obra/superpowers` set (no-git-scrubbed):
- writing-plans, brainstorming, subagent-driven-development, systematic-debugging
- executing-plans, dispatching-parallel-agents
- test-driven-development, verification-before-completion
- requesting-code-review, receiving-code-review
- writing-skills (NEW from superpowers, not currently in wardrobe)
- using-superpowers (NEW meta-skill that documents how the pack composes)

**Dropped from superpowers entirely:** `using-git-worktrees`, `finishing-a-development-branch` (both built around git, 47/46 git-term hits respectively).

**Explicitly skipped:** philosophy stack (ousterhout, tigerstyle, hipp, farley), LSPs, backpressure category. Those graduate the user to `senior-engineer`.

**Sharp engineer→senior gap is intentional** — engineer = "executing well with the basics", senior = "starts thinking about design".

### senior-engineer

**Posture:** Trust convention. Design before code on non-trivial changes. Flag taste calls but decide implementation. Lean into parallel-agent dispatch and post-task reflection.

**Skills:** Everything in `engineer` fit, plus:
- BackPressure category (load via `categories: [backpressure]` or explicit `skill_include`):
  - `course-correct`, `dx-audit`, `hipp`, `norman`, `ousterhout`, `stuck-detector`, `tigerstyle`, `verification-before-completion` (most already loaded; this completes the set)
  - `golang-patterns` only via outfit (not auto-loaded by fit since fit is language-agnostic)
- `farley` (continuous delivery / testing discipline)
- `reflect` (post-task critique)

**Tigerstyle/ousterhout/hipp usage notes** (per user — these load but trigger conditionally per their own descriptions):
- `tigerstyle` triggers on low-level code review (its own description gate)
- `ousterhout` triggers after spec/code review (deep-modules / cognitive-load lens)
- `hipp` triggers when scoping a small, no-dependency stack

**LSPs:** `enable.plugins: [gopls-lsp]` (currently the only LSP plugin). Other-language LSPs auto-pick-up if/when they exist.

### staff-engineer

**Posture:** Think in systems. Prioritize boundaries and cross-cutting concerns. Mentor through review. ADR-first on architectural forks.

**Skills:** Everything in `senior-engineer` MINUS superpowers, PLUS:
- `using-spec-kit` (NEW skill — see below) replacing the superpowers workflow scaffolds (writing-plans / executing-plans / etc. still load via core4 + senior inheritance)
- All BackPressure category (same as senior)
- `architect-review` agent (likely under `agents/` — verify exists; if not, defer)

**Explicitly drops:** `course-correct` from skill_include — assumes self-correcting.

**LSPs:** same as senior.

## New skills to author / vendor

### 1. `skills/using-spec-kit/SKILL.md` (NEW)

Triggers on spec-driven workflow requests for staff-fit-flavored sessions. Body:
- Sets `SPECIFY_FEATURE_DIRECTORY=.agent-config/specs/$slug` before invoking `/speckit.*` commands
- Adds `.agent-config/specs/` to `.gitignore` if not already present
- Documents the `/speckit.constitution` → `/speckit.specify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement` chain
- Lazy-initializes spec-kit: `uvx --from git+https://github.com/github/spec-kit.git specify-cli init . --integration claude` on first invocation, only if `.specify/` doesn't exist
- Gotcha documented: `.specify/` (templates, constitution, integration.json) MUST live at repo root — it's the project marker

Note: The user wanted specKit files in temp folders, NOT worktree. Resolution: artifacts (`.agent-config/specs/<slug>/spec.md`, plan.md, tasks.md) relocate cleanly via env var. The `.specify/` config directory is a hard repo-root requirement — gitignore it instead of relocating.

### 2. `skills/pocock-{caveman,handoff,diagnose,git-guardrails,setup-pre-commit}/SKILL.md` (NEW × 5)

Vendor from `mattpocock/skills` (MIT). Preserve LICENSE attribution in a top-level `skills/pocock-*/UPSTREAM.md` per skill or in the wardrobe `THIRD_PARTY.md`.

Curation rationale: Pocock's repo is mostly senior-flavored (grill-with-docs, improve-codebase-architecture, zoom-out — taste-heavy). Junior subset is rule-heavy + process-focused.

### 3. `skills/writing-skills/SKILL.md`, `skills/using-superpowers/SKILL.md` (NEW × 2)

Vendor from obra/superpowers — these don't currently exist in wardrobe. Apply no-git scrub (writing-skills has 4 git mentions, using-superpowers has 6).

## Refreshed (rewritten) existing wardrobe skills

Replace these 10 wardrobe skills with no-git-scrubbed upstream versions of `obra/superpowers`:

| Skill | Upstream git mentions | Patch scope |
|---|---|---|
| brainstorming | 0 | clean import |
| dispatching-parallel-agents | 0 | clean import |
| requesting-code-review | 0 | clean import |
| test-driven-development | 0 | clean import |
| executing-plans | 1 (worktree) | 1-line patch |
| subagent-driven-development | 1 (worktree) | 1-line patch |
| verification-before-completion | 1 (PR) | 1-line patch |
| receiving-code-review | 1 (PR) | 1-line patch |
| writing-plans | 3 (1 worktree + 1 commit + 1 add) | 3-line patch |
| systematic-debugging | 3 (worktree) | 3-line patch |

**Blast radius:** Every outfit currently using these skills (engineer, backend, code, implementer, planner, reviewer, quick — likely all) inherits the no-git rewrite. Most of these are skill-internal nudges ("commit your progress before...", "spawn a worktree to...") that can be made tool-agnostic ("checkpoint your progress", "spawn an isolated work area") without losing meaning.

**Mitigation:** Run `npm run validate` after the rewrite; spot-check 2-3 outfits to confirm no regressions.

## Composition semantics — Option A (decided)

Fit composes as a strict overlay onto the existing set-algebra pipeline (suit already runs this across outfit/cut/accessory; fit becomes a fourth axis fed in). `--outfit code --fit senior` = code's skills ∪ senior fit's additions, dedupe. Redundancy on `--outfit engineer --fit engineer-fit` is accepted as harmless. Fit-alone launches are allowed but uncommon — outfit remains the conventional base.

## Tasks / sequence

1. **Get plan sign-off** (this doc).
2. **File suit issue** (upstream — github.com/danmestas/suit). Issue body includes the fit YAML schema and composition rules from this plan.
3. **Create feature branch** `feat/fit-axis-seniority-tiers` in wardrobe.
4. **Refresh superpowers** (10 existing skills replaced + 2 new + 2 dropped from upstream). Validate other outfits.
5. **Vendor Pocock subset** (5 new skills, preserve MIT attribution).
6. **Author using-spec-kit skill** (with env-var spec-storage trick).
7. **Author 4 fit files** (junior-engineer, engineer, senior-engineer, staff-engineer).
8. **Validate** — `npm run validate`, `npm run build --target claude-code`. Spot-check 2-3 affected outfits.
9. **Open wardrobe PR.** Block on suit issue landing.
10. **Cleanup** post-merge per pr-policy.

## Risks

- **Blast radius of superpowers refresh** — 10 existing skills rewritten. Mitigated by validation pass; could be staged into a separate refresh PR if too noisy.
- **Pocock vendor naming conflict** — if Pocock has a skill named `tdd` and wardrobe already has `test-driven-development`, the import naming (`pocock-tdd` vs absorbing into existing) needs deciding. Plan currently uses `pocock-*` prefix to avoid collision.
- **Fit-as-seniority semantic stretch** — accepted, but flag in README so future contributors know `fit` ≠ "fit for purpose" but seniority-tier.
- **Suit-side change rate** — wardrobe PR is blocked until suit lands `--fit`. If suit dev capacity is constrained, wardrobe scaffolding can land first as orphan content (suit ignores it) with PR title flagged "blocked on suit#N".

## Resolved decisions (2026-05-14 sign-off)

1. **Composition semantics:** Option A (overlay-additive). Suit already does set algebra on outfit/cut/accessory — fit just registers as a fourth input.
2. **Superpowers refresh blast radius:** single PR with validation pass; do not stage a separate refresh-first PR.
3. **Pocock import naming:** `pocock-*` prefix on all imported skills (`pocock-caveman`, `pocock-diagnose`, etc.) to avoid collision and signal provenance.
4. **Architect-review agent:** confirmed exists at `agents/architect-review/`. Staff fit wires it in via `include.agents`.
