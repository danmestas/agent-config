#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"
cd "$(dirname "$0")/.."

# Skip if no network
if ! curl -fsS --max-time 3 -o /dev/null https://kroki.io/health 2>/dev/null; then
  echo "SKIP: kroki.io unreachable; skipping HTTP fallback test"
  exit 0
fi

# Force kroki path
output="$(bin/compile.sh --kroki test/fixtures/hello.pikchr)"
assert_contains "$output" "<svg" "kroki should return SVG"

# Auto-fallback path: rename local binary, ensure compile.sh falls through to kroki
if [[ -x bin/pikchr ]]; then
  trap 'mv -f bin/pikchr.bak bin/pikchr 2>/dev/null || true' EXIT
  mv bin/pikchr bin/pikchr.bak
fi
output2="$(bin/compile.sh test/fixtures/hello.pikchr)"
assert_contains "$output2" "<svg" "auto-fallback should produce SVG"
