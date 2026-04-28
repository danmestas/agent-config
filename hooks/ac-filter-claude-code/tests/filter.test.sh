#!/usr/bin/env bash
set -euo pipefail
dir="$(cd "$(dirname "$0")/.." && pwd)"
script="$dir/hooks/filter.sh"

# Case 1: AC not active → no-op {} output.
out=$(echo '{}' | env -u AC_WRAPPED -u AC_RESOLUTION_PATH "$script")
if [[ "$out" != "{}" ]]; then
  echo "FAIL: expected {} when AC not active, got: $out" >&2
  exit 1
fi
echo "PASS: no-op when AC not active"

# Case 2: AC active with a resolution artifact.
tmp=$(mktemp -d)
cat > "$tmp/resolution.json" <<EOF
{
  "schemaVersion": 1,
  "harness": "claude-code",
  "skillsDrop": ["a", "b"],
  "skillsKeep": null,
  "modePrompt": "Stay focused.",
  "metadata": {"persona": "p", "mode": "m", "categories": []}
}
EOF
out=$(echo '{}' | AC_WRAPPED=1 AC_RESOLUTION_PATH="$tmp/resolution.json" "$script")

# Expect output to reference the mode prompt and/or out-of-scope skill list.
if ! echo "$out" | grep -qE "Stay focused|out-of-scope"; then
  echo "FAIL: expected output to reference filter or prompt, got: $out" >&2
  rm -rf "$tmp"
  exit 1
fi
echo "PASS: filter emits expected output for active session"

rm -rf "$tmp"
