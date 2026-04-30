# Upstream Provenance

`bones-powers` was forked from [superpowers](https://github.com/obra/superpowers) v5.0.7 on 2026-04-29.

This is a **one-time copy + diverge**. There is no automated resync from upstream. Future upstream changes must be hand-merged.

## Per-file provenance

| `bones-powers` file | Upstream source (`superpowers v5.0.7`) | Treatment |
|---|---|---|
| `hooks/run-hook.cmd` | `hooks/run-hook.cmd` | verbatim copy |
| `hooks/session-start` | `hooks/session-start` | rewritten — gated on `.bones/repo.fossil` marker, reads `using-bones-powers` instead of `using-superpowers` |
| `hooks/hooks.json` | `hooks/hooks.json` | identical structure, identical schema |
| `skills/using-bones-powers/SKILL.md` | `skills/using-superpowers/SKILL.md` | refactored — replaces "you have superpowers" with "you have bones-powers"; adds bones-primitives vocabulary section; drops codex/copilot tool-mapping refs |
| `skills/brainstorming/SKILL.md` | `skills/brainstorming/SKILL.md` | refactored — spec output path → `docs/bones-powers/specs/`; commit mechanic → `bones repo add` + `bones repo ci` |
| `skills/brainstorming/spec-document-reviewer-prompt.md` | same | verbatim copy |
| `skills/brainstorming/visual-companion.md` | same | verbatim copy |
| `skills/writing-plans/SKILL.md` | `skills/writing-plans/SKILL.md` | refactored — adds `[slot: X]` annotation requirement; emits bones tasks per spec § 4.4 |
| `skills/writing-plans/plan-document-reviewer-prompt.md` | same | verbatim copy |
| `skills/executing-plans/SKILL.md` | `skills/executing-plans/SKILL.md` | refactored — replaces TodoWrite plan-tracking with `bones tasks list/claim/close` |
| `skills/subagent-driven-development/SKILL.md` | `skills/subagent-driven-development/SKILL.md` | refactored — implementer dispatch becomes `bones swarm join --slot --task-id` |
| `skills/subagent-driven-development/implementer-prompt.md` | same | refactored — TodoWrite a fresh checklist after `swarm join` |
| `skills/subagent-driven-development/spec-reviewer-prompt.md` | same | verbatim copy |
| `skills/subagent-driven-development/code-quality-reviewer-prompt.md` | same | verbatim copy |
| `skills/dispatching-parallel-agents/SKILL.md` | same | refactored — parallel = N concurrent slot sessions |
| `skills/using-bones-swarm/SKILL.md` | `skills/using-git-worktrees/SKILL.md` | full rewrite — bones swarm flow (join/cwd/work/commit/close) |
| `skills/finishing-a-bones-leaf/SKILL.md` | `skills/finishing-a-development-branch/SKILL.md` | full rewrite — fan-in/keep/abandon menu instead of merge/PR/keep/discard |

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
