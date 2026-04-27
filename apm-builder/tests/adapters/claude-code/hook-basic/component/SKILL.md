---
name: tts-announcer
version: 1.0.0
description: TTS announcements
type: hook
targets:
  - claude-code
hooks:
  Stop:
    command: hooks/announce.sh
---

# TTS Announcer

Announces task completion.
