#!/usr/bin/env bash
# compile-dot.sh — compile a .dot source to themed SVG.
# Usage:
#   compile-dot.sh [--theme NAME] [--with-stdlib] <input.dot>
#   echo 'digraph { a -> b }' | compile-dot.sh [--theme NAME] [--with-stdlib] -
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
THEMEIZE="$SKILL_DIR/lib/themeize.sh"

WITH_STDLIB=0
THEME="default"
INPUT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --with-stdlib)  WITH_STDLIB=1; shift ;;
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

# Locate dot: prefer bin/dot symlink, fall back to PATH.
DOT_BIN="$SCRIPT_DIR/dot"
if [[ ! -x "$DOT_BIN" ]]; then
  if command -v dot >/dev/null 2>&1; then
    DOT_BIN="$(command -v dot)"
  else
    echo "ERROR: dot not found. Run: bash $SCRIPT_DIR/install-dot.sh" >&2
    exit 3
  fi
fi

# Read source
if [[ "$INPUT" == "-" ]]; then SRC="$(cat)"
else [[ -f "$INPUT" ]] || { echo "ERROR: input '$INPUT' not found" >&2; exit 2; }
     SRC="$(cat "$INPUT")"
fi

# Inject stdlib attributes immediately after the `{` that opens the user's
# top-level graph. We match the opener via regex (handling `strict`, optional
# name, and keyword/brace on separate lines) so that `{` characters inside
# pre-graph comments don't trick us. Stdlib is loaded via getline since BSD
# awk rejects literal newlines in -v assignments.
if [[ $WITH_STDLIB -eq 1 ]]; then
  STDLIB="$SKILL_DIR/lib/stdlib.dot"
  [[ -f "$STDLIB" ]] || { echo "ERROR: stdlib-dot not found at $STDLIB" >&2; exit 2; }
  SRC="$(printf '%s' "$SRC" | awk -v stdlib_path="$STDLIB" '
    BEGIN {
      injected = 0
      saw_graph_kw = 0
      stdlib = ""
      while ((getline line < stdlib_path) > 0) {
        stdlib = (stdlib == "") ? line : stdlib "\n" line
      }
      close(stdlib_path)
    }
    {
      if (!injected) {
        if (!saw_graph_kw && match($0, /(strict[[:space:]]+)?(di)?graph([[:space:]]+([A-Za-z_][A-Za-z0-9_]*|"[^"]*"))?[[:space:]]*\{?/)) {
          saw_graph_kw = 1
        }
        if (saw_graph_kw && match($0, /\{/)) {
          idx = index($0, "{")
          pre = substr($0, 1, idx)
          post = substr($0, idx + 1)
          printf "%s\n%s\n%s\n", pre, stdlib, post
          injected = 1
          next
        }
      }
      print
    }
  ')"
fi

# Run dot and pipe through themeize. Capture stderr separately so any
# warnings don't pollute the SVG on stdout.
ERR_FILE="$(mktemp)"
trap 'rm -f "$ERR_FILE"' EXIT

set +e
OUT="$(printf '%s' "$SRC" | "$DOT_BIN" -Tsvg 2>"$ERR_FILE")"
RC=$?
set -e

if [[ $RC -ne 0 ]]; then
  echo "ERROR: dot failed (exit $RC):" >&2
  cat "$ERR_FILE" >&2
  exit 1
fi
# Forward any warnings to caller's stderr but keep SVG clean.
[[ -s "$ERR_FILE" ]] && cat "$ERR_FILE" >&2
printf '%s\n' "$OUT" | bash "$THEMEIZE" --theme "$THEME"
