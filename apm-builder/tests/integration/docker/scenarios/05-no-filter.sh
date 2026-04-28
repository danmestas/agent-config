#!/usr/bin/env bash
# 05-no-filter.sh <harness>
# Verifies: --no-filter flag bypasses resolution; AC_RESOLUTION_PATH unset.
# Also: for codex, with --no-filter no tempdir/AGENTS.md should be created.
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
echo "AC_WRAPPED=\${AC_WRAPPED:-}" > "$CAPTURED_ENV_FILE"
echo "AC_RESOLUTION_PATH=\${AC_RESOLUTION_PATH:-}" >> "$CAPTURED_ENV_FILE"
echo "PWD=\${PWD:-}" >> "$CAPTURED_ENV_FILE"
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
  output=$(node "$TSX" "$AC" "$harness" --no-filter --persona backend --mode focused -- "${REAL_CMD[@]:1}" 2>&1)
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

# Run with --no-filter AND persona/mode flags — resolution should still be skipped
node "$TSX" "$AC" "$harness" --no-filter --persona backend --mode focused -- ping 2>/dev/null
stub_exit=$?

if [[ $stub_exit -ne 0 ]]; then
  echo "FAIL: ac exited $stub_exit"
  exit 1
fi

ac_resolution_path=$(grep "^AC_RESOLUTION_PATH=" "$CAPTURED_ENV_FILE" | cut -d= -f2-)

if [[ -n "$ac_resolution_path" ]]; then
  echo "FAIL: AC_RESOLUTION_PATH should be unset with --no-filter, got: $ac_resolution_path"
  exit 1
fi

ac_wrapped=$(grep "^AC_WRAPPED=" "$CAPTURED_ENV_FILE" | cut -d= -f2-)
if [[ "$ac_wrapped" != "1" ]]; then
  echo "FAIL: AC_WRAPPED should still be 1 with --no-filter, got: $ac_wrapped"
  exit 1
fi

# For codex: verify CWD was NOT changed to a tempdir (no prelaunch without resolution)
if [[ "$harness" == "codex" ]]; then
  stub_pwd=$(grep "^PWD=" "$CAPTURED_ENV_FILE" | cut -d= -f2-)
  if echo "$stub_pwd" | grep -q "ac-prelaunch"; then
    echo "FAIL: codex with --no-filter should not create prelaunch tempdir, but PWD=$stub_pwd"
    exit 1
  fi
fi

echo "PASS"
exit 0
