# skills/gh-project-shared/tests/unit/test-error-handler.sh
#!/bin/bash
set -e

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

cd /
rm -rf "$TEST_DIR"

echo ""
echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
