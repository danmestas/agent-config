---
name: rtk-pre-commit-format
version: 1.0.0
description: >
  Auto-formats Rust code with `cargo fmt --all` and blocks the commit if
  `cargo clippy --all-targets` finds compilation errors (warnings still pass).
  Wired to PreToolUse:Bash and triggers when Claude Code is about to run a
  `git commit`. Use only in Rust projects with rtk-style discipline — the hook
  bails noisily if cargo is missing.
type: hook
targets:
  - claude-code
category:
  primary: workflow
license:
  upstream: Apache-2.0
  source: rtk-ai/rtk@3ba1634
  path: .claude/hooks/bash/pre-commit-format.sh
hooks:
  PreToolUse:
    matcher: Bash
    command: hooks/rtk-pre-commit-format.sh
---

# rtk-pre-commit-format

Pre-commit format-and-error-check for Rust projects, lifted from rtk's own development pre-commit hook. Before a `git commit` runs, this hook:

1. Runs `cargo fmt --all` to auto-format the working tree.
2. Runs `cargo clippy --all-targets` and greps the output for `error:`. If any clippy errors exist, the hook fails and the commit is blocked.

Clippy warnings are allowed — only hard errors block.

## Activation

This hook is intended to be installed only in Rust repos that follow rtk's discipline (zero clippy errors, `cargo fmt` clean tree). Outside Rust projects, leave it off — `cargo fmt` will fail with a non-Rust complaint and noise up every Bash invocation.

The wardrobe build wires this hook to `PreToolUse:Bash` unconditionally; if your repo has no Cargo project, exclude it via your outfit or accessory selection.

## Files

- `hooks/rtk-pre-commit-format.sh` — the cargo fmt + clippy check.

## Source

Vendored from `github.com/rtk-ai/rtk` at commit `3ba1634` (`.claude/hooks/bash/pre-commit-format.sh`). Apache-2.0; see `THIRD_PARTY_LICENSES.md`.
