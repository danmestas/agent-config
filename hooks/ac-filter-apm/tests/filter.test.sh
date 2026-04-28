#!/usr/bin/env bash

##
# Smoke tests for ac-filter-apm/hooks/filter.sh
#
# Case 1: AC not active → no-op {} output.
# Case 2: AC active with a resolution artifact → additionalContext injected.
#
##

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FILTER_SH="${SCRIPT_DIR}/../hooks/filter.sh"

# Test case 1: AC not active (AC_WRAPPED unset) → output is {}
echo "Test 1: AC not active (AC_WRAPPED unset) → no-op"
unset AC_WRAPPED
unset AC_RESOLUTION_PATH
output=$(echo '{}' | bash "${FILTER_SH}")
if [[ "${output}" == '{}' ]]; then
  echo "PASS"
else
  echo "FAIL: Expected '{}', got '${output}'"
  exit 1
fi

# Test case 2: AC active with resolution artifact
echo "Test 2: AC active with resolution artifact → additionalContext included"

# Create a temporary resolution artifact.
tmpfile=$(mktemp)
trap "rm -f ${tmpfile}" EXIT

cat > "${tmpfile}" <<'EOF'
{
  "mode": {
    "name": "TestMode",
    "body": "This is a test mode prompt.\nMultiline supported."
  },
  "skillsDrop": ["skill-a", "skill-b"]
}
EOF

export AC_WRAPPED=1
export AC_RESOLUTION_PATH="${tmpfile}"

output=$(echo '{}' | bash "${FILTER_SH}")

# Verify the output contains hookSpecificOutput, SessionStart, and additionalContext.
if echo "${output}" | grep -q "hookSpecificOutput" && \
   echo "${output}" | grep -q "SessionStart" && \
   echo "${output}" | grep -q "additionalContext" && \
   echo "${output}" | grep -q "TestMode"; then
  echo "PASS"
else
  echo "FAIL: Output missing expected fields or values"
  echo "Output: ${output}"
  exit 1
fi
