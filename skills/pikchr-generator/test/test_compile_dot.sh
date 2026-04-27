#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"
cd "$(dirname "$0")/.."

# Compile without stdlib
out="$(bash bin/compile-dot.sh test/fixtures/hello.dot)"
assert_contains "$out" "<svg" "dot compile produces SVG"
assert_contains "$out" "--bg:" "dot output is themed (style block present)"
assert_contains "$out" "Alpha" "dot preserves labels"

# Compile with stdlib + theme flag
out_themed="$(bash bin/compile-dot.sh --with-stdlib --theme tokyo-night test/fixtures/hello.dot)"
assert_contains "$out_themed" "--bg:#1a1b26" "dot --theme tokyo-night applies theme"

# Stdin path
out_stdin="$(echo 'digraph { x -> y }' | bash bin/compile-dot.sh -)"
assert_contains "$out_stdin" "<svg" "dot compile from stdin"

echo "dot compile OK"
