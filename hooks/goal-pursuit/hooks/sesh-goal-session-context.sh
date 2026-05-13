#!/usr/bin/env bash
# sesh-goal-session-context.sh — SessionStart hook for sesh goal context.
#
# Fires on session-init and /resume. When SESH_GOAL_ID is set, reads the
# goal record from sesh and emits a Claude Code additionalContext JSON
# block so the assistant knows what it's pursuing from turn one.
#
# Env (all optional except SESH_GOAL_ID, which activates the hook):
#   SESH_GOAL_ID                — active goal record id (no SESH_GOAL_ID = no-op)
#   SESH_GOAL_SCOPE             — sesh scope (default: project)
#   SESH_GOAL_SCOPE_ID          — scope-id (default: cwd basename, sanitized)
#   SESH_OPS_BIN                — sesh-ops binary (default: "sesh-ops")

set -u

if [[ -z "${SESH_GOAL_ID:-}" ]]; then
  exit 0
fi

SESH_OPS_BIN="${SESH_OPS_BIN:-sesh-ops}"
SCOPE="${SESH_GOAL_SCOPE:-project}"
SCOPE_ID="${SESH_GOAL_SCOPE_ID:-$(basename "$PWD" | tr .- _)}"

if ! command -v "$SESH_OPS_BIN" >/dev/null 2>&1; then
  exit 0
fi

GOAL_JSON="$("$SESH_OPS_BIN" --scope "$SCOPE" --scope-id "$SCOPE_ID" \
              goal get "$SESH_GOAL_ID" 2>/dev/null)" || exit 0

if [[ -z "$GOAL_JSON" ]]; then
  exit 0
fi

SUMMARY="$(echo "$GOAL_JSON" | jq -r '
  "Active goal pursuit:\n" +
  "  id:        \(.id)\n" +
  "  objective: \(.objective)\n" +
  "  status:    \(.status)\n" +
  "  budget:    \(.used_tokens)/\(.token_budget // "∞") tokens\n" +
  "  tasks:     \((.tasks // []) | length) linked\n" +
  "\nUse the working-with-sesh-tasks skill to pull/work/complete linked\n" +
  "tasks; invoke the goal-complete skill only after the completion audit."
' 2>/dev/null)"

if [[ -z "$SUMMARY" ]]; then
  exit 0
fi

jq -nc \
  --arg ctx "$SUMMARY" \
  '{hookSpecificOutput: {hookEventName: "SessionStart", additionalContext: $ctx}}'
