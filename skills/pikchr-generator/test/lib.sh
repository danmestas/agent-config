#!/usr/bin/env bash
# Shared test helpers. Source this from each test_*.sh.

assert_contains() {
  local haystack="$1" needle="$2" msg="${3:-}"
  if ! printf '%s' "$haystack" | grep -q -- "$needle"; then
    echo "FAIL: expected to contain '$needle' ${msg:+($msg)}" >&2
    echo "--- actual ---" >&2
    printf '%s\n' "$haystack" | head -20 >&2
    return 1
  fi
}

assert_file_exists() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    echo "FAIL: expected file '$path' to exist" >&2
    return 1
  fi
}

assert_exit_code() {
  local expected="$1" actual="$2" msg="${3:-}"
  if [[ "$expected" != "$actual" ]]; then
    echo "FAIL: expected exit $expected, got $actual ${msg:+($msg)}" >&2
    return 1
  fi
}

# Each test file MUST `set -euo pipefail` and source this lib.
# Without `set -e`, a failing assertion (return 1) will NOT fail the test
# — run.sh uses the script's overall exit code to determine pass/fail.
