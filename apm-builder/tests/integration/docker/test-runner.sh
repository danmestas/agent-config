#!/usr/bin/env bash
# test-runner.sh — Docker entrypoint for ac integration test matrix.
# Usage: test-runner.sh [harness] [--dry-run]
#   harness   optional: claude | codex | gemini | pi   (default: all)
#   --dry-run print test plan without running scenarios
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCENARIOS_DIR="$SCRIPT_DIR/scenarios"

ALL_HARNESSES=(claude codex gemini pi)
SCENARIOS=(01-no-flags 02-persona-only 03-mode-only 04-persona-and-mode 05-no-filter)

HARNESS_FILTER=""
DRY_RUN=false
REAL_MODE=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --real) REAL_MODE=true ;;
    --help|-h)
      echo "Usage: test-runner.sh [harness] [--dry-run] [--real]"
      echo "  harness   claude | codex | gemini | pi  (default: all)"
      echo "  --dry-run print plan without running"
      echo "  --real    invoke actual harness binaries (requires auth)"
      exit 0
      ;;
    -*) echo "Unknown flag: $arg" >&2; exit 1 ;;
    *) HARNESS_FILTER="$arg" ;;
  esac
done

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
# Local mount example (RW required for codex/gemini cache writes; claude.json file is read-only):
#   docker run --rm \
#     -v ~/.claude:/root/.claude \
#     -v ~/.claude.json:/root/.claude.json:ro \
#     -v ~/.codex:/root/.codex \
#     -v ~/.gemini:/root/.gemini \
#     agent-config-test --real
declare -A HARNESS_AUTH
[[ -n "${ANTHROPIC_API_KEY:-}" || -f "$HOME/.claude.json" || -f "$HOME/.claude/.credentials.json" ]] && HARNESS_AUTH[claude]=ok || HARNESS_AUTH[claude]=
[[ -n "${OPENAI_API_KEY:-}" || -f "$HOME/.codex/auth.json" || -d "$HOME/.codex" ]] && HARNESS_AUTH[codex]=ok || HARNESS_AUTH[codex]=
[[ -n "${GEMINI_API_KEY:-}" || -d "$HOME/.gemini" ]] && HARNESS_AUTH[gemini]=ok || HARNESS_AUTH[gemini]=
[[ -n "${ANTHROPIC_API_KEY:-}" || -f "$HOME/.claude.json" || -f "$HOME/.claude/.credentials.json" ]] && HARNESS_AUTH[pi]=ok || HARNESS_AUTH[pi]=
declare -A HARNESS_KEY
for h in claude codex gemini pi; do HARNESS_KEY[$h]="${HARNESS_AUTH[$h]}"; done

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

echo "=== ac docker test matrix ==="
echo ""

for harness in "${HARNESSES[@]}"; do
  echo "--- harness: $harness ---"

  api_key="${HARNESS_KEY[$harness]}"
  if [[ -z "$api_key" ]]; then
    echo "[SKIP] $harness: no auth (no API key env var, no OAuth credentials mounted) — skipping all scenarios"
    SKIP_COUNT=$(( SKIP_COUNT + ${#SCENARIOS[@]} ))
    echo ""
    continue
  fi

  for scenario in "${SCENARIOS[@]}"; do
    script="$SCENARIOS_DIR/${scenario}.sh"
    if [[ ! -f "$script" ]]; then
      echo "[FAIL] $scenario $harness: script not found at $script"
      FAIL_COUNT=$(( FAIL_COUNT + 1 ))
      continue
    fi

    set +e
    output=$(REAL_MODE=$REAL_MODE bash "$script" "$harness" 2>&1)
    exit_code=$?
    set -e

    if echo "$output" | grep -q "^SKIP"; then
      echo "[SKIP] $scenario $harness"
      echo "$output" | grep "^SKIP" | sed 's/^/       /'
      SKIP_COUNT=$(( SKIP_COUNT + 1 ))
    elif [[ $exit_code -eq 0 ]]; then
      echo "[PASS] $scenario $harness"
      PASS_COUNT=$(( PASS_COUNT + 1 ))
    else
      echo "[FAIL] $scenario $harness (exit $exit_code)"
      echo "$output" | sed 's/^/       /'
      FAIL_COUNT=$(( FAIL_COUNT + 1 ))
    fi
  done
  echo ""
done

echo "=== Results: ${PASS_COUNT} PASS | ${FAIL_COUNT} FAIL | ${SKIP_COUNT} SKIP ==="

if [[ $FAIL_COUNT -gt 0 ]]; then
  exit 1
fi
exit 0
