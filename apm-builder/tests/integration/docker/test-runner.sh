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

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --help|-h)
      echo "Usage: test-runner.sh [harness] [--dry-run]"
      echo "  harness   claude | codex | gemini | pi  (default: all)"
      echo "  --dry-run print plan without running"
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

# API key presence map
declare -A HARNESS_KEY
HARNESS_KEY[claude]="${ANTHROPIC_API_KEY:-}"
HARNESS_KEY[codex]="${OPENAI_API_KEY:-}"
HARNESS_KEY[gemini]="${GEMINI_API_KEY:-}"
HARNESS_KEY[pi]="${ANTHROPIC_API_KEY:-}"

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

echo "=== ac docker test matrix ==="
echo ""

for harness in "${HARNESSES[@]}"; do
  echo "--- harness: $harness ---"

  api_key="${HARNESS_KEY[$harness]}"
  if [[ -z "$api_key" ]]; then
    echo "[SKIP] $harness: API key not set — skipping all scenarios"
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
    output=$(bash "$script" "$harness" 2>&1)
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
