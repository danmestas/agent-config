#!/usr/bin/env bash
# shellcheck shell=bash

##
# SessionStart hook for Gemini that reads the AC resolution artifact and injects
# the active persona/mode context (mode prompt + out-of-scope skill list) as
# additionalContext. Emits valid JSON on stdout per Gemini's hook contract.
# Path B implementation: additionalContext-only.
#
# Protocol: reads JSON from stdin, writes JSON to stdout, exits 0 always.
##

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=../../_lib/fail-safe.sh
source "${SCRIPT_DIR}/../../_lib/fail-safe.sh" 2>/dev/null || {
  set +e
  trap 'exit 0' ERR
}

failsafe::trap_errors 2>/dev/null || true

# Consume stdin (required by hook protocol; we don't need its contents here).
# shellcheck disable=SC2162
read -r -t 1 < <(cat)

# No-op when not launched via `ac`.
if [[ -z "${AC_WRAPPED}" ]]; then
  echo '{}'
  exit 0
fi

# No-op when resolution path is missing or file doesn't exist.
if [[ -z "${AC_RESOLUTION_PATH}" ]] || [[ ! -f "${AC_RESOLUTION_PATH}" ]]; then
  echo '{}'
  exit 0
fi

# Parse resolution artifact.
# Extract fields. Prefer jq; fall back to grep/sed for minimal environments.

mode_name=""
mode_prompt=""
skills_drop_json=""

if command -v jq &>/dev/null; then
  mode_name=$(jq -r '.mode.name // empty' "${AC_RESOLUTION_PATH}" 2>/dev/null) || true
  mode_prompt=$(jq -r '.mode.body // empty' "${AC_RESOLUTION_PATH}" 2>/dev/null) || true
  skills_drop_json=$(jq -r '.skillsDrop | join(", ") // empty' "${AC_RESOLUTION_PATH}" 2>/dev/null) || true
else
  # Fallback to grep/sed (minimal environment).
  mode_name=$(grep -o '"name":"[^"]*"' "${AC_RESOLUTION_PATH}" 2>/dev/null | head -1 | sed 's/"name":"\|"//g') || true
  # This is a crude fallback for mode_prompt (multiline body); skip if jq unavailable.
  skills_drop_json=$(grep -o '"skillsDrop":\[[^]]*\]' "${AC_RESOLUTION_PATH}" 2>/dev/null | sed 's/"skillsDrop":\["\|"\|"//g' | sed 's/","/,/g') || true
fi

# Build additionalContext body.

context_parts=()

# Header line showing active persona/mode (informational).
if [[ -n "${mode_name}" ]]; then
  context_parts+=("## Active mode: ${mode_name}")
fi

# Mode prompt body (may be multi-line markdown).
if [[ -n "${mode_prompt}" ]]; then
  context_parts+=("${mode_prompt}")
fi

# Out-of-scope skill notice.
if [[ -n "${skills_drop_json}" ]]; then
  context_parts+=("The following skills are out-of-scope for this session and should not be invoked: ${skills_drop_json}")
fi

# Nothing to inject → no-op.
if [[ ${#context_parts[@]} -eq 0 ]]; then
  echo '{}'
  exit 0
fi

# Join parts with double newline.
additional_context=$(printf '%s\n\n' "${context_parts[@]}" | sed '$ s/\n\n$//')

# Emit JSON using jq when available for correct escaping; fallback otherwise.
if command -v jq &>/dev/null; then
  jq -n \
    --arg context "${additional_context}" \
    '{
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: $context
      }
    }' 2>/dev/null || echo '{}'
elif command -v python3 &>/dev/null; then
  python3 -c "
import json
import sys
output = {
    'hookSpecificOutput': {
        'hookEventName': 'SessionStart',
        'additionalContext': '''${additional_context}'''
    }
}
print(json.dumps(output))
" 2>/dev/null || echo '{}'
else
  # Last resort: shell-based escaping (imperfect but fail-safe).
  # Replace " with \" and newlines with \n.
  escaped=$(printf '%s' "${additional_context}" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')
  echo "{\"hookSpecificOutput\":{\"hookEventName\":\"SessionStart\",\"additionalContext\":\"${escaped}\"}}"
fi

exit 0
