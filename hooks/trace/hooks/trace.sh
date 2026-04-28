#!/usr/bin/env bash
# PostToolUse hook for agent-config. Appends one JSONL record per tool call to
# `.agent-config/trace/<session-id>.jsonl`. Intentionally minimal: no LLM, no
# DB, no daemon. Skills like `reflect` and `stuck-detector` read the file later.
#
# Reads the Claude Code hook envelope from stdin:
#   { "session_id": "...", "tool_name": "...", "tool_input": {...},
#     "tool_response": {...}, "cwd": "...", ... }
#
# Writes a single JSONL line:
#   {"ts":"<ISO>","tool":"<name>","args":<tool_input>,"status":"<ok|error|blocked>",
#    "duration_ms":<int|null>}
#
# Per CONVENTIONS.md: never blocks, always exits 0.

# shellcheck shell=bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../_lib/fail-safe.sh
source "${SCRIPT_DIR}/../../_lib/fail-safe.sh" 2>/dev/null || {
  set +e
  trap 'exit 0' ERR
}
# shellcheck source=../_lib/should-track.sh
source "${SCRIPT_DIR}/../../_lib/should-track.sh" 2>/dev/null || true

failsafe::trap_errors 2>/dev/null || true

# Read entire JSON envelope.
input="$(cat)"

# Extract a couple of well-known fields without depending on jq.
extract_field() {
  local field="$1"
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "${input}" | jq -r --arg f "${field}" '.[$f] // empty' 2>/dev/null
  else
    # Fallback: naive grep for top-level "<field>": "<value>".
    printf '%s' "${input}" | grep -o "\"${field}\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | head -1 | sed 's/.*: *"\(.*\)"/\1/'
  fi
}

cwd="$(extract_field cwd)"
[[ -z "${cwd}" ]] && cwd="${PWD}"

# Per-project exclusion gate.
if command -v should_track_project >/dev/null 2>&1; then
  should_track_project "${cwd}" || exit 0
fi

session_id="$(extract_field session_id)"
[[ -z "${session_id}" ]] && session_id="unknown-$(date +%s)"

tool_name="$(extract_field tool_name)"
[[ -z "${tool_name}" ]] && tool_name="?"

# Status: blocked > error > ok.
status="ok"
if printf '%s' "${input}" | grep -q '"hookEventName"[[:space:]]*:[[:space:]]*"PreToolUse"'; then
  # Pre-call envelope; we treat it as ok for now.
  status="ok"
fi
if printf '%s' "${input}" | grep -qi '"permissionDecision"[[:space:]]*:[[:space:]]*"deny"'; then
  status="blocked"
elif printf '%s' "${input}" | grep -qi '"is_error"[[:space:]]*:[[:space:]]*true'; then
  status="error"
fi

ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
trace_dir="${cwd}/.agent-config/trace"
mkdir -p "${trace_dir}" 2>/dev/null || true
trace_file="${trace_dir}/${session_id}.jsonl"

# Build the JSONL record. Prefer jq for correctness; fall back to printf.
if command -v jq >/dev/null 2>&1; then
  printf '%s' "${input}" | jq -c --arg ts "${ts}" --arg tool "${tool_name}" --arg status "${status}" \
    '{ts: $ts, tool: $tool, args: (.tool_input // {}), status: $status, duration_ms: (.duration_ms // null)}' \
    >> "${trace_file}" 2>/dev/null || true
else
  # Best-effort fallback. Truncate args to keep the line bounded.
  args_blob="$(printf '%s' "${input}" | tr -d '\n' | cut -c1-2000)"
  printf '{"ts":"%s","tool":"%s","args":%s,"status":"%s","duration_ms":null}\n' \
    "${ts}" "${tool_name}" "{}" "${status}" >> "${trace_file}" 2>/dev/null || true
  # We don't try to escape the raw envelope; jq is the supported path. Suppress lint.
  : "${args_blob}"
fi

exit 0
