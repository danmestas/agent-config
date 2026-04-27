#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"
cd "$(dirname "$0")/.."

# Clean any prior install
rm -rf bin/node_modules bin/package.json bin/package-lock.json

bash bin/install-mermaid.sh || { echo "install-mermaid.sh failed"; exit 1; }

assert_file_exists bin/node_modules/beautiful-mermaid/package.json
assert_file_exists bin/node_modules/elkjs/package.json
assert_file_exists bin/node_modules/entities/package.json

# Verify version pin
ver="$(node -e "console.log(require('./bin/node_modules/beautiful-mermaid/package.json').version)")"
[[ "$ver" == "1.1.3" ]] || { echo "FAIL: expected beautiful-mermaid 1.1.3, got $ver"; exit 1; }

echo "install-mermaid OK"
