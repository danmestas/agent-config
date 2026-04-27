#!/usr/bin/env bash
# install-d2.sh — install D2 (terrastruct/d2). Single Go binary.
# Strategy:
#   1. Already on PATH? Symlink to bin/d2 and exit.
#   2. macOS with Homebrew? `brew install d2`, then symlink.
#   3. Otherwise, download release tarball from GitHub into bin/d2.
set -euo pipefail
cd "$(dirname "$0")"

# Pin to a known-good release. Bump manually when upstream has a new stable.
D2_VERSION="${D2_VERSION:-v0.7.1}"

if command -v d2 >/dev/null 2>&1; then
  SYS_D2="$(command -v d2)"
  [[ -x "$SYS_D2" ]] || { echo "ERROR: d2 not executable at $SYS_D2 (PATH stale?)" >&2; exit 1; }
  ln -sf "$SYS_D2" d2
  echo "Linked bin/d2 -> $SYS_D2"
  exit 0
fi

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64|amd64) ARCH=amd64 ;;
  arm64|aarch64) ARCH=arm64 ;;
  *) echo "ERROR: unsupported arch: $ARCH" >&2; exit 1 ;;
esac

# macOS homebrew shortcut (keeps macOS users on a managed install)
if [[ "$OS" == "darwin" ]] && command -v brew >/dev/null 2>&1; then
  echo "Installing d2 via Homebrew..."
  brew install d2
  SYS_D2="$(command -v d2)"
  [[ -x "$SYS_D2" ]] || { echo "ERROR: d2 not executable at $SYS_D2 (PATH stale?)" >&2; exit 1; }
  ln -sf "$SYS_D2" d2
  echo "Linked bin/d2 -> $SYS_D2"
  exit 0
fi

# Direct release download: asset name pattern is:
#   d2-${VERSION}-${OS}-${ARCH}.tar.gz
case "$OS" in
  darwin|linux) ;;
  *) echo "ERROR: unsupported OS: $OS (run installer on macOS/Linux, or install d2 manually)" >&2; exit 1 ;;
esac

ASSET="d2-${D2_VERSION}-${OS}-${ARCH}.tar.gz"
URL="https://github.com/terrastruct/d2/releases/download/${D2_VERSION}/${ASSET}"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "Downloading $URL ..."
curl -fsSL --connect-timeout 15 --max-time 120 --retry 3 --retry-delay 2 "$URL" -o "$WORK/d2.tgz"

tar -xzf "$WORK/d2.tgz" -C "$WORK"
# Tarball top-level dir is d2-${VERSION}/
EXTRACTED_BIN="$WORK/d2-${D2_VERSION}/bin/d2"
[[ -x "$EXTRACTED_BIN" ]] || {
  echo "ERROR: expected binary at $EXTRACTED_BIN after extract" >&2
  echo "Tarball contents:" >&2
  tar -tzf "$WORK/d2.tgz" | head >&2
  exit 1
}
install -m 0755 "$EXTRACTED_BIN" d2

echo "Installed bin/d2 ($(./d2 --version 2>&1 | head -1))"
