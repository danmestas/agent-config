#!/usr/bin/env bash
# test_e2e.sh — end-to-end check that compile.sh produces distinct themed SVGs
# across different themes, with --with-stdlib plumbed through.
set -euo pipefail
source "$(dirname "$0")/lib.sh"
cd "$(dirname "$0")/.."

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

template="templates/architecture.pikchr"
assert_file_exists "$template"

for theme in default tokyo-night dracula; do
  out="$WORK/$theme.svg"
  bin/compile.sh --with-stdlib --theme "$theme" "$template" > "$out"
  content="$(cat "$out")"
  assert_contains "$content" "<svg" "$theme: SVG emitted"
  assert_contains "$content" "</svg>" "$theme: SVG closed"
  assert_contains "$content" "background:#" "$theme: themeize style block applied with concrete hex"
  shasum -a 256 "$out" >> "$WORK/hashes.txt"
done

uniq_hashes=$(awk '{print $1}' "$WORK/hashes.txt" | sort -u | wc -l)
if [[ $uniq_hashes -ne 3 ]]; then
  echo "FAIL: expected 3 distinct outputs, got $uniq_hashes" >&2
  exit 1
fi

echo "E2E OK"
