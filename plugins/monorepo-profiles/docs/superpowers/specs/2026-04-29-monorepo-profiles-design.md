# monorepo-profiles — Design Spec

**Status:** Approved 2026-04-29
**Owner:** dmestas
**Audience:** v1 implementation
**Predecessor:** `dx-audit-claude-code-monorepo.md` (problem motivation)

## Problem

Claude Code is project-scoped for almost every config layer except `CLAUDE.md`. In a monorepo where one engineer alternates between frontend (`apps/web/`) and backend (`services/api/`) work, switching context means manually toggling plugins, swapping `.mcp.json`, editing `settings.local.json`, and accepting that auto-memory mixes both contexts. The audit (`/Users/dmestas/projects/dx-audit-claude-code-monorepo.md`) scored this defining workflow 3/10.

## Goal

Ship a Claude Code plugin that lets the user define named **profiles** (one JSON file per profile in `<repo>/.claude/profiles/`) and atomically swap the managed config layers with a single slash command. Profiles are committed to the repo so the team shares them.

## Non-goals (v1)

- Cross-harness support (Codex, Gemini, Cursor, Copilot). Architecture leaves room for it but no adapters ship.
- Mid-session swap of plugins or MCP servers. Switch requires a Claude Code restart — restart prompt is part of the UX.
- Snapshot/rollback machinery. Files under git are recovered with `git restore`; `settings.local.json` is the user's responsibility (one-time backup).
- Drift detection beyond a presence check.
- Concurrency control. Solo dev, no lock file.
- Per-skill or per-agent toggling within a plugin. Only plugin-level enable/disable is supported (harness limitation).

## Approach

A single Node script (`bin/mr-profile.mjs`) does all the work, invoked by a slash command and a SessionStart hook. Profiles overwrite the files they manage; manual edits to those files between switches are lost. This invariant — **the profile is the single source of truth for managed files** — keeps the implementation simple and the mental model clean.

When the user wants a managed file to contain something the profile doesn't say, they edit the profile, not the file.

## Architecture

### Source repository

```
~/projects/monorepo-profiles/
├── .claude-plugin/plugin.json     # Claude Code plugin manifest
├── commands/profile.md            # /profile slash command body
├── hooks/hooks.json               # SessionStart registration
├── bin/mr-profile.mjs             # all logic, ~200 LOC, single file
├── test/
│   ├── mr-profile.test.mjs        # ~150 LOC, ~10 tests
│   └── fixtures/sample/           # one fixture monorepo
├── docs/superpowers/specs/        # this doc lives here
└── README.md
```

### Per-monorepo files (created/managed by the plugin in user repos)

```
<repo>/.claude/
├── profiles/
│   ├── frontend.json              # committed
│   └── backend.json               # committed
└── active-profile                 # gitignored, one line: "backend"
```

User adds `active-profile` to `.gitignore` once during onboarding (mentioned in README).

## Components

### `/profile` slash command

`commands/profile.md` defines a single dispatcher with two subcommands:

| Subcommand | Effect |
|---|---|
| `/profile switch <name>` | Calls `mr-profile switch <name>`. Writes managed files. Prints restart prompt. |
| `/profile status` | Calls `mr-profile status`. Prints active profile name + presence/absence of each managed file. |

### SessionStart hook

`hooks/hooks.json` registers `bin/mr-profile.mjs session-start` on the SessionStart event. The hook reads `<repo>/.claude/active-profile`, loads the named profile, concatenates the contents of `instruction_fragments`, and emits a JSON object to stdout in the schema Claude Code's hook system expects. The expected shape (per current Claude Code docs) is:

```json
{"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "..."}}
```

**Implementation step 1 must verify this schema against the live Claude Code hook documentation before writing the hook.** If it has changed, update the schema in code. This is the only spec assumption that requires runtime verification.

If no `active-profile` file exists, the hook exits 0 with no output.

### `bin/mr-profile.mjs`

Single Node ESM script. Subcommands:

| Subcommand | Args | Output |
|---|---|---|
| `switch <name>` | profile name | applies profile, prints restart prompt to stdout, exit 0 on success |
| `status` | none | prints active profile + managed-file checks, exit 0 |
| `session-start` | none | emits JSON `additionalContext` for SessionStart hook, exit 0 |

The script auto-detects repo root by walking up from `process.cwd()` looking for `.claude/profiles/`. If none is found, it exits 1 with an actionable message.

## Profile schema

Example `<repo>/.claude/profiles/backend.json`:

```json
{
  "name": "backend",
  "description": "Go API services + Postgres + observability",
  "mcp_servers": {
    "signoz": { "command": "npx", "args": ["@signoz/mcp"], "env": {} },
    "github": { "command": "npx", "args": ["@modelcontextprotocol/server-github"] }
  },
  "permissions": {
    "allow": ["Bash(go *)", "Bash(docker *)", "Bash(psql *)", "Bash(kubectl get *)"],
    "deny":  ["Bash(rm -rf *)", "Bash(kubectl delete *)"]
  },
  "plugins": [
    "software-philosophy@agent-plugins",
    "gopls-lsp@claude-plugins-official",
    "code-review@claude-plugins-official"
  ],
  "local_skills": "services/api/.claude/skills",
  "local_agents": "services/api/.claude/agents",
  "instruction_fragments": [
    ".claude/profiles/backend.preamble.md"
  ]
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | Must equal the JSON filename stem (e.g. `backend.json` → `"backend"`) |
| `description` | string | no | Shown in `status` output |
| `mcp_servers` | object | no | Same shape as `.mcp.json`'s `mcpServers`. Profile fully owns `.mcp.json`. |
| `permissions.allow` | string[] | no | Replaces `settings.local.json` allow list |
| `permissions.deny` | string[] | no | Replaces deny list |
| `plugins` | string[] | no | `name@marketplace` keys. Profile fully owns the user-level `enabledPlugins` map for these names. (Plugins not listed by any profile are not touched.) |
| `local_skills` | string | no | Path **relative to repo root** pointing to a directory of skills; symlinked to `~/.claude/skills/<profile-name>/` |
| `local_agents` | string | no | Path **relative to repo root** pointing to a directory of agents; symlinked to `~/.claude/agents/<profile-name>/` |
| `instruction_fragments` | string[] | no | Paths relative to repo root; concatenated into SessionStart `additionalContext`. Reserve this for supplementary content not picked up by Claude Code's CLAUDE.md cwd cascade — e.g., profile-specific preambles. Listing CLAUDE.md itself is allowed but redundant; the cascade already injects it. |

### Managed files — uniform per-key ownership

Every managed file follows the same rule: **the profile owns specific keys it lists; every other key in that file is preserved.** This single rule applies to all writes.

| Path | Profile-owned key(s) | Preserved on the same file |
|---|---|---|
| `<repo>/.mcp.json` | `mcpServers` | any other top-level keys (none today; future-proofing) |
| `<repo>/.claude/settings.local.json` | `permissions.allow`, `permissions.deny` | every other top-level key (`env`, `hooks`, etc.) |
| `~/.claude/settings.json` | `enabledPlugins[<key>]` for each key in the previous profile's plugins ∪ the new profile's plugins | all other keys including `enabledPlugins` keys for non-managed plugins |
| `~/.claude/skills/<profile-name>/` | the symlink itself | nothing else under `~/.claude/skills/` |
| `~/.claude/agents/<profile-name>/` | the symlink itself | nothing else under `~/.claude/agents/` |
| `<repo>/.claude/active-profile` | the entire file | n/a (single-purpose file) |

### Write order

Writes happen in this fixed order so that mid-write failure damages the most-recoverable files first and leaves the completion flag in a state the next `/profile status` can detect:

1. `<repo>/.mcp.json` — git-tracked, trivial restore on failure
2. `~/.claude/skills/<name>/` and `~/.claude/agents/<name>/` symlinks — idempotent, easy to delete
3. `<repo>/.claude/settings.local.json` — gitignored; the user keeps a one-time backup per onboarding instructions
4. `~/.claude/settings.json` `enabledPlugins` — user-global; manual recovery, hardest case
5. `<repo>/.claude/active-profile` — written **last**, acts as the completion flag. If `active-profile` is missing or stale, `/profile status` will detect the partial state and report it.

### Plugin-key tracking — previous→current diff

Switching plugins requires knowing what to remove (last profile's plugins not in the new profile). The script computes this from local context only: the previous profile name comes from `<repo>/.claude/active-profile` (read before it is overwritten), and only the previous profile's `plugins` list is consulted. No "union of all profiles" — the apply behavior depends only on the two profiles directly involved.

Algorithm on `switch <new>`:

1. Read `active-profile` → previous name (may be absent).
2. If previous exists and previous profile file exists, load it; otherwise treat its plugins as `[]`.
3. Compute:
   - `to_enable  = new.plugins`
   - `to_disable = previous.plugins − new.plugins`
4. In `~/.claude/settings.json.enabledPlugins`: set keys in `to_enable` to `true`; remove keys in `to_disable`. All other keys are untouched.

Edge cases:
- First-ever switch (no previous): `to_disable = []`, just enable.
- Previous profile file deleted: warn to stderr, treat as `to_disable = []` (don't orphan plugins).
- Same profile re-applied: `to_enable = new.plugins`, `to_disable = previous.plugins − new.plugins = []`. No-op for plugin keys.

This replaces the earlier "union of all profiles" model — local reasoning only, no spooky action between unrelated profile files.

## Data flow

### Switch

```
/profile switch backend
  └→ mr-profile switch backend
      ├→ resolve repo root
      ├→ load <repo>/.claude/profiles/backend.json, validate
      ├→ load all profiles in <repo>/.claude/profiles/ (compute managed plugin set)
      ├→ write .mcp.json
      ├→ write .claude/settings.local.json (preserving non-permissions keys)
      ├→ write ~/.claude/settings.json enabledPlugins (managed-set diff)
      ├→ symlink ~/.claude/skills/<name>/ and ~/.claude/agents/<name>/
      ├→ write .claude/active-profile
      └→ print: "Profile 'backend' applied. Restart Claude Code to load plugins/MCP."
```

### Status

```
/profile status
  └→ mr-profile status
      ├→ read .claude/active-profile
      ├→ for each managed file/symlink:
      │     ├→ render what the active profile would write for that file (in memory)
      │     ├→ compute SHA-256 of rendered bytes vs SHA-256 of on-disk bytes
      │     └→ ✓ if equal, ✗ drifted (with a hint of which keys differ) if not
      └→ print active name + per-file ✓/✗ list + last-switch timestamp (if known)
```

The drift check is intentionally a fingerprint comparison rather than a full diff — cheap, no extra deps, and accurate enough for the user to know whether to re-apply or investigate.

### SessionStart

```
SessionStart event
  └→ hooks/hooks.json invokes mr-profile session-start
      ├→ read .claude/active-profile (skip if missing)
      ├→ load profile, read instruction_fragments
      ├→ concatenate (separator: "\n\n---\n\n")
      └→ stdout: {"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"..."}}
```

## Error handling

| Failure | Detection | Response |
|---|---|---|
| Profile not found | `fs.access` | exit 1, message lists available profiles |
| Profile JSON invalid | `JSON.parse` throws | exit 1, message includes file path and parse position |
| Schema invalid (e.g. missing `name`) | manual validator | exit 1, lists each violation |
| Repo root not found | walked to `/` | exit 1, "no .claude/profiles/ in any parent" |
| Mid-write failure | try/catch around each write | exit 1 with the failed path; user runs `git restore` |
| Symlink target missing | `fs.access` on source | warn to stderr, skip, continue |
| Symlink slot occupied by non-symlink | `fs.lstat` | exit 1, "remove `~/.claude/skills/<name>/` manually" |
| `active-profile` references missing profile | hook + status | hook exits 0 silently; status flags it |

No transactions, no rollback. The user's recovery is: `git restore .mcp.json` and a backup of `settings.local.json`.

## Testing

### Test stack

`node --test` (built-in to Node 20+, zero deps). Fixtures under `test/fixtures/sample/`. Each integration test copies the fixture to a `mkdtemp` directory and operates there.

### Test list

| # | Test | Category |
|---|---|---|
| 1 | profile rejects missing required fields with clear error | unit |
| 2 | profile loads a valid file | unit |
| 3 | malformed JSON gives file path + parse position | unit |
| 4 | apply writes `.mcp.json` with profile servers | unit |
| 5 | apply writes `settings.local.json`, preserves `env` key | unit |
| 6a | apply enables new profile's plugins; keys not in either previous or new are untouched | unit |
| 6b | apply removes plugins listed in previous profile but not in new profile | unit |
| 6c | apply with no previous profile only enables (no removals); previous-profile-deleted warns and skips removals | unit |
| 7 | apply creates skills/agents symlinks, refuses non-symlink target | unit |
| 8 | apply concatenates `instruction_fragments`, skips missing with warning | unit |
| 9a | status reports active profile + ✓ for each managed file when on-disk SHA matches profile-rendered SHA | unit |
| 9b | status reports ✗ drifted for a managed file whose on-disk SHA differs from rendered | unit |
| 9c | status detects partial state when `active-profile` is absent but managed files exist | unit |
| 10 | session-start emits the verified Claude Code hook JSON schema with concatenated fragments | unit |

### TDD discipline

For each row:
1. Write the test → run → **see red**.
2. Implement minimum to make it pass → run → **see green**.
3. Refactor if needed → run → still green.
4. Commit.

Commit cadence: ~one commit per green. Never commit without a green test.

### Acceptance criteria

| ID | Criterion | Verified by |
|---|---|---|
| AC-1 | Profile JSON loads or rejects with actionable error | tests 1-3 |
| AC-2 | Each managed file follows the per-key ownership rule; non-owned keys preserved | tests 4-5, 6a, 7, 8 |
| AC-3 | Plugin enable/remove follows previous→current diff with no spooky action between unrelated profiles | tests 6a, 6b, 6c |
| AC-4 | `/profile status` reports active profile + per-file SHA-fingerprint match (✓ / ✗ drifted / partial-state) | tests 9a, 9b, 9c |
| AC-5 | `/profile switch <name>` is idempotent: applying same profile twice yields same on-disk state | each of tests 4-8 runs apply twice and asserts identical output |
| AC-6 | SessionStart hook emits the verified Claude Code JSON schema with concatenated fragments | test 10 |
| AC-7 | Manual: real Claude Code session post-restart sees new MCP servers, permissions, enabled plugins | manual checklist (one-time) |

### Manual checklist (one-time, post-implementation)

1. Install plugin in Claude Code locally (file:// install or symlink into plugins cache).
2. In a fixture monorepo, create `frontend.json` and `backend.json` profiles.
3. `/profile switch frontend` → exit Claude Code → `claude` again → `/profile status` shows frontend active and Claude session has frontend MCP servers.
4. `/profile switch backend` → restart → status shows backend, MCP and permissions reflect backend.
5. Manually edit `.mcp.json` → `/profile switch backend` again → file is overwritten (confirms the invariant).

## Out of scope, but acknowledged

- **Cross-harness use.** v1 is Claude Code-only. The plugin shell (manifest, slash command, hook config) is Claude-specific. The core script `bin/mr-profile.mjs` is harness-agnostic — it reads JSON profiles and writes standard config files — so a future adapter for Cursor/Codex/Gemini could invoke it from their hook systems, but no such adapters ship in v1. Profile schema choices should not be driven by hypothetical adapters.
- **Per-skill toggling.** Harness loads all skills in `~/.claude/skills/`. Symlinking a profile-bundled dir gives those skills; harness has no per-skill enable knob.
- **Auto cwd-binding.** A profile does not declare `activates_when: <glob>`. Switching is always explicit.
- **Symlinking `.mcp.json` into the profile (v2 candidate).** v1 keeps profile and `.mcp.json` as separate files; hand-edits to `.mcp.json` are lost on next switch. The proper "define error out of existence" answer is to make `.mcp.json` a symlink into a per-profile rendered file so editing it edits the active profile's data — but that requires restructuring profiles from single JSON files to directories. Logged for v2.

## File creation/modification scope (v1 implementation)

To avoid scope creep, the implementation creates exactly these files:

```
monorepo-profiles/.claude-plugin/plugin.json
monorepo-profiles/commands/profile.md
monorepo-profiles/hooks/hooks.json
monorepo-profiles/bin/mr-profile.mjs
monorepo-profiles/test/mr-profile.test.mjs
monorepo-profiles/test/fixtures/sample/.claude/profiles/frontend.json
monorepo-profiles/test/fixtures/sample/.claude/profiles/backend.json
monorepo-profiles/test/fixtures/sample/AGENTS.md
monorepo-profiles/README.md
monorepo-profiles/.gitignore
```

Approximate sizes:
- `bin/mr-profile.mjs` — ~200 LOC
- `test/mr-profile.test.mjs` — ~150 LOC
- everything else — small

Total budget: ~400 LOC source + tests, plus configuration.
