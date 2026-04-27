#!/usr/bin/env bash
# install-dot.sh — install GraphViz (the `dot` binary).
# Strategy:
#   1. Already on PATH?  Symlink to bin/dot and exit.
#   2. macOS + Homebrew? `brew install graphviz`, then symlink.
#   3. Debian/Ubuntu with apt? `sudo apt-get install -y graphviz`, then symlink.
#   4. Otherwise fail with instructions.
set -euo pipefail
cd "$(dirname "$0")"          # lands in bin/

if command -v dot >/dev/null 2>&1; then
  SYS_DOT="$(command -v dot)"
  ln -sf "$SYS_DOT" dot
  echo "Linked bin/dot -> $SYS_DOT"
  exit 0
fi

OS="$(uname -s)"
if [[ "$OS" == "Darwin" ]]; then
  if command -v brew >/dev/null 2>&1; then
    echo "Installing graphviz via Homebrew..."
    brew install graphviz
    SYS_DOT="$(command -v dot)"
    [[ -x "$SYS_DOT" ]] || { echo "ERROR: dot still not on PATH after brew install" >&2; exit 1; }
    ln -sf "$SYS_DOT" dot
    echo "Linked bin/dot -> $SYS_DOT"
    exit 0
  fi
  echo "ERROR: Homebrew not found on macOS; install from https://brew.sh then re-run." >&2
  exit 1
fi

if [[ "$OS" == "Linux" ]]; then
  if command -v apt-get >/dev/null 2>&1; then
    echo "Installing graphviz via apt..."
    if [[ "$(id -u)" -eq 0 ]]; then
      apt-get update && apt-get install -y graphviz
    else
      sudo apt-get update && sudo apt-get install -y graphviz
    fi
    SYS_DOT="$(command -v dot)"
    [[ -x "$SYS_DOT" ]] || { echo "ERROR: dot still not on PATH after apt install" >&2; exit 1; }
    ln -sf "$SYS_DOT" dot
    echo "Linked bin/dot -> $SYS_DOT"
    exit 0
  fi
  if command -v dnf >/dev/null 2>&1; then
    echo "Installing graphviz via dnf..."
    if [[ "$(id -u)" -eq 0 ]]; then
      dnf install -y graphviz
    else
      sudo dnf install -y graphviz
    fi
    SYS_DOT="$(command -v dot)"
    [[ -x "$SYS_DOT" ]] || { echo "ERROR: dot still not on PATH after dnf install" >&2; exit 1; }
    ln -sf "$SYS_DOT" dot
    echo "Linked bin/dot -> $SYS_DOT"
    exit 0
  fi
  if command -v apk >/dev/null 2>&1; then
    echo "Installing graphviz via apk..."
    if [[ "$(id -u)" -eq 0 ]]; then
      apk add --no-cache graphviz
    else
      sudo apk add --no-cache graphviz
    fi
    SYS_DOT="$(command -v dot)"
    [[ -x "$SYS_DOT" ]] || { echo "ERROR: dot still not on PATH after apk install" >&2; exit 1; }
    ln -sf "$SYS_DOT" dot
    echo "Linked bin/dot -> $SYS_DOT"
    exit 0
  fi
fi

cat >&2 <<EOF
ERROR: couldn't auto-install graphviz.
Install manually and re-run this script:
  macOS:           brew install graphviz
  Debian/Ubuntu:   sudo apt install graphviz
  Fedora/RHEL:     sudo dnf install graphviz
  Alpine:          sudo apk add graphviz
  Windows:         winget install Graphviz.Graphviz
EOF
exit 1
