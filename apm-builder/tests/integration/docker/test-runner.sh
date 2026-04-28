#!/usr/bin/env bash
# test-runner.sh — Docker entrypoint for ac integration test matrix.
# Usage: test-runner.sh [harness] [--dry-run] [--real] [--timeout=N]
#   harness     optional: claude | codex | gemini | pi   (default: all)
#   --dry-run   print test plan without running scenarios
#   --real      invoke actual harness binaries (requires auth)
#   --timeout=N kill any scenario that runs >N seconds (default 90 in --real, 30 otherwise)
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCENARIOS_DIR="$SCRIPT_DIR/scenarios"

# If host auth was bind-mounted at /host-auth/, copy it into /root/ so the
# harnesses see writable, container-local credentials (mount semantics break
# OAuth refresh for some harnesses; copy avoids that).
if [[ -d /host-auth ]]; then
  echo "[setup] copying host auth into /root/ (writable copy)"
  cp -rL /host-auth/.claude /root/ 2>/dev/null || true
  cp -L  /host-auth/.claude.json /root/ 2>/dev/null || true
  cp -rL /host-auth/.codex /root/ 2>/dev/null || true
  cp -rL /host-auth/.gemini /root/ 2>/dev/null || true
fi

# Claude Code's `--print` mode rejects OAuth tokens read from the credentials
# file directly (file content is correct but the API path requires the token
# to be passed via env). Extract and re-export. Pattern from darkish-factory.
if [[ -f "$HOME/.claude/.credentials.json" ]] && command -v jq >/dev/null 2>&1; then
  CLAUDE_TOKEN="$(jq -r '.claudeAiOauth.accessToken // .accessToken // .oauth_token // empty' "$HOME/.claude/.credentials.json")"
  if [[ -n "${CLAUDE_TOKEN:-}" && "$CLAUDE_TOKEN" != "null" ]]; then
    export CLAUDE_CODE_OAUTH_TOKEN="$CLAUDE_TOKEN"
    unset ANTHROPIC_API_KEY  # prefer OAuth when both available
    echo "[setup] CLAUDE_CODE_OAUTH_TOKEN exported from credentials"
  fi
fi

ALL_HARNESSES=(claude codex gemini pi)
SCENARIOS=(01-no-flags 02-persona-only 03-mode-only 04-persona-and-mode 05-no-filter)

HARNESS_FILTER=""
DRY_RUN=false
REAL_MODE=false
SCENARIO_TIMEOUT=""

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --real) REAL_MODE=true ;;
    --timeout=*) SCENARIO_TIMEOUT="${arg#--timeout=}" ;;
    --help|-h)
      echo "Usage: test-runner.sh [harness] [--dry-run] [--real] [--timeout=N]"
      echo "  harness     claude | codex | gemini | pi  (default: all)"
      echo "  --dry-run   print plan without running"
      echo "  --real      invoke actual harness binaries (requires auth + API spend)"
      echo "  --timeout=N per-scenario timeout in seconds"
      echo "              default: 90 in --real, 30 otherwise"
      exit 0
      ;;
    -*) echo "Unknown flag: $arg" >&2; exit 1 ;;
    *) HARNESS_FILTER="$arg" ;;
  esac
done

# Default timeout per mode
if [[ -z "$SCENARIO_TIMEOUT" ]]; then
  if $REAL_MODE; then SCENARIO_TIMEOUT=90; else SCENARIO_TIMEOUT=30; fi
fi

# Determine which harnesses to run
if [[ -n "$HARNESS_FILTER" ]]; then
  HARNESSES=("$HARNESS_FILTER")
else
  HARNESSES=("${ALL_HARNESSES[@]}")
fi

# Dry-run: just print what would run
if $DRY_RUN; then
  echo "=== ac docker test matrix — DRY RUN ==="
  for h in "${HARNESSES[@]}"; do
    for s in "${SCENARIOS[@]}"; do
      echo "  WOULD RUN: $s $h"
    done
  done
  echo "Total: $((${#HARNESSES[@]} * ${#SCENARIOS[@]})) scenarios"
  exit 0
fi

# Auth presence — accept either an API key env var OR mounted OAuth credentials.
declare -A HARNESS_AUTH
[[ -n "${ANTHROPIC_API_KEY:-}" || -f "$HOME/.claude.json" || -f "$HOME/.claude/.credentials.json" ]] && HARNESS_AUTH[claude]=ok || HARNESS_AUTH[claude]=
[[ -n "${OPENAI_API_KEY:-}" || -f "$HOME/.codex/auth.json" || -d "$HOME/.codex" ]] && HARNESS_AUTH[codex]=ok || HARNESS_AUTH[codex]=
[[ -n "${GEMINI_API_KEY:-}" || -d "$HOME/.gemini" ]] && HARNESS_AUTH[gemini]=ok || HARNESS_AUTH[gemini]=
# Pi's auth model is independent — it doesn't honor CLAUDE_CODE_OAUTH_TOKEN.
# In real mode, require an explicit provider env var (ANTHROPIC_API_KEY,
# OPENAI_API_KEY, or GEMINI_API_KEY). In shim mode, just check ANTHROPIC.
if $REAL_MODE; then
  [[ -n "${ANTHROPIC_API_KEY:-}" || -n "${OPENAI_API_KEY:-}" || -n "${GEMINI_API_KEY:-}" || -n "${OPENROUTER_API_KEY:-}" ]] && HARNESS_AUTH[pi]=ok || HARNESS_AUTH[pi]=
else
  [[ -n "${ANTHROPIC_API_KEY:-}" || -f "$HOME/.claude.json" || -f "$HOME/.claude/.credentials.json" ]] && HARNESS_AUTH[pi]=ok || HARNESS_AUTH[pi]=
fi
declare -A HARNESS_KEY
for h in claude codex gemini pi; do HARNESS_KEY[$h]="${HARNESS_AUTH[$h]}"; done

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
TIMEOUT_COUNT=0
START_TS=$(date +%s)

# Print live (don't buffer through pipes)
printf '%s\n' "=== ac docker test matrix (real=$REAL_MODE, timeout=${SCENARIO_TIMEOUT}s) ==="
echo ""

for harness in "${HARNESSES[@]}"; do
  printf -- '--- harness: %s ---\n' "$harness"

  api_key="${HARNESS_KEY[$harness]}"
  if [[ -z "$api_key" ]]; then
    printf '[SKIP] %s: no auth — skipping all scenarios\n\n' "$harness"
    SKIP_COUNT=$(( SKIP_COUNT + ${#SCENARIOS[@]} ))
    continue
  fi

  for scenario in "${SCENARIOS[@]}"; do
    script="$SCENARIOS_DIR/${scenario}.sh"
    if [[ ! -f "$script" ]]; then
      printf '[FAIL] %s %s: script not found\n' "$scenario" "$harness"
      FAIL_COUNT=$(( FAIL_COUNT + 1 ))
      continue
    fi

    # Live progress: print before invoking, flush stdout
    printf '[RUNNING] %s %s ...' "$scenario" "$harness"
    # Flush — important for piped output to surface this line immediately
    exec 1>&1

    log=$(mktemp /tmp/ac-scenario-XXXXXX.log)
    scenario_start=$(date +%s)

    # Use `timeout` to enforce per-scenario cap. Output streams to log file.
    timeout --kill-after=5 "$SCENARIO_TIMEOUT" \
      env REAL_MODE=$REAL_MODE bash "$script" "$harness" > "$log" 2>&1
    exit_code=$?

    duration=$(( $(date +%s) - scenario_start ))
    output=$(cat "$log")
    rm -f "$log"

    # `timeout` returns 124 (or 137 on KILL) when the limit is hit
    if [[ $exit_code -eq 124 || $exit_code -eq 137 ]]; then
      printf '\r[TIMEOUT] %s %s after %ds                    \n' "$scenario" "$harness" "$duration"
      printf '%s\n' "$output" | sed 's/^/       /' | tail -10
      TIMEOUT_COUNT=$(( TIMEOUT_COUNT + 1 ))
      FAIL_COUNT=$(( FAIL_COUNT + 1 ))
      continue
    fi

    if echo "$output" | grep -q "^SKIP"; then
      printf '\r[SKIP]    %s %s (%ds)\n' "$scenario" "$harness" "$duration"
      echo "$output" | grep "^SKIP" | sed 's/^/       /'
      SKIP_COUNT=$(( SKIP_COUNT + 1 ))
    elif [[ $exit_code -eq 0 ]]; then
      printf '\r[PASS]    %s %s (%ds)\n' "$scenario" "$harness" "$duration"
      PASS_COUNT=$(( PASS_COUNT + 1 ))
    else
      printf '\r[FAIL]    %s %s (%ds, exit %d)\n' "$scenario" "$harness" "$duration" "$exit_code"
      printf '%s\n' "$output" | sed 's/^/       /' | tail -10
      FAIL_COUNT=$(( FAIL_COUNT + 1 ))
    fi
  done
  echo ""
done

TOTAL_DURATION=$(( $(date +%s) - START_TS ))
printf '=== Results: %d PASS | %d FAIL | %d SKIP | %d TIMEOUT (%.1fs total) ===\n' \
  "$PASS_COUNT" "$FAIL_COUNT" "$SKIP_COUNT" "$TIMEOUT_COUNT" "$TOTAL_DURATION"

[[ $FAIL_COUNT -gt 0 ]] && exit 1
exit 0
