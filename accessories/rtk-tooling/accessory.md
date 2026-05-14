---
name: rtk-tooling
version: 1.0.0
type: accessory
description: Use when working in a project where rtk (Rust Token Killer) is installed and you want its token-saving rewrites, triage workflows, and review skills loaded. Requires the `rtk` binary on PATH — wardrobe does not auto-install.
targets:
  - claude-code
  - codex
  - gemini
  - pi
include:
  skills:
    - rtk-code-simplifier
    - rtk-design-patterns
    - rtk-issue-triage
    - rtk-performance
    - rtk-pr-review
    - rtk-pr-triage
    - rtk-repo-recap
    - rtk-tdd
    - rtk-tdd-rust
    - rtk-triage
    - rtk-security-guardian
    - rtk-ship
  rules: []
  hooks:
    - rtk-suggest
    - rtk-rewrite
  agents:
    - rtk-testing-specialist
    - rtk-rust-expert
  commands: []
---

# rtk-tooling accessory

Layer this on any session that runs shell commands inside a project where `rtk` (Rust Token Killer) is installed. Loads rtk's full skill pack, both review/testing agents, and the two PreToolUse hooks that transparently rewrite eligible commands through `rtk proxy …`.

## What this loads

- **Skills (12)** — `rtk-code-simplifier`, `rtk-design-patterns`, `rtk-issue-triage`, `rtk-performance`, `rtk-pr-review`, `rtk-pr-triage`, `rtk-repo-recap`, `rtk-tdd`, `rtk-tdd-rust`, `rtk-triage`, `rtk-security-guardian`, `rtk-ship`. Covers triage, TDD, review, perf, and shipping workflows that rtk's authors curated for high-leverage Claude sessions.
- **Agents** — `rtk-testing-specialist` (test authorship + coverage), `rtk-rust-expert` (deep Rust review).
- **Hooks** — `rtk-suggest` (PreToolUse advisor that flags rewrite candidates), `rtk-rewrite` (PreToolUse rewriter that routes eligible Bash commands through `rtk proxy`). Both probe `command -v rtk` and graceful-pass when the binary is absent, so loading this accessory in an rtk-less environment is safe — just noisy on the suggest side.

## Requires

The `rtk` binary on PATH. Wardrobe does not install rtk. From rtk's README:

```bash
# Homebrew (recommended)
brew install rtk

# Linux/macOS quick install (installs to ~/.local/bin)
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh

# From source
cargo install --git https://github.com/rtk-ai/rtk
```

Verify with `rtk --version` and `rtk gain`. If `rtk gain` errors with "command not found" but `rtk --version` works, you have the wrong package — the `rtk` crate on crates.io is a different project (Rust Type Kit). Install from `rtk-ai/rtk` instead.

## Token savings

rtk's CLI proxy reports 60–90% token savings on common dev operations (git, file inspection, build/test output) by filtering and summarizing output before it reaches the model.

## When NOT to load

- Sessions that never run shell commands (pure planning, doc review).
- Sessions in environments where rtk is not installed and you don't want the rtk-suggest hook reminding you on every turn.
- Sessions where the host outfit already wraps shell execution differently (e.g., context-mode's `ctx_batch_execute` path) — there's no harm in stacking them, but rtk's rewrites only fire when the model actually calls Bash directly.

## Pairing

- `engineer` outfit + `--accessory rtk-tooling` — recommended default for Rust-flavored engineering work.
- `--cut executing` or `--cut debugging` — rtk's review/triage skills compose well with both.
- `--accessory pr-policy` — pairs naturally; rtk's `rtk-pr-review` and `rtk-ship` skills assume PR-based workflow.
