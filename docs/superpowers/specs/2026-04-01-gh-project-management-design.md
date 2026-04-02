# GitHub Project Management Skills - Design Specification

**Version:** 1.0
**Date:** 2026-04-01
**Status:** Draft
**Author:** AI Agent with @danmestas

---

## Executive Summary

A modular system of GitHub project management skills for AI agents to autonomously create, configure, and manage GitHub Projects V2 via the `gh` CLI. The system provides three independent skills with shared utilities, enabling agents to handle everything from initial project setup through ongoing operations and documentation.

**Key capabilities:**
- Context-aware project setup with 6 template types
- Full CRUD operations for issues/items with bulk operations support
- Progressive project charter documentation that evolves with the project
- Git-based state management for auditability
- Interactive error recovery for resilience

---

## 1. Overall Architecture

### 1.1 System Components

Four-skill system with independent invocation but shared utilities:

1. **`gh-project-setup`** - Project creation, field configuration, template application
2. **`gh-project-operations`** - CRUD operations for issues/items, bulk operations, project item management
3. **`gh-project-charter`** - Charter creation and evolution in `docs/`
4. **`gh-project-shared`** - Common utilities (not directly invoked by agent)

### 1.2 Design Principles

- **Independent but coordinated** - Skills work standalone but suggest related skills when contextually relevant
- **Agent-driven with user control** - Agent performs operations autonomously but asks explicit questions at decision points
- **Git-based state** - All configuration and documentation lives in version control
- **Progressive enhancement** - Start simple, grow complex as needed
- **Interactive recovery** - Pause and ask user how to proceed when errors occur

### 1.3 Skill Trigger Descriptions

```yaml
gh-project-setup:
  description: "Use when creating new GitHub projects, setting up project boards,
               configuring kanban/scrum/roadmap boards, or applying project templates"

gh-project-operations:
  description: "Use when adding/updating/deleting issues in projects, changing item
               statuses, bulk operations, archiving items, or managing project boards daily"

gh-project-charter:
  description: "Use when creating project charters, documenting project goals/scope,
               defining success criteria, updating project documentation, or tracking scope changes"

gh-project-shared:
  description: "Shared utilities for GitHub project management. Not directly invoked.
               Provides: gh CLI validation, config management, context detection, error handling"
```

### 1.4 Directory Structure

```
skills/
├── gh-project-setup/
│   ├── SKILL.md
│   ├── scripts/
│   │   ├── create-project.sh
│   │   ├── configure-fields.sh
│   │   └── apply-template.sh
│   ├── templates/
│   │   ├── kanban.json
│   │   ├── bug-tracker.json
│   │   ├── feature-development.json
│   │   ├── roadmap.json
│   │   ├── research.json
│   │   └── release-planning.json
│   └── references/
│       └── field-definitions.md
│
├── gh-project-operations/
│   ├── SKILL.md
│   ├── scripts/
│   │   ├── issue-crud.sh
│   │   ├── bulk-operations.sh
│   │   ├── query-parser.sh
│   │   └── csv-parser.sh
│   └── references/
│       └── operation-patterns.md
│
├── gh-project-charter/
│   ├── SKILL.md
│   ├── scripts/
│   │   ├── charter-create.sh
│   │   ├── charter-update.sh
│   │   └── charter-sections.sh
│   └── templates/
│       ├── charter-minimal.md
│       └── section-templates/
│           ├── timeline.md
│           ├── deliverables.md
│           ├── risks.md
│           └── change-log.md
│
└── gh-project-shared/
    ├── SKILL.md (reference documentation only)
    ├── scripts/
    │   ├── gh-check.sh          # Verify gh CLI installation
    │   ├── gh-auth.sh           # Check/guide authentication
    │   ├── config-manager.sh    # Read/write .github/project-config.json
    │   ├── context-detector.sh  # Analyze repo and suggest templates
    │   └── error-handler.sh     # Interactive error recovery
    └── references/
        └── gh-api-reference.md
```

---

## 2. Git-Based State Management

### 2.1 Configuration File

**Location:** `.github/project-config.json`

**Purpose:** Source of truth for project metadata, field IDs, and coordination state

**Structure:**
```json
{
  "version": "1.0",
  "projects": [
    {
      "id": "PVT_kwHOBY96fM4AQFQu",
      "number": 1,
      "title": "Product Roadmap",
      "owner": "@me",
      "template": "feature-development",
      "linked_repos": ["danmestas/agent-skills"],
      "created_at": "2026-04-01T10:30:00Z",
      "fields": {
        "status_field_id": "PVTSSF_lAHOBY96fM4AQFQuzgKRH7s",
        "priority_field_id": "PVTSSF_lAHOBY96fM4AQFQuzgKRH7t",
        "size_field_id": "PVTSSF_lAHOBY96fM4AQFQuzgKRH7u",
        "type_field_id": "PVTSSF_lAHOBY96fM4AQFQuzgKRH7v"
      },
      "field_options": {
        "priority": {
          "high": "f75ad846",
          "medium": "47fc9ee4",
          "low": "98236657"
        },
        "size": {
          "xs": "a1b2c3d4",
          "s": "e5f6g7h8",
          "m": "i9j0k1l2",
          "l": "m3n4o5p6",
          "xl": "q7r8s9t0"
        },
        "type": {
          "bug": "u1v2w3x4",
          "feature": "y5z6a7b8",
          "improvement": "c9d0e1f2",
          "spike": "g3h4i5j6"
        }
      },
      "coordination": {
        "charter_suggested": true,
        "last_scope_check": "2026-04-01T10:30:00Z",
        "skip_charter_prompts": false
      }
    }
  ]
}
```

**Operations:**
- Created by `gh-project-setup` after project creation
- Read by all skills to get field IDs and project metadata
- Updated by skills when configuration changes
- Verified against API before mutations (handle deleted projects)
- Supports multiple projects per repository

### 2.2 Charter File

**Location:** `docs/project-charter.md`

**Purpose:** Living documentation that grows with the project

**Minimal structure (initial creation):**
```markdown
---
project: "Product Roadmap"
project_id: "PVT_kwHOBY96fM4AQFQu"
status: "active"
created: "2026-04-01"
updated: "2026-04-01"
owner: "@danmestas"
---

# Product Roadmap - Project Charter

## Goals
- Build GitHub project management skills for AI agents
- Support automated project setup and operations

## Scope
Initial focus: Project setup, operations, and charter management

## Success Criteria
- Agent can create and configure projects autonomously
- Projects track work effectively
```

**Progressive enhancement:** Sections added over time as project evolves

**Core sections (always present):**
- Goals
- Scope
- Success Criteria

**Optional sections (added on demand):**
- Timeline
- Deliverables
- Risks & Assumptions
- Dependencies
- Resources
- Communication Plan
- Change Log

### 2.3 State Management Principles

1. **Config is source of truth** - All project metadata and IDs stored in `.github/project-config.json`
2. **Charter is living document** - In-place edits tracked via git history
3. **Git provides audit trail** - All changes versioned and attributable
4. **Verify before mutate** - Always check project still exists via API before operations
5. **Handle deletions gracefully** - If project deleted externally, offer cleanup or recreation
6. **Multiple projects supported** - Single repo can track multiple GitHub projects

---

## 3. Templates and Field Definitions

### 3.1 Standard Fields

**Base fields available to templates:**

| Field | Type | Options | Always Present |
|-------|------|---------|----------------|
| Status | SINGLE_SELECT | Todo, In Progress, Done | ✓ (built-in) |
| Priority | SINGLE_SELECT | High, Medium, Low | Default |
| Size | SINGLE_SELECT | XS, S, M, L, XL | Optional |
| Type | SINGLE_SELECT | Bug, Feature, Improvement, Spike | Optional |

**Notes:**
- Status field is built-in to all GitHub Projects V2 (cannot be removed or replaced)
- Templates choose which additional fields to create from the base set
- Templates can define custom fields that replace or supplement base fields (see field_overrides)
- Most templates use Priority, Size, Type for consistency, but some substitute domain-specific fields

### 3.2 Template Definitions

**1. Kanban** (Simple workflow)
```json
{
  "name": "kanban",
  "display_name": "Kanban Board",
  "description": "Simple workflow for general task tracking",
  "fields": ["Status", "Priority"],
  "use_case": "General task tracking, simple projects"
}
```

**2. Bug Tracker** (Issue management)
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

**Field override behavior:** When `replaces` is specified, the base field (Priority) is NOT created, and the override field (Severity) is created instead with the specified options.

**3. Feature Development** (Product work)
```json
{
  "name": "feature-development",
  "display_name": "Feature Development",
  "description": "Product feature development workflow",
  "fields": ["Status", "Priority", "Size", "Type"],
  "use_case": "Building new features"
}
```

**4. Roadmap** (Long-term planning)
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
      "adds_to": ["Status", "Priority"]
    }
  },
  "use_case": "Strategic planning, quarterly goals"
}
```

**5. Research/Spikes** (Exploration work)
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
      "replaces": "Priority"
    }
  },
  "use_case": "Technical investigation, proof-of-concepts"
}
```

**6. Release Planning** (Version management)
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
      "adds_to": ["Status", "Priority"]
    }
  },
  "use_case": "Release coordination, version management"
}
```

### 3.3 Template Storage

**Location:** `skills/gh-project-setup/templates/`

**Files:**
- `kanban.json`
- `bug-tracker.json`
- `feature-development.json`
- `roadmap.json`
- `research.json`
- `release-planning.json`

### 3.4 Field Override Semantics

**Two override operations:**

1. **`replaces`** - Substitute a base field with a domain-specific field
   - Base field is NOT created
   - Override field is created instead with specified options
   - Example: Bug Tracker uses "Severity" (Critical/High/Medium/Low) instead of "Priority"

2. **`adds_to`** - Add a custom field alongside base fields
   - All listed base fields are created
   - Additional custom field is also created
   - Example: Roadmap adds "Quarter" (Q1/Q2/Q3/Q4) alongside "Status" and "Priority"

**Implementation in `scripts/apply-template.sh`:**
```bash
for field in "${TEMPLATE_FIELDS[@]}"; do
  if is_override_field "$field"; then
    operation=$(get_override_operation "$field")
    if [ "$operation" = "replaces" ]; then
      # Skip creating base field that's being replaced
      replaced_field=$(get_replaced_field "$field")
      create_custom_field "$field"
    elif [ "$operation" = "adds_to" ]; then
      # Create base fields first, then add custom field
      create_custom_field "$field"
    fi
  else
    # Standard base field
    create_base_field "$field"
  fi
done
```

---

## 4. Context Detection & Template Suggestion

### 4.1 Detection Sources

**Repo analysis indicators:**

| Indicator | Suggested Template | Weight |
|-----------|-------------------|--------|
| package.json, Gemfile, requirements.txt | Feature Development | High |
| CHANGELOG.md, releases/ folder | Release Planning | High |
| docs/research/, docs/spikes/ | Research/Spikes | High |
| High ratio of "bug" labeled issues | Bug Tracker | Medium |
| docs/roadmap/, quarterly planning docs | Roadmap | Medium |
| Simple structure, few files | Kanban | Low |

**Conversation analysis keywords:**

| Keywords | Template |
|----------|----------|
| "track bugs", "bug board" | Bug Tracker |
| "feature roadmap", "product roadmap" | Roadmap |
| "sprint board", "feature development" | Feature Development |
| "research", "spikes", "investigation" | Research/Spikes |
| "release planning", "version tracking" | Release Planning |
| "simple kanban", "task board" | Kanban |

### 4.2 Context Detection Flow

```
1. gh-project-setup invoked
   ↓
2. Run context-detector.sh
   - Analyze repo structure (files, folders, git history)
   - Parse conversation text for keywords
   - Query existing issues via gh CLI (labels, types)
   - Score each template 0-100
   ↓
3. Generate recommendation with reasoning
   ↓
4. Present to user:

   "Based on your repo structure (CHANGELOG.md, 3 releases, package.json)
    and conversation ('release planning'), I suggest the **Release Planning**
    template with Status, Priority, and Release fields.

    Other good options: Feature Development (score: 75), Roadmap (score: 60)

    Which template would you like? You can also describe a custom setup."
   ↓
5. User response:
   - Picks suggested template → proceed
   - Picks alternative → proceed with that
   - Describes custom → parse and configure
   - "Not sure" → ask clarifying questions
```

### 4.3 Context Detector Output

**Shared utility:** `scripts/context-detector.sh`

**Input:**
- Repository path
- Conversation context (optional)
- Existing project config (optional)

**Output JSON:**
```json
{
  "scores": {
    "bug-tracker": 20,
    "feature-development": 75,
    "release-planning": 85,
    "roadmap": 60,
    "research": 10,
    "kanban": 40
  },
  "reasoning": {
    "release-planning": [
      "CHANGELOG.md found",
      "3 releases detected in git history",
      "conversation mentions 'release'"
    ],
    "feature-development": [
      "package.json found",
      "multiple feature branches",
      "Issues labeled 'feature' found"
    ],
    "roadmap": [
      "docs/roadmap/ directory exists",
      "Quarterly planning docs found"
    ]
  },
  "recommendation": "release-planning",
  "confidence": "high"
}
```

---

## 5. Skill Coordination & Cross-Skill Suggestions

### 5.1 Coordination Pattern: Explicit Ask

**Principle:** Skills pause and ask clear questions at natural transition points. Agent shows awareness and respects user control.

### 5.2 Coordination Scenarios

#### Scenario 1: Setup → Charter

**Trigger:** `gh-project-setup` completes successfully

**Check:** Does `docs/project-charter.md` exist?

**Flow:**
```
gh-project-setup completes
  ↓
Check: charter exists?
  ↓ NO
Agent: "Project created successfully! Since this is a new [feature-development]
        project, would you like me to create a project charter to document
        goals and scope?"

User response:
  - "yes" → Invoke gh-project-charter
  - "no" / "not now" → Continue, set coordination.charter_suggested = true
  - "later" → Set coordination.skip_charter_prompts = true
```

#### Scenario 2: Operations detects scope change

**Trigger:** Multiple new issues created OR bulk import OR user mentions adding major feature

**Check:** Does charter exist? Are new items significantly different from existing scope?

**Flow:**
```
gh-project-operations creates 5+ new issues OR
user says "adding authentication module"
  ↓
Check: charter exists? Is this new scope?
  ↓ YES
Agent: "I notice you're adding [authentication features] which looks like a
        scope expansion. Would you like me to update the project charter to
        document this change?"

User response:
  - "yes" → Invoke gh-project-charter with context
  - "no" → Continue without update
  - "show me first" → Display current charter scope section
```

#### Scenario 3: Operations detects new feature mention

**Trigger:** User conversation mentions adding features not yet tracked

**Check:** Is there an active project? Is feature mentioned in charter or issues?

**Flow:**
```
User conversation: "we need to add X feature"
  ↓
Check: active project? feature not in issues?
  ↓ YES
Agent: "Should I add '[X feature]' to the project board as a new issue?"

User response:
  - "yes" → Create issue and add to project
  - "yes with details" → Ask for title/description, then create
  - "no" → Continue conversation only
```

#### Scenario 4: Charter mentions new deliverables

**Trigger:** Charter updated with deliverables or milestones

**Check:** Do deliverables have corresponding issues?

**Flow:**
```
gh-project-charter updated with ## Deliverables section
  ↓
Parse charter for action items
  ↓
Found: 3 deliverables not in issues
  ↓
Agent: "I see 3 new deliverables in the charter:
        - Feature X
        - Feature Y
        - Feature Z

        Would you like me to create issues for these and add them to the project?"

User response:
  - "yes" → Invoke gh-project-operations to create all
  - "yes, but let me review first" → Show proposed issues, then create
  - "no" → Charter stays as documentation only
```

### 5.3 Coordination State

**Stored in:** `.github/project-config.json` under `coordination` object

```json
{
  "coordination": {
    "charter_suggested": false,
    "last_scope_check": "2026-04-01T10:30:00Z",
    "skip_charter_prompts": false
  }
}
```

**Fields:**
- `charter_suggested`: Has agent suggested creating charter? (avoid repeating suggestion)
- `last_scope_check`: Last time agent checked for scope changes (ISO 8601 timestamp)
- `skip_charter_prompts`: User said "no more charter suggestions" (suppresses future prompts)

**Scope check triggers (when `last_scope_check` is updated):**

1. **Bulk issue creation** - Creating 5+ issues at once suggests scope expansion
2. **Major feature mentioned** - User conversation mentions adding significant new functionality
3. **Charter update** - After charter is modified, check if new deliverables need issues
4. **Periodic check** - Every 7 days of active development (prevents scope drift going unnoticed)

**Scope check logic in `gh-project-operations`:**
```bash
# Check if scope check is needed
days_since_last_check=$(days_since "$LAST_SCOPE_CHECK")
new_issues_count=$(count_new_issues_this_session)

if [ "$new_issues_count" -ge 5 ] || [ "$days_since_last_check" -ge 7 ]; then
  # Trigger scope check
  if charter_exists && scope_appears_different; then
    suggest_charter_update
    update_coordination_state "last_scope_check" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  fi
fi
```

---

## 6. Error Handling & Interactive Recovery

### 6.1 Error Categories

#### 1. Prerequisites Missing

**Error:** gh CLI not installed

**Handling:**
```
Skill detects: gh command not found
  ↓
Skill exits with error code 1 and message
  ↓
Agent sees error output and responds to user:

Agent: "GitHub CLI (gh) is not installed. Here's how to install it:

        macOS:   brew install gh
        Linux:   https://github.com/cli/cli#installation
        Windows: winget install GitHub.cli

        After installing, verify with: gh --version

        Let me know when it's installed and I'll retry."

User installs gh CLI
  ↓
User: "installed" or "done"
  ↓
Agent re-invokes skill (will now pass prerequisite check)
```

#### 2. Authentication Issues

**Error:** Not authenticated with GitHub

**Handling:**
```
Skill detects: gh auth status returns "not logged in"
  ↓
Skill exits with error code 1 and message
  ↓
Agent sees error output and responds to user:

Agent: "You're not authenticated with GitHub. Please run this command
        to authenticate:

        gh auth login --web

        This will open your browser for OAuth authentication. Make sure
        to grant the 'project' scope when prompted.

        After authenticating, let me know and I'll retry the operation."

User runs command and authenticates
  ↓
User: "done" or "authenticated"
  ↓
Agent re-invokes skill (will now pass auth check)
```

**Implementation note:** Skills cannot pause mid-execution. When prerequisites fail, the skill exits immediately with an error message. The agent then guides the user through fixing the issue and retries.

#### 3. API Failures (Partial Success)

**Error:** Bulk operation partially fails

**Handling:**
```
Bulk operation: Add 10 issues to project
  ↓
Issue #1-7: Success ✓
Issue #8: FAILED (rate limit)
Issue #9-10: Not attempted
  ↓
Agent: "Added 7/10 issues successfully. Issue #8 failed due to rate limiting:

        Error: API rate limit exceeded (resets in 12 minutes)

        Options:
        1. Retry failed items now (may hit rate limit again)
        2. Wait 12 minutes and retry
        3. Skip failed items and continue
        4. Abort remaining operations

        What would you like to do?"

User chooses option
  ↓
Agent proceeds accordingly:
  - Option 1: Retry immediately
  - Option 2: Set timer, retry after wait
  - Option 3: Continue, log skipped items
  - Option 4: Stop, report final state
```

#### 4. Missing Project/Field

**Error:** Project referenced in config no longer exists

**Handling:**
```
Operation references project ID from config
  ↓
gh API call returns: Project not found (404)
  ↓
Agent: "The project 'Product Roadmap' (ID: PVT_...) no longer exists.
        It may have been deleted.

        Options:
        1. Remove from config (cleanup)
        2. Create new project with same settings
        3. Link to different existing project

        What would you like to do?"

User response:
  - Option 1: Remove project from config
  - Option 2: Re-run setup with same template
  - Option 3: List projects, user picks one, update config
```

#### 5. Script Failures

**Error:** Shell script exits with non-zero code

**Handling:**
```
Execute: scripts/create-project.sh
  ↓
Exit code: 1
Stderr: "jq: parse error: Invalid JSON"
  ↓
Agent: "The operation failed while creating the project.

        What happened: JSON parsing error in configuration file
        Error details: jq: parse error: Invalid JSON at line 15

        Options:
        1. Show me the config file (debug)
        2. Reset config and try again
        3. Skip this step
        4. Abort operation

        What would you like to do?"

User chooses
  ↓
Agent proceeds with chosen recovery path
```

### 6.2 Recovery Principles

1. **Always provide context** - What failed, why it failed, what was being attempted
2. **Always offer 2-4 clear options** - User chooses recovery path
3. **Default to safest option** - Skip > Abort > Retry > Destructive
4. **Log all errors** - Write to `.github/project-errors.log` for debugging
5. **Be transparent** - Show error messages, don't hide technical details

### 6.3 Shared Error Handling Utility

**Script:** `scripts/error-handler.sh`

**Functions:**
```bash
# Handle error with context and recovery options
handle_error() {
  local exit_code=$1
  local message=$2
  local context=$3
  # Log error
  # Present options
  # Wait for user input
  # Return recovery action
}

# Offer recovery options
offer_recovery() {
  local options=("$@")
  # Display numbered options
  # Read user choice
  # Return selected option
}

# Log error details
log_error() {
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  local details=$1
  echo "[$timestamp] $details" >> .github/project-errors.log
}
```

---

## 7. Bulk Operations in `gh-project-operations`

### 7.1 Three Bulk Operation Styles

#### Style 1: Simple Batch Operations

**Pattern:** Same operation applied to filtered items

**Examples:**
```
- "Archive all items with Status=Done"
- "Set Priority=High for all items labeled 'security'"
- "Update Size=L for all feature items"
```

**Flow:**
```
1. Parse filter criteria from user request
2. Query matching items via gh CLI:
   gh project item-list <project> --format json | jq 'filter criteria'
3. Show count and sample:
   "Found 12 items matching criteria. Sample (first 3):
    - Fix login bug
    - Update API docs
    - Refactor auth module"
4. Apply operation to all matching items
5. Report results:
   "Updated 12/12 items successfully"
```

**Script:** `scripts/bulk-operations.sh`

#### Style 2: CSV/JSON Import

**Pattern:** Structured data file with multiple items to create/update

**CSV format:**
```csv
title,type,priority,size,status
"Add authentication",Feature,High,L,Todo
"Fix login bug",Bug,High,M,In Progress
"Refactor API",Improvement,Medium,XL,Todo
```

**JSON format:**
```json
[
  {
    "title": "Add authentication",
    "type": "Feature",
    "priority": "High",
    "size": "L",
    "status": "Todo"
  },
  {
    "title": "Fix login bug",
    "type": "Bug",
    "priority": "High",
    "size": "M",
    "status": "In Progress"
  }
]
```

**Flow:**
```
1. User provides file path or inline data
2. Parse file format (detect CSV vs JSON)
3. Validate all rows/objects:
   - Required fields present
   - Field values are valid options
   - No duplicate titles
4. Show preview:
   "Will create 3 issues:
    1. Add authentication (Feature, High, L)
    2. Fix login bug (Bug, High, M)
    3. Refactor API (Improvement, Medium, XL)"
5. Create issues → Add to project → Set field values
6. Report results:
   "Created and added 3/3 issues successfully"
```

**Script:** `scripts/csv-parser.sh`

#### Style 3: Pattern-Based Queries

**Pattern:** Query language (simplified JQL-like syntax)

**Query syntax:**
```
Filters:
  - label:X
  - status:X
  - type:X
  - priority:X
  - size:X
  - created:>DATE
  - updated:<DATE

Operators:
  - AND
  - OR

Actions:
  - archive
  - set:field=value
  - delete
```

**Examples:**
```
- "label:bug AND status:Done → archive"
- "type:Feature AND priority:High → size:L"
- "created:>2026-01-01 AND status:Todo → priority:Medium"
```

**Flow:**
```
1. Parse query into filters + action:
   filters: {type: "Feature", priority: "High"}
   action: {set: {size: "L"}}

2. Fetch matching items via gh API

3. Show what will change:
   "5 items match the query. Changes:
    - Feature A: size → L
    - Feature B: size → L
    - Feature C: size → L
    (showing 3/5)"

4. Execute changes

5. Report results:
   "Updated 5/5 items successfully"
```

**Script:** `scripts/query-parser.sh`

### 7.2 Bulk Operation Safety

**Before executing any bulk operation:**

1. **Validate inputs** - Parse and check all filters/data before API calls
2. **Dry-run query** - Test fetch to verify query works
3. **Show preview** - Display count and sample of affected items
   ```
   Example: "Found 12 items matching criteria. Sample (first 3):
            - Fix login bug
            - Update API docs
            - Refactor auth module

            Proceeding with update..."
   ```
4. **Execute** - Proceed immediately after showing preview (no pause for confirmation)
5. **Report detailed results** - Success/failure counts, list failures

**Rationale:** Agent shows preview for transparency but proceeds automatically. User can interrupt if needed, and interactive recovery handles any issues that arise. This balances user awareness with execution speed.

---

## 8. Charter Evolution & Progressive Enhancement

### 8.1 Charter Lifecycle Stages

#### Stage 1: Minimal (Initial Creation)

**Created by:** `gh-project-charter` on first invocation

**Content:**
```markdown
---
project: "Product Roadmap"
project_id: "PVT_kwHOBY96fM4AQFQu"
status: "active"
created: "2026-04-01"
updated: "2026-04-01"
owner: "@danmestas"
---

# Product Roadmap - Project Charter

## Goals
- Build GitHub project management skills for AI agents
- Support automated project setup and operations

## Scope
Initial focus: Project setup, operations, and charter management

## Success Criteria
- Agent can create and configure projects autonomously
- Projects track work effectively
```

#### Stage 2: Expanded (User Adds Sections)

**Trigger:** User mentions timeline, deliverables, risks, or agent detects need

**Content additions:**
```markdown
[...frontmatter...]

# Product Roadmap - Project Charter

## Goals
[existing content]

## Scope
### In Scope
- Project setup with templates
- CRUD operations for issues
- Charter documentation

### Out of Scope
- GitHub Actions automation
- Sprint velocity tracking
- Third-party integrations

## Success Criteria
[existing content]

## Timeline
- Phase 1 (Apr 2026): Core skills implementation
- Phase 2 (May 2026): Testing and refinement
- Phase 3 (Jun 2026): Documentation and release
```

#### Stage 3: Comprehensive (Full Maturity)

**Trigger:** Project reaches maturity, multiple milestones completed

**Content additions:**
```markdown
[...all previous sections...]

## Deliverables
- [ ] gh-project-setup skill
- [ ] gh-project-operations skill
- [ ] gh-project-charter skill
- [x] Comprehensive design document
- [ ] Test suite
- [ ] User documentation

## Risks & Assumptions
### Risks
- GitHub API rate limiting during bulk operations (Mitigation: implement retry with backoff)
- User authentication token expiration (Mitigation: guide re-authentication)
- Breaking changes in GitHub Projects API (Mitigation: version pinning, compatibility layer)

### Assumptions
- Users have gh CLI installed (or can install it)
- Projects use GitHub Projects V2 (not legacy Projects)
- Git is available for version control
- Users have project scope in GitHub token

## Dependencies
- GitHub CLI (v2.89.0+)
- GitHub API with project scope
- Git for version control
- jq for JSON parsing
- bash 4.0+ for shell scripts

## Change Log
### 2026-04-01
- Initial charter created
- Defined core goals and scope

### 2026-04-15
- Added timeline and deliverables sections
- Expanded success criteria with metrics

### 2026-05-01
- Added risks and assumptions
- Documented dependencies
- Marked first deliverable complete
```

### 8.2 How Agent Suggests Additions

#### Suggestion: Deliverables Section

**Trigger:** Major milestone completed or multiple goals mentioned

```
Agent detects: Issue marked Done represents significant deliverable
  ↓
Agent: "I see you completed '[feature X]', which looks like a major project
        deliverable. Would you like me to add a Deliverables section to the
        charter to track this and other milestones?"

User: "yes"
  ↓
Agent adds ## Deliverables section with checkbox list
```

#### Suggestion: Risks Section

**Trigger:** User mentions concern, blocker, or risk

```
User says: "worried about rate limiting"
  ↓
Agent: "That's an important risk. Should I add a Risks & Assumptions section
        to the charter to document this and any mitigation strategies?"

User: "yes"
  ↓
Agent adds ## Risks & Assumptions section with rate limiting noted
```

#### Suggestion: Timeline Section

**Trigger:** User mentions dates, phases, or milestones

```
User says: "want to launch by Q2"
  ↓
Agent: "You mentioned a Q2 launch. Should I add a Timeline section to the
        charter to document phases and dates?"

User: "yes"
  ↓
Agent adds ## Timeline section with phases
```

#### Suggestion: Scope Clarification

**Trigger:** Scope appears to expand or contract significantly

```
Multiple new features added that differ from charter scope
  ↓
Agent: "The project scope seems to have expanded with [authentication,
        payments, analytics]. Would you like me to update the charter with
        detailed In Scope / Out of Scope sections?"

User: "yes"
  ↓
Agent updates ## Scope with subsections
```

### 8.3 Charter Update Operations

**Supported operations:**

```bash
# Add new section
gh-project-charter add-section "Risks & Assumptions" --content "..."

# Update existing section (append)
gh-project-charter update-section "Goals" --append "New goal text"

# Update existing section (replace)
gh-project-charter update-section "Scope" --replace "New scope text"

# Log change to Change Log section
gh-project-charter log-change "Added risk mitigation strategies"

# Show diff before committing
git diff docs/project-charter.md
```

### 8.4 Template Sections

**Core sections (always present):**
- Goals
- Scope
- Success Criteria

**Optional sections (added on demand):**
- Timeline
- Deliverables
- Risks & Assumptions
- Dependencies
- Resources
- Communication Plan
- Change Log

**Template files:** `skills/gh-project-charter/templates/section-templates/`

---

## 9. Testing & Validation Strategy

### 9.1 Test Categories

#### 1. Prerequisites Check

**Script:** `scripts/test-prerequisites.sh`

**Validates:**
- gh CLI installed and version >= 2.89.0
- Authentication status (gh auth status)
- API connectivity (gh api /user)
- Project scope in token (parse gh auth status output)

**Usage:**
```bash
# Run from any skill
source ../gh-project-shared/scripts/test-prerequisites.sh
check_prerequisites
# Returns: 0 (success) or 1 (failure with guidance)
```

#### 2. Template Validation

**Script:** `scripts/test-templates.sh`

**Validates each template JSON:**
- Valid JSON syntax
- Required fields present (name, display_name, description, fields, use_case)
- Field definitions valid (type, options)
- No duplicate field names
- Options arrays non-empty

**Usage:**
```bash
cd skills/gh-project-setup
./scripts/test-templates.sh
# Validates all templates in templates/ directory
```

#### 3. Script Validation

**Script:** `scripts/test-scripts.sh`

**Validates each shell script:**
- ShellCheck for syntax and best practices
- Error handling paths (set -e, trap, etc.)
- JSON output validity (if script produces JSON)
- Exit codes (0 for success, non-zero for errors)

**Usage:**
```bash
cd skills/gh-project-shared
shellcheck scripts/*.sh
```

#### 4. Integration Testing

**Test suite:** `skills/gh-project-shared/tests/integration/`

**End-to-end workflows:**

**Test 1: Full setup flow**
```bash
# Create test repo
# Run gh-project-setup
# Verify .github/project-config.json written
# Verify project exists via gh API
# Verify fields created correctly
# Cleanup
```

**Test 2: Operations flow**
```bash
# Setup test project
# Add issue via gh-project-operations
# Verify issue in project
# Update status
# Verify status changed
# Archive item
# Verify archived
# Cleanup
```

**Test 3: Charter flow**
```bash
# Create charter via gh-project-charter
# Verify docs/project-charter.md exists
# Update charter (add section)
# Verify git diff shows changes
# Commit and verify git log
# Cleanup
```

**Test 4: Bulk operations**
```bash
# Setup test project with items
# Import CSV with 5 issues
# Verify all 5 created and added
# Run batch update (all Done → archive)
# Verify all archived
# Cleanup
```

**Test 5: Coordination**
```bash
# Run gh-project-setup
# Capture output for charter suggestion
# Verify "Would you like to create charter?" appears
# Simulate "yes" response
# Verify gh-project-charter invoked
# Cleanup
```

#### 5. Error Scenario Testing

**Test suite:** `skills/gh-project-shared/tests/error-scenarios/`

**Recovery flows:**

**Test 1: Missing gh CLI**
```bash
# Mock: gh command not found
# Run skill
# Verify: guidance message appears
# Verify: installation instructions correct
```

**Test 2: Unauthenticated**
```bash
# Mock: gh auth status returns "not logged in"
# Run skill
# Verify: auth guidance appears
# Verify: login instructions correct
```

**Test 3: Rate limit**
```bash
# Mock: API returns 429 rate limit
# Run bulk operation
# Verify: partial success reported
# Verify: recovery options offered
```

**Test 4: Project deleted**
```bash
# Create project, save config
# Delete project externally
# Run operation
# Verify: "project not found" detected
# Verify: cleanup options offered
```

**Test 5: Partial bulk failure**
```bash
# Mock: bulk operation where item 5/10 fails
# Run operation
# Verify: 4 success, 1 fail, 5 not attempted
# Verify: recovery options offered
```

### 9.2 Test Directory Structure

```
skills/gh-project-shared/tests/
├── unit/
│   ├── test-context-detector.sh
│   ├── test-config-manager.sh
│   ├── test-error-handler.sh
│   └── test-query-parser.sh
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
└── fixtures/
    ├── sample-repos/
    │   ├── feature-repo/
    │   ├── bug-heavy-repo/
    │   └── release-repo/
    ├── test-projects.json
    ├── test-charters/
    │   ├── minimal.md
    │   └── comprehensive.md
    └── test-data/
        ├── sample-issues.csv
        └── sample-issues.json
```

### 9.3 Validation on Skill Invocation

**Every skill starts with:**

```bash
#!/bin/bash
set -e  # Exit on error

# Source shared utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHARED_DIR="$SCRIPT_DIR/../../gh-project-shared/scripts"

source "$SHARED_DIR/gh-check.sh"
source "$SHARED_DIR/error-handler.sh"

# Validate prerequisites
check_gh_installed || exit 1
check_gh_authenticated || exit 1
check_project_scope || exit 1

# Validate state files (if operating on existing project)
if [ -f ".github/project-config.json" ]; then
  validate_config_file || exit 1
fi

# Verify project still exists (if operating on one)
if [ -n "$PROJECT_ID" ]; then
  verify_project_exists "$PROJECT_ID" || handle_missing_project
fi

# Proceed with operation
...
```

### 9.4 Test Execution Strategy

**Test runner:** `skills/gh-project-shared/tests/run-tests.sh`

**Execution modes:**

1. **Manual (development)**
   ```bash
   cd skills/gh-project-shared/tests
   ./run-tests.sh              # Run all tests
   ./run-tests.sh unit         # Run unit tests only
   ./run-tests.sh integration  # Run integration tests only
   ./run-tests.sh error        # Run error scenario tests only
   ```

2. **Pre-commit hook (optional)**
   ```bash
   # .git/hooks/pre-commit
   #!/bin/bash
   cd skills/gh-project-shared/tests
   ./run-tests.sh unit || exit 1
   ```

3. **CI/CD (GitHub Actions)**
   ```yaml
   # .github/workflows/test.yml
   name: Test Skills
   on: [push, pull_request]
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Install dependencies
           run: |
             brew install gh jq
             gh --version
         - name: Run tests
           run: |
             cd skills/gh-project-shared/tests
             ./run-tests.sh
           env:
             GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
   ```

**Test success criteria:**
- Exit code 0 = all tests passed
- Exit code 1 = one or more tests failed
- Detailed output shows which tests passed/failed

**Test fixture management:**
- Fixtures in `tests/fixtures/` directory
- Created once, reused across tests
- Cleaned up after test suite completes

**Who maintains tests:**
- Skill developers write tests for new features
- Test suite runs in CI on every PR
- Breaking changes must update tests

**Test isolation:**
- Each test creates temporary test projects
- Uses unique project names (timestamped)
- Cleans up test projects after completion
- Never mutates production projects

---

## 10. Implementation Considerations

### 10.1 Dependencies

**Required:**
- bash 4.0+
- GitHub CLI (gh) v2.89.0+
- jq (JSON processor)
- git

**Optional:**
- curl (for direct API calls if needed)
- shellcheck (for development/testing)

### 10.2 Multi-Repository & Organization Support

**User projects:**
- Default owner: `@me`
- Single repo typical (current repo)
- Config in repo: `.github/project-config.json`

**Organization projects:**
- Owner: `orgname` (user specifies during setup)
- Multi-repo supported
- Can link multiple repos to one project
- Config stored in primary repo (where setup was run)

**How multi-repo linking works:**

**Handled by:** `gh-project-setup` skill during project creation

**User specification:**
```
User: "Create project for repos agent-skills, superpowers, and dotfiles"
  or
User: "Create org project for acme-corp repos: api, web, mobile"
```

**Agent parsing:**
- Detects owner type (user vs org) from context or explicit mention
- Parses list of repositories from user message
- Confirms with user before creating

**Implementation in `scripts/create-project.sh`:**
```bash
# Parse owner and repos from user input
OWNER="${1:-@me}"
shift
REPOS=("$@")  # All remaining args are repo names

# Detect owner type
if [ "$OWNER" != "@me" ]; then
  if gh api "/users/$OWNER" | jq -e '.type == "Organization"'; then
    OWNER_TYPE="org"
  else
    OWNER_TYPE="user"
  fi
else
  OWNER_TYPE="user"
fi

# Create project
PROJECT_NUM=$(gh project create --owner "$OWNER" --title "$TITLE" --format json | jq -r '.number')

# Link repos (automatically links current repo for user projects)
if [ "$OWNER_TYPE" = "user" ] && [ ${#REPOS[@]} -eq 0 ]; then
  # User project, no explicit repos: link current repo
  gh project link "$PROJECT_NUM" --owner "$OWNER"
elif [ ${#REPOS[@]} -gt 0 ]; then
  # Multiple repos specified: link each one
  for repo in "${REPOS[@]}"; do
    gh project link "$PROJECT_NUM" --owner "$OWNER" --repo "$repo"
  done
fi

# Save config in current repo
save_config "$PROJECT_NUM" "$OWNER" "${REPOS[@]}"
```

**User flow example:**
```
User: "Set up a project for my org's api, web, and mobile repos"
  ↓
Agent: "I'll create an organization project. What's the org name?"
  ↓
User: "acme-corp"
  ↓
Agent: "Creating project for org 'acme-corp' with repos: api, web, mobile"
  ↓
gh-project-setup creates project and links all three repos
```

### 10.3 Performance Considerations

**Rate limiting:**
- GitHub API has rate limits (5000 req/hour for authenticated users)
- Bulk operations should batch API calls
- Implement exponential backoff on rate limit errors
- Cache field IDs and project metadata in config file

**Caching strategy:**
```
High-frequency operations:
  - Field IDs: cache in config (rarely change)
  - Project metadata: cache in config
  - Option IDs: cache in config

Low-frequency operations:
  - Project existence: verify before mutations
  - Item queries: always fresh from API
```

### 10.4 Security Considerations

**Credentials:**
- Never store GitHub tokens in files
- Use gh CLI's credential storage
- Document that users need `project` scope in token

**Config file:**
- `.github/project-config.json` contains IDs, not sensitive data
- Safe to commit to version control
- If repo is public, project IDs are not sensitive (already public)

**Scripts:**
- Validate all inputs before shell execution
- Escape user-provided strings in shell commands
- Use jq for JSON parsing (avoids eval/injection risks)

### 10.5 Extensibility

**Adding new skills:**
```
1. Create new skill directory: skills/gh-project-<name>/
2. Reference shared scripts: ../gh-project-shared/scripts/
3. Add coordination logic to detect when to suggest new skill
4. Update coordination scenarios in other skills
```

**Adding new templates:**
```
1. Create template JSON: skills/gh-project-setup/templates/new-template.json
2. Add detection logic to context-detector.sh
3. Test with validation scripts
```

**Adding new bulk operation styles:**
```
1. Extend query-parser.sh or create new parser
2. Add to bulk-operations.sh dispatch logic
3. Document syntax in gh-project-operations SKILL.md
```

---

## 11. Success Criteria

**The system is successful when:**

1. ✅ Agent can create and configure GitHub projects autonomously with user approval
2. ✅ Context detection suggests appropriate templates with transparent reasoning
3. ✅ Skills coordinate naturally through explicit ask pattern
4. ✅ Charter grows from minimal to comprehensive as project evolves
5. ✅ Bulk operations handle all three styles (batch, import, query)
6. ✅ Error recovery is interactive and user-controlled
7. ✅ All state lives in git (config, charter) for auditability
8. ✅ Multi-repo and organization projects are supported
9. ✅ Skills can be used independently or together
10. ✅ Agent shows awareness and respects user control throughout

---

## 12. Open Questions & Future Enhancements

**Open questions:**
- None (all design questions resolved)

**Future enhancements (out of scope for v1):**
- GitHub Actions automation skill (auto-update projects on issue events)
- Sprint planning skill (iteration management, velocity tracking)
- Project analytics skill (burndown charts, completion metrics)
- Template marketplace (user-contributed templates)
- Web UI companion (visual project board configuration)

---

## 13. Summary

This design provides a comprehensive, modular system for GitHub project management via AI agents. The architecture balances autonomy with user control through:

- **Independent, composable skills** that work alone or together
- **Context-aware suggestions** with transparent reasoning
- **Git-based state management** for auditability
- **Interactive error recovery** for resilience
- **Progressive documentation** that grows with projects
- **Comprehensive bulk operations** for scale

The system respects the principle of explicit coordination—skills pause and ask at natural decision points—while enabling agents to handle the full lifecycle of GitHub project management from initial setup through ongoing operations and documentation.

**Next step:** Create detailed implementation plan with `writing-plans` skill.
