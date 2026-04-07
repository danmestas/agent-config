#!/bin/bash
# skills/gh-project-charter/tests/test-template.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="$SCRIPT_DIR/../templates/charter-minimal.md"

PASS=0
FAIL=0

assert() {
  local desc="$1" result="$2"
  if [ "$result" = "true" ]; then
    echo "✓ $desc"
    PASS=$((PASS + 1))
  else
    echo "✗ $desc"
    FAIL=$((FAIL + 1))
  fi
}

# Test 1: Template file exists
assert "Template file exists" "$([ -f "$TEMPLATE" ] && echo true || echo false)"

# Test 2: Has ## Goals section
assert "Template has ## Goals section" "$(grep -q '^## Goals' "$TEMPLATE" && echo true || echo false)"

# Test 3: Has ## Scope section
assert "Template has ## Scope section" "$(grep -q '^## Scope' "$TEMPLATE" && echo true || echo false)"

# Test 4: Has ## Success Criteria section
assert "Template has ## Success Criteria section" "$(grep -q '^## Success Criteria' "$TEMPLATE" && echo true || echo false)"

# Test 5: Has ## Change Log section
assert "Template has ## Change Log section" "$(grep -q '^## Change Log' "$TEMPLATE" && echo true || echo false)"

echo ""
echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
