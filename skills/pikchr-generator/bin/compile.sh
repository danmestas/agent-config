#!/usr/bin/env bash
# compile.sh — compile a .pikchr source to SVG and apply a theme.
# Usage:
#   compile.sh [--theme NAME] <input.pikchr>
#   compile.sh [--theme NAME] --kroki <input.pikchr>
#   compile.sh [--theme NAME] --with-stdlib <input.pikchr>
#   echo 'box "hi"' | compile.sh [--theme NAME] -
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
THEMEIZE="$SKILL_DIR/lib/themeize.sh"

USE_KROKI=0
WITH_STDLIB=0
THEME="default"
INPUT=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --kroki)        USE_KROKI=1; shift ;;
    --with-stdlib)  WITH_STDLIB=1; shift ;;
    --theme)
      [[ $# -ge 2 ]] || { echo "ERROR: --theme requires a value" >&2; exit 2; }
      THEME="$2"; shift 2 ;;
    -h|--help)      sed -n '2,7p' "$0" | sed 's/^# *//'; exit 0 ;;
    -)              INPUT="-"; shift ;;
    *)
      if [[ -z "$INPUT" ]]; then INPUT="$1"; shift
      else echo "ERROR: unexpected arg '$1'" >&2; exit 2; fi ;;
  esac
done

if [[ -z "$INPUT" ]]; then
  echo "ERROR: no input file (or '-' for stdin)" >&2
  exit 2
fi

# Read source
if [[ "$INPUT" == "-" ]]; then
  SRC="$(cat)"
else
  [[ -f "$INPUT" ]] || { echo "ERROR: input '$INPUT' not found" >&2; exit 2; }
  SRC="$(cat "$INPUT")"
fi

# Optionally prepend stdlib
if [[ $WITH_STDLIB -eq 1 ]]; then
  STDLIB="$SKILL_DIR/lib/stdlib.pikchr"
  [[ -f "$STDLIB" ]] || { echo "ERROR: stdlib not found at $STDLIB" >&2; exit 2; }
  SRC="$(cat "$STDLIB")"$'\n'"$SRC"
fi

run_themeize() {
  bash "$THEMEIZE" --theme "$THEME"
}

# Local path
LOCAL_BIN="$SCRIPT_DIR/pikchr"
if [[ $USE_KROKI -eq 0 && -x "$LOCAL_BIN" ]]; then
  set +e
  OUT="$(printf '%s' "$SRC" | "$LOCAL_BIN" --svg-only - 2>&1)"
  PIKCHR_EXIT=$?
  set -e
  if [[ $PIKCHR_EXIT -ne 0 ]] || printf '%s' "$OUT" | grep -q '^ERROR:'; then
    printf '%s\n' "$OUT" >&2
    exit 1
  fi
  printf '%s\n' "$OUT" | run_themeize
  exit 0
fi

# Kroki fallback
KROKI_URL="${KROKI_URL:-https://kroki.io/pikchr/svg}"
command -v curl >/dev/null 2>&1 || { echo "ERROR: curl required" >&2; exit 4; }

resp_file=""
trap '[[ -n "${resp_file:-}" ]] && rm -f "$resp_file"' EXIT
resp_file="$(mktemp)"

set +e
http_code="$(printf '%s' "$SRC" | curl -sS -X POST \
  -H 'Content-Type: text/plain' --data-binary @- \
  -o "$resp_file" -w '%{http_code}' \
  --connect-timeout 15 --max-time 30 \
  "$KROKI_URL")"
curl_rc=$?
set -e

if [[ $curl_rc -ne 0 || -z "$http_code" ]]; then
  echo "ERROR: could not reach Kroki at $KROKI_URL (curl exit $curl_rc)" >&2
  exit 5
fi
if [[ "$http_code" != "200" ]]; then
  echo "ERROR: Kroki returned HTTP $http_code" >&2
  cat "$resp_file" >&2
  exit 5
fi
run_themeize < "$resp_file"
