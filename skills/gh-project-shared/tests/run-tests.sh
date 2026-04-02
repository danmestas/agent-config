#!/bin/bash
set -e

echo "Running gh-project-shared tests..."
echo ""

TOTAL_PASS=0
TOTAL_FAIL=0

# Determine which test suite to run
TEST_SUITE="${1:-all}"

run_unit_tests() {
  echo "=== Unit Tests ==="
  echo ""

  for test_file in unit/test-*.sh; do
    if [ -f "$test_file" ]; then
      echo "Running $(basename "$test_file")..."
      if bash "$test_file"; then
        echo "✓ $(basename "$test_file") passed"
      else
        echo "✗ $(basename "$test_file") failed"
        TOTAL_FAIL=$((TOTAL_FAIL + 1))
      fi
      echo ""
    fi
  done
}

run_integration_tests() {
  echo "=== Integration Tests ==="
  echo ""

  for test_file in integration/test-*.sh; do
    if [ -f "$test_file" ]; then
      echo "Running $(basename "$test_file")..."
      if bash "$test_file"; then
        echo "✓ $(basename "$test_file") passed"
      else
        echo "✗ $(basename "$test_file") failed"
        TOTAL_FAIL=$((TOTAL_FAIL + 1))
      fi
      echo ""
    fi
  done
}

run_error_scenario_tests() {
  echo "=== Error Scenario Tests ==="
  echo ""

  for test_file in error-scenarios/test-*.sh; do
    if [ -f "$test_file" ]; then
      echo "Running $(basename "$test_file")..."
      if bash "$test_file"; then
        echo "✓ $(basename "$test_file") passed"
      else
        echo "✗ $(basename "$test_file") failed"
        TOTAL_FAIL=$((TOTAL_FAIL + 1))
      fi
      echo ""
    fi
  done
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
  echo "All tests passed!"
  exit 0
else
  echo "$TOTAL_FAIL test(s) failed"
  exit 1
fi
