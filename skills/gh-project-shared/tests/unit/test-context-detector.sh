# skills/gh-project-shared/tests/unit/test-context-detector.sh
#!/bin/bash
set -e

PASS=0
FAIL=0

# Capture absolute script dir before changing directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"
git init >/dev/null 2>&1

touch package.json
mkdir -p docs/releases
touch CHANGELOG.md

source "$SCRIPT_DIR/../../scripts/context-detector.sh" 2>/dev/null || true

INDICATORS=$(detect_repo_type 2>/dev/null)
if echo "$INDICATORS" | grep -q "package.json"; then
  echo "✓ detect_repo_type finds package.json"
  PASS=$((PASS + 1))
else
  echo "✗ detect_repo_type should find package.json"
  FAIL=$((FAIL + 1))
fi

if echo "$INDICATORS" | grep -q "CHANGELOG.md"; then
  echo "✓ detect_repo_type finds CHANGELOG.md"
  PASS=$((PASS + 1))
else
  echo "✗ detect_repo_type should find CHANGELOG.md"
  FAIL=$((FAIL + 1))
fi

SCORES=$(score_templates "" 2>/dev/null)
if echo "$SCORES" | jq empty 2>/dev/null; then
  echo "✓ score_templates returns valid JSON"
  PASS=$((PASS + 1))
else
  echo "✗ score_templates should return valid JSON"
  FAIL=$((FAIL + 1))
fi

RECOMMENDATION=$(recommend_template "release planning" 2>/dev/null)
if echo "$RECOMMENDATION" | jq -e '.recommendation' >/dev/null 2>&1; then
  echo "✓ recommend_template returns recommendation"
  PASS=$((PASS + 1))
else
  echo "✗ recommend_template should return recommendation"
  FAIL=$((FAIL + 1))
fi

cd /
rm -rf "$TEST_DIR"

echo ""
echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
