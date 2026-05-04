---
name: tts-announcer
version: 0.1.0
description: >
  Local, offline voice announcements for Claude Code and Pi via Kokoro-82M TTS.
  Wires Notification + SubagentStop hooks so the terminal whispers progress
  instead of going *bing*. Useful when subagents run for minutes and you've
  wandered off. Use when the user wants TTS announcements, voice notifications,
  audible subagent feedback, or mentions "/tts", "speak", "announce", or
  "Kokoro". Audio never leaves the machine; no API keys.
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

Local, private voice announcements for Claude Code and Pi powered by [Kokoro-82M](https://github.com/hexgrad/kokoro). Audio never leaves your machine.

## How it works

Two Claude Code hooks wire into lifecycle events:

| Event | Script | What gets spoken |
|---|---|---|
| `Notification` | `hooks/notify-tts.sh` | Foreground notification text (permission prompts, attention requests) |
| `SubagentStop` | `hooks/subagent-stop-tts.sh` | Subagent completion summaries — "The Explore agent finished: scouting the wiki for ingest targets" |

The Pi adapter ships a parallel implementation under `extensions/pi-tts/` for the Pi coding agent's hook contract.

## Install

The hooks shell out to a Kokoro container (Docker). Install Kokoro once:

```bash
docker run --name kokoro -d -p 8880:8880 ghcr.io/hexgrad/kokoro:latest
```

Then enable the hook through `suit-build build --target claude-code` (which emits the appropriate `.claude/settings.fragment.json` entries) or install manually with the legacy `install.sh` from the source repo.

## Voice + project naming

A stable random voice is assigned per project on first use, so different repos sound distinguishably different. The project name is always included in announcements.

## Files

- `hooks/lib.sh` — shared TTS helpers (Kokoro endpoint, audio playback, debouncing)
- `hooks/notify-tts.sh` — Notification hook entry point
- `hooks/subagent-stop-tts.sh` — SubagentStop hook entry point
- `extensions/pi-tts/` — Pi coding-agent hook variant (TS extension)

## Why "workflow" category

This skill is a **Workflow** primitive, not Tooling: it shapes the agent's *event lifecycle* (announcements at decision points, completion summaries) rather than adding a new capability the agent can invoke. The hooks fire automatically on lifecycle events; the agent doesn't call them.

## Source

Originally `github.com/danmestas/claude-tts-hooks`. Brought into agent-skills with canonical frontmatter; the source repo continues as the upstream project for non-skill packaging (Docker compose, install.sh, etc.).
