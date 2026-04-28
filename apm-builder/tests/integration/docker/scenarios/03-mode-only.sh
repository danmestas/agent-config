#!/usr/bin/env bash
# 03-mode-only.sh <harness>
# Verifies: --mode focused sets AC_RESOLUTION_PATH; resolution JSON has
#           metadata.mode == "focused" and a non-empty mode_prompt.
set -uo pipefail

harness="${1:?harness name required}"

WORKSPACE="${WORKSPACE:-/workspace}"
AC="$WORKSPACE/apm-builder/ac.ts"
TSX="$WORKSPACE/node_modules/.bin/tsx"

SHIM_DIR="$(mktemp -d /tmp/shims-XXXXXX)"
CAPTURED_ENV_FILE="$(mktemp /tmp/cap-XXXXXX.env)"

case "$harness" in
  claude|claude-code) BIN_NAME="claude" ;;
  codex) BIN_NAME="codex" ;;
  gemini) BIN_NAME="gemini" ;;
  pi) BIN_NAME="pi" ;;
  *) echo "FAIL: unknown harness $harness"; exit 1 ;;
esac

STUB_BIN="$SHIM_DIR/$BIN_NAME"
cat > "$STUB_BIN" <<STUBEOF
#!/usr/bin/env bash
echo "AC_RESOLUTION_PATH=\${AC_RESOLUTION_PATH:-}" > "$CAPTURED_ENV_FILE"
exit 0
STUBEOF
chmod +x "$STUB_BIN"

cleanup() {
  rm -f "$CAPTURED_ENV_FILE"
  rm -rf "$SHIM_DIR"
}
trap cleanup EXIT

# Real mode: skip shim, invoke actual harness binary with a minimal prompt
if [[ "${REAL_MODE:-false}" == "true" ]]; then
  case "$harness" in
    claude|claude-code) REAL_CMD=(claude --print "reply with just the four characters PING and stop") ;;
    codex)              REAL_CMD=(codex exec "reply with just the four characters PING and stop") ;;
    gemini)             REAL_CMD=(gemini --skip-trust -p "reply with just the four characters PING and stop") ;;
    pi)                 REAL_CMD=(pi --provider openrouter --print "reply with just the four characters PING and stop") ;;
    *) echo "FAIL: unknown harness $harness"; exit 1 ;;
  esac
  output=$(node "$TSX" "$AC" "$harness" --mode focused -- "${REAL_CMD[@]:1}" 2>&1)
  exit_code=$?
  if [[ $exit_code -ne 0 ]]; then
    echo "FAIL: ac+real exited $exit_code"
    echo "$output"
    exit 1
  fi
  if [[ -z "${output// }" ]]; then
    echo "FAIL: real harness produced empty output"
    exit 1
  fi
  echo "PASS"
  exit 0
fi

# Install stub on PATH only for the non-real stub test
export PATH="$SHIM_DIR:$PATH"

node "$TSX" "$AC" "$harness" --mode focused -- ping 2>/dev/null
stub_exit=$?

if [[ $stub_exit -ne 0 ]]; then
  echo "FAIL: ac exited $stub_exit"
  exit 1
fi

ac_resolution_path=$(grep "^AC_RESOLUTION_PATH=" "$CAPTURED_ENV_FILE" | cut -d= -f2-)

if [[ -z "$ac_resolution_path" ]]; then
  echo "FAIL: AC_RESOLUTION_PATH not set with --mode focused"
  cat "$CAPTURED_ENV_FILE"
  exit 1
fi

if [[ ! -f "$ac_resolution_path" ]]; then
  echo "FAIL: AC_RESOLUTION_PATH=$ac_resolution_path is not a readable file"
  exit 1
fi

mode_name=$(jq -r '.metadata.mode // empty' "$ac_resolution_path" 2>/dev/null || true)
mode_prompt=$(jq -r '.modePrompt // empty' "$ac_resolution_path" 2>/dev/null || true)

if [[ "$mode_name" != "focused" ]]; then
  echo "FAIL: expected metadata.mode=focused, got: $mode_name"
  jq . "$ac_resolution_path" 2>/dev/null || cat "$ac_resolution_path"
  exit 1
fi

if [[ -z "$mode_prompt" ]]; then
  echo "FAIL: modePrompt is empty — expected non-empty prompt for 'focused' mode"
  jq . "$ac_resolution_path" 2>/dev/null || cat "$ac_resolution_path"
  exit 1
fi

echo "PASS"
exit 0
