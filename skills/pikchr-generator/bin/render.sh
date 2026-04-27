#!/usr/bin/env bash
# render.sh — universal dispatcher for pikchr / dot / d2 / mermaid.
# Detects engine from file extension (or explicit --engine NAME).
# Usage:
#   render.sh [--engine pikchr|dot|d2|mermaid] [--theme NAME] [--with-stdlib] <input>
#   render.sh [--engine NAME] [--theme NAME] -   # stdin
# Output: SVG to stdout.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ENGINE=""
THEME="default"
WITH_STDLIB=0
INPUT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --engine)
      [[ $# -ge 2 ]] || { echo "ERROR: --engine requires a value" >&2; exit 2; }
      ENGINE="$2"; shift 2 ;;
    --theme)
      [[ $# -ge 2 ]] || { echo "ERROR: --theme requires a value" >&2; exit 2; }
      THEME="$2"; shift 2 ;;
    --with-stdlib)  WITH_STDLIB=1; shift ;;
    -h|--help)      sed -n '2,7p' "$0" | sed 's/^# *//'; exit 0 ;;
    -)              INPUT="-"; shift ;;
    *)
      if [[ -z "$INPUT" ]]; then INPUT="$1"; shift
      else echo "ERROR: unexpected arg '$1'" >&2; exit 2; fi ;;
  esac
done

[[ -n "$INPUT" ]] || { echo "ERROR: no input file (or '-' for stdin)" >&2; exit 2; }

# Auto-detect engine from extension if --engine not given.
if [[ -z "$ENGINE" ]]; then
  if [[ "$INPUT" == "-" ]]; then
    echo "ERROR: --engine required when reading from stdin" >&2; exit 2
  fi
  case "$INPUT" in
    *.pikchr) ENGINE="pikchr" ;;
    *.dot|*.gv) ENGINE="dot" ;;
    *.d2) ENGINE="d2" ;;
    *.mmd|*.mermaid) ENGINE="mermaid" ;;
    *) echo "ERROR: cannot auto-detect engine from '$INPUT'; pass --engine" >&2; exit 2 ;;
  esac
fi

# Unquoted $STDLIB_FLAG below is intentional: when empty, word-splitting on an
# empty expansion is benign and simpler than juggling an optional array under
# `set -u` (empty-array expansion on bash 3.2 needs the ${ARR[@]+...} dance).
STDLIB_FLAG=""
[[ $WITH_STDLIB -eq 1 ]] && STDLIB_FLAG="--with-stdlib"

case "$ENGINE" in
  pikchr)
    exec bash "$SCRIPT_DIR/compile.sh" $STDLIB_FLAG --theme "$THEME" "$INPUT"
    ;;
  dot)
    exec bash "$SCRIPT_DIR/compile-dot.sh" $STDLIB_FLAG --theme "$THEME" "$INPUT"
    ;;
  d2)
    # d2 has no --with-stdlib concept; the flag is silently ignored.
    exec bash "$SCRIPT_DIR/compile-d2.sh" --theme "$THEME" "$INPUT"
    ;;
  mermaid)
    # mermaid has no --with-stdlib concept; the flag is silently ignored.
    exec bash "$SCRIPT_DIR/compile-mermaid.sh" --theme "$THEME" "$INPUT"
    ;;
  *)
    echo "ERROR: unknown engine '$ENGINE' (want pikchr|dot|d2|mermaid)" >&2
    exit 2
    ;;
esac
