#!/usr/bin/env bash
# Shared fail-safe helpers for hook scripts in agent-config.
#
# A hook MUST never block the user's session. This library installs a trap
# that catches unhandled errors, logs them quietly to stderr, and exits 0.
# Source it at the top of every hook body, then call failsafe::trap_errors.
#
# See CONVENTIONS.md for the full rule.

# shellcheck shell=bash

failsafe::trap_errors() {
  set +e
  trap 'failsafe::on_error $? "$BASH_COMMAND" $LINENO' ERR
}

failsafe::on_error() {
  local code="$1"
  local cmd="$2"
  local line="$3"
  printf '[hook fail-safe] exit=%s line=%s cmd=%s\n' "${code}" "${line}" "${cmd}" >&2
  # Surface a JSON envelope when the host harness expects one. Hooks that don't
  # use stdout for protocol can ignore it; Claude Code's hook protocol treats
  # the envelope as a no-op continue signal.
  printf '{"continue": true, "suppressOutput": true}\n' 2>/dev/null || true
  exit 0
}

# Convenience: run a command, swallow any non-zero exit code, return 0.
failsafe::try() {
  "$@" 2>/dev/null || true
}
