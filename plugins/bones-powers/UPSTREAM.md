# Upstream Provenance

`bones-powers` was forked from [superpowers](https://github.com/obra/superpowers) v5.0.7 on 2026-04-29.

This is a **one-time copy + diverge**. There is no automated resync from upstream. Future upstream changes must be hand-merged.

Set B (test-driven-development, systematic-debugging, verification-before-completion, requesting-code-review, receiving-code-review) added 2026-04-30 in v0.2.0.
v0.3.0 (2026-04-30): added bones-native git push + PR flow to `finishing-a-bones-leaf`. Depends on `bones apply` subcommand (forthcoming bones release).

## Per-file provenance

| `bones-powers` file | Upstream source (`superpowers v5.0.7`) | Treatment |
|---|---|---|
| `hooks/run-hook.cmd` | `hooks/run-hook.cmd` | verbatim copy |
| `hooks/session-start` | `hooks/session-start` | rewritten — gated on `.bones/repo.fossil` marker, reads `using-bones-powers` instead of `using-superpowers` |
| `hooks/hooks.json` | `hooks/hooks.json` | identical structure, identical schema |
| `skills/using-bones-powers/SKILL.md` | `skills/using-superpowers/SKILL.md` | refactored — replaces "you have superpowers" with "you have bones-powers"; adds bones-primitives vocabulary section; drops codex/copilot tool-mapping refs |
| `skills/brainstorming/SKILL.md` | `skills/brainstorming/SKILL.md` | refactored — spec output path → `docs/bones-powers/specs/`; commit mechanic → `bones repo add` + `bones repo ci` |
| `skills/brainstorming/spec-document-reviewer-prompt.md` | same | verbatim copy |
| `skills/brainstorming/visual-companion.md` | same | refactored — replaced `.superpowers/brainstorm/` runtime paths with `.bones-powers/brainstorm/` |
| `skills/writing-plans/SKILL.md` | `skills/writing-plans/SKILL.md` | refactored — adds `[slot: X]` annotation requirement; emits bones tasks per spec § 4.4 |
| `skills/writing-plans/plan-document-reviewer-prompt.md` | same | verbatim copy |
| `skills/executing-plans/SKILL.md` | `skills/executing-plans/SKILL.md` | refactored — replaces TodoWrite plan-tracking with `bones tasks list/claim/close` |
| `skills/subagent-driven-development/SKILL.md` | `skills/subagent-driven-development/SKILL.md` | refactored — implementer dispatch becomes `bones swarm join --slot --task-id` |
| `skills/subagent-driven-development/implementer-prompt.md` | same | refactored — TodoWrite a fresh checklist after `swarm join` |
| `skills/subagent-driven-development/spec-reviewer-prompt.md` | same | verbatim copy |
| `skills/subagent-driven-development/code-quality-reviewer-prompt.md` | same | verbatim copy |
| `skills/dispatching-parallel-agents/SKILL.md` | same | refactored — parallel = N concurrent slot sessions |
| `skills/using-bones-swarm/SKILL.md` | `skills/using-git-worktrees/SKILL.md` | full rewrite — bones swarm flow (join/cwd/work/commit/close) |
| `skills/finishing-a-bones-leaf/SKILL.md` | `skills/finishing-a-development-branch/SKILL.md` | full rewrite — fan-in/keep/abandon menu instead of merge/PR/keep/discard. v0.3 added optional ## After fan-in: push to git remote section using bones apply |
| `skills/test-driven-development/SKILL.md` | same | refactored — `bones-powers:` prefix swap; description gains "in a bones workspace" qualifier |
| `skills/test-driven-development/testing-anti-patterns.md` | same | refactored — `bones-powers:` prefix swap |
| `skills/systematic-debugging/SKILL.md` | same | refactored — prefix swap; new "## Bones context" sub-section noting `bones repo status`, leaf logs, sibling-slot reproduction |
| `skills/systematic-debugging/root-cause-tracing.md` | same | refactored — prefix swap |
| `skills/systematic-debugging/defense-in-depth.md` | same | refactored — prefix swap |
| `skills/systematic-debugging/condition-based-waiting.md` | same | refactored — prefix swap |
| `skills/systematic-debugging/condition-based-waiting-example.ts` | same | verbatim copy |
| `skills/systematic-debugging/find-polluter.sh` | same | verbatim copy |
| `skills/verification-before-completion/SKILL.md` | same | refactored — `git status` → `bones repo status`; test-run cwd note via `bones swarm cwd`; prefix swap |
| `skills/requesting-code-review/SKILL.md` | same | refactored — `git diff` → `bones repo diff <rev>`; reviewer-as-sibling-slot note; prefix swap |
| `skills/requesting-code-review/code-reviewer.md` | same | refactored — `git diff` → `bones repo diff <rev>`; fossil rev guidance for BASE/HEAD; prefix swap |
| `skills/receiving-code-review/SKILL.md` | same | refactored — re-dispatch loop pointer to `bones-powers:subagent-driven-development`; prefix swap |

**Skipped upstream files (Set B):** The following upstream files from `systematic-debugging/` are NOT copied — they are upstream meta/QA material, not user-facing skill content: `CREATION-LOG.md` (internal authoring history), `test-academic.md`, `test-pressure-1.md`, `test-pressure-2.md`, `test-pressure-3.md` (upstream skill QA/dogfood material).

Upstream license: MIT (Jesse Vincent / fsck.com).

## Resyncing from upstream (manual procedure)

1. Identify the latest installed upstream version:
   ```
   ls ~/.claude/plugins/cache/claude-plugins-official/superpowers/ | sort -V | tail -1
   ```
   Confirm by reading that path's manifest:
   ```
   cat ~/.claude/plugins/cache/claude-plugins-official/superpowers/<version>/.claude-plugin/plugin.json | jq .version
   ```
2. For each file in the table above marked "verbatim copy", overwrite with the upstream copy.
3. For each "refactored" or "full rewrite" file, manually merge upstream changes into the bones-powers version.
4. Update this file's "forked from v5.0.7 on 2026-04-29" header.
