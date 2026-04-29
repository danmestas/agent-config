#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"
cd "$(dirname "$0")/.."

THEMEIZE="lib/themeize.sh"
assert_file_exists "$THEMEIZE"
[[ -x "$THEMEIZE" ]] || { echo "FAIL: $THEMEIZE not executable"; exit 1; }

MINIMAL_SVG='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect x="0" y="0" width="10" height="10" fill="#010203"/><text x="5" y="5" fill="#0a0b0c">hi</text><line x1="0" y1="0" x2="10" y2="10" stroke="#101112"/><circle cx="5" cy="5" r="2" fill="#202122"/></svg>'

# 1. Every theme in themes.json should apply cleanly (exit 0, non-empty SVG).
# Prefer node; fall back to python3 for JSON-key listing.
if command -v node >/dev/null 2>&1; then
  THEMES=$(node -e "console.log(Object.keys(JSON.parse(require('fs').readFileSync('lib/themes.json','utf8'))).join(' '))")
elif command -v python3 >/dev/null 2>&1; then
  THEMES=$(python3 -c "import json; print(' '.join(json.load(open('lib/themes.json')).keys()))")
else
  THEMES="default zinc-light zinc-dark tokyo-night tokyo-storm tokyo-light catppuccin latte nord nord-light dracula github github-dark solarized solar-dark one-dark cursor-dark"
fi

count=0
for theme in $THEMES; do
  out="$(printf '%s' "$MINIMAL_SVG" | bash "$THEMEIZE" --theme "$theme")"
  assert_contains "$out" "<svg" "$theme: has <svg>"
  assert_contains "$out" "<style>" "$theme: style block injected"
  assert_contains "$out" "background:#" "$theme: background declared as concrete hex"
  assert_contains "$out" "color:#" "$theme: color declared as concrete hex"
  assert_contains "$out" "font-family" "$theme: font-family injected"
  # Output must be self-contained — no CSS vars, no color-mix() — so the SVG
  # renders identically in librsvg / ImageMagick / kitten icat / GitHub preview.
  if printf '%s' "$out" | grep -q 'var(--'; then
    echo "FAIL: $theme: output contains var(--*) — must be resolved to concrete hex"; exit 1
  fi
  if printf '%s' "$out" | grep -q 'color-mix'; then
    echo "FAIL: $theme: output contains color-mix() — must be resolved to concrete hex"; exit 1
  fi
  count=$((count + 1))
done

# Should have processed at least 16 themes
if (( count < 16 )); then
  echo "FAIL: expected >= 16 themes, processed $count"; exit 1
fi

# 2. Missing-token derivation: tokyo-night doesn't set `surface` or `border`,
# so themeize derives them via sRGB mix(fg, bg, pct). The output must be
# self-contained hex (no var(), no color-mix()).
out_tokyo="$(printf '%s' "$MINIMAL_SVG" | bash "$THEMEIZE" --theme tokyo-night)"
if printf '%s' "$out_tokyo" | grep -qE 'var\(--|color-mix'; then
  echo "FAIL: tokyo-night derivation left unresolved tokens"; exit 1
fi

# 3. Unknown theme falls back to default (with a warning to stderr).
out_err=$(mktemp)
out_unknown="$(printf '%s' "$MINIMAL_SVG" | bash "$THEMEIZE" --theme does-not-exist 2>"$out_err")"
assert_contains "$out_unknown" "background:#18181B" "unknown theme falls back to default bg"
assert_contains "$(cat "$out_err")" "falling back to 'default'" "warning printed to stderr"
rm -f "$out_err"

# 4. Cursor-dark (custom theme): all 7 tokens set, none derived.
out_cursor="$(printf '%s' "$MINIMAL_SVG" | bash "$THEMEIZE" --theme cursor-dark)"
assert_contains "$out_cursor" "background:#1e1e1e" "cursor-dark bg in style block"
assert_contains "$out_cursor" "color:#d4d4d4" "cursor-dark fg in style block"
# Accent (#007acc) is baked into every sentinel-accent fill (#202122 in the
# input MINIMAL_SVG becomes #007acc in the output).
assert_contains "$out_cursor" "#007acc" "cursor-dark accent baked into sentinel fills"

echo "themeize OK"
