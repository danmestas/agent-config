#!/usr/bin/env bash
# compile-d2.sh — compile a .d2 source to themed SVG.
# Usage:
#   compile-d2.sh [--theme NAME] <input.d2>
#   echo 'a -> b' | compile-d2.sh [--theme NAME] -
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
THEMEIZE="$SKILL_DIR/lib/themeize.sh"

THEME="default"
INPUT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --theme)
      [[ $# -ge 2 ]] || { echo "ERROR: --theme requires a value" >&2; exit 2; }
      THEME="$2"; shift 2 ;;
    -h|--help) sed -n '2,5p' "$0" | sed 's/^# *//'; exit 0 ;;
    -)         INPUT="-"; shift ;;
    *)
      if [[ -z "$INPUT" ]]; then INPUT="$1"; shift
      else echo "ERROR: unexpected arg '$1'" >&2; exit 2; fi ;;
  esac
done

[[ -n "$INPUT" ]] || { echo "ERROR: no input file (or '-' for stdin)" >&2; exit 2; }

# Locate d2: prefer bin/d2 symlink, fall back to PATH.
D2_BIN="$SCRIPT_DIR/d2"
if [[ ! -x "$D2_BIN" ]]; then
  if command -v d2 >/dev/null 2>&1; then
    D2_BIN="$(command -v d2)"
  else
    echo "ERROR: d2 not found. Run: bash $SCRIPT_DIR/install-d2.sh" >&2
    exit 3
  fi
fi

# Read source
if [[ "$INPUT" == "-" ]]; then SRC="$(cat)"
else [[ -f "$INPUT" ]] || { echo "ERROR: input '$INPUT' not found" >&2; exit 2; }
     SRC="$(cat "$INPUT")"
fi

# Run d2 and pipe through themeize. Capture stderr separately so any
# warnings don't pollute the SVG on stdout.
# `d2 - -` reads from stdin, writes SVG to stdout.
# --theme=0 (default light) — themeize.sh overrides colors via CSS.
# --layout=dagre is the single-binary layout engine (elk needs a JS runtime).
ERR_FILE="$(mktemp)"
trap 'rm -f "$ERR_FILE"' EXIT

set +e
OUT="$(printf '%s' "$SRC" | "$D2_BIN" --layout=dagre --theme=0 - - 2>"$ERR_FILE")"
RC=$?
set -e

if [[ $RC -ne 0 ]]; then
  echo "ERROR: d2 failed (exit $RC):" >&2
  cat "$ERR_FILE" >&2
  exit 1
fi
# Forward any warnings to caller's stderr but keep SVG clean.
[[ -s "$ERR_FILE" ]] && cat "$ERR_FILE" >&2

# d2 draws an opaque white canvas rect (class="fill-N7") that blocks the
# themed --bg. Make it transparent so our CSS background shows through.
printf '%s\n' "$OUT" \
  | sed -E 's/(<rect[^>]* )fill="#FFFFFF"([^>]*class="[^"]*fill-N7[^"]*")/\1fill="transparent"\2/' \
  | bash "$THEMEIZE" --theme "$THEME"
