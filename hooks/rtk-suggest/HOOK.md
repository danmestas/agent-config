---
name: rtk-suggest
version: 1.0.0
description: >
  Suggests rtk-equivalent commands as PreToolUse system messages when Claude Code
  is about to run a raw command that rtk can wrap for 60-90% token savings.
  Detects git, gh, cargo, pnpm, vitest, tsc, eslint, prettier, playwright, prisma,
  docker, kubectl, curl, wget, cat, rg/grep, ls, tree, find, diff, head. Pure
  suggestion: the hook never modifies the command and always exits "allow", so the
  raw command runs unchanged if rtk is missing. Use when you want passive hints
  without auto-rewrites; pair with rtk-rewrite for transparent substitution.
type: hook
targets:
  - claude-code
category:
  primary: economy
license:
  upstream: Apache-2.0
  source: rtk-ai/rtk@3ba1634
  path: .claude/hooks/rtk-suggest.sh
hooks:
  PreToolUse:
    matcher: Bash
    command: hooks/rtk-suggest.sh
---

# rtk-suggest

Passive RTK awareness. Whenever Claude Code is about to invoke a Bash command that rtk has a filter for, this hook surfaces a one-line system reminder ("rtk available: `rtk git log` (60-90% token savings)") without changing the command. The agent decides whether to swap.

## Behavior

- Reads the PreToolUse JSON payload from stdin and extracts `tool_input.command`.
- Skips commands that already start with `rtk ` or pipe through `rtk`.
- Skips heredocs (`<<`) since substitution would be unsafe.
- Pattern-matches the first sub-command (everything before pipes, `&&`, `||`) against rtk's known surface:
  - **Git**: `git status|diff|log|add|commit|push|pull|branch|fetch|stash|show`
  - **GitHub CLI**: `gh pr|issue|run …`
  - **Cargo**: `cargo test|build|clippy|check|install|nextest|fmt`
  - **File ops**: `cat`, `rg`/`grep`, `ls`, `tree`, `find`, `diff`, `head -N file`
  - **JS/TS**: `vitest`, `tsc`, `eslint`, `prettier`, `playwright`, `prisma`
  - **Containers**: `docker ps|images|logs`, `kubectl get|logs`
  - **Network**: `curl`, `wget`
  - **pnpm**: `pnpm list|ls|outdated`
- Emits a `PreToolUse` hook response with `permissionDecision: allow` and a `systemMessage` containing the suggestion. The original command still runs.

## Graceful degradation

The hook does **not** check whether `rtk` is installed. If rtk is absent, the system message is still printed but harmless — the agent reads it as advice, runs the raw command anyway, and the workflow proceeds. If you want auto-rewriting that respects rtk's permission rules (and silently skips when rtk is missing), use [`rtk-rewrite`](../rtk-rewrite/HOOK.md) instead.

## Files

- `hooks/rtk-suggest.sh` — payload script wired to `PreToolUse:Bash`.

## Pairs with

- `hooks/rtk-rewrite` — transparent auto-substitution. Don't enable both; pick one.
- `skills/rtk-tdd`, `skills/rtk-triage`, `skills/rtk-pr-review` — the rtk-specific skill pack.

## Source

Vendored from `github.com/rtk-ai/rtk` at commit `3ba1634` (`.claude/hooks/rtk-suggest.sh`). Apache-2.0; see `THIRD_PARTY_LICENSES.md`.
