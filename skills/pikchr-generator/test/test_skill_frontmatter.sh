#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"
cd "$(dirname "$0")/.."

assert_file_exists SKILL.md

# Frontmatter is the block between the first two '---' lines
fm="$(awk '/^---$/{c++; if(c==2) exit; next} c==1' SKILL.md)"

assert_contains "$fm" "name:" "frontmatter must have 'name'"
assert_contains "$fm" "description:" "frontmatter must have 'description'"
assert_contains "$fm" "name: pikchr-generator" "name must be 'pikchr-generator'"

# Description must be substantive (>200 chars) so the trigger logic can match
desc_line_count="$(printf '%s\n' "$fm" | wc -l)"
fm_chars="${#fm}"
if [[ $fm_chars -lt 250 ]]; then
  echo "FAIL: frontmatter is too short ($fm_chars chars) — description should be detailed for triggering" >&2
  exit 1
fi

# Body must reference the bin scripts so the agent knows how to invoke them
body="$(awk '/^---$/{c++; next} c>=2' SKILL.md)"
assert_contains "$body" "bin/compile.sh" "body must reference compile.sh"
assert_contains "$body" "bin/install-pikchr.sh" "body must reference install script"
assert_contains "$body" "lib/stdlib.pikchr" "body must mention the stdlib"
