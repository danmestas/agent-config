---
name: tts-announcer
version: 1.0.0
description: TTS announcements when Codex stops
type: hook
targets:
  - codex
hooks:
  Stop:
    command: hooks/announce.sh
  PreToolUse:
    command: hooks/audit.sh
    matcher: Bash
---

# TTS Announcer

Announces task completion via TTS.
