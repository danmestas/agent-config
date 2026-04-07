#!/bin/bash
# skills/gh-project-operations/tests/test-bulk-operations.sh

source "$(dirname "$0")/../scripts/bulk-operations.sh"

PASS=0
FAIL=0

# Test: bulk_create_issues from array
test_bulk_create_array() {
  declare -a issues=(
    "Bug 1|Description 1|bug"
    "Bug 2|Description 2|bug"
  )

  RESULT=$(bulk_create_issues "array" issues[@] 2>&1)
  if echo "$RESULT" | grep -q "Created 2 issues"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: bulk_create_issues should report count"
  fi
}

# Test: bulk_update_status
test_bulk_update_status() {
  RESULT=$(bulk_update_status "1" "Todo" "In Progress" 2>&1)
  if echo "$RESULT" | grep -q "Updating"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: bulk_update_status should show progress"
  fi
}

# Test: bulk_archive_completed
test_bulk_archive_completed() {
  RESULT=$(bulk_archive_completed "1" 2>&1)
  if echo "$RESULT" | grep -q "Archiving"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: bulk_archive_completed should show progress"
  fi
}

# Test: import_from_csv
test_import_csv() {
  echo "title,body,labels" > /tmp/test-import.csv
  echo "Test,Description,bug" >> /tmp/test-import.csv

  RESULT=$(import_from_csv "/tmp/test-import.csv" 2>&1)
  if echo "$RESULT" | grep -q "Importing"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: import_from_csv should show progress"
  fi

  rm -f /tmp/test-import.csv
}

# Test: export_to_csv
test_export_csv() {
  RESULT=$(export_to_csv "1" "/tmp/test-export.csv" 2>&1)
  if echo "$RESULT" | grep -q "Exported"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: export_to_csv should confirm export"
  fi

  rm -f /tmp/test-export.csv
}

# Run tests
test_bulk_create_array
test_bulk_update_status
test_bulk_archive_completed
test_import_csv
test_export_csv

echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
