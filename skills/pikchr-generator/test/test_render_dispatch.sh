#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"
cd "$(dirname "$0")/.."

# Ensure each engine's fixture routes to the right compile script.

# pikchr
out_p="$(bash bin/render.sh --theme nord test/fixtures/hello.pikchr 2>/dev/null || true)"
assert_contains "$out_p" "<svg" "pikchr auto-dispatch"
assert_contains "$out_p" "--bg:#2e3440" "pikchr theme propagated through dispatcher"

# dot
out_d="$(bash bin/render.sh --theme github-dark test/fixtures/hello.dot)"
assert_contains "$out_d" "<svg" "dot auto-dispatch"
assert_contains "$out_d" "--bg:#0d1117" "dot theme propagated"

# d2 (if installed)
if [[ -x bin/d2 ]] || command -v d2 >/dev/null 2>&1; then
  out_d2="$(bash bin/render.sh --theme dracula test/fixtures/hello.d2)"
  assert_contains "$out_d2" "<svg" "d2 auto-dispatch"
  assert_contains "$out_d2" "--bg:#282a36" "d2 theme propagated"
fi

# mermaid (if installed)
if [[ -d bin/node_modules/beautiful-mermaid ]]; then
  out_m="$(bash bin/render.sh --theme catppuccin test/fixtures/hello.mmd)"
  assert_contains "$out_m" "<svg" "mermaid auto-dispatch"
  assert_contains "$out_m" "--bg:#1e1e2e" "mermaid theme propagated"
fi

# --engine override beats extension detection
out_ovr="$(echo 'box "x"' | bash bin/render.sh --engine pikchr --theme solar-dark -)"
assert_contains "$out_ovr" "--bg:#002b36" "engine override with stdin"

# Unknown extension errors
if bash bin/render.sh test/fixtures/hello.txt 2>/dev/null; then
  echo "FAIL: expected error for unknown extension"; exit 1
fi

echo "render dispatch OK"
