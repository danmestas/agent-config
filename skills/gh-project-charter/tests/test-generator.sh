#!/bin/bash
# skills/gh-project-charter/tests/test-generator.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../scripts/charter-create.sh"

PASS=0
FAIL=0

assert() {
  local desc="$1" result="$2"
  if [ "$result" = "true" ]; then
    echo "✓ $desc"
    PASS=$((PASS + 1))
  else
    echo "✗ $desc"
    FAIL=$((FAIL + 1))
  fi
}

# Test 1: generate_charter outputs "Generated"
TMPDIR_TEST=$(mktemp -d)
pushd "$TMPDIR_TEST" > /dev/null
OUTPUT=$(generate_charter "Test Project" "1" "Test purpose" 2>&1)
popd > /dev/null
assert "generate_charter outputs Generated" "$(echo "$OUTPUT" | grep -q 'Generated' && echo true || echo false)"

# Test 2: populate_template replaces placeholders
TEMPLATE="$SCRIPT_DIR/../templates/charter-minimal.md"
RESULT=$(populate_template "$TEMPLATE" "My Project" "42")
HAS_NAME=$(echo "$RESULT" | grep -q 'My Project' && echo true || echo false)
HAS_NUM=$(echo "$RESULT" | grep -q '#42' && echo true || echo false)
NO_PLACEHOLDER=$(echo "$RESULT" | grep -q '{{PROJECT_NAME}}' && echo false || echo true)
assert "populate_template replaces {{PROJECT_NAME}} and {{PROJECT_NUM}}" "$([ "$HAS_NAME" = "true" ] && [ "$HAS_NUM" = "true" ] && [ "$NO_PLACEHOLDER" = "true" ] && echo true || echo false)"

# Test 3: add_changelog_entry adds entry to Change Log
TMPFILE=$(mktemp)
cat > "$TMPFILE" <<'EOF'
## Change Log

### 2026-01-01 - Charter Created
- Initial charter
EOF
add_changelog_entry "$TMPFILE" "Scope expanded"
assert "add_changelog_entry adds entry under Change Log" "$(grep -q 'Scope expanded' "$TMPFILE" && echo true || echo false)"
rm -f "$TMPFILE"
rm -rf "$TMPDIR_TEST"

echo ""
echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
