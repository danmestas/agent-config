#!/bin/bash
# skills/gh-project-operations/tests/test-coordinator.sh

source "$(dirname "$0")/../scripts/coordinator.sh"

PASS=0
FAIL=0

# Test: detect_scope_change with new milestone
test_detect_scope_change_milestone() {
  RESULT=$(detect_scope_change "milestone" "Q2 Launch" 2>&1)
  if echo "$RESULT" | grep -q "Scope change detected"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should detect milestone as scope change"
  fi
}

# Test: detect_scope_change with dependencies
test_detect_scope_change_dependencies() {
  RESULT=$(detect_scope_change "label" "blocked" 2>&1)
  if echo "$RESULT" | grep -q "Scope change detected"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should detect blocked label as scope change"
  fi
}

# Test: detect_scope_change with normal label
test_detect_scope_change_normal() {
  RESULT=$(detect_scope_change "label" "bug" 2>&1)
  if [ -z "$RESULT" ]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should not detect normal labels as scope change"
  fi
}

# Test: suggest_charter_update
test_suggest_charter_update() {
  RESULT=$(suggest_charter_update "milestone" "Q2 Launch" 2>&1)
  if echo "$RESULT" | grep -q "SUGGEST:"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should suggest charter update"
  fi
}

# Run tests
test_detect_scope_change_milestone
test_detect_scope_change_dependencies
test_detect_scope_change_normal
test_suggest_charter_update

echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
