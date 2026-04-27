#!/usr/bin/env bash
# compile-mermaid.sh — compile a .mmd source to themed SVG via beautiful-mermaid.
# Usage:
#   compile-mermaid.sh [--theme NAME] <input.mmd>
#   echo 'graph TD; A-->B' | compile-mermaid.sh [--theme NAME] -
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"

THEME="default"
INPUT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --theme)
      [[ $# -ge 2 ]] || { echo "ERROR: --theme requires a value" >&2; exit 2; }
      THEME="$2"; shift 2 ;;
    -h|--help)      sed -n '2,5p' "$0" | sed 's/^# *//'; exit 0 ;;
    -)              INPUT="-"; shift ;;
    *)
      if [[ -z "$INPUT" ]]; then INPUT="$1"; shift
      else echo "ERROR: unexpected arg '$1'" >&2; exit 2; fi ;;
  esac
done

[[ -n "$INPUT" ]] || { echo "ERROR: no input file (or '-' for stdin)" >&2; exit 2; }

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node not on PATH. Run: bash $SCRIPT_DIR/install-mermaid.sh (which checks for Node)" >&2
  exit 3
fi
if [[ ! -d "$SCRIPT_DIR/node_modules/beautiful-mermaid" ]]; then
  echo "ERROR: beautiful-mermaid not installed. Run: bash $SCRIPT_DIR/install-mermaid.sh" >&2
  exit 3
fi

if [[ "$INPUT" == "-" ]]; then
  THEME="$THEME" node "$SCRIPT_DIR/compile-mermaid.js"
else
  [[ -f "$INPUT" ]] || { echo "ERROR: input '$INPUT' not found" >&2; exit 2; }
  THEME="$THEME" node "$SCRIPT_DIR/compile-mermaid.js" < "$INPUT"
fi
