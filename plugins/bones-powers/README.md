# bones-powers

Bones-native workflow skills, forked from [superpowers](https://github.com/obra/superpowers) v5.0.7. Brainstorming → planning → execution → fan-in, expressed in bones primitives (slots, leaves, hub/trunk, swarm sessions, persistent task graph) instead of git worktrees + TodoWrite.

## What's in the box

13 skills:

| Skill | Phase | What changed vs. upstream |
|---|---|---|
| `using-bones-powers` | Bootstrap meta | Renamed from `using-superpowers`; speaks bones vocabulary. v0.4 adds harness tool-name mapping refs (codex/gemini/copilot/pi). |
| `brainstorming` | Design | Spec output `docs/bones-powers/specs/`; commits via `bones repo ci`. |
| `writing-plans` | Plan | Plans annotate `[slot: X]` per task; emit `bones tasks` graph at end. |
| `executing-plans` | Single-session execution | TodoWrite plan-tracking replaced with `bones tasks list/claim/close`. |
| `subagent-driven-development` | Parallel execution | Each implementer = `bones swarm join` (slot + claim + worktree atomic). |
| `dispatching-parallel-agents` | Parallel debug | N concurrent slot sessions; `bones tasks aggregate` for rollup. |
| `using-bones-swarm` | Workspace primitive | Full rewrite — `swarm join → cwd → work → commit → close`. Replaces `using-git-worktrees`. |
| `finishing-a-bones-leaf` | Integration | `swarm fan-in` to trunk (with `--dry-run` preview); optionally materialize via `bones apply` + push + open PR. Replaces `finishing-a-development-branch`. |
| `test-driven-development` | Discipline | Forked v5.0.7; `bones-powers:` prefix swap. |
| `systematic-debugging` | Discipline | Forked v5.0.7; new "Bones context" section (`bones repo status`, leaf logs, sibling-slot repro). |
| `verification-before-completion` | Discipline | Forked v5.0.7; `git status` → `bones repo status`; test-run cwd note. |
| `requesting-code-review` | Discipline | Forked v5.0.7; `git diff` → `bones repo diff <rev>`; reviewer-as-sibling-slot note. |
| `receiving-code-review` | Discipline | Forked v5.0.7; re-dispatch loop pointer to subagent-driven-development. |

## Hybrid task model

| Layer | Tool | Lifetime |
|---|---|---|
| Plan-level | `bones tasks` | Durable, cross-session, slot-routable, claimable |
| In-session | TodoWrite | Ephemeral; one fresh list per claimed bones task |

Plan steps go to `bones tasks`. Micro-steps inside a single agent's head go to TodoWrite. Never the reverse.

## Activation

The plugin's SessionStart hook auto-injects the `using-bones-powers` meta-skill **only when cwd contains `.bones/repo.fossil`**. Outside a bones workspace, the hook is silent.

If you have both `superpowers` and `bones-powers` installed and you're in a bones workspace, both meta-skills bootstrap. Acceptable; gives you both vocabularies.

## Multi-harness support

v0.4 ships bones-powers across 6 harness targets via apm-builder:

- **claude-code** — primary target; full plugin (skills + hook + manifest)
- **apm** — neutral package format
- **codex** — Codex CLI (AGENTS.md based)
- **gemini** — Gemini CLI
- **copilot** — GitHub Copilot CLI
- **pi** — Pi runtime

Tool-name translation between Claude Code and other harnesses lives in `using-bones-powers/references/<harness>-tools.md` (codex, gemini, copilot, pi). The agent reads these mappings at session start via the gated SessionStart hook and translates implicitly when reading downstream skills.

Build per-target output via `npm run build -- --target <target>` (or `--target all` for everything).

## Out of v0.4

- Automated test suite
- Suppress-superpowers escape valve
- Auto-resync from upstream

See `UPSTREAM.md` for provenance and the design spec at `docs/superpowers/specs/2026-04-29-bones-powers-design.md` for full rationale.
