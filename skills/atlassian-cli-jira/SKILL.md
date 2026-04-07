---
name: atlassian-cli-jira
description: "Use when working with Atlassian CLI (acli) to install, authenticate, and manage Jira Cloud work items/issues from the command line: search (JQL), view, create, edit, assign, transition, comment, link, watch, attach, archive/unarchive, bulk operations, and project/board/sprint discovery."
---

# Atlassian CLI Jira

Comprehensive reference for Atlassian CLI (acli) focused on Jira Cloud workflows from the command line.

**Version:** Check with `acli --version` (each CLI version is supported for 6 months after release). Some commands in the CLI structure section require ACLI 1.3.5+; if you see "unknown command", upgrade and re-check.

## Prerequisites

### Installation (macOS)

```bash
brew tap atlassian/homebrew-acli
brew install acli
acli --version
```

Or download the macOS binary:

```bash
# Intel
curl -LO "https://acli.atlassian.com/darwin/latest/acli_darwin_amd64/acli"

# Apple Silicon
curl -LO "https://acli.atlassian.com/darwin/latest/acli_darwin_arm64/acli"

chmod +x ./acli
sudo mv ./acli /usr/local/bin/acli
sudo chown root: /usr/local/bin/acli
```

### Authentication

```bash
# OAuth (browser)
acli jira auth login --web

# API token (stdin)
echo <token> | acli jira auth login --site "mysite.atlassian.net" --email "user@atlassian.com" --token

# Switch between accounts
acli jira auth switch
```

## CLI Structure

```
acli jira
├── auth
│   ├── login
│   └── switch
├── board
│   ├── list-sprints
│   └── search
├── dashboard
│   └── search
├── field
│   ├── create
│   ├── delete
│   └── cancel-delete
├── filter
│   ├── search
│   ├── list
│   └── add-favourite
├── project
│   ├── archive
│   ├── create
│   ├── delete
│   ├── list
│   ├── restore
│   ├── update
│   └── view
├── sprint
│   └── list-workitems
└── workitem
    ├── archive
    ├── assign
    ├── attachment
    │   ├── list
    │   └── delete
    ├── clone
    ├── comment
    │   ├── create
    │   ├── list
    │   ├── update
    │   ├── delete
    │   └── visibility
    ├── create
    ├── create-bulk
    ├── delete
    ├── edit
    ├── link
    │   ├── create
    │   ├── delete
    │   ├── list
    │   └── type
    ├── search
    ├── transition
    ├── unarchive
    ├── view
    └── watcher
        └── remove
```

## Command Pattern

```
acli <product> <entity> <action> [flags]
```

Example:

```
acli jira workitem create --summary "New Task" --project TEAM --type Task
```

## Output Formatting

- `--json` for JSON output (when available)
- `--csv` for CSV output (when available)
- `--paginate` to fetch all pages (where available)
- `--web` to open results in the browser (where available)

## Common Workflows

### Search and view work items

```bash
# JQL search
acli jira workitem search --jql "project = TEAM" --paginate

# View a work item
acli jira workitem view --key "TEAM-123"
```

### Create and edit work items

```bash
# Create a work item
acli jira workitem create --summary "New Task" --project TEAM --type Task

# Create from JSON
acli jira workitem create --generate-json
acli jira workitem create --from-json "workitem.json"

# Edit from JSON
acli jira workitem edit --generate-json
acli jira workitem edit --from-json "workitem.json"
```

### Assign and transition

```bash
# Assign to yourself
acli jira workitem assign --key "TEAM-123" --assignee "@me"

# Transition by status
acli jira workitem transition --key "TEAM-123" --status "Done"
```

### Comment and link

```bash
# Comment
acli jira workitem comment --key "TEAM-123" --body "Status update"

# Link work items
acli jira workitem link create --out TEAM-123 --in TEAM-456 --type Blocks
```

### Boards and sprints

```bash
# Find boards by name
acli jira board search --name "Platform"

# List sprints for a board
acli jira board list-sprints --id 123

# List work items in a sprint
acli jira sprint list-workitems --sprint 1 --board 6
```

### Projects

```bash
# List projects
acli jira project list --recent

# Create a project from an existing one
acli jira project create --from-project "TEAM" --key "NEWTEAM" --name "New Project"
```

## CI Usage

```bash
# install-acli.sh
#!/bin/bash
set -euo pipefail

# Download the latest release.
curl -LO "https://acli.atlassian.com/linux/latest/acli_linux_amd64/acli"

# Make the acli binary executable.
chmod +x ./acli

# You can now use acli from this directory.
./acli --help
```

```bash
# Authenticate with a bot token in CI
echo "$BOT_API_TOKEN" | ./acli jira auth login --email bot@atlassian.com --site hello.atlassian.com --token
```

## Shell Autocomplete (zsh, macOS)

```bash
# Enable completion in your shell config (one-time)
echo "autoload -U compinit; compinit" >> ~/.zshrc

# Enable in the current session
source <(acli completion zsh)

# Persist completion for new sessions
acli completion zsh > $(brew --prefix)/share/zsh/site-functions/_acli
```

## Safety Defaults

- Prefer `archive`/`unarchive` over `delete` for recoverable actions.
- Use `--yes` only when selection criteria are precise.
- Validate JQL with a small query before running bulk actions.

## Getting Help

```bash
acli --help
acli jira --help
acli jira workitem --help
acli jira workitem create --help
```
