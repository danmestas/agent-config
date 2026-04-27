#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"
cd "$(dirname "$0")/.."

bash bin/install-d2.sh || { echo "install-d2.sh failed"; exit 1; }

[[ -x bin/d2 ]] || { echo "FAIL: bin/d2 not created by install-d2.sh"; exit 1; }
D2="./bin/d2"

out="$(echo 'a -> b' | "$D2" - -)"
assert_contains "$out" "<svg" "d2 produces SVG"
