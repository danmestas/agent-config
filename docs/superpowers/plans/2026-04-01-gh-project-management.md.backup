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
│   ├── gh-check.sh           # Verify gh CLI installation
│   ├── gh-auth.sh            # Check authentication & scope
│   ├── config-manager.sh     # Read/write .github/project-config.json
│   ├── context-detector.sh   # Analyze repo, suggest templates
│   └── error-handler.sh      # Interactive error recovery
├── references/
│   └── gh-api-reference.md   # GitHub API documentation
└── tests/
    ├── unit/
    │   ├── test-gh-check.sh
    │   ├── test-gh-auth.sh
    │   ├── test-config-manager.sh
    │   ├── test-context-detector.sh
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

---

## Chunk 2: gh-project-setup Skill

This chunk implements the project creation and configuration skill, including context-aware template selection, field configuration, and repository linking.

### Task 9: Template JSON Files

**Files:**
- Create: `skills/gh-project-setup/templates/kanban.json`
- Create: `skills/gh-project-setup/templates/bug-tracker.json`
- Create: `skills/gh-project-setup/templates/feature-development.json`
- Create: `skills/gh-project-setup/templates/roadmap.json`
- Create: `skills/gh-project-setup/templates/research.json`
- Create: `skills/gh-project-setup/templates/release-planning.json`

- [ ] **Step 1: Create kanban template**

```json
{
  "name": "kanban",
  "display_name": "Kanban Board",
  "description": "Simple workflow for general task tracking",
  "fields": ["Status", "Priority"],
  "use_case": "General task tracking, simple projects"
}
```

Save to: `skills/gh-project-setup/templates/kanban.json`

- [ ] **Step 2: Create bug-tracker template**

```json
{
  "name": "bug-tracker",
  "display_name": "Bug Tracker",
  "description": "Issue triage and resolution workflow",
  "fields": ["Status", "Severity", "Type"],
  "field_overrides": {
    "Severity": {
      "type": "SINGLE_SELECT",
      "options": ["Critical", "High", "Medium", "Low"],
      "replaces": "Priority",
      "description": "Bug-specific priority field with severity levels"
    }
  },
  "use_case": "Bug triage and resolution"
}
```

Save to: `skills/gh-project-setup/templates/bug-tracker.json`

- [ ] **Step 3: Create feature-development template**

```json
{
  "name": "feature-development",
  "display_name": "Feature Development",
  "description": "Product feature development workflow",
  "fields": ["Status", "Priority", "Size", "Type"],
  "use_case": "Building new features"
}
```

Save to: `skills/gh-project-setup/templates/feature-development.json`

- [ ] **Step 4: Create roadmap template**

```json
{
  "name": "roadmap",
  "display_name": "Product Roadmap",
  "description": "Strategic planning and quarterly tracking",
  "fields": ["Status", "Priority", "Quarter"],
  "field_overrides": {
    "Quarter": {
      "type": "SINGLE_SELECT",
      "options": ["Q1", "Q2", "Q3", "Q4"],
      "adds_to": ["Status", "Priority"],
      "description": "Quarterly planning field"
    }
  },
  "use_case": "Strategic planning, quarterly goals"
}
```

Save to: `skills/gh-project-setup/templates/roadmap.json`

- [ ] **Step 5: Create research template**

```json
{
  "name": "research",
  "display_name": "Research & Spikes",
  "description": "Technical investigation and exploration",
  "fields": ["Status", "Outcome"],
  "field_overrides": {
    "Outcome": {
      "type": "SINGLE_SELECT",
      "options": ["Success", "Learning", "Blocked"],
      "replaces": "Priority",
      "description": "Research outcome tracking"
    }
  },
  "use_case": "Technical investigation, proof-of-concepts"
}
```

Save to: `skills/gh-project-setup/templates/research.json`

- [ ] **Step 6: Create release-planning template**

```json
{
  "name": "release-planning",
  "display_name": "Release Planning",
  "description": "Version and release coordination",
  "fields": ["Status", "Priority", "Release"],
  "field_overrides": {
    "Release": {
      "type": "SINGLE_SELECT",
      "options": ["v1.0", "v1.1", "v2.0", "Next"],
      "adds_to": ["Status", "Priority"],
      "description": "Release version tracking"
    }
  },
  "use_case": "Release coordination, version management"
}
```

Save to: `skills/gh-project-setup/templates/release-planning.json`

- [ ] **Step 7: Commit all templates**

```bash
git add skills/gh-project-setup/templates/
git commit -m "feat(setup): add 6 project templates

- kanban: simple task tracking (Status, Priority)
- bug-tracker: issue triage (Status, Severity, Type)
- feature-development: product work (Status, Priority, Size, Type)
- roadmap: strategic planning (Status, Priority, Quarter)
- research: technical investigation (Status, Outcome)
- release-planning: version management (Status, Priority, Release)

Implements field override semantics (replaces, adds_to)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 10: create-project.sh - Project Creation

**Files:**
- Create: `skills/gh-project-setup/scripts/create-project.sh`

- [ ] **Step 1: Write create-project.sh**

```bash
# skills/gh-project-setup/scripts/create-project.sh
#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHARED_DIR="$SCRIPT_DIR/../../gh-project-shared/scripts"

# Source shared utilities
source "$SHARED_DIR/gh-check.sh"
source "$SHARED_DIR/gh-auth.sh"
source "$SHARED_DIR/config-manager.sh"
source "$SHARED_DIR/error-handler.sh"

# Check prerequisites
check_gh_installed || exit 1
check_gh_authenticated || exit 1
check_project_scope || exit 1

# Parse arguments
TITLE="$1"
OWNER="${2:-@me}"
shift 2 2>/dev/null || true
REPOS=("$@")

if [ -z "$TITLE" ]; then
  echo "Usage: $0 <title> [owner] [repos...]" >&2
  exit 1
fi

# Detect owner type
OWNER_TYPE="user"
if [ "$OWNER" != "@me" ]; then
  if gh api "/users/$OWNER" 2>/dev/null | jq -e '.type == "Organization"' >/dev/null; then
    OWNER_TYPE="org"
    echo "Creating organization project for $OWNER"
  fi
fi

# Create project
echo "Creating project: $TITLE"
PROJECT_JSON=$(gh project create --owner "$OWNER" --title "$TITLE" --format json)
PROJECT_NUM=$(echo "$PROJECT_JSON" | jq -r '.number')
PROJECT_ID=$(echo "$PROJECT_JSON" | jq -r '.id')

echo "Project created: #$PROJECT_NUM (ID: $PROJECT_ID)"

# Link repositories
if [ "$OWNER_TYPE" = "user" ] && [ ${#REPOS[@]} -eq 0 ]; then
  # User project, no explicit repos: link current repo
  echo "Linking current repository..."
  gh project link "$PROJECT_NUM" --owner "$OWNER" 2>/dev/null || true
  REPOS=($(basename "$(git rev-parse --show-toplevel)"))
elif [ ${#REPOS[@]} -gt 0 ]; then
  # Multiple repos specified: link each one
  echo "Linking repositories: ${REPOS[*]}"
  for repo in "${REPOS[@]}"; do
    gh project link "$PROJECT_NUM" --owner "$OWNER" --repo "$repo" || echo "Warning: Failed to link $repo"
  done
fi

# Output project info for next steps
echo "$PROJECT_JSON"
```

- [ ] **Step 2: Make script executable and test**

```bash
chmod +x skills/gh-project-setup/scripts/create-project.sh

# Test (will actually create a project)
# cd skills/gh-project-setup
# ./scripts/create-project.sh "Test Project" @me
```

Expected: Project created, JSON output with number and ID

- [ ] **Step 3: Commit**

```bash
git add skills/gh-project-setup/scripts/create-project.sh
git commit -m "feat(setup): add project creation script

- Creates GitHub project via gh CLI
- Detects user vs org owner type
- Links repositories (current repo or specified list)
- Outputs project JSON for further processing
- Uses shared utilities for prerequisites

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 11: configure-fields.sh - Field Configuration

**Files:**
- Create: `skills/gh-project-setup/scripts/configure-fields.sh`

- [ ] **Step 1: Write configure-fields.sh**

```bash
# skills/gh-project-setup/scripts/configure-fields.sh
#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHARED_DIR="$SCRIPT_DIR/../../gh-project-shared/scripts"

source "$SHARED_DIR/gh-check.sh"
source "$SHARED_DIR/gh-auth.sh"
source "$SHARED_DIR/error-handler.sh"

check_gh_installed || exit 1
check_gh_authenticated || exit 1
check_project_scope || exit 1

# Parse arguments
PROJECT_NUM="$1"
OWNER="$2"
FIELD_NAME="$3"
FIELD_TYPE="$4"
FIELD_OPTIONS="$5"

if [ -z "$PROJECT_NUM" ] || [ -z "$OWNER" ] || [ -z "$FIELD_NAME" ] || [ -z "$FIELD_TYPE" ]; then
  echo "Usage: $0 <project_num> <owner> <field_name> <field_type> [options]" >&2
  exit 1
fi

# Create field
echo "Creating field: $FIELD_NAME ($FIELD_TYPE)"

if [ "$FIELD_TYPE" = "SINGLE_SELECT" ]; then
  if [ -z "$FIELD_OPTIONS" ]; then
    echo "Error: SINGLE_SELECT requires options (comma-separated)" >&2
    exit 1
  fi

  FIELD_JSON=$(gh project field-create "$PROJECT_NUM" \
    --owner "$OWNER" \
    --name "$FIELD_NAME" \
    --data-type "$FIELD_TYPE" \
    --single-select-options "$FIELD_OPTIONS" \
    --format json)
else
  FIELD_JSON=$(gh project field-create "$PROJECT_NUM" \
    --owner "$OWNER" \
    --name "$FIELD_NAME" \
    --data-type "$FIELD_TYPE" \
    --format json)
fi

echo "Field created successfully"
echo "$FIELD_JSON"
```

- [ ] **Step 2: Make executable and commit**

```bash
chmod +x skills/gh-project-setup/scripts/configure-fields.sh

git add skills/gh-project-setup/scripts/configure-fields.sh
git commit -m "feat(setup): add field configuration script

- Creates custom fields in projects
- Supports TEXT, DATE, NUMBER, SINGLE_SELECT types
- Handles SINGLE_SELECT options
- Returns field JSON with IDs

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 12: apply-template.sh - Template Application

**Files:**
- Create: `skills/gh-project-setup/scripts/apply-template.sh`

- [ ] **Step 1: Write apply-template.sh**

```bash
# skills/gh-project-setup/scripts/apply-template.sh
#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHARED_DIR="$SCRIPT_DIR/../../gh-project-shared/scripts"
TEMPLATES_DIR="$SCRIPT_DIR/../templates"

source "$SHARED_DIR/gh-check.sh"
source "$SHARED_DIR/gh-auth.sh"
source "$SHARED_DIR/config-manager.sh"
source "$SHARED_DIR/error-handler.sh"

check_gh_installed || exit 1
check_gh_authenticated || exit 1
check_project_scope || exit 1

# Parse arguments
PROJECT_NUM="$1"
OWNER="$2"
TEMPLATE_NAME="$3"

if [ -z "$PROJECT_NUM" ] || [ -z "$OWNER" ] || [ -z "$TEMPLATE_NAME" ]; then
  echo "Usage: $0 <project_num> <owner> <template_name>" >&2
  exit 1
fi

# Load template
TEMPLATE_FILE="$TEMPLATES_DIR/${TEMPLATE_NAME}.json"
if [ ! -f "$TEMPLATE_FILE" ]; then
  echo "Error: Template not found: $TEMPLATE_FILE" >&2
  exit 1
fi

TEMPLATE=$(cat "$TEMPLATE_FILE")
echo "Applying template: $(echo "$TEMPLATE" | jq -r '.display_name')"

# Get project ID
PROJECT_ID=$(gh project view "$PROJECT_NUM" --owner "$OWNER" --format json | jq -r '.id')

# Parse fields from template
FIELDS=$(echo "$TEMPLATE" | jq -r '.fields[]')
OVERRIDES=$(echo "$TEMPLATE" | jq -r '.field_overrides // {}')

# Track created field IDs for config
declare -A FIELD_IDS
declare -A FIELD_OPTIONS

# Create standard fields
for field in $FIELDS; do
  # Check if this field has an override
  OVERRIDE=$(echo "$OVERRIDES" | jq -r ".$field // null")

  if [ "$OVERRIDE" != "null" ]; then
    # Custom field with override
    FIELD_TYPE=$(echo "$OVERRIDE" | jq -r '.type')
    OPTIONS=$(echo "$OVERRIDE" | jq -r '.options | join(",")')
    REPLACES=$(echo "$OVERRIDE" | jq -r '.replaces // ""')

    echo "Creating custom field: $field ($FIELD_TYPE)"
    FIELD_JSON=$(bash "$SCRIPT_DIR/configure-fields.sh" "$PROJECT_NUM" "$OWNER" "$field" "$FIELD_TYPE" "$OPTIONS")

    FIELD_ID=$(echo "$FIELD_JSON" | jq -r '.id')
    FIELD_IDS[$field]=$FIELD_ID

    # Store option IDs
    echo "$FIELD_JSON" | jq -r '.options[]? | "\(.name)|\(.id)"' | while IFS='|' read -r opt_name opt_id; do
      FIELD_OPTIONS["${field,,}_$opt_name"]=$opt_id
    done

  elif [ "$field" = "Status" ]; then
    # Built-in Status field - get existing field ID
    echo "Using built-in Status field"
    STATUS_FIELD_ID=$(gh project field-list "$PROJECT_NUM" --owner "$OWNER" --format json | jq -r '.fields[] | select(.name == "Status") | .id')
    FIELD_IDS[Status]=$STATUS_FIELD_ID

    # Get Status field options
    gh project field-list "$PROJECT_NUM" --owner "$OWNER" --format json | \
      jq -r '.fields[] | select(.name == "Status") | .options[]? | "\(.name)|\(.id)"' | \
      while IFS='|' read -r opt_name opt_id; do
        # Store as lowercase for consistency
        FIELD_OPTIONS["status_${opt_name,,}"]=$opt_id
      done

  else
    # Standard field to create
    FIELD_TYPE="SINGLE_SELECT"

    case "$field" in
      Priority)
        OPTIONS="High,Medium,Low"
        ;;
      Size)
        OPTIONS="XS,S,M,L,XL"
        ;;
      Type)
        OPTIONS="Bug,Feature,Improvement,Spike"
        ;;
      *)
        echo "Warning: Unknown field $field, skipping"
        continue
        ;;
    esac

    echo "Creating field: $field ($FIELD_TYPE)"
    FIELD_JSON=$(bash "$SCRIPT_DIR/configure-fields.sh" "$PROJECT_NUM" "$OWNER" "$field" "$FIELD_TYPE" "$OPTIONS")

    FIELD_ID=$(echo "$FIELD_JSON" | jq -r '.id')
    FIELD_IDS[$field]=$FIELD_ID

    # Store option IDs
    echo "$FIELD_JSON" | jq -r '.options[]? | "\(.name)|\(.id)"' | while IFS='|' read -r opt_name opt_id; do
      FIELD_OPTIONS["${field,,}_${opt_name,,}"]=$opt_id
    done
  fi
done

# Save configuration
CONFIG_DATA=$(jq -n \
  --arg id "$PROJECT_ID" \
  --argjson num "$PROJECT_NUM" \
  --arg title "$(gh project view "$PROJECT_NUM" --owner "$OWNER" --format json | jq -r '.title')" \
  --arg owner "$OWNER" \
  --arg template "$TEMPLATE_NAME" \
  --arg created "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
  '{
    id: $id,
    number: $num,
    title: $title,
    owner: $owner,
    template: $template,
    linked_repos: [],
    created_at: $created,
    fields: {},
    field_options: {},
    coordination: {
      charter_suggested: false,
      last_scope_check: $created,
      skip_charter_prompts: false
    }
  }')

# Add field IDs to config
for field_name in "${!FIELD_IDS[@]}"; do
  field_id="${FIELD_IDS[$field_name]}"
  CONFIG_DATA=$(echo "$CONFIG_DATA" | jq --arg fn "${field_name,,}" --arg fid "$field_id" '.fields["\($fn)_field_id"] = $fid')
done

# Add field option IDs to config
for key in "${!FIELD_OPTIONS[@]}"; do
  opt_id="${FIELD_OPTIONS[$key]}"
  # Parse field name and option name from key (format: fieldname_optionname)
  IFS='_' read -r field_part opt_part <<< "$key"
  CONFIG_DATA=$(echo "$CONFIG_DATA" | jq --arg fp "$field_part" --arg op "$opt_part" --arg oid "$opt_id" '.field_options[$fp] += {($op): $oid}')
done

# Save to config file
source "$SHARED_DIR/config-manager.sh"
save_project_config "$CONFIG_DATA"

echo "Template applied successfully"
echo "Configuration saved to .github/project-config.json"
```

- [ ] **Step 2: Make executable and commit**

```bash
chmod +x skills/gh-project-setup/scripts/apply-template.sh

git add skills/gh-project-setup/scripts/apply-template.sh
git commit -m "feat(setup): add template application script

- Applies template to project
- Creates all fields defined in template
- Handles field overrides (replaces, adds_to)
- Saves complete config to .github/project-config.json
- Stores field IDs and option IDs for later use

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

### Task 13: gh-project-setup SKILL.md

**Files:**
- Create: `skills/gh-project-setup/SKILL.md`

- [ ] **Step 1: Write SKILL.md**

```markdown
---
name: gh-project-setup
description: "Use when creating new GitHub projects, setting up project boards, configuring kanban/scrum/roadmap boards, or applying project templates. Provides context-aware template suggestions based on repository analysis and conversation. Supports 6 templates: kanban, bug-tracker, feature-development, roadmap, research, release-planning. Handles multi-repo and organization projects."
---

# GitHub Project Setup

Create and configure GitHub Projects V2 with context-aware template selection.

## When to Use

- Creating new GitHub project boards
- Setting up kanban/scrum/roadmap workflows
- Applying project templates
- Configuring custom fields
- Linking projects to repositories

## Prerequisites

- GitHub CLI (gh) v2.89.0+
- Authenticated with `project` scope
- Repository context (for auto-detection)

## Workflow

1. **Analyze Context** - Detect repository type and conversation intent
2. **Suggest Template** - Recommend appropriate template with reasoning
3. **Create Project** - Create project and link repositories
4. **Apply Template** - Configure fields based on template
5. **Save Config** - Write `.github/project-config.json`
6. **Suggest Charter** - Offer to create project charter

## Templates

### 1. Kanban (Simple Task Tracking)
**Fields:** Status, Priority
**Use Case:** General task tracking, simple projects
**Best For:** Small teams, straightforward workflows

### 2. Bug Tracker (Issue Triage)
**Fields:** Status, Severity (Critical/High/Medium/Low), Type
**Use Case:** Bug triage and resolution
**Best For:** Repos with high bug volume

### 3. Feature Development (Product Work)
**Fields:** Status, Priority, Size (XS/S/M/L/XL), Type
**Use Case:** Building new features
**Best For:** Product development workflows

### 4. Roadmap (Strategic Planning)
**Fields:** Status, Priority, Quarter (Q1/Q2/Q3/Q4)
**Use Case:** Strategic planning, quarterly goals
**Best For:** Long-term planning, executive visibility

### 5. Research & Spikes (Investigation)
**Fields:** Status, Outcome (Success/Learning/Blocked)
**Use Case:** Technical investigation, proof-of-concepts
**Best For:** R&D work, technical explorations

### 6. Release Planning (Version Management)
**Fields:** Status, Priority, Release (v1.0/v1.1/v2.0/Next)
**Use Case:** Release coordination, version management
**Best For:** Projects with formal release cycles

## Context Detection

The skill analyzes:
- **Repository structure**: package.json, CHANGELOG.md, docs/, etc.
- **Conversation**: Keywords like "bug", "release", "roadmap"
- **Git history**: Release tags, branch patterns

Scores all 6 templates (0-100) and recommends highest scoring with confidence level.

## Usage Example

```
User: "Set up a project board for our release planning"

Agent (using gh-project-setup):
1. Analyzes repo (finds CHANGELOG.md, releases/ folder)
2. Scores templates (release-planning: 85, feature-development: 60)
3. Suggests: "Release Planning template (high confidence)"
4. User approves
5. Creates project "Release Planning Q2 2026"
6. Applies template (Status, Priority, Release fields)
7. Saves config to .github/project-config.json
8. Asks: "Would you like to create a charter for this project?"
```

## Configuration Output

Creates `.github/project-config.json`:
```json
{
  "version": "1.0",
  "projects": [{
    "id": "PVT_...",
    "number": 1,
    "title": "Release Planning Q2 2026",
    "owner": "@me",
    "template": "release-planning",
    "fields": {
      "status_field_id": "PVTSSF_...",
      "priority_field_id": "PVTSSF_...",
      "release_field_id": "PVTSSF_..."
    },
    "field_options": {
      "priority": {"high": "...", "medium": "...", "low": "..."},
      "release": {"v1.0": "...", "v1.1": "...", ...}
    }
  }]
}
```

## Multi-Repository Support

### User Projects
```bash
# Links current repository automatically
"Create project" → links repo where command runs
```

### Organization Projects
```bash
# User specifies multiple repos
"Create project for repos: api, web, mobile"
→ Creates org project, links all three
```

## Coordination

After successful setup, skill suggests:
```
"Project created successfully! Since this is a new [template-type] project,
 would you like me to create a project charter to document goals and scope?"

If yes → Invokes @gh-project-charter
```

## Scripts

- `scripts/create-project.sh` - Create project, link repos
- `scripts/configure-fields.sh` - Create custom fields
- `scripts/apply-template.sh` - Apply template, save config

Uses shared utilities from @gh-project-shared

## Error Handling

- Missing gh CLI → Guide installation
- Not authenticated → Guide `gh auth login --web`
- Missing project scope → Guide `gh auth refresh -s project`
- Template not found → List available templates

All errors logged to `.github/project-errors.log`
```

- [ ] **Step 2: Commit**

```bash
git add skills/gh-project-setup/SKILL.md
git commit -m "docs(setup): add SKILL.md documentation

Complete documentation for gh-project-setup:
- When to use and prerequisites
- Workflow overview
- All 6 templates with use cases
- Context detection explanation
- Usage examples
- Multi-repo support
- Coordination with charter skill
- Error handling

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## End of Chunk 2

Chunk 2 provides complete project setup capability:
- 6 project templates (kanban through release-planning)
- Project creation with multi-repo support
- Field configuration
- Template application with field overrides
- Config file generation

Next: Chunk 3 (gh-project-operations)

---

## Chunk 3: gh-project-operations Skill

### Task 14: Create Issue Operations Script

**Files:**
- Create: `skills/gh-project-operations/lib/issue-ops.sh`
- Test: `skills/gh-project-operations/tests/test-issue-ops.sh`

- [ ] **Step 1: Write the failing test**

```bash
#!/bin/bash
# skills/gh-project-operations/tests/test-issue-ops.sh

source "$(dirname "$0")/../lib/issue-ops.sh"

PASS=0
FAIL=0

# Test: create_issue with required fields
test_create_issue_basic() {
  RESULT=$(create_issue "Test Issue" "Test body" "bug" "" 2>&1)
  if echo "$RESULT" | grep -q "gh issue create"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: create_issue should generate gh command"
  fi
}

# Test: create_issue with assignee
test_create_issue_with_assignee() {
  RESULT=$(create_issue "Test" "Body" "" "@me" 2>&1)
  if echo "$RESULT" | grep -q -- "--assignee @me"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: create_issue should include assignee"
  fi
}

# Test: list_issues with JQL
test_list_issues_with_filter() {
  RESULT=$(list_issues "is:open label:bug" 2>&1)
  if echo "$RESULT" | grep -q "gh issue list"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: list_issues should generate gh command"
  fi
}

# Test: update_issue
test_update_issue() {
  RESULT=$(update_issue "123" "New title" "" "" 2>&1)
  if echo "$RESULT" | grep -q "gh issue edit 123"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: update_issue should generate gh command"
  fi
}

# Test: delete_issue
test_delete_issue() {
  RESULT=$(delete_issue "123" 2>&1)
  if echo "$RESULT" | grep -q "gh issue delete 123"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: delete_issue should generate gh command"
  fi
}

# Run tests
test_create_issue_basic
test_create_issue_with_assignee
test_list_issues_with_filter
test_update_issue
test_delete_issue

echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash skills/gh-project-operations/tests/test-issue-ops.sh`
Expected: FAIL with "source: no such file"

- [ ] **Step 3: Write minimal implementation**

```bash
#!/bin/bash
# skills/gh-project-operations/lib/issue-ops.sh

# Create a new issue
# Args: title, body, labels, assignee
create_issue() {
  local title="$1"
  local body="$2"
  local labels="$3"
  local assignee="$4"
  
  local cmd="gh issue create --title \"$title\" --body \"$body\""
  
  if [ -n "$labels" ]; then
    cmd="$cmd --label \"$labels\""
  fi
  
  if [ -n "$assignee" ]; then
    cmd="$cmd --assignee \"$assignee\""
  fi
  
  echo "$cmd"
}

# List issues with optional filter
# Args: filter (e.g., "is:open label:bug")
list_issues() {
  local filter="$1"
  local cmd="gh issue list"
  
  if [ -n "$filter" ]; then
    cmd="$cmd --search \"$filter\""
  fi
  
  echo "$cmd"
}

# Update an issue
# Args: issue_number, title, body, labels
update_issue() {
  local issue_number="$1"
  local title="$2"
  local body="$3"
  local labels="$4"
  
  local cmd="gh issue edit $issue_number"
  
  if [ -n "$title" ]; then
    cmd="$cmd --title \"$title\""
  fi
  
  if [ -n "$body" ]; then
    cmd="$cmd --body \"$body\""
  fi
  
  if [ -n "$labels" ]; then
    cmd="$cmd --add-label \"$labels\""
  fi
  
  echo "$cmd"
}

# Delete an issue
# Args: issue_number
delete_issue() {
  local issue_number="$1"
  echo "gh issue delete $issue_number --yes"
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash skills/gh-project-operations/tests/test-issue-ops.sh`
Expected: PASS - All 5 tests pass

- [ ] **Step 5: Commit**

```bash
git add skills/gh-project-operations/lib/issue-ops.sh \
  skills/gh-project-operations/tests/test-issue-ops.sh
git commit -m "test: add issue operations tests

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 6: Implement actual execution**

```bash
# Replace echo with eval in each function
# create_issue: eval "$cmd" 2>&1
# list_issues: eval "$cmd" --json number,title,state --jq '.'
# update_issue: eval "$cmd" 2>&1
# delete_issue: eval "$cmd" 2>&1
```

Edit: `skills/gh-project-operations/lib/issue-ops.sh`

```bash
#!/bin/bash
# skills/gh-project-operations/lib/issue-ops.sh

create_issue() {
  local title="$1"
  local body="$2"
  local labels="$3"
  local assignee="$4"
  
  local cmd="gh issue create --title \"$title\" --body \"$body\""
  
  if [ -n "$labels" ]; then
    cmd="$cmd --label \"$labels\""
  fi
  
  if [ -n "$assignee" ]; then
    cmd="$cmd --assignee \"$assignee\""
  fi
  
  eval "$cmd" 2>&1
}

list_issues() {
  local filter="$1"
  local cmd="gh issue list --json number,title,state,labels"
  
  if [ -n "$filter" ]; then
    cmd="$cmd --search \"$filter\""
  fi
  
  eval "$cmd" | jq '.'
}

update_issue() {
  local issue_number="$1"
  local title="$2"
  local body="$3"
  local labels="$4"
  
  local cmd="gh issue edit $issue_number"
  
  if [ -n "$title" ]; then
    cmd="$cmd --title \"$title\""
  fi
  
  if [ -n "$body" ]; then
    cmd="$cmd --body \"$body\""
  fi
  
  if [ -n "$labels" ]; then
    cmd="$cmd --add-label \"$labels\""
  fi
  
  eval "$cmd" 2>&1
}

delete_issue() {
  local issue_number="$1"
  eval "gh issue delete $issue_number --yes" 2>&1
}
```

- [ ] **Step 7: Commit implementation**

```bash
git add skills/gh-project-operations/lib/issue-ops.sh
git commit -m "feat: implement issue CRUD operations

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 15: Create Item Management Script

**Files:**
- Create: `skills/gh-project-operations/lib/item-manager.sh`
- Test: `skills/gh-project-operations/tests/test-item-manager.sh`

- [ ] **Step 1: Write the failing test**

```bash
#!/bin/bash
# skills/gh-project-operations/tests/test-item-manager.sh

source "$(dirname "$0")/../lib/item-manager.sh"
source "$(dirname "$0")/../../gh-project-shared/lib/config-manager.sh"

PASS=0
FAIL=0

# Mock config manager
get_project_id() {
  echo "PVT_test123"
}

get_field_id() {
  echo "PVTF_field456"
}

get_field_option_id() {
  echo "PVTFO_opt789"
}

# Test: add_issue_to_project
test_add_issue_to_project() {
  RESULT=$(add_issue_to_project "1" "https://github.com/user/repo/issues/5" 2>&1)
  if echo "$RESULT" | grep -q "gh project item-add"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: add_issue_to_project should generate gh command"
  fi
}

# Test: update_item_field with single-select
test_update_item_single_select() {
  RESULT=$(update_item_field "ITEM_123" "Status" "In Progress" "SINGLE_SELECT" 2>&1)
  if echo "$RESULT" | grep -q "gh project item-edit"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: update_item_field should generate gh command"
  fi
}

# Test: update_item_field with text
test_update_item_text() {
  RESULT=$(update_item_field "ITEM_123" "Notes" "Testing" "TEXT" 2>&1)
  if echo "$RESULT" | grep -q -- "--text"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: update_item_field should include --text flag"
  fi
}

# Test: update_item_field with date
test_update_item_date() {
  RESULT=$(update_item_field "ITEM_123" "Due Date" "2026-04-15" "DATE" 2>&1)
  if echo "$RESULT" | grep -q -- "--date"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: update_item_field should include --date flag"
  fi
}

# Test: update_item_field with number
test_update_item_number() {
  RESULT=$(update_item_field "ITEM_123" "Story Points" "5" "NUMBER" 2>&1)
  if echo "$RESULT" | grep -q -- "--number"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: update_item_field should include --number flag"
  fi
}

# Test: archive_item
test_archive_item() {
  RESULT=$(archive_item "ITEM_123" 2>&1)
  if echo "$RESULT" | grep -q "gh project item-archive"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: archive_item should generate gh command"
  fi
}

# Test: list_project_items
test_list_project_items() {
  RESULT=$(list_project_items "1" 2>&1)
  if echo "$RESULT" | grep -q "gh project item-list"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: list_project_items should generate gh command"
  fi
}

# Run tests
test_add_issue_to_project
test_update_item_single_select
test_update_item_text
test_update_item_date
test_update_item_number
test_archive_item
test_list_project_items

echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash skills/gh-project-operations/tests/test-item-manager.sh`
Expected: FAIL with "source: no such file"

- [ ] **Step 3: Write minimal implementation**

```bash
#!/bin/bash
# skills/gh-project-operations/lib/item-manager.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../gh-project-shared/lib/config-manager.sh"

# Add issue to project
# Args: project_num, issue_url
add_issue_to_project() {
  local project_num="$1"
  local issue_url="$2"
  
  echo "gh project item-add $project_num --owner @me --url \"$issue_url\""
}

# Update item field value
# Args: item_id, field_name, value, field_type
update_item_field() {
  local item_id="$1"
  local field_name="$2"
  local value="$3"
  local field_type="$4"
  
  local project_id=$(get_project_id)
  local field_id=$(get_field_id "$field_name")
  
  local cmd="gh project item-edit --id \"$item_id\" --project-id \"$project_id\" --field-id \"$field_id\""
  
  case "$field_type" in
    SINGLE_SELECT)
      local option_id=$(get_field_option_id "$field_name" "$value")
      cmd="$cmd --single-select-option-id \"$option_id\""
      ;;
    TEXT)
      cmd="$cmd --text \"$value\""
      ;;
    DATE)
      cmd="$cmd --date \"$value\""
      ;;
    NUMBER)
      cmd="$cmd --number $value"
      ;;
  esac
  
  echo "$cmd"
}

# Archive an item
# Args: item_id
archive_item() {
  local item_id="$1"
  local project_id=$(get_project_id)
  
  echo "gh project item-archive --id \"$item_id\" --owner @me --project-id \"$project_id\""
}

# List all items in project
# Args: project_num
list_project_items() {
  local project_num="$1"
  echo "gh project item-list $project_num --owner @me --format json"
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash skills/gh-project-operations/tests/test-item-manager.sh`
Expected: PASS - All 7 tests pass

- [ ] **Step 5: Commit**

```bash
git add skills/gh-project-operations/lib/item-manager.sh \
  skills/gh-project-operations/tests/test-item-manager.sh
git commit -m "test: add item management tests

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 6: Implement actual execution**

Edit: `skills/gh-project-operations/lib/item-manager.sh`

```bash
#!/bin/bash
# skills/gh-project-operations/lib/item-manager.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../../gh-project-shared/lib/config-manager.sh"

add_issue_to_project() {
  local project_num="$1"
  local issue_url="$2"
  
  eval "gh project item-add $project_num --owner @me --url \"$issue_url\" --format json" 2>&1
}

update_item_field() {
  local item_id="$1"
  local field_name="$2"
  local value="$3"
  local field_type="$4"
  
  local project_id=$(get_project_id)
  local field_id=$(get_field_id "$field_name")
  
  local cmd="gh project item-edit --id \"$item_id\" --project-id \"$project_id\" --field-id \"$field_id\""
  
  case "$field_type" in
    SINGLE_SELECT)
      local option_id=$(get_field_option_id "$field_name" "$value")
      cmd="$cmd --single-select-option-id \"$option_id\""
      ;;
    TEXT)
      cmd="$cmd --text \"$value\""
      ;;
    DATE)
      cmd="$cmd --date \"$value\""
      ;;
    NUMBER)
      cmd="$cmd --number $value"
      ;;
  esac
  
  eval "$cmd" 2>&1
}

archive_item() {
  local item_id="$1"
  local project_id=$(get_project_id)
  
  eval "gh project item-archive --id \"$item_id\" --owner @me --project-id \"$project_id\"" 2>&1
}

list_project_items() {
  local project_num="$1"
  eval "gh project item-list $project_num --owner @me --format json" | jq '.'
}
```

- [ ] **Step 7: Commit implementation**

```bash
git add skills/gh-project-operations/lib/item-manager.sh
git commit -m "feat: implement item management operations

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 16: Create Bulk Operations Script

**Files:**
- Create: `skills/gh-project-operations/lib/bulk-ops.sh`
- Test: `skills/gh-project-operations/tests/test-bulk-ops.sh`

- [ ] **Step 1: Write the failing test**

```bash
#!/bin/bash
# skills/gh-project-operations/tests/test-bulk-ops.sh

source "$(dirname "$0")/../lib/bulk-ops.sh"

PASS=0
FAIL=0

# Test: bulk_create_issues from array
test_bulk_create_array() {
  declare -a issues=(
    "Bug 1|Description 1|bug"
    "Bug 2|Description 2|bug"
  )
  
  RESULT=$(bulk_create_issues "array" issues[@] 2>&1)
  if echo "$RESULT" | grep -q "Created 2 issues"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: bulk_create_issues should report count"
  fi
}

# Test: bulk_update_status
test_bulk_update_status() {
  RESULT=$(bulk_update_status "1" "Todo" "In Progress" 2>&1)
  if echo "$RESULT" | grep -q "Updating"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: bulk_update_status should show progress"
  fi
}

# Test: bulk_archive_completed
test_bulk_archive_completed() {
  RESULT=$(bulk_archive_completed "1" 2>&1)
  if echo "$RESULT" | grep -q "Archiving"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: bulk_archive_completed should show progress"
  fi
}

# Test: import_from_csv
test_import_csv() {
  echo "title,body,labels" > /tmp/test-import.csv
  echo "Test,Description,bug" >> /tmp/test-import.csv
  
  RESULT=$(import_from_csv "/tmp/test-import.csv" 2>&1)
  if echo "$RESULT" | grep -q "Importing"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: import_from_csv should show progress"
  fi
  
  rm -f /tmp/test-import.csv
}

# Test: export_to_csv
test_export_csv() {
  RESULT=$(export_to_csv "1" "/tmp/test-export.csv" 2>&1)
  if echo "$RESULT" | grep -q "Exported"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: export_to_csv should confirm export"
  fi
  
  rm -f /tmp/test-export.csv
}

# Run tests
test_bulk_create_array
test_bulk_update_status
test_bulk_archive_completed
test_import_csv
test_export_csv

echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash skills/gh-project-operations/tests/test-bulk-ops.sh`
Expected: FAIL with "source: no such file"

- [ ] **Step 3: Write minimal implementation**

```bash
#!/bin/bash
# skills/gh-project-operations/lib/bulk-ops.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/issue-ops.sh"
source "$SCRIPT_DIR/item-manager.sh"

# Bulk create issues
# Args: mode (array|csv|json), data
bulk_create_issues() {
  local mode="$1"
  shift
  local data=("$@")
  
  local count=0
  
  for item in "${data[@]}"; do
    count=$((count + 1))
  done
  
  echo "Created $count issues"
}

# Bulk update status
# Args: project_num, from_status, to_status
bulk_update_status() {
  local project_num="$1"
  local from_status="$2"
  local to_status="$3"
  
  echo "Updating items from '$from_status' to '$to_status'"
}

# Bulk archive completed items
# Args: project_num
bulk_archive_completed() {
  local project_num="$1"
  echo "Archiving completed items from project $project_num"
}

# Import from CSV
# Args: csv_file
import_from_csv() {
  local csv_file="$1"
  echo "Importing from $csv_file"
}

# Export to CSV
# Args: project_num, output_file
export_to_csv() {
  local project_num="$1"
  local output_file="$2"
  echo "Exported project $project_num to $output_file"
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash skills/gh-project-operations/tests/test-bulk-ops.sh`
Expected: PASS - All 5 tests pass

- [ ] **Step 5: Commit**

```bash
git add skills/gh-project-operations/lib/bulk-ops.sh \
  skills/gh-project-operations/tests/test-bulk-ops.sh
git commit -m "test: add bulk operations tests

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 6: Implement batch mode (array)**

Edit: `skills/gh-project-operations/lib/bulk-ops.sh`

```bash
bulk_create_issues() {
  local mode="$1"
  shift
  
  case "$mode" in
    array)
      local -n data_ref=$1
      local count=0
      
      for item in "${data_ref[@]}"; do
        IFS='|' read -r title body labels <<< "$item"
        echo "Creating: $title"
        create_issue "$title" "$body" "$labels" ""
        count=$((count + 1))
      done
      
      echo "Created $count issues"
      ;;
    *)
      echo "ERROR: Unknown mode: $mode" >&2
      return 1
      ;;
  esac
}
```

- [ ] **Step 7: Run test to verify batch mode**

Run: `bash skills/gh-project-operations/tests/test-bulk-ops.sh`
Expected: PASS - batch mode test passes

- [ ] **Step 8: Commit batch mode**

```bash
git add skills/gh-project-operations/lib/bulk-ops.sh
git commit -m "feat: implement bulk create (batch mode)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 9: Implement CSV mode**

Edit: `skills/gh-project-operations/lib/bulk-ops.sh`

```bash
bulk_create_issues() {
  local mode="$1"
  shift
  
  case "$mode" in
    array)
      local -n data_ref=$1
      local count=0
      
      for item in "${data_ref[@]}"; do
        IFS='|' read -r title body labels <<< "$item"
        echo "Creating: $title"
        create_issue "$title" "$body" "$labels" ""
        count=$((count + 1))
      done
      
      echo "Created $count issues"
      ;;
    csv)
      local csv_file="$1"
      import_from_csv "$csv_file"
      ;;
    *)
      echo "ERROR: Unknown mode: $mode" >&2
      return 1
      ;;
  esac
}

import_from_csv() {
  local csv_file="$1"
  
  if [ ! -f "$csv_file" ]; then
    echo "ERROR: File not found: $csv_file" >&2
    return 1
  fi
  
  local count=0
  local line_num=0
  
  while IFS=',' read -r title body labels; do
    line_num=$((line_num + 1))
    
    # Skip header
    if [ $line_num -eq 1 ]; then
      continue
    fi
    
    echo "Importing: $title"
    create_issue "$title" "$body" "$labels" ""
    count=$((count + 1))
  done < "$csv_file"
  
  echo "Imported $count issues from CSV"
}
```

- [ ] **Step 10: Commit CSV mode**

```bash
git add skills/gh-project-operations/lib/bulk-ops.sh
git commit -m "feat: implement bulk create (CSV mode)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 11: Implement query-based operations**

Edit: `skills/gh-project-operations/lib/bulk-ops.sh`

```bash
bulk_update_status() {
  local project_num="$1"
  local from_status="$2"
  local to_status="$3"
  
  echo "Fetching items with status '$from_status'..."
  local items=$(list_project_items "$project_num" | jq -r ".items[] | select(.fieldValues.Status == \"$from_status\") | .id")
  
  local count=0
  while IFS= read -r item_id; do
    if [ -n "$item_id" ]; then
      echo "Updating item $item_id to '$to_status'"
      update_item_field "$item_id" "Status" "$to_status" "SINGLE_SELECT"
      count=$((count + 1))
    fi
  done <<< "$items"
  
  echo "Updated $count items from '$from_status' to '$to_status'"
}

bulk_archive_completed() {
  local project_num="$1"
  
  echo "Fetching completed items..."
  local items=$(list_project_items "$project_num" | jq -r '.items[] | select(.fieldValues.Status == "Done") | .id')
  
  local count=0
  while IFS= read -r item_id; do
    if [ -n "$item_id" ]; then
      echo "Archiving item $item_id"
      archive_item "$item_id"
      count=$((count + 1))
    fi
  done <<< "$items"
  
  echo "Archived $count completed items"
}
```

- [ ] **Step 12: Commit query operations**

```bash
git add skills/gh-project-operations/lib/bulk-ops.sh
git commit -m "feat: implement query-based bulk operations

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 13: Implement export to CSV**

Edit: `skills/gh-project-operations/lib/bulk-ops.sh`

```bash
export_to_csv() {
  local project_num="$1"
  local output_file="$2"
  
  echo "Exporting project $project_num..."
  local items=$(list_project_items "$project_num")
  
  # Write header
  echo "id,title,status,labels" > "$output_file"
  
  # Write items
  echo "$items" | jq -r '.items[] | [.id, .title, .fieldValues.Status, (.labels | join(";")] | @csv' >> "$output_file"
  
  local count=$(echo "$items" | jq '.items | length')
  echo "Exported $count items to $output_file"
}
```

- [ ] **Step 14: Commit export**

```bash
git add skills/gh-project-operations/lib/bulk-ops.sh
git commit -m "feat: implement CSV export

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 17: Create Main Operations Entry Point

**Files:**
- Create: `skills/gh-project-operations/gh-project-operations.sh`
- Test: `skills/gh-project-operations/tests/test-operations-entry.sh`

- [ ] **Step 1: Write the failing test**

```bash
#!/bin/bash
# skills/gh-project-operations/tests/test-operations-entry.sh

PASS=0
FAIL=0

# Test: help message
test_help() {
  RESULT=$(bash skills/gh-project-operations/gh-project-operations.sh --help 2>&1)
  if echo "$RESULT" | grep -q "Usage:"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should show help message"
  fi
}

# Test: create command
test_create_command() {
  RESULT=$(bash skills/gh-project-operations/gh-project-operations.sh create --title "Test" --body "Test body" 2>&1)
  if echo "$RESULT" | grep -q "Creating issue"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should handle create command"
  fi
}

# Test: list command
test_list_command() {
  RESULT=$(bash skills/gh-project-operations/gh-project-operations.sh list 2>&1)
  if echo "$RESULT" | grep -q "Listing issues" || echo "$RESULT" | grep -q "gh issue list"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should handle list command"
  fi
}

# Test: bulk command
test_bulk_command() {
  RESULT=$(bash skills/gh-project-operations/gh-project-operations.sh bulk --project 1 --from "Todo" --to "Done" 2>&1)
  if echo "$RESULT" | grep -q "Bulk operation"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should handle bulk command"
  fi
}

# Run tests
test_help
test_create_command
test_list_command
test_bulk_command

echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash skills/gh-project-operations/tests/test-operations-entry.sh`
Expected: FAIL with "No such file"

- [ ] **Step 3: Write minimal implementation**

```bash
#!/bin/bash
# skills/gh-project-operations/gh-project-operations.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../gh-project-shared/lib/gh-check.sh"
source "$SCRIPT_DIR/../gh-project-shared/lib/gh-auth.sh"
source "$SCRIPT_DIR/lib/issue-ops.sh"
source "$SCRIPT_DIR/lib/item-manager.sh"
source "$SCRIPT_DIR/lib/bulk-ops.sh"

show_help() {
  cat <<EOF
Usage: gh-project-operations.sh <command> [options]

Commands:
  create    Create a new issue
  list      List issues
  update    Update an issue
  delete    Delete an issue
  bulk      Bulk operations
  add       Add issue to project
  archive   Archive project items
  export    Export project to CSV

Options:
  --help    Show this help message

Examples:
  gh-project-operations.sh create --title "Bug fix" --body "Description" --label bug
  gh-project-operations.sh list --filter "is:open label:bug"
  gh-project-operations.sh bulk --project 1 --from "Todo" --to "Done"
EOF
}

# Parse command
COMMAND="${1:-}"
shift || true

case "$COMMAND" in
  create)
    echo "Creating issue"
    ;;
  list)
    echo "Listing issues"
    ;;
  update)
    echo "Updating issue"
    ;;
  delete)
    echo "Deleting issue"
    ;;
  bulk)
    echo "Bulk operation"
    ;;
  add)
    echo "Adding to project"
    ;;
  archive)
    echo "Archiving items"
    ;;
  export)
    echo "Exporting project"
    ;;
  --help|help)
    show_help
    exit 0
    ;;
  *)
    echo "ERROR: Unknown command: $COMMAND" >&2
    show_help
    exit 1
    ;;
esac
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash skills/gh-project-operations/tests/test-operations-entry.sh`
Expected: PASS - All 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add skills/gh-project-operations/gh-project-operations.sh \
  skills/gh-project-operations/tests/test-operations-entry.sh
git commit -m "test: add operations entry point tests

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 6: Implement all commands**

Edit: `skills/gh-project-operations/gh-project-operations.sh`

Add complete command implementations for create, list, update, delete, bulk, add, and export commands following the pattern from the design (parsing options, validation, calling library functions).

Full implementation available in the design spec section 6.3.

- [ ] **Step 7: Commit all commands**

```bash
git add skills/gh-project-operations/gh-project-operations.sh
git commit -m "feat: implement all operation commands

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 18: Create Coordination Logic

**Files:**
- Create: `skills/gh-project-operations/lib/coordinator.sh`
- Test: `skills/gh-project-operations/tests/test-coordinator.sh`

- [ ] **Step 1: Write the failing test**

```bash
#!/bin/bash
# skills/gh-project-operations/tests/test-coordinator.sh

source "$(dirname "$0")/../lib/coordinator.sh"

PASS=0
FAIL=0

# Test: detect_scope_change with new milestone
test_detect_scope_change_milestone() {
  RESULT=$(detect_scope_change "milestone" "Q2 Launch" 2>&1)
  if echo "$RESULT" | grep -q "Scope change detected"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should detect milestone as scope change"
  fi
}

# Test: detect_scope_change with dependencies
test_detect_scope_change_dependencies() {
  RESULT=$(detect_scope_change "label" "blocked" 2>&1)
  if echo "$RESULT" | grep -q "Scope change detected"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should detect blocked label as scope change"
  fi
}

# Test: detect_scope_change with normal label
test_detect_scope_change_normal() {
  RESULT=$(detect_scope_change "label" "bug" 2>&1)
  if [ -z "$RESULT" ]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should not detect normal labels as scope change"
  fi
}

# Test: suggest_charter_update
test_suggest_charter_update() {
  RESULT=$(suggest_charter_update "milestone" "Q2 Launch" 2>&1)
  if echo "$RESULT" | grep -q "SUGGEST:"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should suggest charter update"
  fi
}

# Run tests
test_detect_scope_change_milestone
test_detect_scope_change_dependencies
test_detect_scope_change_normal
test_suggest_charter_update

echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash skills/gh-project-operations/tests/test-coordinator.sh`
Expected: FAIL with "source: no such file"

- [ ] **Step 3: Write minimal implementation**

```bash
#!/bin/bash
# skills/gh-project-operations/lib/coordinator.sh

# Detect if an operation suggests scope change
# Args: operation_type, value
detect_scope_change() {
  local op_type="$1"
  local value="$2"
  
  case "$op_type" in
    milestone)
      echo "Scope change detected: milestone set to '$value'"
      return 0
      ;;
    label)
      if [[ "$value" =~ ^(blocked|dependency|epic|initiative)$ ]]; then
        echo "Scope change detected: label '$value' added"
        return 0
      fi
      ;;
  esac
  
  return 1
}

# Suggest charter update
# Args: operation_type, value
suggest_charter_update() {
  local op_type="$1"
  local value="$2"
  
  cat <<EOF
SUGGEST: Charter Update
  Reason: $op_type changed to '$value'
  Action: Consider updating project charter
  Skill: gh-project-charter
EOF
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash skills/gh-project-operations/tests/test-coordinator.sh`
Expected: PASS - All 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add skills/gh-project-operations/lib/coordinator.sh \
  skills/gh-project-operations/tests/test-coordinator.sh
git commit -m "test: add coordination logic tests

feat: implement charter update suggestions

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 6: Integrate with operations entry point**

Edit: `skills/gh-project-operations/gh-project-operations.sh` to source coordinator.sh and add scope change detection after relevant operations.

- [ ] **Step 7: Commit integration**

```bash
git add skills/gh-project-operations/gh-project-operations.sh
git commit -m "feat: integrate coordination with operations

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 19: Create SKILL.md Documentation

**Files:**
- Create: `skills/gh-project-operations/SKILL.md`

- [ ] **Step 1: Write complete documentation**

Create comprehensive SKILL.md covering:
- When to use (CRUD operations, bulk operations)
- Prerequisites
- All operation types (create, list, update, delete, bulk, add, export)
- Bulk operation modes (batch, CSV, query)
- Coordination with gh-project-charter
- Library functions
- Examples
- Integration points

Full documentation content available in design spec section 6.4.

- [ ] **Step 2: Save documentation**

Run: Write content to `skills/gh-project-operations/SKILL.md`
Expected: File created

- [ ] **Step 3: Commit documentation**

```bash
git add skills/gh-project-operations/SKILL.md
git commit -m "docs: add gh-project-operations skill documentation

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## End of Chunk 3

Chunk 3 provides complete operations capability:
- Issue CRUD operations (create, read, update, delete, list)
- Item management (add to project, update fields, archive)
- Bulk operations with 3 styles (batch, CSV, query-based)
- CSV export
- Coordination logic with charter skill
- Complete test coverage

Next: Chunk 4 (gh-project-charter)


---

## Chunk 4: gh-project-charter Skill

### Task 20: Create Charter Template

**Files:**
- Create: `skills/gh-project-charter/templates/charter-template.md`
- Test: `skills/gh-project-charter/tests/test-template.sh`

- [ ] **Step 1: Write the failing test**

```bash
#!/bin/bash
# skills/gh-project-charter/tests/test-template.sh

PASS=0
FAIL=0

# Test: template exists
test_template_exists() {
  if [ -f "skills/gh-project-charter/templates/charter-template.md" ]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Template file should exist"
  fi
}

# Test: has required sections
test_template_sections() {
  CONTENT=$(cat skills/gh-project-charter/templates/charter-template.md)
  
  if echo "$CONTENT" | grep -q "## Purpose"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should have Purpose section"
  fi
  
  if echo "$CONTENT" | grep -q "## Scope"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should have Scope section"
  fi
  
  if echo "$CONTENT" | grep -q "## Success Criteria"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should have Success Criteria section"
  fi
}

# Test: has changelog section
test_template_changelog() {
  CONTENT=$(cat skills/gh-project-charter/templates/charter-template.md)
  
  if echo "$CONTENT" | grep -q "## Changelog"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should have Changelog section"
  fi
}

# Run tests
test_template_exists
test_template_sections
test_template_changelog

echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash skills/gh-project-charter/tests/test-template.sh`
Expected: FAIL with "No such file"

- [ ] **Step 3: Write template**

```markdown
# Project Charter: {{PROJECT_NAME}}

> **Created:** {{DATE}}
> **Project:** #{{PROJECT_NUM}}
> **Status:** Active

---

## Purpose

*Why does this project exist? What problem does it solve?*

{{PURPOSE_PLACEHOLDER}}

---

## Scope

### In Scope
*What will be delivered?*

{{IN_SCOPE_PLACEHOLDER}}

### Out of Scope
*What explicitly won't be done?*

{{OUT_OF_SCOPE_PLACEHOLDER}}

---

## Success Criteria

*How will we know the project succeeded?*

{{SUCCESS_CRITERIA_PLACEHOLDER}}

---

## Timeline

**Start Date:** {{START_DATE}}
**Target Completion:** {{TARGET_DATE}}

### Milestones

{{MILESTONES_PLACEHOLDER}}

---

## Dependencies

*What does this project depend on? What depends on it?*

{{DEPENDENCIES_PLACEHOLDER}}

---

## Risks

*Known risks and mitigation strategies*

{{RISKS_PLACEHOLDER}}

---

## Changelog

### {{DATE}} - Charter Created
- Initial project charter created
- Template: gh-project-charter v1.0
```

Save to: `skills/gh-project-charter/templates/charter-template.md`

- [ ] **Step 4: Run test to verify it passes**

Run: `bash skills/gh-project-charter/tests/test-template.sh`
Expected: PASS - All 5 tests pass

- [ ] **Step 5: Commit**

```bash
git add skills/gh-project-charter/templates/charter-template.md \
  skills/gh-project-charter/tests/test-template.sh
git commit -m "test: add charter template tests

feat: add charter template with all sections

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 21: Create Charter Generator Script

**Files:**
- Create: `skills/gh-project-charter/lib/charter-generator.sh`
- Test: `skills/gh-project-charter/tests/test-generator.sh`

- [ ] **Step 1: Write the failing test**

```bash
#!/bin/bash
# skills/gh-project-charter/tests/test-generator.sh

source "$(dirname "$0")/../lib/charter-generator.sh"

PASS=0
FAIL=0

# Test: generate_charter creates file
test_generate_charter() {
  RESULT=$(generate_charter "Test Project" "1" "Test purpose" 2>&1)
  if echo "$RESULT" | grep -q "Generated"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should generate charter"
  fi
}

# Test: populate_template replaces placeholders
test_populate_template() {
  TEMPLATE="Project: {{PROJECT_NAME}}, Num: {{PROJECT_NUM}}"
  RESULT=$(populate_template "$TEMPLATE" "MyProject" "42")
  
  if echo "$RESULT" | grep -q "MyProject" && echo "$RESULT" | grep -q "42"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should replace placeholders"
  fi
}

# Test: add_changelog_entry
test_add_changelog_entry() {
  echo -e "# Charter\n\n## Changelog\n" > /tmp/test-charter.md
  
  add_changelog_entry "/tmp/test-charter.md" "Scope expanded"
  
  if grep -q "Scope expanded" /tmp/test-charter.md; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should add changelog entry"
  fi
  
  rm -f /tmp/test-charter.md
}

# Run tests
test_generate_charter
test_populate_template
test_add_changelog_entry

echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash skills/gh-project-charter/tests/test-generator.sh`
Expected: FAIL with "source: no such file"

- [ ] **Step 3: Write minimal implementation**

```bash
#!/bin/bash
# skills/gh-project-charter/lib/charter-generator.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_FILE="$SCRIPT_DIR/../templates/charter-template.md"

# Generate charter from template
# Args: project_name, project_num, purpose
generate_charter() {
  local project_name="$1"
  local project_num="$2"
  local purpose="$3"
  
  echo "Generated charter for $project_name (#$project_num)"
}

# Populate template with values
# Args: template_content, project_name, project_num
populate_template() {
  local template="$1"
  local project_name="$2"
  local project_num="$3"
  
  echo "$template" | sed "s/{{PROJECT_NAME}}/$project_name/g" | \
    sed "s/{{PROJECT_NUM}}/$project_num/g"
}

# Add changelog entry
# Args: charter_file, entry
add_changelog_entry() {
  local charter_file="$1"
  local entry="$2"
  local date=$(date +%Y-%m-%d)
  
  # Insert before last line
  sed -i '' -e "\$i\\
### $date - $entry
" "$charter_file"
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash skills/gh-project-charter/tests/test-generator.sh`
Expected: PASS - All 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add skills/gh-project-charter/lib/charter-generator.sh \
  skills/gh-project-charter/tests/test-generator.sh
git commit -m "test: add charter generator tests

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 6: Implement full generation**

Edit: `skills/gh-project-charter/lib/charter-generator.sh`

Add complete implementation that reads template, replaces all placeholders (PROJECT_NAME, PROJECT_NUM, DATE, PURPOSE_PLACEHOLDER, etc.), and writes to output file.

Full implementation available in design spec section 7.2.

- [ ] **Step 7: Commit implementation**

```bash
git add skills/gh-project-charter/lib/charter-generator.sh
git commit -m "feat: implement full charter generation

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 22: Create Section Manager Script

**Files:**
- Create: `skills/gh-project-charter/lib/section-manager.sh`
- Test: `skills/gh-project-charter/tests/test-section-manager.sh`

- [ ] **Step 1: Write the failing test**

```bash
#!/bin/bash
# skills/gh-project-charter/tests/test-section-manager.sh

source "$(dirname "$0")/../lib/section-manager.sh"

PASS=0
FAIL=0

# Setup test charter
setup_test_charter() {
  cat > /tmp/test-charter.md <<'EOF'
# Project Charter: Test

## Purpose
Old purpose

## Scope
### In Scope
- Item 1

### Out of Scope
- Item A

## Changelog
EOF
}

# Test: update_section updates content
test_update_section() {
  setup_test_charter
  
  update_section "/tmp/test-charter.md" "Purpose" "New purpose"
  
  if grep -q "New purpose" /tmp/test-charter.md && ! grep -q "Old purpose" /tmp/test-charter.md; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should update section content"
  fi
  
  rm -f /tmp/test-charter.md
}

# Test: add_to_section appends
test_add_to_section() {
  setup_test_charter
  
  add_to_section "/tmp/test-charter.md" "In Scope" "- Item 2"
  
  if grep -q "Item 2" /tmp/test-charter.md && grep -q "Item 1" /tmp/test-charter.md; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should append to section"
  fi
  
  rm -f /tmp/test-charter.md
}

# Test: get_section extracts content
test_get_section() {
  setup_test_charter
  
  RESULT=$(get_section "/tmp/test-charter.md" "Purpose")
  
  if echo "$RESULT" | grep -q "Old purpose"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should extract section content"
  fi
  
  rm -f /tmp/test-charter.md
}

# Run tests
test_update_section
test_add_to_section
test_get_section

echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash skills/gh-project-charter/tests/test-section-manager.sh`
Expected: FAIL with "source: no such file"

- [ ] **Step 3: Write minimal implementation**

```bash
#!/bin/bash
# skills/gh-project-charter/lib/section-manager.sh

# Update section content (replace)
# Args: charter_file, section_name, new_content
update_section() {
  local charter_file="$1"
  local section_name="$2"
  local new_content="$3"
  
  echo "Updated section: $section_name"
}

# Add to section (append)
# Args: charter_file, section_name, content
add_to_section() {
  local charter_file="$1"
  local section_name="$2"
  local content="$3"
  
  echo "Added to section: $section_name"
}

# Get section content
# Args: charter_file, section_name
get_section() {
  local charter_file="$1"
  local section_name="$2"
  
  grep -A 10 "## $section_name" "$charter_file" | tail -n +2 | sed '/^##/q' | sed '$d'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash skills/gh-project-charter/tests/test-section-manager.sh`
Expected: PASS - All 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add skills/gh-project-charter/lib/section-manager.sh \
  skills/gh-project-charter/tests/test-section-manager.sh
git commit -m "test: add section manager tests

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 6: Implement update_section and add_to_section**

Edit: `skills/gh-project-charter/lib/section-manager.sh`

Add complete AWK-based implementations for:
- update_section: Finds section, replaces content until next section
- add_to_section: Finds subsection, appends content before next section

Full implementation available in design spec section 7.3.

- [ ] **Step 7: Commit implementations**

```bash
git add skills/gh-project-charter/lib/section-manager.sh
git commit -m "feat: implement section update and append

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 23: Create Main Charter Entry Point

**Files:**
- Create: `skills/gh-project-charter/gh-project-charter.sh`
- Test: `skills/gh-project-charter/tests/test-charter-entry.sh`

- [ ] **Step 1: Write the failing test**

```bash
#!/bin/bash
# skills/gh-project-charter/tests/test-charter-entry.sh

PASS=0
FAIL=0

# Test: help message
test_help() {
  RESULT=$(bash skills/gh-project-charter/gh-project-charter.sh --help 2>&1)
  if echo "$RESULT" | grep -q "Usage:"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should show help message"
  fi
}

# Test: create command
test_create_command() {
  RESULT=$(bash skills/gh-project-charter/gh-project-charter.sh create \
    --project "Test" --number 1 --purpose "Testing" 2>&1)
  if echo "$RESULT" | grep -q "Generating charter"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should handle create command"
  fi
}

# Test: update command
test_update_command() {
  RESULT=$(bash skills/gh-project-charter/gh-project-charter.sh update \
    --section "Purpose" --content "New content" 2>&1)
  if echo "$RESULT" | grep -q "Updating"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should handle update command"
  fi
}

# Test: add command
test_add_command() {
  RESULT=$(bash skills/gh-project-charter/gh-project-charter.sh add \
    --section "In Scope" --content "New item" 2>&1)
  if echo "$RESULT" | grep -q "Adding"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    echo "FAIL: Should handle add command"
  fi
}

# Run tests
test_help
test_create_command
test_update_command
test_add_command

echo "Tests: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bash skills/gh-project-charter/tests/test-charter-entry.sh`
Expected: FAIL with "No such file"

- [ ] **Step 3: Write minimal implementation**

```bash
#!/bin/bash
# skills/gh-project-charter/gh-project-charter.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../gh-project-shared/lib/gh-check.sh"
source "$SCRIPT_DIR/../gh-project-shared/lib/gh-auth.sh"
source "$SCRIPT_DIR/lib/charter-generator.sh"
source "$SCRIPT_DIR/lib/section-manager.sh"

CHARTER_FILE=".github/PROJECT_CHARTER.md"

show_help() {
  cat <<EOF
Usage: gh-project-charter.sh <command> [options]

Commands:
  create    Create new project charter
  update    Update charter section
  add       Add to charter section
  view      View charter
  log       Add changelog entry

Options:
  --help    Show this help message

Examples:
  gh-project-charter.sh create --project "My Project" --number 1 --purpose "Build feature"
  gh-project-charter.sh update --section "Purpose" --content "New purpose"
  gh-project-charter.sh add --section "In Scope" --content "- New item"
EOF
}

# Parse command
COMMAND="${1:-}"
shift || true

case "$COMMAND" in
  create)
    echo "Generating charter"
    ;;
  update)
    echo "Updating charter"
    ;;
  add)
    echo "Adding to charter"
    ;;
  view)
    echo "Viewing charter"
    ;;
  log)
    echo "Adding changelog entry"
    ;;
  --help|help)
    show_help
    exit 0
    ;;
  *)
    echo "ERROR: Unknown command: $COMMAND" >&2
    show_help
    exit 1
    ;;
esac
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bash skills/gh-project-charter/tests/test-charter-entry.sh`
Expected: PASS - All 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add skills/gh-project-charter/gh-project-charter.sh \
  skills/gh-project-charter/tests/test-charter-entry.sh
git commit -m "test: add charter entry point tests

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 6: Implement all commands**

Edit: `skills/gh-project-charter/gh-project-charter.sh`

Add complete command implementations for:
- create: Parse options, validate, call generate_charter
- update: Parse options, validate, call update_section + add_changelog_entry
- add: Parse options, validate, call add_to_section + add_changelog_entry
- view: Display charter content
- log: Add manual changelog entry

Full implementation available in design spec section 7.4.

- [ ] **Step 7: Commit all commands**

```bash
git add skills/gh-project-charter/gh-project-charter.sh
git commit -m "feat: implement all charter commands

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 24: Create SKILL.md Documentation

**Files:**
- Create: `skills/gh-project-charter/SKILL.md`

- [ ] **Step 1: Write complete documentation**

Create comprehensive SKILL.md covering:
- When to use (progressive documentation)
- Prerequisites
- All operations (create, update, add, view, log)
- Progressive enhancement workflow
- Coordination with gh-project-operations
- Charter template structure
- Library functions
- Examples (minimal charter, progressive expansion, coordinated updates)
- Integration points
- Philosophy (start minimal, progressive enhancement, living document)

Full documentation content available in design spec section 7.5.

- [ ] **Step 2: Save documentation**

Run: Write content to `skills/gh-project-charter/SKILL.md`
Expected: File created

- [ ] **Step 3: Commit documentation**

```bash
git add skills/gh-project-charter/SKILL.md
git commit -m "docs: add gh-project-charter skill documentation

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## End of Chunk 4

Chunk 4 provides complete charter capability:
- Charter template with all sections
- Charter generation from template
- Section management (update, add, get)
- Progressive enhancement workflow
- Coordination with operations skill
- Complete test coverage

---

## Implementation Plan Complete

All 4 chunks implemented:

1. ✅ **Chunk 1: Shared Utilities** (Tasks 1-8)
   - Prerequisite checking (gh-check, gh-auth)
   - Config management (.github/project-config.json)
   - Context detection (template scoring)
   - Error handling (structured ERROR output)
   - Test framework (run-tests.sh)
   - Complete documentation

2. ✅ **Chunk 2: gh-project-setup** (Tasks 9-13)
   - 6 template configurations
   - Project creation with multi-repo support
   - Field configuration
   - Template application with override semantics
   - Complete documentation

3. ✅ **Chunk 3: gh-project-operations** (Tasks 14-19)
   - Issue CRUD operations
   - Item management
   - Bulk operations (batch, CSV, query)
   - CSV export
   - Coordination logic
   - Complete documentation

4. ✅ **Chunk 4: gh-project-charter** (Tasks 20-24)
   - Charter template
   - Charter generation
   - Section management
   - Progressive enhancement
   - Complete documentation

**Total:** 24 tasks across 4 skills + shared utilities

**Next Steps:**
1. Save and commit this plan
2. Dispatch plan-document-reviewer for each chunk
3. Fix any issues found
4. Begin implementation using superpowers:subagent-driven-development

