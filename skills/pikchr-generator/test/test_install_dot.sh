#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"
cd "$(dirname "$0")/.."

# Run the installer — if it succeeds, bin/dot must be executable OR
# point to a system-installed dot (we symlink on macOS/Linux when brew/apt
# did the work in a system location).
bash bin/install-dot.sh || { echo "install-dot.sh exited non-zero"; exit 1; }

# Installer must have produced bin/dot (either as symlink to system dot,
# or as a locally-installed binary). A plain "command -v dot" is not sufficient
# — that would pass even when the installer did nothing.
if [[ ! -x bin/dot ]]; then
  echo "FAIL: bin/dot missing or not executable after install-dot.sh"; exit 1
fi
DOT="./bin/dot"

out="$(echo 'digraph { a -> b }' | "$DOT" -Tsvg 2>&1)"
assert_contains "$out" "<svg" "dot produces SVG"
