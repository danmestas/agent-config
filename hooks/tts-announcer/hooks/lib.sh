#!/usr/bin/env bash
# Shared helpers for claude-tts-hooks. Sourced by the individual hooks.

KOKORO_URL="${KOKORO_URL:-http://localhost:8880}"
VOICES_FILE="${TTS_VOICES_FILE:-$HOME/.claude/tts-voices.json}"

# Curated pool of Supertonic voice styles. Edit to taste.
# First-time per-project assignment randomly picks from this list.
# Backend: supertonic-tts-daemon (Kokoro-compatible API on localhost:8880).
VOICE_POOL=(
  F1 F2 F3 F4 F5
  M1 M2 M3 M4 M5
)

# get_voice_for_project <project_name> → echoes a voice id
#
# Precedence:
#   1. $TTS_VOICE environment variable (global override)
#   2. Existing mapping in $VOICES_FILE
#   3. Random pick from $VOICE_POOL, persisted to $VOICES_FILE
#   4. F1 (hard fallback)
get_voice_for_project() {
  local project="$1"
  if [[ -n "${TTS_VOICE:-}" ]]; then
    echo "$TTS_VOICE"; return
  fi
  if [[ -z "$project" ]]; then
    echo "F1"; return
  fi
  [[ -f "$VOICES_FILE" ]] || echo '{}' > "$VOICES_FILE"
  local voice
  voice="$(jq -r --arg p "$project" '.[$p] // empty' "$VOICES_FILE" 2>/dev/null)"
  if [[ -z "$voice" ]]; then
    # /dev/urandom — bash's $RANDOM returns the same value in each
    # command-substitution subshell, which defeats the purpose here.
    local rand_idx
    rand_idx="$(od -An -N2 -tu2 /dev/urandom | tr -d ' \n\t')"
    voice="${VOICE_POOL[rand_idx % ${#VOICE_POOL[@]}]}"
    local tmp
    tmp="$(mktemp)"
    if jq --arg p "$project" --arg v "$voice" '. + {($p): $v}' "$VOICES_FILE" > "$tmp" 2>/dev/null; then
      mv "$tmp" "$VOICES_FILE"
    else
      rm -f "$tmp"
    fi
  fi
  echo "$voice"
}

# speak <voice> <text> [output_path]
# POSTs to the Kokoro-compatible TTS daemon and plays the resulting audio
# in the background (non-blocking).
speak() {
  local voice="$1" text="$2" out="${3:-/tmp/claude-tts.wav}"
  curl -sf --max-time 10 "$KOKORO_URL/v1/audio/speech" \
    -H 'Content-Type: application/json' \
    -d "$(jq -nc --arg v "$voice" --arg t "$text" \
          '{model:"supertonic", voice:$v, input:$t, response_format:"mp3"}')" \
    -o "$out" \
    && afplay "$out" &
}
