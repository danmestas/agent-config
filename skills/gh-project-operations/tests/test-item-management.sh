#!/bin/bash
# skills/gh-project-operations/tests/test-item-management.sh

source "$(dirname "$0")/../scripts/item-management.sh"
source "$(dirname "$0")/../../gh-project-shared/scripts/config-manager.sh" 2>/dev/null || true

PASS=0
FAIL=0

# Mock config manager
get_project_id() {
  echo "PVT_test123"
}

get_field_id() {
  echo "PVTF_field456"
}

get_field_option_id() {
  echo "PVTFO_opt789"
}

# Test: add_issue_to_project
test_add_issue_to_project() {
  RESULT=$(add_issue_to_project "1" "https://github.com/user/repo/issues/5" 2>&1)
  if echo "$RESULT" | grep -q "gh project item-add"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: add_issue_to_project should generate gh command"
  fi
}

# Test: update_item_field with single-select
test_update_item_single_select() {
  RESULT=$(update_item_field "ITEM_123" "Status" "In Progress" "SINGLE_SELECT" 2>&1)
  if echo "$RESULT" | grep -q "gh project item-edit"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: update_item_field should generate gh command"
  fi
}

# Test: update_item_field with text
test_update_item_text() {
  RESULT=$(update_item_field "ITEM_123" "Notes" "Testing" "TEXT" 2>&1)
  if echo "$RESULT" | grep -q -- "--text"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: update_item_field should include --text flag"
  fi
}

# Test: update_item_field with date
test_update_item_date() {
  RESULT=$(update_item_field "ITEM_123" "Due Date" "2026-04-15" "DATE" 2>&1)
  if echo "$RESULT" | grep -q -- "--date"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: update_item_field should include --date flag"
  fi
}

# Test: update_item_field with number
test_update_item_number() {
  RESULT=$(update_item_field "ITEM_123" "Story Points" "5" "NUMBER" 2>&1)
  if echo "$RESULT" | grep -q -- "--number"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: update_item_field should include --number flag"
  fi
}

# Test: archive_item
test_archive_item() {
  RESULT=$(archive_item "ITEM_123" 2>&1)
  if echo "$RESULT" | grep -q "gh project item-archive"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: archive_item should generate gh command"
  fi
}

# Test: list_project_items
test_list_project_items() {
  RESULT=$(list_project_items "1" 2>&1)
  if echo "$RESULT" | grep -q "gh project item-list"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: list_project_items should generate gh command"
  fi
}

# Run tests
test_add_issue_to_project
test_update_item_single_select
test_update_item_text
test_update_item_date
test_update_item_number
test_archive_item
test_list_project_items

echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
