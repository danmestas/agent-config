#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"
cd "$(dirname "$0")/.."

EXPECTED=(flowchart sequence architecture state-machine data-pipeline swim-lane)

for name in "${EXPECTED[@]}"; do
  path="templates/${name}.pikchr"
  assert_file_exists "$path"
  out="$(bin/compile.sh --with-stdlib "$path")" || {
    echo "FAIL: template '$name' did not compile" >&2
    exit 1
  }
  assert_contains "$out" "<svg" "$name should produce SVG"
  # Output must be > 500 bytes (a non-trivial diagram)
  size=${#out}
  if [[ $size -lt 500 ]]; then
    echo "FAIL: template '$name' SVG suspiciously small ($size bytes)" >&2
    exit 1
  fi
done
