#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"
cd "$(dirname "$0")/.."

for css in assets/css/neutral.css assets/css/blueprint.css assets/css/warm.css; do
  assert_file_exists "$css"
  content="$(cat "$css")"
  # Each palette must define light defaults on a CSS var scope
  assert_contains "$content" ":root" "$css missing :root scope"
  # And a dark variant via prefers-color-scheme
  assert_contains "$content" "prefers-color-scheme: dark" "$css missing media query"
  # And a manual data-theme override
  assert_contains "$content" '[data-theme="dark"]' "$css missing [data-theme=\"dark\"]"
  # And a .pikchr scope so it only colors compiled SVGs
  assert_contains "$content" ".pikchr" "$css missing .pikchr scope"
done
