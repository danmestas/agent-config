#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib.sh"
cd "$(dirname "$0")/.."

for ref in references/syntax.md references/theming.md references/renderers.md references/stdlib-reference.md; do
  assert_file_exists "$ref"
  size=$(wc -c < "$ref")
  if [[ $size -lt 1500 ]]; then
    echo "FAIL: $ref is suspiciously small ($size bytes)" >&2
    exit 1
  fi
done

# All internal markdown links in SKILL.md and references/* should resolve
check_links() {
  local f="$1"
  # Match relative markdown links: [...](path) where path doesn't start with http
  local links
  links=$(grep -oE '\]\([^)#h][^)]*\.(md|pikchr|css|html|sh)\)' "$f" 2>/dev/null | \
    sed -E 's/^\]\(//;s/\)$//' || true)
  [[ -z "$links" ]] && return 0
  while IFS= read -r link; do
    # Resolve relative to the file's dir
    local base="$(dirname "$f")"
    local target="$base/$link"
    if [[ ! -e "$target" ]]; then
      echo "FAIL: broken link in $f: $link (resolved to $target)" >&2
      return 1
    fi
  done <<< "$links"
}

for f in SKILL.md references/*.md; do
  check_links "$f" || exit 1
done
