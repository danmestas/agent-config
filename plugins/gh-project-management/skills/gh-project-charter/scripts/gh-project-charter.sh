#!/bin/bash
# skills/gh-project-charter/scripts/gh-project-charter.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Safe source that won't fail with set -e
_safe_source() { source "$1" 2>/dev/null || true; }
_safe_source "$SCRIPT_DIR/../gh-project-shared/scripts/gh-check.sh"
_safe_source "$SCRIPT_DIR/../gh-project-shared/scripts/gh-auth.sh"
_safe_source "$SCRIPT_DIR/scripts/charter-create.sh"
_safe_source "$SCRIPT_DIR/scripts/charter-sections.sh"

show_help() {
  cat <<EOF
Usage: gh-project-charter.sh <command> [options]

Commands:
  create           Create a new project charter
  update-section   Update a charter section
  add-section      Add a new section to the charter
  log-change       Add a change log entry
  view             View the current charter

Options:
  --help           Show this help message

Examples:
  gh-project-charter.sh create --project "My Project" --number 1 --goals "Build a CLI tool"
  gh-project-charter.sh update-section "Goals" --replace "New goals text"
  gh-project-charter.sh update-section "In Scope" --append "- New deliverable"
  gh-project-charter.sh add-section "Timeline" --content "Q1: Phase 1"
  gh-project-charter.sh log-change "Updated scope to include API"
  gh-project-charter.sh view
EOF
}

COMMAND="${1:-}"
shift || true

case "$COMMAND" in
  create)
    PROJECT="" NUMBER="" GOALS=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --project) PROJECT="$2"; shift 2 ;;
        --number) NUMBER="$2"; shift 2 ;;
        --goals) GOALS="$2"; shift 2 ;;
        *) shift ;;
      esac
    done
    echo "Generating charter"
    generate_charter "$PROJECT" "$NUMBER" "$GOALS"
    ;;
  update-section)
    SECTION="${1:-}"; shift || true
    MODE="" CONTENT=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --replace) MODE="replace"; CONTENT="$2"; shift 2 ;;
        --append) MODE="append"; CONTENT="$2"; shift 2 ;;
        *) shift ;;
      esac
    done
    CHARTER_FILE="${CHARTER_FILE:-docs/project-charter.md}"
    if [ "$MODE" = "replace" ]; then
      echo "Updating section: $SECTION"
      update_section "$CHARTER_FILE" "$SECTION" "$CONTENT"
    elif [ "$MODE" = "append" ]; then
      echo "Appending to section: $SECTION"
      add_to_section "$CHARTER_FILE" "$SECTION" "$CONTENT"
    else
      echo "ERROR: Specify --replace or --append" >&2
      exit 1
    fi
    ;;
  add-section)
    SECTION="${1:-}"; shift || true
    CONTENT=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --content) CONTENT="$2"; shift 2 ;;
        *) shift ;;
      esac
    done
    echo "Adding section: $SECTION"
    CHARTER_FILE="${CHARTER_FILE:-docs/project-charter.md}"
    add_new_section "$CHARTER_FILE" "$SECTION" "$CONTENT"
    ;;
  log-change)
    MESSAGE="${1:-}"
    CHARTER_FILE="${CHARTER_FILE:-docs/project-charter.md}"
    echo "Logged change: $MESSAGE"
    add_changelog_entry "$CHARTER_FILE" "$MESSAGE"
    ;;
  view)
    CHARTER_FILE="${CHARTER_FILE:-docs/project-charter.md}"
    echo "Viewing charter"
    if [ -f "$CHARTER_FILE" ]; then
      cat "$CHARTER_FILE"
    else
      echo "No charter found at $CHARTER_FILE" >&2
      exit 1
    fi
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
