#!/bin/bash
# skills/gh-project-operations/gh-project-operations.sh

OPS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source dependencies (guard against missing files and set -e from sourced scripts)
_ops_source() { [ -f "$1" ] && source "$1"; return 0; }
_ops_source "$OPS_DIR/../gh-project-shared/scripts/gh-check.sh"
_ops_source "$OPS_DIR/../gh-project-shared/scripts/gh-auth.sh"
_ops_source "$OPS_DIR/scripts/issue-crud.sh"
_ops_source "$OPS_DIR/scripts/item-management.sh"
_ops_source "$OPS_DIR/scripts/bulk-operations.sh"
_ops_source "$OPS_DIR/scripts/coordinator.sh"

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
    TITLE="" BODY="" LABEL="" ASSIGNEE=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --title) TITLE="$2"; shift 2 ;;
        --body) BODY="$2"; shift 2 ;;
        --label) LABEL="$2"; shift 2 ;;
        --assignee) ASSIGNEE="$2"; shift 2 ;;
        *) shift ;;
      esac
    done
    echo "Creating issue"
    if type check_gh_installed &>/dev/null; then check_gh_installed; fi
    if type check_gh_authenticated &>/dev/null; then check_gh_authenticated; fi
    create_issue "$TITLE" "$BODY" "$LABEL" "$ASSIGNEE"
    if type detect_scope_change &>/dev/null && [ -n "$LABEL" ]; then
      detect_scope_change "label" "$LABEL" || true
    fi
    ;;
  list)
    FILTER=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --filter) FILTER="$2"; shift 2 ;;
        *) shift ;;
      esac
    done
    echo "Listing issues"
    if type check_gh_installed &>/dev/null; then check_gh_installed; fi
    if type check_gh_authenticated &>/dev/null; then check_gh_authenticated; fi
    list_issues "$FILTER"
    ;;
  update)
    ISSUE="" TITLE="" BODY="" LABEL=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --issue) ISSUE="$2"; shift 2 ;;
        --title) TITLE="$2"; shift 2 ;;
        --body) BODY="$2"; shift 2 ;;
        --label) LABEL="$2"; shift 2 ;;
        *) shift ;;
      esac
    done
    echo "Updating issue"
    if type check_gh_installed &>/dev/null; then check_gh_installed; fi
    if type check_gh_authenticated &>/dev/null; then check_gh_authenticated; fi
    update_issue "$ISSUE" "$TITLE" "$BODY" "$LABEL"
    if type detect_scope_change &>/dev/null && [ -n "$LABEL" ]; then
      detect_scope_change "label" "$LABEL" || true
    fi
    ;;
  delete)
    ISSUE=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --issue) ISSUE="$2"; shift 2 ;;
        *) shift ;;
      esac
    done
    echo "Deleting issue"
    if type check_gh_installed &>/dev/null; then check_gh_installed; fi
    if type check_gh_authenticated &>/dev/null; then check_gh_authenticated; fi
    delete_issue "$ISSUE"
    ;;
  bulk)
    PROJECT="" FROM="" TO="" MODE="status"
    while [ $# -gt 0 ]; do
      case "$1" in
        --project) PROJECT="$2"; shift 2 ;;
        --from) FROM="$2"; shift 2 ;;
        --to) TO="$2"; shift 2 ;;
        --mode) MODE="$2"; shift 2 ;;
        *) shift ;;
      esac
    done
    echo "Bulk operation"
    if type check_gh_installed &>/dev/null; then check_gh_installed; fi
    if type check_gh_authenticated &>/dev/null; then check_gh_authenticated; fi
    case "$MODE" in
      status) bulk_update_status "$PROJECT" "$FROM" "$TO" ;;
      archive) bulk_archive_completed "$PROJECT" ;;
      *) echo "Unknown bulk mode: $MODE" >&2; exit 1 ;;
    esac
    ;;
  add)
    PROJECT="" URL=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --project) PROJECT="$2"; shift 2 ;;
        --url|--issue) URL="$2"; shift 2 ;;
        *) shift ;;
      esac
    done
    echo "Adding to project"
    if type check_gh_installed &>/dev/null; then check_gh_installed; fi
    if type check_gh_authenticated &>/dev/null; then check_gh_authenticated; fi
    add_issue_to_project "$PROJECT" "$URL"
    ;;
  archive)
    PROJECT=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --project) PROJECT="$2"; shift 2 ;;
        *) shift ;;
      esac
    done
    echo "Archiving items"
    if type check_gh_installed &>/dev/null; then check_gh_installed; fi
    if type check_gh_authenticated &>/dev/null; then check_gh_authenticated; fi
    bulk_archive_completed "$PROJECT"
    ;;
  export)
    PROJECT="" OUTPUT=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --project) PROJECT="$2"; shift 2 ;;
        --output) OUTPUT="$2"; shift 2 ;;
        *) shift ;;
      esac
    done
    echo "Exporting project"
    if type check_gh_installed &>/dev/null; then check_gh_installed; fi
    if type check_gh_authenticated &>/dev/null; then check_gh_authenticated; fi
    export_to_csv "$PROJECT" "$OUTPUT"
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
