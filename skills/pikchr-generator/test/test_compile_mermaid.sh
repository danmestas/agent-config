#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"
cd "$(dirname "$0")/.."

# Requires install-mermaid.sh has been run.
[[ -d bin/node_modules/beautiful-mermaid ]] || bash bin/install-mermaid.sh

out="$(bash bin/compile-mermaid.sh --theme tokyo-night test/fixtures/hello.mmd)"
assert_contains "$out" "<svg" "mermaid produces SVG"
assert_contains "$out" "--bg:#1a1b26" "mermaid applies tokyo-night theme"
assert_contains "$out" "Start" "mermaid preserves labels"

# Default theme
out_def="$(bash bin/compile-mermaid.sh test/fixtures/hello.mmd)"
assert_contains "$out_def" "--bg:#18181B" "mermaid default theme is zinc-dark"

# Custom theme not in beautiful-mermaid (cursor-dark) works via raw colors
out_cursor="$(bash bin/compile-mermaid.sh --theme cursor-dark test/fixtures/hello.mmd)"
assert_contains "$out_cursor" "--bg:#1e1e1e" "mermaid cursor-dark theme applied"

# Stdin (beautiful-mermaid needs newline-separated statements, not semicolons)
out_stdin="$(printf 'graph TD\nA-->B\n' | bash bin/compile-mermaid.sh -)"
assert_contains "$out_stdin" "<svg" "mermaid compile from stdin"

echo "mermaid compile OK"
