#!/bin/bash
# skills/gh-project-charter/tests/test-charter-sections.sh
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../scripts/charter-sections.sh"

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

# Setup: create temp charter file
setup_charter() {
  local tmpfile=$(mktemp)
  cat > "$tmpfile" <<'EOF'
## Goals

Old purpose

---

## Scope

### In Scope

- Item 1

### Out of Scope

- Nothing yet

---

## Change Log

### 2026-01-01 - Created
- Initial
EOF
  echo "$tmpfile"
}

# Test 1: update_section replaces content under Goals
CHARTER=$(setup_charter)
update_section "$CHARTER" "Goals" "New purpose"
assert "update_section replaces content under Goals" "$(grep -q 'New purpose' "$CHARTER" && ! grep -q 'Old purpose' "$CHARTER" && echo true || echo false)"
rm -f "$CHARTER"

# Test 2: add_to_section appends to In Scope preserving existing
CHARTER=$(setup_charter)
add_to_section "$CHARTER" "In Scope" "- Item 2"
HAS_ITEM1=$(grep -qF -- '- Item 1' "$CHARTER" && echo true || echo false)
HAS_ITEM2=$(grep -qF -- '- Item 2' "$CHARTER" && echo true || echo false)
assert "add_to_section appends Item 2 under In Scope preserving Item 1" "$([ "$HAS_ITEM1" = "true" ] && [ "$HAS_ITEM2" = "true" ] && echo true || echo false)"
rm -f "$CHARTER"

# Test 3: get_section extracts Goals content
CHARTER=$(setup_charter)
CONTENT=$(get_section "$CHARTER" "Goals")
assert "get_section extracts content from Goals" "$(echo "$CONTENT" | grep -q 'Old purpose' && echo true || echo false)"
rm -f "$CHARTER"

echo ""
echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
