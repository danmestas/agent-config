# skills/gh-project-shared/tests/unit/test-error-handler.sh
#!/bin/bash

PASS=0
FAIL=0

# Capture absolute script dir before changing directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"
mkdir -p .github

source "$SCRIPT_DIR/../../scripts/error-handler.sh" 2>/dev/null || true

# Test: log_error creates file
log_error "Test error message" 2>/dev/null
if [ -f .github/project-errors.log ]; then
  echo "✓ log_error creates error log file"
  PASS=$((PASS + 1))
else
  echo "✗ log_error should create .github/project-errors.log"
  FAIL=$((FAIL + 1))
fi

# Test: log_error contains message
if grep -q "Test error message" .github/project-errors.log; then
  echo "✓ log_error writes message to file"
  PASS=$((PASS + 1))
else
  echo "✗ log_error should write message to log"
  FAIL=$((FAIL + 1))
fi

# Test: log_error uses ISO 8601 UTC timestamp format
if grep -q "\[202[0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z\]" .github/project-errors.log; then
  echo "✓ log_error uses ISO 8601 UTC timestamp format"
  PASS=$((PASS + 1))
else
  echo "✗ log_error should use ISO 8601 UTC timestamp format"
  FAIL=$((FAIL + 1))
fi

# Test: output_error format
output_error_test=$(output_error "TestCategory" "Test message" "Test action" 2>&1)
if echo "$output_error_test" | grep -q "ERROR: TestCategory"; then
  echo "✓ output_error includes ERROR category"
  PASS=$((PASS + 1))
else
  echo "✗ output_error should include ERROR category"
  FAIL=$((FAIL + 1))
fi

if echo "$output_error_test" | grep -q "Message: Test message"; then
  echo "✓ output_error includes message"
  PASS=$((PASS + 1))
else
  echo "✗ output_error should include message"
  FAIL=$((FAIL + 1))
fi

if echo "$output_error_test" | grep -q "Suggested Action: Test action"; then
  echo "✓ output_error includes suggested action"
  PASS=$((PASS + 1))
else
  echo "✗ output_error should include suggested action"
  FAIL=$((FAIL + 1))
fi

# Test: handle_error logs and outputs to stderr
# Run in subshell and capture both exit code and output
bash -c 'source "$0" 2>/dev/null || true
handle_error 42 "Test error" "Test context"' "$SCRIPT_DIR/../../scripts/error-handler.sh" &>/tmp/handle_error_test.log || true

handle_error_output=$(cat /tmp/handle_error_test.log)
if echo "$handle_error_output" | grep -q "Error: Test error"; then
  echo "✓ handle_error outputs to stderr"
  PASS=$((PASS + 1))
else
  echo "✗ handle_error should output to stderr"
  FAIL=$((FAIL + 1))
fi

if echo "$handle_error_output" | grep -q "Context: Test context"; then
  echo "✓ handle_error includes context"
  PASS=$((PASS + 1))
else
  echo "✗ handle_error should include context"
  FAIL=$((FAIL + 1))
fi

if grep -q "Exit code: 42" .github/project-errors.log; then
  echo "✓ handle_error logs exit code"
  PASS=$((PASS + 1))
else
  echo "✗ handle_error should log exit code"
  FAIL=$((FAIL + 1))
fi

# Test: require_prerequisite success case (command -v true always succeeds)
if require_prerequisite "command -v true" "true should exist" "Install true"; then
  echo "✓ require_prerequisite succeeds for valid command"
  PASS=$((PASS + 1))
else
  echo "✗ require_prerequisite should succeed for valid command"
  FAIL=$((FAIL + 1))
fi

# Test: require_prerequisite failure case (command -v nonexistent fails)
# Must run in subshell since require_prerequisite calls exit
require_prerequisite_fail=$(bash -c "
  source '$SCRIPT_DIR/../../scripts/error-handler.sh' 2>/dev/null || true
  cd '$TEST_DIR'
  require_prerequisite 'command -v nonexistentcommand12345xyz' 'nonexistent tool' 'Install it'
" 2>&1 || true)
if echo "$require_prerequisite_fail" | grep -q "ERROR: Prerequisite Missing"; then
  echo "✓ require_prerequisite fails for missing command"
  PASS=$((PASS + 1))
else
  echo "✗ require_prerequisite should fail for missing command"
  FAIL=$((FAIL + 1))
fi

# Test: require_prerequisite rejects invalid pattern
# Must run in subshell since require_prerequisite calls exit
require_prerequisite_invalid=$(bash -c "
  source '$SCRIPT_DIR/../../scripts/error-handler.sh' 2>/dev/null || true
  cd '$TEST_DIR'
  require_prerequisite 'rm -rf /' 'should reject' 'N/A'
" 2>&1 || true)
if echo "$require_prerequisite_invalid" | grep -q "ERROR: Prerequisite Check Error"; then
  echo "✓ require_prerequisite rejects invalid command pattern"
  PASS=$((PASS + 1))
else
  echo "✗ require_prerequisite should reject invalid command pattern"
  FAIL=$((FAIL + 1))
fi

cd /
rm -rf "$TEST_DIR"

echo ""
echo "Tests: $PASS passed, $FAIL failed"
exit $([ $FAIL -eq 0 ] && echo 0 || echo 1)
