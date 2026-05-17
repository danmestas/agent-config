---
name: tts-announcer
version: 0.1.0
description: >
  Local, offline voice announcements for Claude Code and Pi via on-device TTS.
  Wires Notification + SubagentStop hooks so the terminal whispers progress
  instead of going *bing*. Useful when subagents run for minutes and you've
  wandered off. Use when the user wants TTS announcements, voice notifications,
  audible subagent feedback, or mentions "/tts", "speak", "announce", or
  "Supertonic". Audio never leaves the machine; no API keys.
type: hook
targets:
  - claude-code
  - pi
category:
  primary: workflow
hooks:
  Notification:
    command: hooks/notify-tts.sh
  SubagentStop:
    command: hooks/subagent-stop-tts.sh
---

# tts-announcer

Local, private voice announcements for Claude Code and Pi powered by [Supertonic](https://github.com/supertone-inc/supertonic). Audio never leaves your machine.

## How it works

Two Claude Code hooks wire into lifecycle events:

| Event | Script | What gets spoken |
|---|---|---|
| `Notification` | `hooks/notify-tts.sh` | Foreground notification text (permission prompts, attention requests) |
| `SubagentStop` | `hooks/subagent-stop-tts.sh` | Subagent completion summaries — "The Explore agent finished: scouting the wiki for ingest targets" |

The Pi adapter ships a parallel implementation under `extensions/pi-tts/` for the Pi coding agent's hook contract.

## Install

The hooks POST to a Kokoro-compatible local TTS daemon at `KOKORO_URL` (default `http://localhost:8880`). Currently backed by [supertonic-tts-daemon](https://github.com/dmestas/supertonic-tts-daemon) (on-device ONNX, no Docker):

```bash
git clone <supertonic-tts-daemon repo> ~/projects/supertonic-tts-daemon
bash ~/projects/supertonic-tts-daemon/bin/start.sh   # first run downloads ~260MB
# Or run in the background via the bundled launchctl plist — see daemon README.
```

The endpoint shape is `POST /v1/audio/speech` (OpenAI-compatible). Any local TTS service that speaks that API will work — point `KOKORO_URL` at it. The historical Kokoro Docker (`ghcr.io/hexgrad/kokoro`) is also a valid backend.

Then enable the hook through `suit-build build --target claude-code` (which emits the appropriate `.claude/settings.fragment.json` entries) or install manually with the legacy `install.sh` from the source repo.

## Voice + project naming

A stable random voice is assigned per project on first use, so different repos sound distinguishably different. The project name is always included in announcements.

## Files

- `hooks/lib.sh` — shared TTS helpers (Kokoro-compatible endpoint, audio playback, debouncing)
- `hooks/notify-tts.sh` — Notification hook entry point
- `hooks/subagent-stop-tts.sh` — SubagentStop hook entry point
- `extensions/pi-tts/` — Pi coding-agent hook variant (TS extension)

## Why "workflow" category

This skill is a **Workflow** primitive, not Tooling: it shapes the agent's *event lifecycle* (announcements at decision points, completion summaries) rather than adding a new capability the agent can invoke. The hooks fire automatically on lifecycle events; the agent doesn't call them.

## Source

Originally `github.com/danmestas/claude-tts-hooks`. Brought into agent-skills with canonical frontmatter; the source repo continues as the upstream project for non-skill packaging (Docker compose, install.sh, etc.).
