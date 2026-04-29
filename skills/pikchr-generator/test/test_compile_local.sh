#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"
cd "$(dirname "$0")/.."

# Happy path: hello.pikchr compiles to SVG containing currentColor
output="$(bin/compile.sh test/fixtures/hello.pikchr)"
assert_contains "$output" "<svg" "should produce SVG root"
assert_contains "$output" "currentColor" "should use currentColor (from -C flag)"

# Should NOT contain 'rgb(0,0,0)' — pikchr emits this without -C
if printf '%s' "$output" | grep -q 'rgb(0,0,0)'; then
  echo "FAIL: SVG contains rgb(0,0,0) — -C flag was not applied" >&2
  exit 1
fi

# Error path: broken.pikchr should exit non-zero and print to stderr
if bin/compile.sh test/fixtures/broken.pikchr 2>/tmp/pikchr-err-$$.log; then
  echo "FAIL: broken.pikchr should have exited non-zero" >&2
  exit 1
fi
if [[ ! -s /tmp/pikchr-err-$$.log ]]; then
  echo "FAIL: broken.pikchr should have produced stderr output" >&2
  exit 1
fi
rm -f /tmp/pikchr-err-$$.log

# A4: --theme flag piped through themeize.sh
out="$(echo 'box "hi"' | bin/compile.sh --theme tokyo-night -)"
assert_contains "$out" "background:#1a1b26" "compile.sh --theme tokyo-night injects tokyo-night bg"
assert_contains "$out" "currentColor" "compile.sh keeps rgb(0,0,0) -> currentColor path"
out_default="$(echo 'box "hi"' | bin/compile.sh -)"
assert_contains "$out_default" "background:#18181B" "compile.sh without --theme uses default theme"
