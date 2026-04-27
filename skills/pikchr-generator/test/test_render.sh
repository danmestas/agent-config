#!/usr/bin/env bash
# test_render.sh — exercise the unified dispatcher in bin/render.sh.
# render.sh now outputs SVG directly (HTML wrapping is deferred to a
# separate follow-up). This test verifies engine auto-detection from file
# extensions, explicit --engine override, --theme plumbing, and clean
# errors for bad inputs.
set -euo pipefail
source "$(dirname "$0")/lib.sh"
cd "$(dirname "$0")/.."

# --- Auto-detect pikchr from .pikchr extension ---
svg_pikchr="$(bin/render.sh test/fixtures/hello.pikchr)"
assert_contains "$svg_pikchr" "<svg" "pikchr auto-detect should emit SVG"
assert_contains "$svg_pikchr" "</svg>" "pikchr SVG should close"

# --- Auto-detect dot from .dot extension ---
svg_dot="$(bin/render.sh test/fixtures/hello.dot)"
assert_contains "$svg_dot" "<svg" "dot auto-detect should emit SVG"
assert_contains "$svg_dot" "</svg>" "dot SVG should close"

# --- Theme is propagated to the compile wrapper (tokyo-night has a known bg) ---
svg_themed="$(bin/render.sh --theme tokyo-night test/fixtures/hello.pikchr)"
assert_contains "$svg_themed" "--bg:" "themed output should include themeize style block"

# --- Explicit --engine override beats extension ---
# Feed a pikchr source through an arbitrary filename using stdin + --engine.
svg_stdin="$(printf 'box "hi"\n' | bin/render.sh --engine pikchr -)"
assert_contains "$svg_stdin" "<svg" "stdin + --engine pikchr should emit SVG"

# --- Stdin without --engine must error (can't detect from '-') ---
if printf 'box "x"\n' | bin/render.sh - 2>/dev/null; then
  echo "FAIL: stdin without --engine should exit non-zero" >&2
  exit 1
fi

# --- Unknown extension must error cleanly ---
tmp="$(mktemp).unknownext"
printf 'box "hi"\n' > "$tmp"
if bin/render.sh "$tmp" 2>/dev/null; then
  echo "FAIL: unknown extension should exit non-zero" >&2
  rm -f "$tmp"
  exit 1
fi
rm -f "$tmp"

# --- Unknown engine name must error ---
if bin/render.sh --engine notarealengine test/fixtures/hello.pikchr 2>/dev/null; then
  echo "FAIL: unknown engine should exit non-zero" >&2
  exit 1
fi

# --- Missing value for --engine must error (guards against set -u crash) ---
if bin/render.sh --engine 2>/dev/null; then
  echo "FAIL: --engine with no value should exit non-zero" >&2
  exit 1
fi

# --- Missing value for --theme must error ---
if bin/render.sh --theme 2>/dev/null; then
  echo "FAIL: --theme with no value should exit non-zero" >&2
  exit 1
fi
