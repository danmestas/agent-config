#!/usr/bin/env bash
# 01-no-flags.sh <harness>
# Verifies: ac sets AC_WRAPPED=1, AC_RESOLUTION_PATH is unset (no persona/mode).
# Strategy: use a stub harness wrapper that echoes env vars and exits 0,
#           bypassing the real LLM call.
set -uo pipefail

harness="${1:?harness name required}"

WORKSPACE="${WORKSPACE:-/workspace}"
AC="$WORKSPACE/apm-builder/ac.ts"
TSX="$WORKSPACE/node_modules/.bin/tsx"

# Build a stub that prints env and exits 0
STUB_BIN="$(mktemp /tmp/stub-XXXXXX)"
cat > "$STUB_BIN" <<'STUBEOF'
#!/usr/bin/env bash
echo "AC_WRAPPED=${AC_WRAPPED:-}"
echo "AC_RESOLUTION_PATH=${AC_RESOLUTION_PATH:-}"
echo "AC_HARNESS=${AC_HARNESS:-}"
exit 0
STUBEOF
chmod +x "$STUB_BIN"

# ac doesn't support injecting a stub bin at CLI level; use a PATH shim instead.
SHIM_DIR="$(mktemp -d /tmp/shims-XXXXXX)"

# Determine the real binary name ac will call
case "$harness" in
  claude|claude-code) BIN_NAME="claude" ;;
  codex) BIN_NAME="codex" ;;
  gemini) BIN_NAME="gemini" ;;
  pi) BIN_NAME="pi" ;;
  *) echo "FAIL: unknown harness $harness"; exit 1 ;;
esac

cp "$STUB_BIN" "$SHIM_DIR/$BIN_NAME"

cleanup() {
  rm -f "$STUB_BIN"
  rm -rf "$SHIM_DIR"
}
trap cleanup EXIT

export PATH="$SHIM_DIR:$PATH"

# Run ac with no persona/mode flags
output=$(node "$TSX" "$AC" "$harness" -- ping 2>&1)
exit_code=$?

if [[ $exit_code -ne 0 ]]; then
  echo "FAIL: ac exited $exit_code"
  echo "$output"
  exit 1
fi

if ! echo "$output" | grep -q "AC_WRAPPED=1"; then
  echo "FAIL: AC_WRAPPED=1 not found in output"
  echo "$output"
  exit 1
fi

if echo "$output" | grep -qE "AC_RESOLUTION_PATH=.+"; then
  echo "FAIL: AC_RESOLUTION_PATH should be unset with no persona/mode"
  echo "$output"
  exit 1
fi

echo "PASS"
exit 0
