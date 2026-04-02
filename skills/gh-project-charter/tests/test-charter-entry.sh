#!/bin/bash
# skills/gh-project-charter/tests/test-charter-entry.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENTRY_POINT="$SCRIPT_DIR/../gh-project-charter.sh"

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

# Test 1: help command shows usage
OUTPUT=$(bash "$ENTRY_POINT" help 2>&1)
assert "help shows usage" "$(echo "$OUTPUT" | grep -q 'Usage' && echo true || echo false)"

# Test 2: create command generates charter
TMPDIR_TEST=$(mktemp -d)
pushd "$TMPDIR_TEST" > /dev/null
OUTPUT=$(bash "$ENTRY_POINT" create --project "Test Project" --number 1 --goals "Test purpose" 2>&1)
popd > /dev/null
assert "create outputs Generating charter" "$(echo "$OUTPUT" | grep -q 'Generating charter' && echo true || echo false)"

# Test 3: update-section --replace
TMPDIR_TEST=$(mktemp -d)
mkdir -p "$TMPDIR_TEST/docs"
cat > "$TMPDIR_TEST/docs/project-charter.md" <<'EOF'
## Goals

Old goals

---

## Change Log
EOF
CHARTER_FILE="$TMPDIR_TEST/docs/project-charter.md" bash "$ENTRY_POINT" update-section "Goals" --replace "New goals" 2>&1
assert "update-section --replace updates content" "$(grep -q 'New goals' "$TMPDIR_TEST/docs/project-charter.md" && echo true || echo false)"

# Test 4: update-section --append
TMPDIR_TEST2=$(mktemp -d)
mkdir -p "$TMPDIR_TEST2/docs"
cat > "$TMPDIR_TEST2/docs/project-charter.md" <<'EOF'
## Scope

### In Scope

- Existing item

### Out of Scope

- Nothing

---
EOF
CHARTER_FILE="$TMPDIR_TEST2/docs/project-charter.md" bash "$ENTRY_POINT" update-section "In Scope" --append "- New item" 2>&1
assert "update-section --append adds content" "$(grep -q 'New item' "$TMPDIR_TEST2/docs/project-charter.md" && grep -q 'Existing item' "$TMPDIR_TEST2/docs/project-charter.md" && echo true || echo false)"

# Test 5: add-section
TMPDIR_TEST3=$(mktemp -d)
mkdir -p "$TMPDIR_TEST3/docs"
cat > "$TMPDIR_TEST3/docs/project-charter.md" <<'EOF'
## Goals

Goals here

---

## Change Log

### 2026-01-01 - Created
EOF
CHARTER_FILE="$TMPDIR_TEST3/docs/project-charter.md" bash "$ENTRY_POINT" add-section "Timeline" --content "Q1: Phase 1" 2>&1
assert "add-section adds new section" "$(grep -q '## Timeline' "$TMPDIR_TEST3/docs/project-charter.md" && grep -q 'Q1: Phase 1' "$TMPDIR_TEST3/docs/project-charter.md" && echo true || echo false)"

# Test 6: log-change
TMPDIR_TEST4=$(mktemp -d)
mkdir -p "$TMPDIR_TEST4/docs"
cat > "$TMPDIR_TEST4/docs/project-charter.md" <<'EOF'
## Change Log

### 2026-01-01 - Created
- Initial
EOF
CHARTER_FILE="$TMPDIR_TEST4/docs/project-charter.md" bash "$ENTRY_POINT" log-change "Scope expanded" 2>&1
assert "log-change adds entry" "$(grep -q 'Scope expanded' "$TMPDIR_TEST4/docs/project-charter.md" && echo true || echo false)"

# Cleanup
rm -rf "$TMPDIR_TEST" "$TMPDIR_TEST2" "$TMPDIR_TEST3" "$TMPDIR_TEST4"

echo ""
echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
