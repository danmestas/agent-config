#!/usr/bin/env bash
# Claude Code Notification hook — speaks the notification message via local TTS,
# prefixed with the project name so you can tell which session is calling when
# multiple Claude sessions are running in parallel. The voice is assigned
# per-project (first time → random pick, then stable) so voice + project name
# reinforce each other.
set -u
# Fail-safe per CONVENTIONS.md: trap unhandled errors and exit 0 always.
trap 'echo "[tts notify-tts] hook error at line $LINENO" >&2; exit 0' ERR
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

payload="$(cat)"
msg="$(echo "$payload" | jq -r '.message // "Claude needs your attention."')"
transcript="$(echo "$payload" | jq -r '.transcript_path // empty')"

project=""
if [[ -n "$transcript" && -f "$transcript" ]]; then
  cwd="$(jq -r 'select(.cwd != null) | .cwd' "$transcript" 2>/dev/null | head -1)"
  [[ -n "$cwd" ]] && project="$(basename "$cwd")"
fi

voice="$(get_voice_for_project "$project")"

if [[ -n "$project" ]]; then
  text="In $project: $msg"
else
  text="$msg"
fi

speak "$voice" "$text" /tmp/claude-tts-notify.wav
exit 0
