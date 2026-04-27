#!/usr/bin/env bash
# SessionStart hook for agent-config. Walks memory + ADR dirs for recent
# entries, formats them as flat-line markdown, and injects them as
# `additionalContext` on the SessionStart hook envelope.
#
# Reads JSON from stdin (per Claude Code's hook protocol), writes JSON to
# stdout (also per protocol). On any error, exits 0 with no output.

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

RECALL_LIMIT="${RECALL_LIMIT:-5}"
RECALL_LINES="${RECALL_LINES:-30}"

input="$(cat 2>/dev/null || true)"

extract_field() {
  local field="$1"
  if command -v jq >/dev/null 2>&1; then
    printf '%s' "${input}" | jq -r --arg f "${field}" '.[$f] // empty' 2>/dev/null
  else
    printf '%s' "${input}" | grep -o "\"${field}\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | head -1 | sed 's/.*: *"\(.*\)"/\1/'
  fi
}

cwd="$(extract_field cwd)"
[[ -z "${cwd}" ]] && cwd="${PWD}"

# Per-project exclusion gate.
if command -v should_track_project >/dev/null 2>&1; then
  should_track_project "${cwd}" || exit 0
fi

# Opt-out: presence of the disable marker.
if [[ -f "${cwd}/.agent-config/recall.disabled" ]]; then
  exit 0
fi

# Project name = last path segment of cwd. The Claude Code memory directory
# layout is ~/.claude/projects/<project>/memory/.
project_name="$(basename "${cwd}")"
memory_dir="${HOME}/.claude/projects/${project_name}/memory"
adr_dir="${cwd}/docs/adr"

candidates=()
if [[ -d "${memory_dir}" ]]; then
  while IFS= read -r f; do
    candidates+=("${f}")
  done < <(find "${memory_dir}" -maxdepth 1 -name 'feedback_*.md' -type f 2>/dev/null)
fi
if [[ -d "${adr_dir}" ]]; then
  while IFS= read -r f; do
    candidates+=("${f}")
  done < <(find "${adr_dir}" -maxdepth 2 -name '*.md' -type f 2>/dev/null)
fi

if [[ ${#candidates[@]} -eq 0 ]]; then
  exit 0
fi

# Sort by mtime descending. `stat -f %m` (BSD/macOS) and `stat -c %Y` (GNU).
mtime() {
  stat -f %m "$1" 2>/dev/null || stat -c %Y "$1" 2>/dev/null || echo 0
}

sorted=()
while IFS= read -r line; do
  sorted+=("$(printf '%s' "${line}" | cut -d' ' -f2-)")
done < <(
  for f in "${candidates[@]}"; do
    printf '%s %s\n' "$(mtime "${f}")" "${f}"
  done | sort -rn
)

count=0
buffer=""
buffer="${buffer}## Recent memory + decisions\n\n"

idx=1
for f in "${sorted[@]}"; do
  [[ ${count} -ge ${RECALL_LIMIT} ]] && break
  fname="$(basename "${f}")"
  date_str="$(date -r "$(mtime "${f}")" +%Y-%m-%d 2>/dev/null || echo "")"
  signal="memory"
  [[ "${f}" == *"/docs/adr/"* ]] && signal="adr"
  excerpt="$(head -n "${RECALL_LINES}" "${f}" 2>/dev/null | tr '\n' ' ' | tr -s ' ' | cut -c1-180)"
  printf -v line '**M-%03d** %s [%s] | `%s` | %s' "${idx}" "${date_str}" "${signal}" "${fname}" "${excerpt}"
  buffer="${buffer}${line}\n"
  count=$((count + 1))
  idx=$((idx + 1))
done

if [[ ${count} -eq 0 ]]; then
  exit 0
fi

# Emit JSON.
if command -v jq >/dev/null 2>&1; then
  printf '%b' "${buffer}" | jq -Rs '{hookSpecificOutput: {hookEventName: "SessionStart", additionalContext: .}}' 2>/dev/null
else
  # Fallback: rough JSON build. Escape backslashes and quotes.
  ctx="${buffer//\\/\\\\}"
  ctx="${ctx//\"/\\\"}"
  ctx="${ctx//$'\n'/\\n}"
  printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "${ctx}"
fi

exit 0
