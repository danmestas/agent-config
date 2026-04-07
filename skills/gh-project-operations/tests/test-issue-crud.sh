#!/bin/bash
# skills/gh-project-operations/tests/test-issue-crud.sh

export DRY_RUN=1
source "$(dirname "$0")/../scripts/issue-crud.sh"

PASS=0
FAIL=0

# Test: create_issue with required fields
test_create_issue_basic() {
  RESULT=$(create_issue "Test Issue" "Test body" "bug" "" 2>&1)
  if echo "$RESULT" | grep -q "gh issue create"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: create_issue should generate gh command"
  fi
}

# Test: create_issue with assignee
test_create_issue_with_assignee() {
  RESULT=$(create_issue "Test" "Body" "" "@me" 2>&1)
  if echo "$RESULT" | grep -q -- "--assignee @me"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: create_issue should include assignee"
  fi
}

# Test: list_issues with JQL
test_list_issues_with_filter() {
  RESULT=$(list_issues "is:open label:bug" 2>&1)
  if echo "$RESULT" | grep -q "gh issue list"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: list_issues should generate gh command"
  fi
}

# Test: update_issue
test_update_issue() {
  RESULT=$(update_issue "123" "New title" "" "" 2>&1)
  if echo "$RESULT" | grep -q "gh issue edit 123"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: update_issue should generate gh command"
  fi
}

# Test: delete_issue
test_delete_issue() {
  RESULT=$(delete_issue "123" 2>&1)
  if echo "$RESULT" | grep -q "gh issue delete 123"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: delete_issue should generate gh command"
  fi
}

# Run tests
test_create_issue_basic
test_create_issue_with_assignee
test_list_issues_with_filter
test_update_issue
test_delete_issue

echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
