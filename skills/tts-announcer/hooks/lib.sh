#!/usr/bin/env bash
# Shared helpers for claude-tts-hooks. Sourced by the individual hooks.

KOKORO_URL="${KOKORO_URL:-http://localhost:8880}"
VOICES_FILE="${TTS_VOICES_FILE:-$HOME/.claude/tts-voices.json}"

# Curated pool of distinct, high-quality Kokoro voices. Edit to taste.
# First-time per-project assignment randomly picks from this list.
VOICE_POOL=(
  af_bella af_sarah af_nicole af_sky af_heart af_aoede af_jessica
  am_adam am_michael am_liam am_puck am_fenrir
  bf_emma bf_alice bf_lily
  bm_george bm_lewis bm_daniel
)

# get_voice_for_project <project_name> → echoes a voice id
#
# Precedence:
#   1. $TTS_VOICE environment variable (global override)
#   2. Existing mapping in $VOICES_FILE
#   3. Random pick from $VOICE_POOL, persisted to $VOICES_FILE
#   4. af_bella (hard fallback)
get_voice_for_project() {
  local project="$1"
  if [[ -n "${TTS_VOICE:-}" ]]; then
    echo "$TTS_VOICE"; return
  fi
  if [[ -z "$project" ]]; then
    echo "af_bella"; return
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
# Calls Kokoro and plays the resulting audio in the background (non-blocking).
speak() {
  local voice="$1" text="$2" out="${3:-/tmp/claude-tts.mp3}"
  curl -sf --max-time 10 "$KOKORO_URL/v1/audio/speech" \
    -H 'Content-Type: application/json' \
    -d "$(jq -nc --arg v "$voice" --arg t "$text" \
          '{model:"kokoro", voice:$v, input:$t, response_format:"mp3"}')" \
    -o "$out" \
    && afplay "$out" &
}
