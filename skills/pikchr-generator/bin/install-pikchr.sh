#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"   # land in bin/

SOURCE_PIN="PIKCHR_SOURCE.txt"

# ---------------------------------------------------------------------------
# Parse PIKCHR_SOURCE.txt (skip comment lines and blank lines)
# ---------------------------------------------------------------------------
if [[ ! -f "$SOURCE_PIN" ]]; then
  echo "ERROR: $SOURCE_PIN not found in $(pwd)" >&2
  exit 1
fi

URL=""
TARBALL_SHA=""
BUILT_SHA=""

while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%$'\r'}"          # strip trailing CR (CRLF-safe)
  # Skip comments and blank lines
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${line// }" ]] && continue

  case "$line" in
    URL=*)             URL="${line#URL=}" ;;
    TARBALL_SHA256=*)  TARBALL_SHA="${line#TARBALL_SHA256=}" ;;
    SHA256=*)          BUILT_SHA="${line#SHA256=}" ;;
  esac
done < "$SOURCE_PIN"

if [[ -z "$URL" || -z "$TARBALL_SHA" || -z "$BUILT_SHA" ]]; then
  echo "ERROR: $SOURCE_PIN is missing one or more required fields (URL, TARBALL_SHA256, SHA256)" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Tool prerequisites
# ---------------------------------------------------------------------------
if ! command -v cc &>/dev/null; then
  echo "ERROR: 'cc' not found in PATH." >&2
  echo "  macOS:  xcode-select --install" >&2
  echo "  Debian/Ubuntu:  sudo apt-get install -y build-essential" >&2
  exit 1
fi

if ! command -v curl &>/dev/null; then
  echo "ERROR: 'curl' not found in PATH." >&2
  exit 1
fi

if ! command -v make &>/dev/null; then
  echo "ERROR: 'make' required for building pikchr.c but not found in PATH." >&2
  exit 1
fi

if ! command -v tar &>/dev/null; then
  echo "ERROR: 'tar' not found in PATH." >&2
  exit 1
fi

if command -v shasum >/dev/null 2>&1; then
  SHA256_CMD="shasum -a 256"
elif command -v sha256sum >/dev/null 2>&1; then
  SHA256_CMD="sha256sum"
else
  echo "ERROR: neither 'shasum' nor 'sha256sum' found in PATH" >&2
  echo "       On macOS: shasum ships with Perl (pre-installed)." >&2
  echo "       On Debian/Ubuntu: already part of coreutils." >&2
  echo "       On Alpine: apk add coreutils" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Work directory (cleaned up on exit)
# ---------------------------------------------------------------------------
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

# ---------------------------------------------------------------------------
# Download tarball
# ---------------------------------------------------------------------------
echo "Downloading pikchr source from $URL ..."
curl -fsSL --connect-timeout 15 --max-time 120 "$URL" -o "$WORK/pikchr-src.tar.gz"

# ---------------------------------------------------------------------------
# Verify tarball sha256
# ---------------------------------------------------------------------------
echo "Verifying tarball sha256 ..."
ACTUAL_TARBALL_SHA=$($SHA256_CMD "$WORK/pikchr-src.tar.gz" | cut -d' ' -f1)
if [[ "$ACTUAL_TARBALL_SHA" != "$TARBALL_SHA" ]]; then
  echo "ERROR: sha256 mismatch on tarball" >&2
  echo "  expected: $TARBALL_SHA" >&2
  echo "  actual:   $ACTUAL_TARBALL_SHA" >&2
  echo "  Update TARBALL_SHA256 in $SOURCE_PIN if you intentionally bumped the pin." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Extract
# ---------------------------------------------------------------------------
echo "Extracting ..."
# Determine top-level directory name from the tarball itself (deterministic)
TOP_DIR_NAME="$(tar -tzf "$WORK/pikchr-src.tar.gz" | head -1 | cut -d/ -f1)"
if [[ -z "$TOP_DIR_NAME" ]]; then
  echo "ERROR: could not read tarball contents" >&2
  exit 1
fi

tar -xzf "$WORK/pikchr-src.tar.gz" -C "$WORK"

SRC_DIR="$WORK/$TOP_DIR_NAME"
[[ -d "$SRC_DIR" ]] || { echo "ERROR: expected source dir '$SRC_DIR' not found after extraction" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Build pikchr.c (Lemon grammar → amalgamated C file)
# ---------------------------------------------------------------------------
echo "Running make pikchr.c ..."
(cd "$SRC_DIR" && make pikchr.c)

if [[ ! -f "$SRC_DIR/pikchr.c" ]]; then
  echo "ERROR: make did not produce pikchr.c in $SRC_DIR" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Verify built pikchr.c sha256
# ---------------------------------------------------------------------------
echo "Verifying built pikchr.c sha256 ..."
ACTUAL_BUILT_SHA=$($SHA256_CMD "$SRC_DIR/pikchr.c" | cut -d' ' -f1)
if [[ "$ACTUAL_BUILT_SHA" != "$BUILT_SHA" ]]; then
  echo "ERROR: sha256 mismatch on built pikchr.c" >&2
  echo "  expected: $BUILT_SHA" >&2
  echo "  actual:   $ACTUAL_BUILT_SHA" >&2
  echo "  This usually means the tarball changed or your Lemon generator produced different output." >&2
  echo "  Update SHA256 in $SOURCE_PIN if intentional." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Compile the shell binary
# ---------------------------------------------------------------------------
echo "Compiling pikchr CLI ..."
cc "$SRC_DIR/pikchr.c" -DPIKCHR_SHELL -lm -O2 -o pikchr   # writes to $(pwd)/pikchr (the bin/ dir)

# ---------------------------------------------------------------------------
# Smoke test
# ---------------------------------------------------------------------------
echo "Smoke test ..."
echo 'box "ok"' | ./pikchr - >/dev/null

echo "Installed: $(pwd)/pikchr"
