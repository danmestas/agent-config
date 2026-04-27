---
name: tts-announcer
version: 1.0.0
description: Announces task completion via TTS
type: hook
targets: [pi]
hooks:
  Stop:
    command: hooks/announce.sh
  PostToolUse:
    command: hooks/log.sh
    matcher: "Bash"
---

# TTS Announcer

A hook that runs a shell script on task completion.
