# GitHub Project Management Skills Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modular GitHub project management system for AI agents to create, configure, and manage GitHub Projects V2 autonomously via gh CLI.

**Architecture:** Four independent skills (gh-project-setup, gh-project-operations, gh-project-charter, gh-project-shared) with git-based state management, context-aware templates, and interactive error recovery.

**Tech Stack:** Bash 4.0+, GitHub CLI (gh) v2.89.0+, jq (JSON processor), git

**Spec Reference:** `docs/superpowers/specs/2026-04-01-gh-project-management-design.md`

---

## File Structure Overview

### gh-project-shared/ (Shared Utilities - Foundation)
```
skills/gh-project-shared/
├── SKILL.md (reference doc, not invocable)
├── scripts/
│   ├── gh-check.sh           # Verify gh CLI & auth
│   ├── config-manager.sh     # Read/write .github/project-config.json
│   ├── context-detector.sh   # Analyze repo, suggest templates
│   └── error-handler.sh      # Interactive error recovery
├── references/
│   └── gh-api-reference.md   # GitHub API documentation
└── tests/
    ├── unit/
    │   ├── test-context-detector.sh
    │   ├── test-config-manager.sh
    │   └── test-error-handler.sh
    ├── integration/
    │   ├── test-full-setup.sh
    │   ├── test-operations-flow.sh
    │   ├── test-charter-evolution.sh
    │   ├── test-bulk-operations.sh
    │   └── test-coordination.sh
    ├── error-scenarios/
    │   ├── test-missing-gh.sh
    │   ├── test-unauthenticated.sh
    │   ├── test-rate-limit.sh
    │   ├── test-project-deleted.sh
    │   └── test-partial-failure.sh
    ├── fixtures/
    │   ├── test-projects.json
    │   ├── test-charters/
    │   │   ├── minimal.md
    │   │   └── comprehensive.md
    │   └── test-data/
    │       ├── sample-issues.csv
    │       └── sample-issues.json
    └── run-tests.sh
```

### gh-project-setup/ (Project Creation & Configuration)
```
skills/gh-project-setup/
├── SKILL.md
├── scripts/
│   ├── create-project.sh
│   ├── configure-fields.sh
│   └── apply-template.sh
├── templates/
│   ├── kanban.json
│   ├── bug-tracker.json
│   ├── feature-development.json
│   ├── roadmap.json
│   ├── research.json
│   └── release-planning.json
└── references/
    └── field-definitions.md
```

### gh-project-operations/ (Daily Operations & Bulk)
```
skills/gh-project-operations/
├── SKILL.md
├── scripts/
│   ├── issue-crud.sh
│   ├── bulk-operations.sh
│   ├── query-parser.sh
│   └── csv-parser.sh
└── references/
    └── operation-patterns.md
```

### gh-project-charter/ (Documentation & Evolution)
```
skills/gh-project-charter/
├── SKILL.md
├── scripts/
│   ├── charter-create.sh
│   ├── charter-update.sh
│   └── charter-sections.sh
└── templates/
    ├── charter-minimal.md
    └── section-templates/
        ├── timeline.md
        ├── deliverables.md
        ├── risks.md
        └── change-log.md
```

---

## Chunk 1: Shared Utilities Foundation

This chunk builds the shared utility scripts that all other skills depend on. These provide prerequisite checking, config management, context detection, and error handling.

### Task 1: gh-check.sh - CLI Installation Check

**Files:**
- Create: `skills/gh-project-shared/scripts/gh-check.sh`
- Test: `skills/gh-project-shared/tests/unit/test-gh-check.sh`

- [ ] **Step 1: Write failing test for gh CLI detection**

```bash
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd skills/gh-project-shared/tests/unit
bash test-gh-check.sh
```

Expected: Script not found error or test failures

- [ ] **Step 3: Write minimal gh-check.sh implementation**

```bash
# skills/gh-project-shared/scripts/gh-check.sh
#!/bin/bash
set -e

# Check if gh CLI is installed
check_gh_installed() {
  if ! command -v gh &>/dev/null; then
    cat >&2 <<EOF
ERROR: Prerequisite Missing
Message: GitHub CLI (gh) is not installed
Suggested Action: Install with: brew install gh (macOS) or see https://github.com/cli/cli#installation
EOF
    return 1
  fi

  # Check version
  local version
  version=$(gh --version 2>&1 | head -1 | awk '{print $3}')
  echo "Found gh CLI version: $version" >&2
  return 0
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd skills/gh-project-shared/tests/unit
bash test-gh-check.sh
```

Expected: All tests pass (assuming gh is installed)

- [ ] **Step 5: Commit**

```bash
git add skills/gh-project-shared/scripts/gh-check.sh \
        skills/gh-project-shared/tests/unit/test-gh-check.sh
git commit -m "feat(shared): add gh CLI installation check

- check_gh_installed: verify gh CLI present and version
- uses structured error output for agent parsing
- includes unit tests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 2: gh-auth.sh - Authentication Check

**Files:**
- Create: `skills/gh-project-shared/scripts/gh-auth.sh`
- Test: `skills/gh-project-shared/tests/unit/test-gh-auth.sh`

- [ ] **Step 1: Write failing test for authentication check**

```bash
# skills/gh-project-shared/tests/unit/test-gh-auth.sh
#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../scripts/gh-auth.sh" 2>/dev/null || true

PASS=0
FAIL=0

# Test check_gh_authenticated when gh auth status succeeds
if command -v gh &>/dev/null && gh auth status &>/dev/null; then
  if check_gh_authenticated >/dev/null 2>&1; then
    echo "✓ check_gh_authenticated returns 0 when authenticated"
    PASS=$((PASS + 1))
  else
    echo "✗ check_gh_authenticated should return 0 when authenticated"
    FAIL=$((FAIL + 1))
  fi
else
  echo "⊘ Skipping authenticated test (gh not authenticated)"
fi

# Test check_project_scope when scope exists
if command -v gh &>/dev/null && gh auth status 2>&1 | grep -q "project"; then
  if check_project_scope >/dev/null 2>&1; then
    echo "✓ check_project_scope returns 0 when scope present"
    PASS=$((PASS + 1))
  else
    echo "✗ check_project_scope should return 0 when scope present"
    FAIL=$((FAIL + 1))
  fi
else
  echo "⊘ Skipping project scope test (scope not present)"
fi

echo ""
echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd skills/gh-project-shared/tests/unit
bash test-gh-auth.sh
```

Expected: Script not found error

- [ ] **Step 3: Write minimal gh-auth.sh implementation**

```bash
# skills/gh-project-shared/scripts/gh-auth.sh
#!/bin/bash
set -e

# Check if gh is authenticated
check_gh_authenticated() {
  if ! gh auth status &>/dev/null; then
    cat >&2 <<EOF
ERROR: Authentication Required
Message: Not authenticated with GitHub
Suggested Action: Run: gh auth login --web
EOF
    return 1
  fi

  echo "GitHub authentication: OK" >&2
  return 0
}

# Check if 'project' scope is available
check_project_scope() {
  local scopes
  scopes=$(gh auth status 2>&1 | grep "Token scopes:" | cut -d: -f2)

  if ! echo "$scopes" | grep -q "project"; then
    cat >&2 <<EOF
ERROR: Missing Scope
Message: GitHub token missing 'project' scope
Suggested Action: Run: gh auth refresh -s project
EOF
    return 1
  fi

  echo "Project scope: OK" >&2
  return 0
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd skills/gh-project-shared/tests/unit
bash test-gh-auth.sh
```

Expected: Tests pass (if authenticated with project scope)

- [ ] **Step 5: Commit**

```bash
git add skills/gh-project-shared/scripts/gh-auth.sh \
        skills/gh-project-shared/tests/unit/test-gh-auth.sh
git commit -m "feat(shared): add gh authentication checking

- check_gh_authenticated: verify gh auth status
- check_project_scope: verify project scope in token
- uses structured error output
- includes unit tests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 3: config-manager.sh - Config File Management

**Files:**
- Create: `skills/gh-project-shared/scripts/config-manager.sh`
- Test: `skills/gh-project-shared/tests/unit/test-config-manager.sh`

- [ ] **Step 1: Write failing test for config reading**

```bash
# skills/gh-project-shared/tests/unit/test-config-manager.sh
#!/bin/bash
set -e

PASS=0
FAIL=0

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
SCRIPT_DIR="$(dirname "$0")"
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd skills/gh-project-shared/tests/unit
bash test-config-manager.sh
```

Expected: Script not found error or test failures

- [ ] **Step 3: Write minimal config-manager.sh implementation**

```bash
# skills/gh-project-shared/scripts/config-manager.sh
#!/bin/bash

CONFIG_FILE=".github/project-config.json"

# Read project ID by project number
get_project_id() {
  local project_num=$1

  if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Config file not found: $CONFIG_FILE" >&2
    return 1
  fi

  local project_id
  project_id=$(jq -r ".projects[] | select(.number == $project_num) | .id" "$CONFIG_FILE")

  if [ -z "$project_id" ] || [ "$project_id" = "null" ]; then
    echo "Error: Project $project_num not found in config" >&2
    return 1
  fi

  echo "$project_id"
  return 0
}

# Read entire project config by project number
get_project_config() {
  local project_num=$1

  if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Config file not found: $CONFIG_FILE" >&2
    return 1
  fi

  local config
  config=$(jq ".projects[] | select(.number == $project_num)" "$CONFIG_FILE")

  if [ -z "$config" ] || [ "$config" = "null" ]; then
    echo "Error: Project $project_num not found in config" >&2
    return 1
  fi

  echo "$config"
  return 0
}

# Write/update project config
save_project_config() {
  local project_data=$1

  # Create .github directory if it doesn't exist
  mkdir -p .github

  # If config doesn't exist, create with empty structure
  if [ ! -f "$CONFIG_FILE" ]; then
    echo '{"version": "1.0", "projects": []}' > "$CONFIG_FILE"
  fi

  # Parse project number from data
  local project_num
  project_num=$(echo "$project_data" | jq -r '.number')

  # Check if project already exists in config
  if jq -e ".projects[] | select(.number == $project_num)" "$CONFIG_FILE" >/dev/null 2>&1; then
    # Update existing project
    local temp_file
    temp_file=$(mktemp)
    jq ".projects |= map(if .number == $project_num then $project_data else . end)" "$CONFIG_FILE" > "$temp_file"
    mv "$temp_file" "$CONFIG_FILE"
  else
    # Add new project
    local temp_file
    temp_file=$(mktemp)
    jq ".projects += [$project_data]" "$CONFIG_FILE" > "$temp_file"
    mv "$temp_file" "$CONFIG_FILE"
  fi

  echo "Config saved successfully" >&2
  return 0
}

# Validate config file structure
validate_config_file() {
  if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Config file not found: $CONFIG_FILE" >&2
    return 1
  fi

  # Validate JSON syntax
  if ! jq empty "$CONFIG_FILE" 2>/dev/null; then
    echo "Error: Invalid JSON in $CONFIG_FILE" >&2
    return 1
  fi

  # Validate required fields
  if ! jq -e '.version' "$CONFIG_FILE" >/dev/null 2>&1; then
    echo "Error: Config missing 'version' field" >&2
    return 1
  fi

  if ! jq -e '.projects' "$CONFIG_FILE" >/dev/null 2>&1; then
    echo "Error: Config missing 'projects' array" >&2
    return 1
  fi

  echo "Config validation: OK" >&2
  return 0
}

# Get field ID by name
get_field_id() {
  local project_num=$1
  local field_name=$2

  local field_id
  field_id=$(jq -r ".projects[] | select(.number == $project_num) | .fields.${field_name}_field_id" "$CONFIG_FILE")

  if [ -z "$field_id" ] || [ "$field_id" = "null" ]; then
    echo "Error: Field '$field_name' not found for project $project_num" >&2
    return 1
  fi

  echo "$field_id"
  return 0
}

# Get field option ID
get_field_option_id() {
  local project_num=$1
  local field_name=$2
  local option_name=$3

  local option_id
  option_id=$(jq -r ".projects[] | select(.number == $project_num) | .field_options.$field_name.$option_name" "$CONFIG_FILE")

  if [ -z "$option_id" ] || [ "$option_id" = "null" ]; then
    echo "Error: Option '$option_name' not found for field '$field_name'" >&2
    return 1
  fi

  echo "$option_id"
  return 0
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd skills/gh-project-shared/tests/unit
bash test-config-manager.sh
```

Expected: Tests pass

- [ ] **Step 5: Commit**

```bash
git add skills/gh-project-shared/scripts/config-manager.sh \
        skills/gh-project-shared/tests/unit/test-config-manager.sh
git commit -m "feat(shared): add config file management

- get_project_id: read project ID by number
- get_project_config: read full project config
- save_project_config: write/update project config
- validate_config_file: validate JSON structure
- get_field_id: read field IDs
- get_field_option_id: read option IDs
- includes unit tests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 4: error-handler.sh - Interactive Error Recovery

**Files:**
- Create: `skills/gh-project-shared/scripts/error-handler.sh`
- Test: `skills/gh-project-shared/tests/unit/test-error-handler.sh`

- [ ] **Step 1: Write failing test for error logging**

```bash
# skills/gh-project-shared/tests/unit/test-error-handler.sh
#!/bin/bash
set -e

PASS=0
FAIL=0

# Create temp test directory
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"
mkdir -p .github

# Source script
SCRIPT_DIR="$(dirname "$0")"
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

# Cleanup
cd /
rm -rf "$TEST_DIR"

echo ""
echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd skills/gh-project-shared/tests/unit
bash test-error-handler.sh
```

Expected: Script not found error or test failures

- [ ] **Step 3: Write minimal error-handler.sh implementation**

```bash
# skills/gh-project-shared/scripts/error-handler.sh
#!/bin/bash

ERROR_LOG=".github/project-errors.log"

# Log error with timestamp
log_error() {
  local message=$1
  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  # Create .github directory if needed
  mkdir -p .github

  # Append to error log
  echo "[$timestamp] $message" >> "$ERROR_LOG"
}

# Handle error with context and exit
handle_error() {
  local exit_code=$1
  local message=$2
  local context=$3

  # Log the error
  log_error "Exit code: $exit_code | Message: $message | Context: $context"

  # Output error to stderr
  echo "Error: $message" >&2

  if [ -n "$context" ]; then
    echo "Context: $context" >&2
  fi

  # Exit with code
  exit "$exit_code"
}

# Output structured error message for agent to parse
output_error() {
  local category=$1
  local message=$2
  local suggested_action=$3

  cat >&2 <<EOF
ERROR: $category
Message: $message
Suggested Action: $suggested_action
EOF
}

# Check if prerequisite is met, exit with guidance if not
require_prerequisite() {
  local check_command=$1
  local error_message=$2
  local installation_guide=$3

  if ! eval "$check_command" &>/dev/null; then
    output_error "Prerequisite Missing" "$error_message" "$installation_guide"
    log_error "Prerequisite check failed: $error_message"
    exit 1
  fi
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd skills/gh-project-shared/tests/unit
bash test-error-handler.sh
```

Expected: Tests pass

- [ ] **Step 5: Commit**

```bash
git add skills/gh-project-shared/scripts/error-handler.sh \
        skills/gh-project-shared/tests/unit/test-error-handler.sh
git commit -m "feat(shared): add error handling and logging

- log_error: write errors to .github/project-errors.log
- handle_error: log and exit with structured message
- output_error: format error for agent parsing
- require_prerequisite: check requirements with guidance
- includes unit tests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 5: context-detector.sh - Template Suggestion

**Files:**
- Create: `skills/gh-project-shared/scripts/context-detector.sh`
- Test: `skills/gh-project-shared/tests/unit/test-context-detector.sh`

- [ ] **Step 1: Write failing test for repo analysis**

```bash
# skills/gh-project-shared/tests/unit/test-context-detector.sh
#!/bin/bash
set -e

PASS=0
FAIL=0

# Create temp test directory
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"
git init >/dev/null 2>&1

# Create sample repo structure
touch package.json
mkdir -p docs/releases
touch CHANGELOG.md

# Source script
SCRIPT_DIR="$(dirname "$0")"
source "$SCRIPT_DIR/../../scripts/context-detector.sh" 2>/dev/null || true

# Test: detect_repo_type finds indicators
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

# Test: score_templates returns valid JSON
SCORES=$(score_templates "" 2>/dev/null)
if echo "$SCORES" | jq empty 2>/dev/null; then
  echo "✓ score_templates returns valid JSON"
  PASS=$((PASS + 1))
else
  echo "✗ score_templates should return valid JSON"
  FAIL=$((FAIL + 1))
fi

# Test: recommend_template returns recommendation
RECOMMENDATION=$(recommend_template "release planning" 2>/dev/null)
if echo "$RECOMMENDATION" | jq -e '.recommendation' >/dev/null 2>&1; then
  echo "✓ recommend_template returns recommendation"
  PASS=$((PASS + 1))
else
  echo "✗ recommend_template should return recommendation"
  FAIL=$((FAIL + 1))
fi

# Cleanup
cd /
rm -rf "$TEST_DIR"

echo ""
echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd skills/gh-project-shared/tests/unit
bash test-context-detector.sh
```

Expected: Script not found error or test failures

- [ ] **Step 3: Write minimal context-detector.sh implementation**

```bash
# skills/gh-project-shared/scripts/context-detector.sh
#!/bin/bash

# Detect repository type by analyzing files
detect_repo_type() {
  local indicators=()

  # Check for package managers
  [ -f "package.json" ] && indicators+=("package.json")
  [ -f "Gemfile" ] && indicators+=("Gemfile")
  [ -f "requirements.txt" ] && indicators+=("requirements.txt")
  [ -f "Cargo.toml" ] && indicators+=("Cargo.toml")
  [ -f "go.mod" ] && indicators+=("go.mod")

  # Check for release/changelog
  [ -f "CHANGELOG.md" ] && indicators+=("CHANGELOG.md")
  [ -d "releases" ] && indicators+=("releases/")
  [ -d "docs/releases" ] && indicators+=("docs/releases/")

  # Check for research/spikes
  [ -d "docs/research" ] && indicators+=("docs/research/")
  [ -d "docs/spikes" ] && indicators+=("docs/spikes/")

  # Check for roadmap docs
  [ -d "docs/roadmap" ] && indicators+=("docs/roadmap/")
  [ -f "ROADMAP.md" ] && indicators+=("ROADMAP.md")

  # Output as JSON array
  printf '%s\n' "${indicators[@]}" | jq -R . | jq -s .
}

# Score templates based on indicators and conversation
score_templates() {
  local conversation=$1
  local indicators
  indicators=$(detect_repo_type)

  local scores='{}'

  # Score Kanban (baseline)
  scores=$(echo "$scores" | jq '.kanban = 40')

  # Score Bug Tracker
  local bug_score=20
  if echo "$indicators" | jq -e '.[] | select(. == "package.json")' >/dev/null; then
    bug_score=$((bug_score + 10))
  fi
  if echo "$conversation" | grep -qi "bug"; then
    bug_score=$((bug_score + 30))
  fi
  scores=$(echo "$scores" | jq ".\"bug-tracker\" = $bug_score")

  # Score Feature Development
  local feature_score=30
  if echo "$indicators" | jq -e '.[] | select(contains("package"))' >/dev/null; then
    feature_score=$((feature_score + 45))
  fi
  if echo "$conversation" | grep -qi "feature"; then
    feature_score=$((feature_score + 20))
  fi
  scores=$(echo "$scores" | jq ".\"feature-development\" = $feature_score")

  # Score Release Planning
  local release_score=20
  if echo "$indicators" | jq -e '.[] | select(. == "CHANGELOG.md")' >/dev/null; then
    release_score=$((release_score + 40))
  fi
  if echo "$indicators" | jq -e '.[] | select(contains("releases"))' >/dev/null; then
    release_score=$((release_score + 25))
  fi
  if echo "$conversation" | grep -qi "release"; then
    release_score=$((release_score + 20))
  fi
  scores=$(echo "$scores" | jq ".\"release-planning\" = $release_score")

  # Score Roadmap
  local roadmap_score=30
  if echo "$indicators" | jq -e '.[] | select(contains("roadmap"))' >/dev/null; then
    roadmap_score=$((roadmap_score + 30))
  fi
  if echo "$conversation" | grep -qi "roadmap\|quarter\|Q[1-4]"; then
    roadmap_score=$((roadmap_score + 30))
  fi
  scores=$(echo "$scores" | jq ".roadmap = $roadmap_score")

  # Score Research
  local research_score=10
  if echo "$indicators" | jq -e '.[] | select(contains("research") or contains("spike"))' >/dev/null; then
    research_score=$((research_score + 50))
  fi
  if echo "$conversation" | grep -qi "research\|spike\|investigation"; then
    research_score=$((research_score + 30))
  fi
  scores=$(echo "$scores" | jq ".research = $research_score")

  echo "$scores"
}

# Get template recommendation with reasoning
recommend_template() {
  local conversation=$1

  local indicators
  indicators=$(detect_repo_type)

  local scores
  scores=$(score_templates "$conversation")

  # Find highest scoring template
  local recommendation
  recommendation=$(echo "$scores" | jq -r 'to_entries | max_by(.value) | .key')

  local max_score
  max_score=$(echo "$scores" | jq -r ".[\"$recommendation\"]")

  # Build reasoning
  local reasoning=()
  if echo "$indicators" | jq -e '.[] | select(. == "CHANGELOG.md")' >/dev/null; then
    reasoning+=("CHANGELOG.md found")
  fi
  if echo "$indicators" | jq -e '.[] | select(contains("package"))' >/dev/null; then
    reasoning+=("Package manager detected")
  fi
  if [ -n "$conversation" ]; then
    reasoning+=("Conversation context analyzed")
  fi

  # Output structured recommendation
  jq -n \
    --arg rec "$recommendation" \
    --argjson score "$max_score" \
    --argjson scores "$scores" \
    --argjson reasons "$(printf '%s\n' "${reasoning[@]}" | jq -R . | jq -s .)" \
    '{
      recommendation: $rec,
      confidence: (if $score >= 70 then "high" elif $score >= 50 then "medium" else "low" end),
      scores: $scores,
      reasoning: $reasons
    }'
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd skills/gh-project-shared/tests/unit
bash test-context-detector.sh
```

Expected: Tests pass

- [ ] **Step 5: Commit**

```bash
git add skills/gh-project-shared/scripts/context-detector.sh \
        skills/gh-project-shared/tests/unit/test-context-detector.sh
git commit -m "feat(shared): add context detection and template scoring

- detect_repo_type: analyze repo structure for indicators
- score_templates: score all 6 templates based on indicators + conversation
- recommend_template: return highest scoring template with reasoning
- supports all 6 templates: kanban, bug-tracker, feature-development,
  release-planning, roadmap, research
- includes unit tests

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 5: gh-project-shared SKILL.md Documentation

**Files:**
- Create: `skills/gh-project-shared/SKILL.md`

- [ ] **Step 1: Write SKILL.md documentation**

```markdown
---
name: gh-project-shared
description: "Shared utilities for GitHub project management. Not directly invoked by agents. Provides: gh CLI validation, authentication checking, config file management (.github/project-config.json), context detection for template suggestions, and error handling with logging."
---

# GitHub Project Management - Shared Utilities

**Purpose:** Common utilities used by gh-project-setup, gh-project-operations, and gh-project-charter skills.

**Not directly invocable:** This skill provides shared scripts. Agents should invoke the specific skills (setup, operations, charter) instead.

## Utilities Provided

### gh-check.sh
gh CLI installation verification.

**Functions:**
- `check_gh_installed` - Verify gh CLI is installed and check version

**Usage:**
```bash
source scripts/gh-check.sh
check_gh_installed || exit 1
```

### gh-auth.sh
gh CLI authentication and scope verification.

**Functions:**
- `check_gh_authenticated` - Verify gh auth status
- `check_project_scope` - Verify project scope in token

**Usage:**
```bash
source scripts/gh-auth.sh
check_gh_authenticated || exit 1
check_project_scope || exit 1
```

### config-manager.sh
Read/write `.github/project-config.json` configuration file.

**Functions:**
- `get_project_id <project_num>` - Get project ID
- `get_project_config <project_num>` - Get full project config
- `save_project_config <json_data>` - Save/update project config
- `validate_config_file` - Validate JSON structure
- `get_field_id <project_num> <field_name>` - Get field ID
- `get_field_option_id <project_num> <field> <option>` - Get option ID

**Usage:**
```bash
source scripts/config-manager.sh
PROJECT_ID=$(get_project_id 1)
PRIORITY_FIELD=$(get_field_id 1 "priority")
HIGH_OPTION=$(get_field_option_id 1 "priority" "high")
```

### context-detector.sh
Analyze repository and conversation to suggest appropriate project template.

**Functions:**
- `detect_repo_type` - Analyze repo structure, return indicators as JSON
- `score_templates <conversation>` - Score all 6 templates 0-100
- `recommend_template <conversation>` - Get recommendation with reasoning

**Templates scored:**
- kanban (simple task tracking)
- bug-tracker (issue triage)
- feature-development (product work)
- release-planning (version management)
- roadmap (strategic planning)
- research (technical investigation)

**Usage:**
```bash
source scripts/context-detector.sh
RECOMMENDATION=$(recommend_template "working on release planning")
TEMPLATE=$(echo "$RECOMMENDATION" | jq -r '.recommendation')
```

### error-handler.sh
Error logging and structured error output for agent parsing.

**Functions:**
- `log_error <message>` - Append to `.github/project-errors.log`
- `handle_error <code> <message> <context>` - Log and exit
- `output_error <category> <message> <action>` - Format for agent
- `require_prerequisite <check> <error> <guide>` - Check with guidance

**Usage:**
```bash
source scripts/error-handler.sh
require_prerequisite "command -v gh" \
  "gh CLI not installed" \
  "Install: brew install gh"
```

## Dependencies

- bash 4.0+
- jq (JSON processor)
- gh CLI v2.89.0+ (for actual operations, not testing)
- git

## Testing

Unit tests in `tests/unit/`:
- test-gh-check.sh
- test-gh-auth.sh
- test-config-manager.sh
- test-context-detector.sh
- test-error-handler.sh

Integration tests in `tests/integration/` test cross-skill workflows.

Error scenario tests in `tests/error-scenarios/` test recovery flows.

Run all tests:
```bash
cd tests
./run-tests.sh
```

## Configuration Files

**Input:** `.github/project-config.json` (managed by config-manager.sh)
**Output:** `.github/project-errors.log` (managed by error-handler.sh)

## Safety

- All scripts use `set -e` to exit on errors
- Prerequisites checked before operations
- Config file validated before reading
- Errors logged with timestamps for debugging
```

- [ ] **Step 2: Commit**

```bash
git add skills/gh-project-shared/SKILL.md
git commit -m "docs(shared): add SKILL.md documentation

Document shared utilities:
- gh-check.sh: gh CLI installation verification
- gh-auth.sh: authentication and scope checking
- config-manager.sh: config file management
- context-detector.sh: template recommendation
- error-handler.sh: error logging and recovery

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 6: gh-api-reference.md Documentation

**Files:**
- Create: `skills/gh-project-shared/references/gh-api-reference.md`

- [ ] **Step 1: Create gh-api-reference.md**

```markdown
# GitHub Projects API Reference

Quick reference for gh CLI commands used in the gh-project-* skills.

## Prerequisites

```bash
# Check gh CLI version
gh --version  # Need v2.89.0+

# Check authentication
gh auth status

# Refresh with project scope if needed
gh auth refresh -s project
```

## Projects

### List Projects
```bash
# User projects
gh project list --owner @me

# Organization projects
gh project list --owner orgname

# Include closed
gh project list --owner @me --closed

# JSON output
gh project list --owner @me --format json
```

### Create Project
```bash
# Basic creation
gh project create --owner @me --title "Project Title"

# Get project number from output
gh project create --owner @me --title "My Board" --format json | jq -r '.number'
```

### View Project
```bash
# View in terminal
gh project view 1 --owner @me

# View as JSON
gh project view 1 --owner @me --format json

# Open in browser
gh project view 1 --owner @me --web
```

### Edit Project
```bash
# Update title
gh project edit 1 --owner @me --title "New Title"

# Update description
gh project edit 1 --owner @me --description "Project description"

# Set visibility
gh project edit 1 --owner @me --visibility PUBLIC  # or PRIVATE
```

### Link Project to Repository
```bash
# Link to current repo
gh project link 1 --owner @me

# Link to specific repo
gh project link 1 --owner @me --repo owner/repo-name
```

## Fields

### List Fields
```bash
# Get all fields
gh project field-list 1 --owner @me

# JSON output with field IDs
gh project field-list 1 --owner @me --format json
```

### Create Field
```bash
# Text field
gh project field-create 1 --owner @me \
  --name "Notes" \
  --data-type TEXT

# Date field
gh project field-create 1 --owner @me \
  --name "Due Date" \
  --data-type DATE

# Number field
gh project field-create 1 --owner @me \
  --name "Story Points" \
  --data-type NUMBER

# Single-select field (dropdown)
gh project field-create 1 --owner @me \
  --name "Priority" \
  --data-type SINGLE_SELECT \
  --single-select-options "High,Medium,Low"
```

### Delete Field
```bash
gh project field-delete --id "PVTF_..."
```

## Items

### List Items
```bash
# List all items in project
gh project item-list 1 --owner @me

# JSON output
gh project item-list 1 --owner @me --format json
```

### Add Item to Project
```bash
# Add existing issue
gh project item-add 1 --owner @me \
  --url https://github.com/owner/repo/issues/123

# Add existing PR
gh project item-add 1 --owner @me \
  --url https://github.com/owner/repo/pull/456
```

### Create Draft Issue in Project
```bash
gh project item-create 1 --owner @me \
  --title "Draft issue title" \
  --body "Draft issue body"
```

### Update Item Fields
```bash
# Update text field
gh project item-edit \
  --id "$ITEM_ID" \
  --project-id "$PROJECT_ID" \
  --field-id "$FIELD_ID" \
  --text "value"

# Update date field
gh project item-edit \
  --id "$ITEM_ID" \
  --project-id "$PROJECT_ID" \
  --field-id "$FIELD_ID" \
  --date "2026-04-15"

# Update number field
gh project item-edit \
  --id "$ITEM_ID" \
  --project-id "$PROJECT_ID" \
  --field-id "$FIELD_ID" \
  --number 5

# Update single-select field
gh project item-edit \
  --id "$ITEM_ID" \
  --project-id "$PROJECT_ID" \
  --field-id "$FIELD_ID" \
  --single-select-option-id "$OPTION_ID"

# Clear field
gh project item-edit \
  --id "$ITEM_ID" \
  --project-id "$PROJECT_ID" \
  --field-id "$FIELD_ID" \
  --clear
```

### Archive Item
```bash
gh project item-archive \
  --id "$ITEM_ID" \
  --owner @me
```

### Delete Item
```bash
gh project item-delete --id "$ITEM_ID"
```

## Issues

### Create Issue
```bash
# Basic
gh issue create --title "Issue title" --body "Issue body"

# With labels and assignee
gh issue create \
  --title "Bug found" \
  --body "Description" \
  --label bug \
  --label urgent \
  --assignee @me

# Add to project on creation
gh issue create \
  --title "New feature" \
  --body "Description" \
  --project "Project Title"
```

### List Issues
```bash
# List all open issues
gh issue list

# Filter by label
gh issue list --label bug

# JSON output
gh issue list --json number,title,url
```

### View Issue
```bash
gh issue view 123
```

### Edit Issue
```bash
# Update title
gh issue edit 123 --title "New title"

# Add labels
gh issue edit 123 --add-label enhancement

# Change assignee
gh issue edit 123 --add-assignee @me
```

## Useful Patterns

### Get Project ID
```bash
PROJECT_ID=$(gh project view 1 --owner @me --format json | jq -r '.id')
```

### Get Field ID by Name
```bash
FIELD_ID=$(gh project field-list 1 --owner @me --format json | \
  jq -r '.fields[] | select(.name == "Priority") | .id')
```

### Get Option ID by Name
```bash
OPTION_ID=$(gh project field-list 1 --owner @me --format json | \
  jq -r '.fields[] | select(.name == "Priority") | .options[] | select(.name == "High") | .id')
```

### Get Item ID by Title
```bash
ITEM_ID=$(gh project item-list 1 --owner @me --format json | \
  jq -r '.items[] | select(.title == "Issue title") | .id')
```

## Rate Limiting

- GitHub API: 5000 requests/hour for authenticated users
- Check remaining: `gh api rate_limit`
- On 429 error: wait for reset time in response headers

## Error Codes

- 0: Success
- 1: General error
- 404: Resource not found
- 429: Rate limit exceeded
- 403: Forbidden (check scopes)

## Resources

- gh CLI Manual: https://cli.github.com/manual/
- GitHub Projects API: https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects
```

- [ ] **Step 2: Commit**

```bash
git add skills/gh-project-shared/references/gh-api-reference.md
git commit -m "docs(shared): add gh API reference documentation

Quick reference for gh CLI commands:
- Project management (list, create, edit, link)
- Field management (list, create, delete)
- Item operations (add, edit, archive)
- Issue creation and management
- Useful patterns and error codes

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 8: run-tests.sh - Test Runner

**Files:**
- Create: `skills/gh-project-shared/tests/run-tests.sh`

- [ ] **Step 1: Create test runner script**

```bash
# skills/gh-project-shared/tests/run-tests.sh
#!/bin/bash
set -e

echo "Running gh-project-shared tests..."
echo ""

TOTAL_PASS=0
TOTAL_FAIL=0

# Determine which test suite to run
TEST_SUITE="${1:-all}"

run_unit_tests() {
  echo "=== Unit Tests ==="
  echo ""

  for test_file in unit/test-*.sh; do
    if [ -f "$test_file" ]; then
      echo "Running $(basename "$test_file")..."
      if bash "$test_file"; then
        echo "✓ $(basename "$test_file") passed"
      else
        echo "✗ $(basename "$test_file") failed"
        TOTAL_FAIL=$((TOTAL_FAIL + 1))
      fi
      echo ""
    fi
  done
}

run_integration_tests() {
  echo "=== Integration Tests ==="
  echo ""

  for test_file in integration/test-*.sh; do
    if [ -f "$test_file" ]; then
      echo "Running $(basename "$test_file")..."
      if bash "$test_file"; then
        echo "✓ $(basename "$test_file") passed"
      else
        echo "✗ $(basename "$test_file") failed"
        TOTAL_FAIL=$((TOTAL_FAIL + 1))
      fi
      echo ""
    fi
  done
}

run_error_scenario_tests() {
  echo "=== Error Scenario Tests ==="
  echo ""

  for test_file in error-scenarios/test-*.sh; do
    if [ -f "$test_file" ]; then
      echo "Running $(basename "$test_file")..."
      if bash "$test_file"; then
        echo "✓ $(basename "$test_file") passed"
      else
        echo "✗ $(basename "$test_file") failed"
        TOTAL_FAIL=$((TOTAL_FAIL + 1))
      fi
      echo ""
    fi
  done
}

# Run selected test suite
case "$TEST_SUITE" in
  unit)
    run_unit_tests
    ;;
  integration)
    run_integration_tests
    ;;
  error)
    run_error_scenario_tests
    ;;
  all)
    run_unit_tests
    run_integration_tests
    run_error_scenario_tests
    ;;
  *)
    echo "Usage: $0 [unit|integration|error|all]"
    exit 1
    ;;
esac

# Summary
echo "===================================="
if [ $TOTAL_FAIL -eq 0 ]; then
  echo "All tests passed!"
  exit 0
else
  echo "$TOTAL_FAIL test(s) failed"
  exit 1
fi
```

- [ ] **Step 2: Make script executable**

```bash
chmod +x skills/gh-project-shared/tests/run-tests.sh
```

- [ ] **Step 3: Test the test runner**

```bash
cd skills/gh-project-shared/tests
./run-tests.sh unit
```

Expected: All unit tests run and report pass/fail

- [ ] **Step 4: Commit**

```bash
git add skills/gh-project-shared/tests/run-tests.sh
git commit -m "test(shared): add test runner script

- Runs unit, integration, and error scenario tests
- Supports selective test execution (unit|integration|error|all)
- Reports pass/fail summary
- Exits with non-zero on failures

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## End of Chunk 1

This completes the shared utilities foundation. The next chunks will build:

- **Chunk 2:** gh-project-setup skill (project creation, templates, field configuration)
- **Chunk 3:** gh-project-operations skill (CRUD, bulk operations)
- **Chunk 4:** gh-project-charter skill (documentation, evolution)

All subsequent skills will use the utilities created in this chunk.
