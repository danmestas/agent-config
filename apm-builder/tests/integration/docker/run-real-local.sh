#!/usr/bin/env bash
# run-real-local.sh — convenience wrapper for `--real` mode tests on macOS.
#
# Claude Code stores OAuth credentials in the macOS Keychain (not in
# ~/.claude/.credentials.json) on recent versions. This script extracts the
# Keychain entry to a tempfile, mounts it into the container as
# /host-auth/.claude/.credentials.json, runs the test matrix, and cleans up.
#
# Linux/CI users: use ANTHROPIC_API_KEY env var instead — see USING-AC.md.
set -euo pipefail

if [[ "$(uname)" != "Darwin" ]]; then
  echo "This script is macOS-only (uses /usr/bin/security)." >&2
  echo "On Linux/CI, run the matrix with -e ANTHROPIC_API_KEY=... directly." >&2
  exit 1
fi

# Require the matrix image
if ! docker image inspect agent-config-test >/dev/null 2>&1; then
  echo "Image agent-config-test not found. Build first:" >&2
  echo "  docker build -f apm-builder/tests/integration/docker/Dockerfile -t agent-config-test ." >&2
  exit 1
fi

TMP_AUTH=$(mktemp -d /tmp/ac-real-auth.XXXXXX)
trap 'rm -rf "$TMP_AUTH"' EXIT

# Extract Claude Code OAuth from Keychain to a tempfile that mirrors the
# pre-Keychain-era ~/.claude/.credentials.json layout.
mkdir -p "$TMP_AUTH/.claude"
if security find-generic-password -s 'Claude Code-credentials' -w \
   > "$TMP_AUTH/.claude/.credentials.json" 2>/dev/null; then
  echo "[run-real-local] Extracted Claude OAuth from Keychain"
else
  echo "[run-real-local] No 'Claude Code-credentials' Keychain entry found." >&2
  echo "[run-real-local] Run \`claude /login\` once to seed it." >&2
  exit 1
fi

# Mirror other harness auth dirs too (these don't have the Keychain issue —
# their on-disk state is the source of truth).
[[ -f "$HOME/.claude.json" ]] && cp "$HOME/.claude.json" "$TMP_AUTH/.claude.json"
[[ -d "$HOME/.codex" ]]      && cp -r "$HOME/.codex"      "$TMP_AUTH/.codex"
[[ -d "$HOME/.gemini" ]]     && cp -r "$HOME/.gemini"     "$TMP_AUTH/.gemini"

echo "[run-real-local] Running matrix..."

docker run --rm \
  -v "$TMP_AUTH/.claude:/host-auth/.claude:ro" \
  -v "$TMP_AUTH/.claude.json:/host-auth/.claude.json:ro" \
  -v "$TMP_AUTH/.codex:/host-auth/.codex:ro" \
  -v "$TMP_AUTH/.gemini:/host-auth/.gemini:ro" \
  ${OPENROUTER_API_KEY:+-e OPENROUTER_API_KEY} \
  ${ANTHROPIC_API_KEY:+-e ANTHROPIC_API_KEY} \
  ${OPENAI_API_KEY:+-e OPENAI_API_KEY} \
  ${GEMINI_API_KEY:+-e GEMINI_API_KEY} \
  agent-config-test --real "$@"
