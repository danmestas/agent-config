#!/usr/bin/env bash
# install-mermaid.sh — install beautiful-mermaid into bin/node_modules/.
# Requires Node 18+ and npm (comes with Node).
set -euo pipefail
cd "$(dirname "$0")"

# --- Pre-flight: Node + npm ---
if ! command -v node >/dev/null 2>&1; then
  cat >&2 <<EOF
ERROR: node not found on PATH.
beautiful-mermaid requires Node 18+.
Install Node from https://nodejs.org (or via fnm/nvm/asdf), then re-run.
EOF
  exit 1
fi

NODE_MAJOR="$(node -e 'process.stdout.write(String(process.versions.node.split(".")[0]))')"
if (( NODE_MAJOR < 18 )); then
  echo "ERROR: Node $NODE_MAJOR detected; beautiful-mermaid needs >= 18." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "ERROR: npm not on PATH (should ship with Node)." >&2
  exit 1
fi

# --- Minimal package.json so npm doesn't complain / mutate parents ---
cat > package.json <<'EOF'
{
  "name": "pikchr-generator-mermaid-bridge",
  "version": "1.0.0",
  "private": true,
  "description": "Runtime deps for the mermaid engine of pikchr-generator. Installed via bin/install-mermaid.sh; NOT packaged into apm bundle.",
  "dependencies": {
    "beautiful-mermaid": "1.1.3",
    "elkjs": "^0.11.0",
    "entities": "^7.0.1"
  }
}
EOF

echo "Installing beautiful-mermaid@1.1.3 + elkjs + entities ..."
npm install --prefix . --no-audit --no-fund --loglevel=error

# Sanity check
if [[ ! -f node_modules/beautiful-mermaid/package.json ]]; then
  echo "ERROR: beautiful-mermaid didn't install" >&2
  exit 1
fi

echo "Installed: $(node -e 'const p=require("./node_modules/beautiful-mermaid/package.json"); console.log(p.name, p.version)')"
