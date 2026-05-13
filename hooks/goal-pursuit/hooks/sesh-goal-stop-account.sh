#!/usr/bin/env bash
# sesh-goal-stop-account.sh — Stop hook for sesh goal accounting.
#
# Fires on every Stop event. When SESH_GOAL_ID is set, reports an estimated
# token cost for the turn to sesh-ops, which CAS-increments the goal's
# used_tokens counter (auto-transitioning to budget_limited if over budget).
#
# Env (all optional except SESH_GOAL_ID, which activates the hook):
#   SESH_GOAL_ID                — active goal record id (no SESH_GOAL_ID = no-op)
#   SESH_GOAL_SCOPE             — sesh scope (default: project)
#   SESH_GOAL_SCOPE_ID          — scope-id (default: cwd basename, sanitized)
#   ORCH_GOAL_TOKEN_ESTIMATE    — per-turn estimate (default: 5000)
#   SESH_OPS_BIN                — sesh-ops binary (default: "sesh-ops")
#
# Failure policy: never block the user's session. Exit 0 on any failure.

set -u

if [[ -z "${SESH_GOAL_ID:-}" ]]; then
  exit 0
fi

SESH_OPS_BIN="${SESH_OPS_BIN:-sesh-ops}"
SCOPE="${SESH_GOAL_SCOPE:-project}"
SCOPE_ID="${SESH_GOAL_SCOPE_ID:-$(basename "$PWD" | tr .- _)}"
ESTIMATE="${ORCH_GOAL_TOKEN_ESTIMATE:-5000}"

if ! command -v "$SESH_OPS_BIN" >/dev/null 2>&1; then
  echo "sesh-goal: $SESH_OPS_BIN not on PATH; skipping account" >&2
  exit 0
fi

if ! "$SESH_OPS_BIN" --scope "$SCOPE" --scope-id "$SCOPE_ID" \
       goal account "$SESH_GOAL_ID" "$ESTIMATE" >/dev/null 2>"/tmp/sesh-goal-stop-${SESH_GOAL_ID}.err"; then
  echo "sesh-goal: goal account failed for $SESH_GOAL_ID (see /tmp/sesh-goal-stop-${SESH_GOAL_ID}.err)" >&2
fi

exit 0
