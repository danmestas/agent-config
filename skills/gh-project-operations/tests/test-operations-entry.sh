#!/bin/bash
# skills/gh-project-operations/tests/test-operations-entry.sh

PASS=0
FAIL=0

# Test: help message
test_help() {
  RESULT=$(bash skills/gh-project-operations/gh-project-operations.sh --help 2>&1)
  if echo "$RESULT" | grep -q "Usage:"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should show help message"
  fi
}

# Test: create command
test_create_command() {
  RESULT=$(bash skills/gh-project-operations/gh-project-operations.sh create --title "Test" --body "Test body" 2>&1)
  if echo "$RESULT" | grep -q "Creating issue"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should handle create command"
  fi
}

# Test: list command
test_list_command() {
  RESULT=$(bash skills/gh-project-operations/gh-project-operations.sh list 2>&1)
  if echo "$RESULT" | grep -q "Listing issues" || echo "$RESULT" | grep -q "gh issue list"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should handle list command"
  fi
}

# Test: bulk command
test_bulk_command() {
  RESULT=$(bash skills/gh-project-operations/gh-project-operations.sh bulk --project 1 --from "Todo" --to "Done" 2>&1)
  if echo "$RESULT" | grep -q "Bulk operation"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should handle bulk command"
  fi
}

# Run tests
test_help
test_create_command
test_list_command
test_bulk_command

echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
