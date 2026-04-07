---
name: doppler
description: Use when migrating .env files to Doppler secrets management, setting up Doppler for a project, or when asked to secure environment variables. Triggers on .env files containing API keys, tokens, or secrets that should not be in plaintext on disk.
---

# Migrate .env to Doppler

Detect `.env` files, push secrets to Doppler, gitignore and delete the plaintext file, verify, and document.

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

# Create (idempotent — fails gracefully if exists)
doppler projects create "$PROJECT" --description "$(head -1 README.md 2>/dev/null)" 2>/dev/null || true

# Link this directory
doppler setup --project "$PROJECT" --config dev --no-interactive
```

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
| Login | `doppler login` |
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
