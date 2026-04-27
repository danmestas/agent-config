#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"

cd "$(dirname "$0")/.."

# Clean any prior install
rm -f bin/pikchr

# Run installer
bash bin/install-pikchr.sh

# Verify binary exists and is executable
assert_file_exists bin/pikchr
[[ -x bin/pikchr ]] || { echo "FAIL: bin/pikchr is not executable"; exit 1; }

# Verify it can compile a trivial input
output="$(echo 'box "hi"' | bin/pikchr - 2>&1)"
assert_contains "$output" "<svg" "binary should output SVG"
