#!/usr/bin/env bash
# SessionStart hook for ac-filter-claude-code.
#
# When `ac` launches Claude Code it sets AC_WRAPPED=1 and writes a resolution
# artifact to a temp path exported as AC_RESOLUTION_PATH. This hook reads that
# artifact and injects the mode prompt + out-of-scope skill list as
# additionalContext so Claude honours the active persona/mode constraints.
#
# When AC_WRAPPED is unset this hook exits 0 with {} (no-op).
#
# Path B implementation: only additionalContext is supported by Claude Code's
# SessionStart hook output schema. Skill descriptions still load into context
# (no token savings). See SKILL.md for full rationale and Plan 9b path C notes.
#
# Protocol: reads JSON from stdin, writes JSON to stdout, exits 0 always.

# shellcheck shell=bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../../_lib/fail-safe.sh
source "${SCRIPT_DIR}/../../_lib/fail-safe.sh" 2>/dev/null || {
  set +e
  trap 'exit 0' ERR
}

failsafe::trap_errors 2>/dev/null || true

# Consume stdin (required by hook protocol; we don't need its contents here).
input="$(cat 2>/dev/null || true)"
# Silence unused-variable warning from shellcheck — input is consumed per protocol.
: "${input}"

# No-op when not launched via `ac`.
if [[ -z "${AC_WRAPPED:-}" ]]; then
  printf '{}\n'
  exit 0
fi

# No-op when resolution path is missing or file doesn't exist.
if [[ -z "${AC_RESOLUTION_PATH:-}" ]] || [[ ! -f "${AC_RESOLUTION_PATH}" ]]; then
  printf '[ac-filter-claude-code] AC_WRAPPED set but AC_RESOLUTION_PATH missing or unreadable\n' >&2
  printf '{}\n'
  exit 0
fi

# Parse resolution artifact.
resolution="$(cat "${AC_RESOLUTION_PATH}" 2>/dev/null || true)"
if [[ -z "${resolution}" ]]; then
  printf '[ac-filter-claude-code] resolution artifact is empty\n' >&2
  printf '{}\n'
  exit 0
fi

# Extract fields. Prefer jq; fall back to grep/sed for minimal environments.
if command -v jq >/dev/null 2>&1; then
  mode_prompt="$(printf '%s' "${resolution}" | jq -r '.modePrompt // ""' 2>/dev/null || true)"
  skills_drop_json="$(printf '%s' "${resolution}" | jq -r '.skillsDrop // [] | join(", ")' 2>/dev/null || true)"
  persona="$(printf '%s' "${resolution}" | jq -r '.metadata.persona // ""' 2>/dev/null || true)"
  mode="$(printf '%s' "${resolution}" | jq -r '.metadata.mode // ""' 2>/dev/null || true)"
else
  # Minimal fallback — best-effort extraction without jq.
  mode_prompt="$(printf '%s' "${resolution}" | grep -o '"modePrompt"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*: *"\(.*\)"/\1/' | head -1 || true)"
  skills_drop_json="$(printf '%s' "${resolution}" | grep -o '"skillsDrop"[[:space:]]*:[[:space:]]*\[[^]]*\]' | sed 's/.*\[\(.*\)\]/\1/' | tr -d '"' | tr ',' ', ' | head -1 || true)"
  persona=""
  mode=""
fi

# Build additionalContext body.
context_parts=()

# Header line showing active persona/mode (informational).
if [[ -n "${persona}" ]] || [[ -n "${mode}" ]]; then
  header="<!-- ac session: persona=${persona:-none} mode=${mode:-none} -->"
  context_parts+=("${header}")
fi

# Mode prompt body (may be multi-line markdown).
if [[ -n "${mode_prompt}" ]]; then
  context_parts+=("${mode_prompt}")
fi

# Out-of-scope skill notice.
if [[ -n "${skills_drop_json}" ]]; then
  context_parts+=("The following skills are out-of-scope for this session and should not be invoked: ${skills_drop_json}.")
fi

# Nothing to inject → no-op.
if [[ ${#context_parts[@]} -eq 0 ]]; then
  printf '{}\n'
  exit 0
fi

# Join parts with double newline.
additional_context=""
for part in "${context_parts[@]}"; do
  if [[ -n "${additional_context}" ]]; then
    additional_context="${additional_context}

${part}"
  else
    additional_context="${part}"
  fi
done

# Emit JSON using jq when available for correct escaping; fallback otherwise.
if command -v jq >/dev/null 2>&1; then
  printf '%s' "${additional_context}" \
    | jq -Rs '{hookSpecificOutput: {hookEventName: "SessionStart", additionalContext: .}}' 2>/dev/null \
    || printf '{}\n'
else
  # Manual escaping fallback.
  ctx="${additional_context//\\/\\\\}"
  ctx="${ctx//\"/\\\"}"
  ctx="${ctx//$'\n'/\\n}"
  printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "${ctx}"
fi

exit 0
