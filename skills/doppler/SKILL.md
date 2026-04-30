---
name: doppler
version: 0.1.0
description: >-
  Use when migrating .env files to Doppler secrets management, setting up
  Doppler for a project, or when asked to secure environment variables. Triggers
  on .env files containing API keys, tokens, or secrets that should not be in
  plaintext on disk.
type: skill
targets:
  - claude-code
category:
  primary: integrations
---

# Migrate .env to Doppler

Detect `.env` files, push secrets to Doppler, gitignore and delete the plaintext file, verify, and document.

## Idiomatic project setup (recommended)

These patterns cover ongoing use. The migration workflow below is a one-time bootstrap step.

### 1. Token type taxonomy

Pick the right token type for the context:

| Token type | Format | Permissions | Use case | Notes |
|---|---|---|---|---|
| Personal Token | `dp.pt.xxx` | Full account | Daily-driver dev (your laptop) | No default expiry. Mint at dashboard → Settings → Tokens |
| Service Token | `dp.st.xxx` | Config-scoped (one project + config) | CI / containers / production | Auto-detects project+config from token scope — no DOPPLER_PROJECT/DOPPLER_CONFIG env needed |
| Service Account Token | `dp.sa.xxx` | Account-level, not human | Agents / automation services | No human-account scope; safer than Personal in shared automation |

Production should **never** see a Personal Token. Use Service Tokens scoped per environment.

### 2. Authenticate via macOS Keychain → DOPPLER_TOKEN

Prefer keychain-managed Personal Token over `doppler login`:
- `doppler login` stores in keychain too, but the entry can desync ("Token not found in system keyring"), get wiped on OS upgrade, or silently expire
- Manual keychain via `security` is bulletproof and survives `doppler logout`/OS rebuilds
- Env var (`DOPPLER_TOKEN`) precedence beats config-file beats keychain — the env var always wins, no config drift

One-time setup:

```bash
# 1. Mint a Personal Token at https://dashboard.doppler.com/workplace/-/settings/me/tokens
#    Choose "Never expires" if available

# 2. Park in macOS Keychain (-U flag overwrites if entry exists)
security add-generic-password -a "$USER" -s doppler-cli-token -w 'dp.pt.xxxxxxxx' -U

# 3. Export from ~/.zshrc on shell startup
export DOPPLER_TOKEN="$(security find-generic-password -a "$USER" -s doppler-cli-token -w 2>/dev/null)"
```

Linux equivalents: `secret-tool` (libsecret) or `pass` (gpg-based) — adapt the lookup pattern.

### 3. Pin scope via `doppler.yaml` (committed)

`doppler.yaml` at repo root pins project + config so fresh clones work without interactive `doppler setup`:

```yaml
# doppler.yaml — committed to the repo
setup:
  - project: myproject
    config: dev
```

Monorepo variant — multiple sub-projects via `path:`:

```yaml
setup:
  - project: backend
    config: dev
    path: backend/
  - project: frontend
    config: dev
    path: frontend/
```

Override per-shell via env vars (e.g., switch to a CI config without editing the file):

```bash
DOPPLER_CONFIG=ci doppler run -- ./test
```

Precedence: `DOPPLER_PROJECT`/`DOPPLER_CONFIG` env > `doppler.yaml` > `.doppler/config.yaml` (created by `doppler setup`).

Commit `doppler.yaml`. Gitignore `.doppler/`.

### 4. direnv integration for auto-load on `cd`

Add `.envrc` to the repo (commit it; it has no secrets — secrets come from Doppler at runtime):

```bash
# .envrc — auto-load Doppler secrets when cd-ing into this repo
set -a
source <(doppler secrets download --no-file --format env)
test -f .env.local && source .env.local
set +a
```

One-time approval per machine: `direnv allow`.

**Caveat**: `eval`/`source` of env-format Doppler output breaks on secrets containing `?`, `*`, backticks, or multi-line values. For those, fall back to `doppler run --` invocation pattern:

```bash
doppler run -- ./your-script
```

### 5. Container / CI: service token in env

Containers and CI should use a Service Token (config-scoped), never a Personal Token. Inject as env:

```yaml
# docker-compose.yml
services:
  app:
    environment:
      DOPPLER_TOKEN: ${DOPPLER_TOKEN}  # dp.st.xxx — config-scoped service token
```

Inside container, install Doppler CLI and wrap your command:

```dockerfile
# Alpine
RUN wget -q -t3 'https://packages.doppler.com/public/cli/rsa.8004D9FF50437357.key' \
      -O /etc/apk/keys/cli@doppler-8004D9FF50437357.rsa.pub && \
    echo 'https://packages.doppler.com/public/cli/alpine/any-version/main' >> /etc/apk/repositories && \
    apk add doppler
CMD ["doppler", "run", "--", "your-command-here"]
```

Service Token auto-detects project+config from its scope — no `DOPPLER_PROJECT`/`DOPPLER_CONFIG` env vars needed in containers.

GitHub Actions:

```yaml
env:
  DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN }}
steps:
  - run: doppler run -- make test
```

### 6. Doppler MCP server (optional, for Claude Code agents)

The official `@dopplerhq/mcp-server` (npm) gives Claude Code typed JSON tool responses for secret operations — vs. shell-parsing `doppler` CLI output. Works on the Free plan; published by Doppler.

Add to `~/.claude.json` (user-scope) or repo `.mcp.json` (project-scope):

```json
{
  "mcpServers": {
    "doppler": {
      "command": "npx",
      "args": ["-y", "@dopplerhq/mcp-server", "--read-only"],
      "env": { "DOPPLER_TOKEN": "${DOPPLER_TOKEN}" }
    }
  }
}
```

`--read-only` gates write tools (set/update/delete) out of the agent's tool list — recommended unless you specifically want the agent to mutate secrets. Drop the flag to allow writes.

To pin the MCP server to a single project: append `"--project", "myproject"` to args.

> **Don't swallow stderr in shell setup.** Stale auth ("Token not found in system keyring", expired token, unreachable Doppler API) should surface immediately as a visible warning — not a silent secret-less environment that breaks your code with confusing "API_KEY undefined" errors hours later.
>
> Pattern from a working setup:
> ```bash
> if _doppler_out=$(doppler secrets download --no-file --format env 2>&1); then
>   eval "$(printf '%s\n' "$_doppler_out" | grep -v '^DOPPLER_')"
> else
>   print -P "%F{yellow}doppler: $_doppler_out%f"  # visible warning
> fi
> ```

## Prerequisites

```bash
brew install doppler    # or: curl -Ls https://cli.doppler.com/install.sh | sh
doppler login           # one-time per device
```

## Migration Steps

### 1. Detect and Parse

Find `.env` / `.env.*` files in the project root. Parse key-value pairs, handling:
- `export KEY=value` (shell-style)
- `KEY=value` (docker-style)
- Values with `=` in them (e.g. `HEADERS=x-api-key=abc123`)
- Quoted values (`KEY="value"` or `KEY='value'`)
- Skip comments (`#`) and blank lines

```bash
# Detection
ls .env .env.* 2>/dev/null
```

### 2. Create or Link Doppler Project

```bash
# Infer project name from directory or git remote
PROJECT=$(basename $(git rev-parse --show-toplevel 2>/dev/null || pwd))

# Create the Doppler project (idempotent — fails gracefully if exists)
doppler projects create "$PROJECT" --description "$(head -1 README.md 2>/dev/null)" 2>/dev/null || true

# Pin scope by committing doppler.yaml (replaces the older `doppler setup` flow)
cat > doppler.yaml <<EOF
setup:
  - project: $PROJECT
    config: dev
EOF
```

Commit `doppler.yaml` to the repo. Future clones don't need `doppler setup` — the CLI reads scope from this file.

### 3. Push Secrets

Use `KEY=value` positional syntax. Each pair is one positional arg:

```bash
doppler secrets set --project "$PROJECT" --config dev \
  "KEY1=value1" \
  "KEY2=value with spaces" \
  "KEY3=value=with=equals"
```

> [!warning] Quoting
> The entire `KEY=value` must be one shell argument. Wrap in double quotes. Doppler splits on the FIRST `=` only, so values containing `=` work fine.

### 4. Verify

```bash
doppler run -- env | grep KEY1
```

Confirm every secret from the `.env` file appears with the correct value.

### 5. Gitignore and Delete

```bash
# Add to .gitignore if not already present
grep -qxF '.env' .gitignore 2>/dev/null || echo -e '\n# Secrets\n.env\n.env.*' >> .gitignore

# Delete the plaintext file
rm .env
```

If other `.env.*` variants exist (`.env.local`, `.env.production`), consider creating separate Doppler configs (`dev`, `staging`, `production`) and migrating each.

### 6. Document

Add to CLAUDE.md / README.md:

```markdown
## Secrets (Doppler)

Environment secrets are managed by [Doppler](https://doppler.com). No `.env` files in the repo.

\```bash
# First time per device:
brew install doppler
doppler login
doppler setup          # links this directory

# Run with secrets:
doppler run -- <command>

# Run without secrets (works fine, features requiring secrets are disabled):
<command>
\```
```

Adjust the "without secrets" note to describe what degrades gracefully (e.g., "no telemetry export" or "uses SQLite instead of Postgres").

## Quick Reference

| Task | Command |
|------|---------|
| Install CLI | `brew install doppler` |
| Login | Personal Token in keychain (preferred) — see Idiomatic setup |
| Mint Personal Token | Dashboard → Settings → Tokens → Create CLI Token (Never expires) |
| Park token in keychain | `security add-generic-password -a "$USER" -s doppler-cli-token -w 'dp.pt.xxx' -U` |
| Pin scope (committed) | Write `doppler.yaml` with `setup: [{project: X, config: Y}]` |
| Auto-load via direnv | `.envrc` with `set -a; source <(doppler secrets download --no-file --format env); set +a` |
| Container service token | `DOPPLER_TOKEN=dp.st.xxx` env var; `doppler run -- cmd` inside |
| Create project | `doppler projects create NAME` |
| Link directory | `doppler setup --project NAME --config dev --no-interactive` |
| Set secrets | `doppler secrets set "KEY=value" "KEY2=value2"` |
| Run with secrets | `doppler run -- <command>` |
| List secrets | `doppler secrets` |
| Download as .env | `doppler secrets download --no-file --format env` |

## Multiple Environments

```bash
# Create configs for each environment
doppler configs create staging --project myapp
doppler configs create production --project myapp

# Set environment-specific secrets
doppler secrets set --config staging "DATABASE_URL=postgres://staging..."
doppler secrets set --config production "DATABASE_URL=postgres://prod..."

# Run with specific config
doppler run --config staging -- ./myapp
```

## CI/CD

Generate a service token for CI (no interactive login needed):

```bash
doppler configs tokens create ci-token --project myapp --config dev --plain
```

In GitHub Actions:
```yaml
env:
  DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN }}
steps:
  - run: doppler run -- make test
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `doppler secrets set KEY value` | Use `KEY=value` as one arg: `doppler secrets set "KEY=value"` |
| Forgetting to gitignore `.env` | Always add `.env` and `.env.*` to `.gitignore` |
| Not verifying after migration | Always run `doppler run -- env \| grep KEY` |
| Leaving `.env` after migration | Delete it — Doppler is the source of truth now |
| Hardcoding `doppler run` in Makefile | Don't — keep Makefile working without Doppler. Users prefix manually. |
| `doppler login` instead of keychain Personal Token | Token can desync, expire silently, or be wiped on OS upgrade — use manual keychain entry + `DOPPLER_TOKEN` env |
| Per-clone `doppler setup` ceremony | Commit `doppler.yaml` instead — fresh clones just work |
| Personal Token in CI/container | Use a Service Token (`dp.st.xxx`) — config-scoped, no human-account access |
| Swallowing Doppler stderr in shell setup | Loud failures — show stale-auth warnings visibly, don't silently ship secret-less env |
| `eval`/`source` of secrets with `?`/`*`/backticks/multiline | Fall back to `doppler run --` for those secrets — env-format download breaks on shell metacharacters |
