# skills/gh-project-shared/tests/unit/test-gh-check.sh
#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../scripts/gh-check.sh" 2>/dev/null || true

PASS=0
FAIL=0

# Test check_gh_installed when gh exists
if command -v gh &>/dev/null; then
  if check_gh_installed >/dev/null 2>&1; then
    echo "✓ check_gh_installed returns 0 when gh installed"
    PASS=$((PASS + 1))
  else
    echo "✗ check_gh_installed should return 0 when gh installed"
    FAIL=$((FAIL + 1))
  fi
else
  echo "⊘ Skipping gh installed test (gh not in PATH)"
fi

echo ""
echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
