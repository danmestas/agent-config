#!/bin/bash

# Change to script directory to ensure relative paths work
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Running gh-project-shared tests..."
echo ""

TOTAL_PASS=0
TOTAL_FAIL=0
TOTAL_COUNT=0

# Determine which test suite to run
TEST_SUITE="${1:-all}"

run_unit_tests() {
  echo "=== Unit Tests ==="
  echo ""

  shopt -s nullglob
  for test_file in unit/test-*.sh; do
    if [ -f "$test_file" ]; then
      echo "Running $(basename "$test_file")..."
      if bash "$test_file"; then
        echo "✓ $(basename "$test_file") passed"
        TOTAL_PASS=$((TOTAL_PASS + 1))
        TOTAL_COUNT=$((TOTAL_COUNT + 1))
      else
        echo "✗ $(basename "$test_file") failed"
        TOTAL_FAIL=$((TOTAL_FAIL + 1))
        TOTAL_COUNT=$((TOTAL_COUNT + 1))
      fi
      echo ""
    fi
  done
  shopt -u nullglob
}

run_integration_tests() {
  echo "=== Integration Tests ==="
  echo ""

  shopt -s nullglob
  for test_file in integration/test-*.sh; do
    if [ -f "$test_file" ]; then
      echo "Running $(basename "$test_file")..."
      if bash "$test_file"; then
        echo "✓ $(basename "$test_file") passed"
        TOTAL_PASS=$((TOTAL_PASS + 1))
        TOTAL_COUNT=$((TOTAL_COUNT + 1))
      else
        echo "✗ $(basename "$test_file") failed"
        TOTAL_FAIL=$((TOTAL_FAIL + 1))
        TOTAL_COUNT=$((TOTAL_COUNT + 1))
      fi
      echo ""
    fi
  done
  shopt -u nullglob
}

run_error_scenario_tests() {
  echo "=== Error Scenario Tests ==="
  echo ""

  shopt -s nullglob
  for test_file in error-scenarios/test-*.sh; do
    if [ -f "$test_file" ]; then
      echo "Running $(basename "$test_file")..."
      if bash "$test_file"; then
        echo "✓ $(basename "$test_file") passed"
        TOTAL_PASS=$((TOTAL_PASS + 1))
        TOTAL_COUNT=$((TOTAL_COUNT + 1))
      else
        echo "✗ $(basename "$test_file") failed"
        TOTAL_FAIL=$((TOTAL_FAIL + 1))
        TOTAL_COUNT=$((TOTAL_COUNT + 1))
      fi
      echo ""
    fi
  done
  shopt -u nullglob
}

# Run selected test suite
case "$TEST_SUITE" in
  unit)
    run_unit_tests
    ;;
  integration)
    run_integration_tests
    ;;
  error)
    run_error_scenario_tests
    ;;
  all)
    run_unit_tests
    run_integration_tests
    run_error_scenario_tests
    ;;
  *)
    echo "Usage: $0 [unit|integration|error|all]"
    exit 1
    ;;
esac

# Summary
echo "===================================="
if [ $TOTAL_FAIL -eq 0 ]; then
  echo "$TOTAL_PASS of $TOTAL_COUNT test(s) passed"
  exit 0
else
  echo "$TOTAL_PASS of $TOTAL_COUNT test(s) passed, $TOTAL_FAIL test(s) failed"
  exit 1
fi
