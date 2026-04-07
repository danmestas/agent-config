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

# Test empty repository (no indicators)
EMPTY_TEST_DIR=$(mktemp -d)
cd "$EMPTY_TEST_DIR"
git init >/dev/null 2>&1

EMPTY_INDICATORS=$(detect_repo_type 2>/dev/null)
if [ "$EMPTY_INDICATORS" = "[]" ]; then
  echo "✓ detect_repo_type returns empty array for empty repo"
  PASS=$((PASS + 1))
else
  echo "✗ detect_repo_type should return [] for empty repo, got: $EMPTY_INDICATORS"
  FAIL=$((FAIL + 1))
fi

EMPTY_RECOMMENDATION=$(recommend_template "" 2>/dev/null)
EMPTY_REASONING=$(echo "$EMPTY_RECOMMENDATION" | jq -r '.reasoning')
if [ "$EMPTY_REASONING" = "[]" ]; then
  echo "✓ recommend_template returns empty reasoning array for empty repo"
  PASS=$((PASS + 1))
else
  echo "✗ recommend_template should return empty reasoning array, got: $EMPTY_REASONING"
  FAIL=$((FAIL + 1))
fi

cd /
rm -rf "$EMPTY_TEST_DIR"

# Test score capping at 100
CAPPED_TEST_DIR=$(mktemp -d)
cd "$CAPPED_TEST_DIR"
git init >/dev/null 2>&1
touch package.json CHANGELOG.md
mkdir -p docs/releases docs/research docs/roadmap

# Score with many indicators and matching conversation should be capped at 100
CAPPED_SCORES=$(score_templates "research spike investigation roadmap Q1 release feature bug" 2>/dev/null)
MAX_SCORE=$(echo "$CAPPED_SCORES" | jq '[.[] | select(. > 100)] | length')
if [ "$MAX_SCORE" -eq 0 ]; then
  echo "✓ Scores are properly capped at 100"
  PASS=$((PASS + 1))
else
  echo "✗ Some scores exceed 100: $(echo "$CAPPED_SCORES" | jq -c 'to_entries | map(select(.value > 100))')"
  FAIL=$((FAIL + 1))
fi

cd /
rm -rf "$CAPPED_TEST_DIR"

cd /
rm -rf "$TEST_DIR"

echo ""
echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
