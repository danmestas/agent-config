FROM node:20-bookworm

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    curl \
    jq \
    python3 \
  && rm -rf /var/lib/apt/lists/*

# Install all 4 harness CLIs
# Claude Code — try npm first, fallback to curl install script
RUN npm install -g @anthropic-ai/claude-code 2>/dev/null \
  || curl -fsSL https://claude.ai/install.sh | bash

# Codex
RUN npm install -g @openai/codex

# Gemini CLI
RUN npm install -g @google/gemini-cli

# Pi coding agent
RUN npm install -g @mariozechner/pi-coding-agent

# Copy repo content into /workspace
COPY . /workspace

# Install apm-builder deps (tsx, vitest, etc.)
WORKDIR /workspace/apm-builder
RUN npm install

# Make test scripts executable
RUN chmod +x /workspace/apm-builder/tests/integration/docker/test-runner.sh \
  && chmod +x /workspace/apm-builder/tests/integration/docker/scenarios/*.sh

WORKDIR /workspace

ENTRYPOINT ["/workspace/apm-builder/tests/integration/docker/test-runner.sh"]
