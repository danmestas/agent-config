# bones-powers

Bones-native workflow skills, forked from [superpowers](https://github.com/obra/superpowers) v5.0.7. Brainstorming → planning → execution → fan-in, expressed in bones primitives (slots, leaves, hub/trunk, swarm sessions, persistent task graph) instead of git worktrees + TodoWrite.

## What's in the box

8 skills:

| Skill | Phase | What changed vs. upstream |
|---|---|---|
| `using-bones-powers` | Bootstrap meta | Renamed from `using-superpowers`; speaks bones vocabulary. |
| `brainstorming` | Design | Spec output `docs/bones-powers/specs/`; commits via `bones repo ci`. |
| `writing-plans` | Plan | Plans annotate `[slot: X]` per task; emit `bones tasks` graph at end. |
| `executing-plans` | Single-session execution | TodoWrite plan-tracking replaced with `bones tasks list/claim/close`. |
| `subagent-driven-development` | Parallel execution | Each implementer = `bones swarm join` (slot + claim + worktree atomic). |
| `dispatching-parallel-agents` | Parallel debug | N concurrent slot sessions; `bones tasks aggregate` for rollup. |
| `using-bones-swarm` | Workspace primitive | Full rewrite — `swarm join → cwd → work → commit → close`. Replaces `using-git-worktrees`. |
| `finishing-a-bones-leaf` | Integration | `swarm fan-in` to trunk (with `--dry-run` preview), keep, or abandon. Replaces `finishing-a-development-branch`. |

## Hybrid task model

| Layer | Tool | Lifetime |
|---|---|---|
| Plan-level | `bones tasks` | Durable, cross-session, slot-routable, claimable |
| In-session | TodoWrite | Ephemeral; one fresh list per claimed bones task |

Plan steps go to `bones tasks`. Micro-steps inside a single agent's head go to TodoWrite. Never the reverse.

## Activation

The plugin's SessionStart hook auto-injects the `using-bones-powers` meta-skill **only when cwd contains `.bones/repo.fossil`**. Outside a bones workspace, the hook is silent.

If you have both `superpowers` and `bones-powers` installed and you're in a bones workspace, both meta-skills bootstrap. Acceptable; gives you both vocabularies.

## Out of v0

- TDD / debugging / verification / code-review skills (use upstream `superpowers` for those)
- Codex/Gemini/Cursor adapters
- Automated test suite
- Push-to-git-remote step in `finishing-a-bones-leaf`
- Suppress-superpowers escape valve

See `UPSTREAM.md` for provenance and the design spec at `docs/superpowers/specs/2026-04-29-bones-powers-design.md` for full rationale.
