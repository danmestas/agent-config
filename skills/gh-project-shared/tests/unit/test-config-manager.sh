# skills/gh-project-shared/tests/unit/test-config-manager.sh
#!/bin/bash
set -e

PASS=0
FAIL=0

# Capture absolute script dir before changing directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create temp test directory
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"
mkdir -p .github

# Create test config
cat > .github/project-config.json <<'EOF'
{
  "version": "1.0",
  "projects": [
    {
      "id": "PVT_test123",
      "number": 1,
      "title": "Test Project"
    }
  ]
}
EOF

# Source script
source "$SCRIPT_DIR/../../scripts/config-manager.sh" 2>/dev/null || true

# Test: Read project ID
PROJECT_ID=$(get_project_id 1 2>/dev/null)
if [ "$PROJECT_ID" = "PVT_test123" ]; then
  echo "✓ get_project_id reads correct project ID"
  PASS=$((PASS + 1))
else
  echo "✗ get_project_id should return 'PVT_test123', got: '$PROJECT_ID'"
  FAIL=$((FAIL + 1))
fi

# Test: Missing config returns error
rm .github/project-config.json
if ! get_project_id 1 2>/dev/null; then
  echo "✓ get_project_id returns error when config missing"
  PASS=$((PASS + 1))
else
  echo "✗ get_project_id should fail when config missing"
  FAIL=$((FAIL + 1))
fi

# Cleanup
cd /
rm -rf "$TEST_DIR"

echo ""
echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
