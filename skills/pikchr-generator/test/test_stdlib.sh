#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"
cd "$(dirname "$0")/.."

assert_file_exists lib/stdlib.pikchr

# Each macro must compile when invoked
for macro in db cloud actor queue lambda datastore decision note; do
  out="$(echo "${macro}(\"X\")" | bin/compile.sh --with-stdlib -)" || {
    echo "FAIL: macro '$macro' did not compile" >&2
    exit 1
  }
  assert_contains "$out" "<svg" "$macro should produce SVG"
  # Result must contain the label text "X"
  assert_contains "$out" ">X<" "$macro should render label 'X'"
done

# A combined diagram exercising all macros
combined='
right
db("Users"); arrow
lambda("AuthFn"); arrow
queue("Events"); arrow
cloud("S3")
'
out="$(echo "$combined" | bin/compile.sh --with-stdlib -)"
assert_contains "$out" "<svg" "combined macro diagram should compile"
