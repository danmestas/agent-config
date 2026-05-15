---
name: caveman-mode-tracker
version: 1.0.0
description: >
  Tracks the active caveman mode across a Claude Code session and intercepts
  `/caveman-stats` to inject real token-usage numbers as a blocked-decision
  reason. Watches user prompts for `/caveman[-commit|-review|-compress]`
  commands plus natural-language activation ("turn on caveman", "stop
  caveman") and writes the resulting mode to a symlink-safe flag file. On
  every user turn while a mode is active, re-injects a one-line system
  reminder so competing plugin instructions can't crowd caveman out of model
  attention. Use when running the caveman skill pack and you want the mode
  to actually persist + the `/caveman-stats` slash command to return live
  numbers.
type: hook
targets:
  - claude-code
category:
  primary: economy
license:
  upstream: MIT
  source: JuliusBrussee/caveman@63a91ec
  path: src/hooks/caveman-mode-tracker.js
hooks:
  UserPromptSubmit:
    command: hooks/caveman-mode-tracker.js
    timeout: 5
---

# caveman-mode-tracker

UserPromptSubmit hook that owns the lifecycle of the caveman flag file (`~/.claude/.caveman-active`) and the `/caveman-stats` slash-command intercept.

## Behavior

- Reads the prompt JSON payload from stdin.
- Recognises explicit slash commands: `/caveman`, `/caveman <mode>`, `/caveman-commit`, `/caveman-review`, `/caveman-compress`. Valid modes are `lite | full | ultra | wenyan-lite | wenyan | wenyan-ultra | off`.
- Recognises natural-language activation: "activate caveman", "turn on caveman", "talk like caveman", "caveman mode on" — and matching deactivation phrases ("stop caveman", "normal mode").
- Writes the resolved mode to the flag file via `safeWriteFlag` (atomic write + `O_NOFOLLOW` + ownership check on the parent dir + size-capped reads). Refuses symlinks. Designed so a local attacker who plants `~/.claude/.caveman-active -> ~/.ssh/id_rsa` cannot exfiltrate the target through the statusline / per-turn reinforcement readers.
- Intercepts `/caveman-stats` (with optional `--share`, `--all`, `--since <Nd|Nh>`): runs `caveman-stats.js` against the current session transcript and returns the formatted output as a `decision: "block"` reason. The user sees the numbers immediately; the model never has to compute or estimate them.
- On every turn while a mode is active, emits a `UserPromptSubmit` hook response with an `additionalContext` reminder ("CAVEMAN MODE ACTIVE (<mode>). Drop articles/filler...") so the style persists across long sessions where competing plugin instructions accumulate.
- Silent-fails on any IO error — the hook is best-effort, never blocks the user's prompt unless intentionally on `/caveman-stats`.

## Files

- `hooks/caveman-mode-tracker.js` — the entry point wired to `UserPromptSubmit`.
- `hooks/caveman-config.js` — shared resolver: default-mode lookup chain (`CAVEMAN_DEFAULT_MODE` env var → `$XDG_CONFIG_HOME/caveman/config.json` → `~/.config/caveman/config.json` → `%APPDATA%\caveman\config.json` → `'full'`), plus symlink-safe `safeWriteFlag` / `readFlag` / `appendFlag` / `readHistory` primitives and the canonical `VALID_MODES` whitelist.
- `hooks/caveman-stats.js` — reads the active Claude Code session JSONL, sums output / cache-read tokens, derives an estimated savings figure from the upstream benchmarks (mean per-task 65% for `full` mode, no estimate for other modes until benchmarked), and appends a snapshot line to `~/.claude/.caveman-history.jsonl` for lifetime aggregation via `--all` / `--since`.

`caveman-mode-tracker.js` requires the other two via `./caveman-config` and `./caveman-stats`, so all three must live in the same directory.

## Configuration

- `CAVEMAN_DEFAULT_MODE` (env) — overrides config-file `defaultMode`. Useful for per-shell defaults.
- `~/.config/caveman/config.json` (`{ "defaultMode": "lite" }`) — persistent default.
- `CAVEMAN_DEBUG=1` — emit stderr diagnostics when a flag write is refused (symlink ownership mismatch, etc.).

## Pairs with

- `skills/caveman`, `skills/caveman-commit`, `skills/caveman-review`, `skills/caveman-compress`, `skills/caveman-help`, `skills/caveman-stats` — the caveman skill pack.
- `skills/cavecrew` + `agents/cavecrew-investigator|-builder|-reviewer` — caveman-style subagent orchestration.

## Source

Vendored from `github.com/JuliusBrussee/caveman` at commit `63a91ec` (`src/hooks/caveman-mode-tracker.js`, `src/hooks/caveman-config.js`, `src/hooks/caveman-stats.js`). MIT; see `skills/THIRD_PARTY_LICENSES.md`.
