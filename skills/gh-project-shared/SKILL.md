---
name: gh-project-shared
description: "Shared utilities for GitHub project management. Not directly invoked by agents. Provides: gh CLI validation, authentication checking, config file management (.github/project-config.json), context detection for template suggestions, and error handling with logging."
category:
  primary: integrations
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
