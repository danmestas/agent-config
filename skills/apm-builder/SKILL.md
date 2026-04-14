---
name: apm-builder
description: >
  Use when building, scaffolding, or packaging APM (Agent Package Manager) bundles.
  Triggers on: "create APM package", "build apm bundle", "package skills for distribution",
  "apm init", "export plugin", "scaffold agent package", or when distributing skills,
  agents, instructions, hooks, or MCP configs as reusable packages across teams or projects.
---

# APM Builder

Build production-grade APM packages from minimal direction. APM (microsoft/apm) is a dependency manager for AI agent configuration — like npm but for skills, agents, prompts, instructions, hooks, plugins, and MCP servers.

Docs: https://microsoft.github.io/apm/

## Workflow

```
1. Clarify  — What primitives? What targets? What purpose?
2. Scaffold — apm init, create .apm/ structure
3. Author   — Write each primitive in correct format
4. Validate — apm install --dry-run, apm audit
5. Pack     — apm pack (or --format plugin for Claude Code plugin export)
```

## Package Structure

```
my-package/
├── apm.yml                          # Manifest (required)
├── SKILL.md                         # Package-level skill (optional, makes it a hybrid package)
├── .apm/                            # Authored primitives
│   ├── instructions/
│   │   └── *.instructions.md        # Coding standards, guardrails
│   ├── skills/
│   │   └── skill-name/SKILL.md      # Reusable AI capabilities
│   ├── prompts/
│   │   └── *.prompt.md              # Slash commands
│   ├── agents/
│   │   └── *.agent.md               # Specialized AI personas
│   ├── hooks/
│   │   └── *.json                   # Lifecycle event handlers
│   └── contexts/
│       └── *.context.md             # Shared context files
├── scripts/                         # Supporting scripts (optional)
├── references/                      # Reference docs (optional)
└── examples/                        # Example files (optional)
```

## apm.yml Manifest

```yaml
name: my-package
version: 1.0.0
description: One-line description of what this package provides
# target: all                        # Optional: copilot|claude|cursor|codex|opencode|all
dependencies:
  apm:
    - owner/repo                     # Full package
    - owner/repo/skills/skill-name   # Single skill from monorepo
    - owner/repo#v1.0.0              # Pinned version
  # mcp:                             # Optional MCP server deps
  #   server-name:
  #     command: npx
  #     args: ["-y", "server-package"]
# devDependencies:                   # Excluded from plugin bundles
#   apm:
#     - owner/repo-dev-tools
```

## Primitive Formats

### Instructions (.instructions.md)

```markdown
---
description: When this instruction applies
globs: "src/**/*.ts"
---

# Instruction Title

Rules and guidelines the agent should follow.
- Be specific and actionable
- No vague platitudes
```

### Skills (SKILL.md)

```markdown
---
name: skill-name
description: Use when [specific triggering conditions]
---

# Skill Name

Core capability description and guidelines.

## When to Use
## Guidelines
## Examples
```

Naming: lowercase alphanumeric + hyphens, 1-64 chars, no consecutive/leading/trailing hyphens.

### Prompts (.prompt.md)

```markdown
---
description: What this slash command does
---

# Prompt Title

Instructions that execute when the slash command is invoked.
```

### Agents (.agent.md)

```markdown
---
name: agent-name
description: What this agent does
---

# Agent Name

System prompt and behavioral instructions for this persona.
```

### Hooks (.json)

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hook": "echo 'Checking bash command...'"
      }
    ]
  }
}
```

## Target Deployment Map

Where primitives land per target:

| Primitive | Claude Code (.claude/) | Copilot (.github/) | Cursor (.cursor/) |
|-----------|----------------------|--------------------|--------------------|
| Instructions | commands/ | instructions/ | rules/ |
| Skills | skills/ | skills/ | skills/ |
| Prompts | **not supported** | prompts/ | prompts/ |
| Agents | agents/ | agents/ | agents/ |
| Hooks | hooks.json (merged) | — | — |

## CLI Reference

### Installation

```bash
# macOS / Linux
curl -sSL https://aka.ms/apm-unix | sh

# Windows
irm https://aka.ms/apm-windows | iex

# Verify
apm --version
```

### `apm init` — Scaffold a New Package

```bash
apm init my-package            # Interactive setup
apm init my-package -y         # Accept defaults (name from arg, version 1.0.0)
apm init my-package --plugin   # Plugin authoring mode (adds plugin export config)
```

Creates `apm.yml` with name, version, empty dependencies. With `--plugin`, also scaffolds `.apm/` directory structure.

### `apm install` — Install & Deploy Dependencies

```bash
apm install                           # Install all deps from apm.yml
apm install owner/repo                # Add + install a package (shorthand)
apm install owner/repo#v2.0.0         # Pin to tag/branch/commit
apm install owner/repo/skills/my-skill # Single skill from a monorepo
apm install https://github.com/o/r.git # Full HTTPS URL
apm install git@github.com:o/r.git    # SSH URL
apm install ./local/path              # Local filesystem (dev only — not packable)
```

**Flags:**

| Flag | Effect |
|------|--------|
| `--target copilot\|claude\|cursor\|codex\|opencode\|all` | Force deployment to specific target directories |
| `--dev` | Add to `devDependencies` (excluded from plugin bundles) |
| `-g, --global` | Install to user scope (`~/.claude/`, `~/.github/`, etc.) |
| `--force` | Overwrite locally-authored files (default: skip conflicts) |
| `--dry-run` | Preview what would be installed without writing anything |
| `--only apm\|mcp` | Install only APM packages or only MCP servers |

**What happens on install:**
1. Downloads packages to `apm_modules/owner/repo/`
2. Resolves transitive dependencies
3. Deploys primitives to target directories (`.claude/`, `.github/`, `.cursor/`, `.opencode/`)
4. Creates/updates `apm.lock.yaml` with pinned commit SHAs

### `apm uninstall` — Remove a Package

```bash
apm uninstall owner/repo       # Remove from apm.yml + delete deployed files
apm uninstall owner/repo --dry-run
apm uninstall -g owner/repo    # Remove from global scope
```

Removes from manifest, deletes from `apm_modules/`, and cleans all deployed integration files.

### `apm compile` — Compile Instructions/Contexts into AGENTS.md

```bash
apm compile                        # Auto-detect target from project structure
apm compile --target claude        # Force specific target
apm compile --target all           # Compile for all detected targets
apm compile --watch                # Re-compile automatically on file changes
apm compile --validate             # Check primitives without writing output
apm compile --dry-run              # Preview compilation output
apm compile --chatmode my-mode     # Prepend a specific chatmode
apm compile --with-constitution    # Include Spec Kit constitution
apm compile --no-constitution      # Exclude constitution
```

Merges `.apm/instructions/`, `.apm/contexts/`, and chatmodes into distributed `AGENTS.md` files per target.

### `apm pack` — Bundle for Distribution

```bash
apm pack                              # Bundle to ./build/
apm pack --target claude              # Only .claude/ files
apm pack --target all                 # All platform files
apm pack --format plugin              # Export as native plugin (plugin.json generated)
apm pack --format apm                 # Default: APM bundle format
apm pack --archive                    # Output as .tar.gz instead of directory
apm pack -o ./dist/                   # Custom output directory
apm pack --dry-run                    # Preview without writing
```

**Requires:** `apm.lock.yaml` must exist (run `apm install` first). No local path dependencies allowed.

**Bundle output structure:**
```
build/my-package-1.0.0/
├── .claude/                  # (if target includes claude)
│   ├── skills/
│   ├── agents/
│   └── commands/
├── .github/                  # (if target includes copilot)
├── apm.lock.yaml             # Enriched with pack metadata
└── plugin.json               # (only with --format plugin)
```

**Cross-target remapping:** When packing for a different target than authored, skills and agents paths are automatically remapped (e.g., `.github/skills/` → `.claude/skills/`).

### `apm unpack` — Extract a Bundle

```bash
apm unpack ./build/my-package-1.0.0.tar.gz    # Extract with verification
apm unpack ./bundle -o ./target-dir            # Custom extraction target
apm unpack --skip-verify ./bundle.tar.gz       # Skip integrity check
apm unpack --dry-run ./bundle.tar.gz           # Preview extraction
apm unpack --force ./bundle.tar.gz             # Override security findings
```

Additive only — never deletes existing files. Bundle files overwrite on conflict.

### `apm audit` — Security Scanning

```bash
apm audit                          # Scan installed packages for hidden unicode
apm audit --strip                  # Remove dangerous characters in-place
apm audit --format json            # Output as JSON (also: text, sarif, markdown)
apm audit --ci                     # Lockfile consistency check (for CI pipelines)
```

Detects hidden Unicode characters that could embed invisible prompt injection instructions.

### `apm deps` — Dependency Inspection

```bash
apm deps list                      # Table of all installed dependencies
apm deps tree                      # Hierarchical dependency tree
apm deps clean                     # Remove entire apm_modules/ directory
apm deps update                    # Update all deps to latest refs
apm deps update owner/repo         # Update specific package
```

### `apm view` — Package Metadata

```bash
apm view owner/repo                # Display package metadata
apm view owner/repo --versions     # List remote versions/tags
```

### `apm outdated` — Check for Updates

```bash
apm outdated                       # Compare locked versions against latest
```

### `apm prune` — Clean Orphans

```bash
apm prune                          # Remove packages in apm_modules/ not in apm.yml
```

### `apm config` — CLI Settings

```bash
apm config get                     # Show all settings
apm config get auto-integrate      # Show specific setting
apm config set auto-integrate true # Enable automatic .prompt.md integration
```

### `apm search` & `apm marketplace` — Discovery

```bash
apm search "code review"           # Search marketplace for plugins
apm marketplace                    # Browse registered marketplaces
```

### `apm run` (Experimental) — Execute Prompts

```bash
apm run my-prompt                  # Execute a .prompt.md with parameters
```

### `apm runtime` (Experimental) — Manage AI Runtimes

```bash
apm runtime list                   # Show installed runtimes and status
apm runtime setup copilot          # Install a runtime (copilot, codex, llm)
apm runtime remove codex           # Uninstall a runtime
apm runtime status                 # Active runtime preference order
```

### GitHub Actions Integration

Use `microsoft/apm-action` in CI:

```yaml
# Install deps in CI
- uses: microsoft/apm-action@v1

# Pack for distribution
- uses: microsoft/apm-action@v1
  with:
    pack: true

# Restore from bundle (no APM/Python/network needed)
- uses: microsoft/apm-action@v1
  with:
    bundle: ./path/to/bundle.tar.gz
```

## Building for Claude Code Specifically

Claude Code receives: skills, agents, commands (from instructions), hooks. **Not prompts.**

To export a Claude Code plugin:

```bash
apm pack --format plugin --target claude
```

This generates a `plugin.json` manifest automatically and remaps:
- `.apm/agents/*.agent.md` → `agents/*.agent.md`
- `.apm/skills/*/SKILL.md` → `skills/*/SKILL.md`
- `.apm/prompts/*.prompt.md` → `commands/*.md` (renamed)
- `.apm/instructions/*.instructions.md` → `instructions/*.instructions.md`
- `.apm/hooks/*.json` → `hooks.json` (merged)

## Monorepo Pattern (Skill Collections)

For distributing multiple independent skills:

```
awesome-skills/
├── apm.yml
├── .apm/skills/
│   ├── code-review/SKILL.md
│   ├── tdd-workflow/SKILL.md
│   └── api-design/SKILL.md
```

Each skill installable individually: `apm install your-org/awesome-skills/skills/code-review`

## Checklist

Before distributing:

- [ ] `apm.yml` has name, version, description
- [ ] All skill names: lowercase, hyphens, 1-64 chars
- [ ] Skill descriptions start with "Use when..."
- [ ] Instructions have `description` and optional `globs` frontmatter
- [ ] `apm install --dry-run` succeeds
- [ ] `apm audit` clean (no hidden unicode)
- [ ] `apm pack --dry-run` shows expected files
- [ ] `apm_modules/` in `.gitignore`
- [ ] `apm.yml` and `apm.lock.yaml` committed

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Prompts for Claude Code target | Claude Code ignores prompts — use instructions or skills instead |
| Skill name with uppercase/spaces | Lowercase + hyphens only: `my-skill` not `My Skill` |
| Missing SKILL.md in skill dir | Every skill directory must have a `SKILL.md` at root |
| Forgetting `--format plugin` | Default pack format is `apm`, not plugin. Explicit flag needed for plugin export |
| Huge SKILL.md files | Keep skills focused. Split heavy reference into supporting files |
| Local path deps in apm.yml | `apm pack` rejects filesystem paths — use git URLs |
