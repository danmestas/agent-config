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
      "title": "Test Project",
      "fields": {
        "status_field_id": "PVTF_test_status"
      },
      "field_options": {
        "status": {
          "Todo": "PVTO_test_todo",
          "Done": "PVTO_test_done"
        }
      }
    }
  ]
}
EOF

# Source script
source "$SCRIPT_DIR/../../scripts/config-manager.sh" 2>/dev/null || true

# Test: Read project ID - success case
PROJECT_ID=$(get_project_id 1 2>/dev/null)
if [ "$PROJECT_ID" = "PVT_test123" ]; then
  echo "✓ get_project_id reads correct project ID"
  PASS=$((PASS + 1))
else
  echo "✗ get_project_id should return 'PVT_test123', got: '$PROJECT_ID'"
  FAIL=$((FAIL + 1))
fi

# Test: get_project_id - error when config missing
rm .github/project-config.json
if ! get_project_id 1 2>/dev/null; then
  echo "✓ get_project_id returns error when config missing"
  PASS=$((PASS + 1))
else
  echo "✗ get_project_id should fail when config missing"
  FAIL=$((FAIL + 1))
fi

# Recreate config for remaining tests
cat > .github/project-config.json <<'EOF'
{
  "version": "1.0",
  "projects": [
    {
      "id": "PVT_test123",
      "number": 1,
      "title": "Test Project",
      "fields": {
        "status_field_id": "PVTF_test_status"
      },
      "field_options": {
        "status": {
          "Todo": "PVTO_test_todo",
          "Done": "PVTO_test_done"
        }
      }
    }
  ]
}
EOF

# Test: get_project_config - success case
CONFIG=$(get_project_config 1 2>/dev/null)
if echo "$CONFIG" | jq -e '.id == "PVT_test123"' >/dev/null 2>&1; then
  echo "✓ get_project_config returns correct project config"
  PASS=$((PASS + 1))
else
  echo "✗ get_project_config should return project with id 'PVT_test123'"
  FAIL=$((FAIL + 1))
fi

# Test: get_project_config - error when project not found
if ! get_project_config 999 2>/dev/null; then
  echo "✓ get_project_config returns error when project not found"
  PASS=$((PASS + 1))
else
  echo "✗ get_project_config should fail when project not found"
  FAIL=$((FAIL + 1))
fi

# Test: save_project_config - success case
NEW_PROJECT='{"id":"PVT_test456","number":2,"title":"New Project"}'
if save_project_config "$NEW_PROJECT" 2>/dev/null; then
  if grep -q "PVT_test456" .github/project-config.json; then
    echo "✓ save_project_config saves new project successfully"
    PASS=$((PASS + 1))
  else
    echo "✗ save_project_config should add new project to config"
    FAIL=$((FAIL + 1))
  fi
else
  echo "✗ save_project_config should succeed with valid JSON"
  FAIL=$((FAIL + 1))
fi

# Test: save_project_config - error with empty input
if ! save_project_config "" 2>/dev/null; then
  echo "✓ save_project_config rejects empty input"
  PASS=$((PASS + 1))
else
  echo "✗ save_project_config should fail with empty input"
  FAIL=$((FAIL + 1))
fi

# Test: save_project_config - error with invalid JSON
if ! save_project_config "not-valid-json" 2>/dev/null; then
  echo "✓ save_project_config rejects invalid JSON"
  PASS=$((PASS + 1))
else
  echo "✗ save_project_config should fail with invalid JSON"
  FAIL=$((FAIL + 1))
fi

# Test: validate_config_file - success case
if validate_config_file 2>/dev/null; then
  echo "✓ validate_config_file validates correct config"
  PASS=$((PASS + 1))
else
  echo "✗ validate_config_file should pass with valid config"
  FAIL=$((FAIL + 1))
fi

# Test: validate_config_file - error with missing config
rm .github/project-config.json
if ! validate_config_file 2>/dev/null; then
  echo "✓ validate_config_file returns error when config missing"
  PASS=$((PASS + 1))
else
  echo "✗ validate_config_file should fail when config missing"
  FAIL=$((FAIL + 1))
fi

# Recreate config for field tests
mkdir -p .github
cat > .github/project-config.json <<'EOF'
{
  "version": "1.0",
  "projects": [
    {
      "id": "PVT_test123",
      "number": 1,
      "title": "Test Project",
      "fields": {
        "status_field_id": "PVTF_test_status"
      },
      "field_options": {
        "status": {
          "Todo": "PVTO_test_todo",
          "Done": "PVTO_test_done"
        }
      }
    }
  ]
}
EOF

# Test: get_field_id - success case
FIELD_ID=$(get_field_id 1 status 2>/dev/null)
if [ "$FIELD_ID" = "PVTF_test_status" ]; then
  echo "✓ get_field_id returns correct field ID"
  PASS=$((PASS + 1))
else
  echo "✗ get_field_id should return 'PVTF_test_status', got: '$FIELD_ID'"
  FAIL=$((FAIL + 1))
fi

# Test: get_field_id - error when config missing
rm .github/project-config.json
if ! get_field_id 1 status 2>/dev/null; then
  echo "✓ get_field_id returns error when config missing"
  PASS=$((PASS + 1))
else
  echo "✗ get_field_id should fail when config missing"
  FAIL=$((FAIL + 1))
fi

# Recreate config for option tests
mkdir -p .github
cat > .github/project-config.json <<'EOF'
{
  "version": "1.0",
  "projects": [
    {
      "id": "PVT_test123",
      "number": 1,
      "title": "Test Project",
      "fields": {
        "status_field_id": "PVTF_test_status"
      },
      "field_options": {
        "status": {
          "Todo": "PVTO_test_todo",
          "Done": "PVTO_test_done"
        }
      }
    }
  ]
}
EOF

# Test: get_field_option_id - success case
OPTION_ID=$(get_field_option_id 1 status Todo 2>/dev/null)
if [ "$OPTION_ID" = "PVTO_test_todo" ]; then
  echo "✓ get_field_option_id returns correct option ID"
  PASS=$((PASS + 1))
else
  echo "✗ get_field_option_id should return 'PVTO_test_todo', got: '$OPTION_ID'"
  FAIL=$((FAIL + 1))
fi

# Test: get_field_option_id - error when config missing
rm .github/project-config.json
if ! get_field_option_id 1 status Todo 2>/dev/null; then
  echo "✓ get_field_option_id returns error when config missing"
  PASS=$((PASS + 1))
else
  echo "✗ get_field_option_id should fail when config missing"
  FAIL=$((FAIL + 1))
fi

# Cleanup
cd /
rm -rf "$TEST_DIR"

echo ""
echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
