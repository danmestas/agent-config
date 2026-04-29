# monorepo-profiles v0.2 — Design Spec

**Status:** Approved 2026-04-29
**Owner:** dmestas
**Audience:** v0.2 implementation
**Predecessors:**
- `dx-audit-claude-code-monorepo.md` (original problem)
- `2026-04-29-monorepo-profiles-design.md` (v0.1 spec)
- `dx-audit-monorepo-profiles.md` (v0.1 audit, motivation for this work)

## Problem

The v0.1 plugin scored 5/10 on the workflow audit, anchored by two pains:

1. **Authoring is destructive.** The only way to test a profile is `/profile switch <name>`, which writes to live state and forces a Claude Code restart. Iterating on a new profile costs N restarts.
2. **`/profile status` is too shallow.** "✗ drifted" tells the user they're out of sync but not what diverged. They have to `cat` files and compare by eye.

A third pain — onboarding has no editor support — comes from the absence of a JSON Schema. Profiles are hand-written JSON with undiscoverable plugin IDs and field names; typos surface only after a destructive switch.

## Goal

Ship three additions in v0.2 that lift the audit score from 5/10 to ~7/10 without changing any v0.1 behavior:

1. **`/profile validate <name>`** — non-destructive correctness check
2. **`/profile diff <name>`** — preview what `/profile switch <name>` would change
3. **JSON Schema** + a single status detail addition

The fourth fix (drift detail in `/profile status`) is bundled here because it shares its key-diff machinery with `/profile diff`.

## Non-goals (v0.2)

- `/profile init` scaffolder — deferred to v0.3
- `/profile rollback` — still no rollback in v0.2
- Mid-session reload (no restart) — requires Claude Code harness investigation, deferred
- Plugin installation precondition check (verify referenced plugins are actually installed on this machine) — deferred to v0.3
- Backup `settings.local.json` on first switch — deferred to v0.3
- `$schema` field in user profiles — schema is consumed via editor config, not embedded

## Approach

All three features extend the existing single-file Node script (`bin/mr-profile.mjs`). No new modules, no new dependencies. The render helpers introduced in v0.1 (`renderMcpBytes`, `renderPermissionsBytes`) become the shared computation engine for validate, diff, and status's drift count — reinforcing the "single source of truth" property already established for apply ↔ status.

Both new subcommands take an **optional** profile name; when omitted, they default to the active profile (read from `<repo>/.claude/active-profile`). If neither is set, they exit 2 with USAGE.

## Architecture

### Source repository changes

```
bin/mr-profile.mjs                  # +~120 LOC: cmdValidate, cmdDiff, drift count, dispatch
test/mr-profile.test.mjs            # +~150 LOC: 8 new tests
.claude-plugin/profile.schema.json  # NEW (~50 lines, JSON Schema Draft-07)
README.md                           # +"Editor schema setup" section
```

### Subcommand surface (new)

| Subcommand | Args | Output | Exit |
|---|---|---|---|
| `validate [name]` | optional profile name; defaults to active | summary line + categorized issue list | 0 if no errors, 1 if any error |
| `diff [name]` | optional profile name; defaults to active | per-file structured diff | 0 always (informational) |

The existing `switch`, `status`, `session-start` subcommands are unchanged in semantics. `cmdStatus` gains the drift-count addition.

## Component: `cmdValidate`

```js
export async function cmdValidate({
  repoRoot, homeClaudeDir, name, stdout, stderr
})
```

**Algorithm:**

1. Resolve `name`: arg → falls back to `readActiveProfileName(repoRoot)` → if still null, write USAGE to stderr, return 2.
2. Load profile via existing `loadProfile(repoRoot, name)`. If load throws, write `error: <msg>` to stderr, return 1. (loadProfile already covers JSON parse + schema-required-field errors.)
3. Run extended checks (table below). Each check produces a list of `{level: 'error'|'warn', message: string}` entries.
4. Format and write the report. Return 1 if any `error` entry, else 0.

(The render functions `renderMcpBytes` / `renderPermissionsBytes` are pure JSON serialization with no realistic throw paths once `loadProfile` has succeeded; no need to wrap them.)

### Extended checks

| Check | Severity | Condition |
|---|---|---|
| `mcp_servers.<name>` missing both `command` and `url` | error | for each entry where neither field is a non-empty string |
| `mcp_servers.<name>.command` is non-string when present | error | type check |
| `plugins[i]` doesn't match `^[\w-]+@[\w-]+$` | warn | per item |
| `local_skills` source dir doesn't exist on disk | error | `fs.access(join(repoRoot, profile.local_skills))`. Apply would create a silent dangling symlink. |
| `local_agents` source dir doesn't exist on disk | error | same |
| `instruction_fragments[i]` path doesn't exist on disk | warn | per item |

**Why these severities:** errors describe states that would produce a useless `.mcp.json` after a switch (Claude Code would refuse to start the server), or render-function exceptions. Warnings describe states that won't break a switch but will silently fail at runtime — dangling symlinks, plugins that don't load, fragments that get skip-warned by the SessionStart hook.

**Excluded check:** "is the plugin actually installed in `~/.claude/plugins/installed_plugins.json`?" — this couples validate to user-local state and creates false negatives for team-shareable validation. Belongs in a v0.3 precondition check.

### Output (valid)

```
Profile 'backend': ✓ valid (3 plugins, 2 mcp servers, 1 fragment, skills, agents)
```

The summary lists count of plugins, mcp servers, instruction fragments, and yes/no for skills+agents (omitting fields that are absent).

**When the name was resolved implicitly from `active-profile`** (no positional arg passed), prepend a single line so the user knows which profile they actually validated:

```
Using active profile 'backend'.
Profile 'backend': ✓ valid (...)
```

### Output (issues)

```
Profile 'backend': ✗ 1 error, 2 warnings
  ERROR  mcp_servers.signoz: missing 'command' or 'url'
  WARN   instruction_fragments[0]: '.claude/profiles/backend.preamble.md' does not exist
  WARN   plugins[1]: 'gopls-lsp_typo' does not match 'name@marketplace' pattern
```

Header line summarizes counts. Issue lines start with two-space indent + 5-char level tag + 2 spaces + message. All output goes to **stdout** (the report is the answer; stderr is reserved for unexpected exceptions).

## Component: `cmdDiff`

```js
export async function cmdDiff({
  repoRoot, homeClaudeDir, name, stdout, stderr
})
```

**Algorithm:**

1. Resolve `name` (same fallback chain as validate).
2. Load profile. On error, write `error: <msg>` to stderr, return 1.
3. For each managed file, compute the diff. Diff structure: `{ path: string, status: 'match'|'differ'|'missing'|'wrong-target', changes: Change[] }`.
4. Format and write report. Return 0 (the report itself is the answer; differences are informational, not errors).

### Per-file diff strategy

| File | Owned namespace | Diff method |
|---|---|---|
| `<repo>/.mcp.json` | `mcpServers.*` | Set diff over keys; if both keys exist but values differ, mark `~ <key> (content differs)` (no deep recursion) |
| `<repo>/.claude/settings.local.json` | `permissions.allow[]`, `permissions.deny[]` | Set diff over array elements |
| `~/.claude/settings.json` | `enabledPlugins[<key>]` | **State projection.** Compute projected map: start from current `enabledPlugins`, set new profile's plugin keys to `true`, delete keys in `(prev.plugins − new.plugins)`. Diff current vs projected — only effective changes (false→true, or actually-deleted keys) appear. |
| `~/.claude/skills/<name>/` | the symlink | lstat + readlink; report missing / wrong-target / matches |
| `~/.claude/agents/<name>/` | same | same |
| `<repo>/.claude/active-profile` | the entire string | exact equality; report `~ was 'X', expected 'Y'` |

**Determining `prevProfile` for the plugin diff:** read `active-profile`. If the named profile differs from active, treat active as prev. If they match, prev = the same profile (so `to_disable = []` per the apply semantics).

**Why state projection rather than profile-vs-profile diff:** if you ran `/profile diff backend` while backend is already active, a profile-vs-profile diff would either show every backend plugin as `+ added` (with prev=null) or nothing at all. Neither is honest. Projecting current state forward through the apply algorithm, then diffing current vs projected, shows only the effective changes the user would observe on disk. Re-applying the active profile produces an empty plugin diff, as it should.

```js
// Projection sketch
const current = settings.enabledPlugins ?? {};
const projected = { ...current };
for (const k of newProfile.plugins) projected[k] = true;
for (const k of (prev?.plugins ?? []).filter(p => !newProfile.plugins.includes(p))) {
  delete projected[k];
}
// Diff current vs projected — effective changes only
```

### Output

When name was resolved implicitly from `active-profile`, prepend `Using active profile 'X'.` (same convention as `cmdValidate`).

Concrete example with the sample fixture, switching from active=frontend to backend:

```
Diff for profile 'backend' (vs current state):

.mcp.json:
  + mcpServers.signoz
  ~ mcpServers.github   (content differs)

.claude/settings.local.json:
  + permissions.allow: 'Bash(go *)'
  - permissions.allow: 'Bash(npm *)'

~/.claude/settings.json (enabledPlugins):
  + gopls-lsp@claude-plugins-official
  - frontend-design@claude-plugins-official

~/.claude/skills/backend:
  + would create symlink → /Users/.../services/api/.claude/skills

~/.claude/agents/backend:
  ✓ matches

.claude/active-profile:
  ~ was 'frontend', expected 'backend'

Run /profile switch backend to apply.
```

If a file is fully matched, it shows a single `✓ matches` line under its header. If everything matches across all files, the body is the headers + `✓ matches` per line, and a footer `No changes.` instead of the run-prompt.

Output to **stdout**. Stderr only on exception.

## Component: drift count in `cmdStatus`

Single change. The line that today reads:
```
.mcp.json: ✗ drifted
```
becomes one of two forms:
```
.mcp.json: ✗ drifted (3 keys differ)
.mcp.json: ✗ drifted (formatting only)
```

The two forms exist because `cmdStatus` already uses two layers of comparison:
- **SHA-256** flags any byte difference, including whitespace or key-order changes.
- **Key-diff** counts only key-level differences in the profile-owned namespace.

When SHA mismatches AND key-diff is non-empty: `(N keys differ)`. When SHA mismatches but key-diff is empty (user reordered keys, ran a formatter, etc.): `(formatting only)` — honest about the situation without misleading the user with a `(0 keys differ)` count.

For permissions, count = `len(allow_diff) + len(deny_diff)`. For enabledPlugins, the existing label `✗ missing required (<plugin>)` already names a specific plugin — keep it as-is, don't add a count.

A footer line is appended when any file is drifted:

```
Run /profile diff for details.
```

When everything matches, the footer is absent.

## Component: JSON Schema

**Path:** `.claude-plugin/profile.schema.json`

**Shape (Draft-07):**

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "$id": "https://example.invalid/monorepo-profiles/profile.schema.json",
  "title": "monorepo-profiles profile",
  "type": "object",
  "additionalProperties": false,
  "required": ["name"],
  "properties": {
    "name": { "type": "string", "pattern": "^[a-zA-Z0-9_-]+$" },
    "description": { "type": "string" },
    "mcp_servers": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "anyOf": [
          { "required": ["command"] },
          { "required": ["url"] }
        ],
        "properties": {
          "command": { "type": "string" },
          "args": { "type": "array", "items": { "type": "string" } },
          "env": { "type": "object", "additionalProperties": { "type": "string" } },
          "url": { "type": "string" }
        }
      }
    },
    "permissions": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "allow": { "type": "array", "items": { "type": "string" } },
        "deny":  { "type": "array", "items": { "type": "string" } }
      }
    },
    "plugins": {
      "type": "array",
      "items": { "type": "string", "pattern": "^[\\w-]+@[\\w-]+$" }
    },
    "local_skills": { "type": "string" },
    "local_agents": { "type": "string" },
    "instruction_fragments": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```

**Why these constraints:**
- `additionalProperties: false` at the top level catches typos like `mcpServers` (camelCase) instead of `mcp_servers`.
- The `anyOf` on each MCP server entry mirrors the runtime check in `cmdValidate` so editors flag the same issue at edit-time.
- The `plugins` regex catches `gopls-lsp` (missing marketplace) before a destructive switch.

**Why no `$schema` field added to user profiles:** committing a `$schema` URL into every profile JSON either ties them to a non-existent public URL or to a fragile relative path. Editor users can wire the schema once via `json.schemas` config without polluting profile files.

### README addition

Append a short section to `README.md`:

```markdown
## Editor schema setup (optional)

The plugin ships a JSON Schema for profile files. To get autocomplete, hover docs,
and typo detection in VS Code or Cursor, add to `.vscode/settings.json` in your
monorepo:

\`\`\`json
{
  "json.schemas": [
    {
      "fileMatch": [".claude/profiles/*.json"],
      "url": "/absolute/path/to/monorepo-profiles/.claude-plugin/profile.schema.json"
    }
  ]
}
\`\`\`

The plugin's install path is shown by `/plugin` in Claude Code. Or, for team-
shareable editor config, copy the schema into your repo (e.g. to
`.claude/profile.schema.json`) and commit it.
```

## Error handling

Inherits the existing model: `cmdValidate` and `cmdDiff` use the same `loadProfile` and `readActiveProfileName` helpers as the rest of the CLI, so behavior on missing/malformed profile files is consistent. The new error paths:

| Failure | Detection | Response |
|---|---|---|
| Subcommand without name AND no active profile | combined check | exit 2, USAGE on stderr |
| Diff: profile load fails | reuses loadProfile error | exit 1, `error: <msg>` on stderr |
| Diff: filesystem read fails (e.g. permission denied on `settings.local.json`) | per-file try/catch | report `~ <path>: read failed (<errno>)`, exit 0 (informational) |

## Testing

### TDD increments (8 new tests + 2 to update)

| # | Test | Phase |
|---|---|---|
| 1 | `cmdValidate`: valid backend profile → exit 0 with summary | Validate |
| 2 | `cmdValidate`: mcp server missing command/url → exit 1, ERROR | Validate |
| 3 | `cmdValidate`: invalid plugin id pattern → exit 0 with WARN | Validate |
| 4 | `cmdValidate`: missing fragment path → exit 0 with WARN | Validate |
| 5 | `cmdValidate`: defaults to active profile when name omitted | Validate |
| 6 | `cmdValidate`: no name + no active-profile → exit 2 with USAGE | Validate |
| 7 | `cmdDiff`: all-match shows `✓ matches` per file, no key list | Diff |
| 8 | `cmdDiff`: prev=frontend, name=backend shows expected +/- key lines | Diff |
| 9 | `cmdStatus`: drifted .mcp.json line shows `(N keys differ)` count | Status drift count |
| 10 | `cmdStatus`: when drifted, footer `Run /profile diff for details.` appears | Status drift count |

**Tests to update (existing):**
- `cmdStatus: ✓ for each managed file after a clean apply` — must still pass; assertion on absence of footer when no drift.

### Acceptance criteria (v0.2)

| ID | Criterion | Verified by |
|---|---|---|
| v0.2-AC-1 | `cmdValidate` reports actionable errors and warnings without writing any file | tests 1–4 |
| v0.2-AC-2 | `cmdValidate` defaults to active profile and exits 2 with USAGE if neither name nor active is set | tests 5, 6 |
| v0.2-AC-3 | `cmdDiff` output matches the spec'd format for both all-match and partial-diff cases | tests 7, 8 |
| v0.2-AC-4 | `/profile status` includes a `(N keys differ)` count and `Run /profile diff` footer when drifted | tests 9, 10 |
| v0.2-AC-5 | Schema file exists, parses as valid JSON, and references the v0.1 profile shape (manual: open in editor with `json.schemas` configured, type `mcp_servers`, see autocomplete) | manual |
| v0.2-AC-6 | All v0.1 tests continue to pass | full test suite |

### Manual verification (v0.2-AC-5 only)

After implementation, on the user's machine:

1. Pick any monorepo with `.claude/profiles/*.json` (the scratch test repo from v0.1's manual verification works fine).
2. Add `.vscode/settings.json` with the README's `json.schemas` snippet, pointing at the absolute path of `<plugin-install-dir>/.claude-plugin/profile.schema.json`.
3. Open a profile JSON. Type a typo like `mcp_serverz` (not `mcp_servers`) — editor should flag it.
4. Type a new key inside `mcp_servers.foo.` and observe autocomplete for `command`, `args`, `env`, `url`.

If the schema works in one editor (VS Code), declare AC-5 met. Don't manually test every editor.

## Out of scope, but acknowledged

- **Onboarding scaffolder (`/profile init`).** Highest-leverage v0.3 candidate. Postponed to keep v0.2 small.
- **Mid-session reload.** Requires investigation of Claude Code's hook/reload semantics. May not be feasible at all without harness changes.
- **Pre-switch plugin install check.** Couples to user-local state. Belongs in a separate "team mode" feature with `/profile install-deps`.

## File creation/modification scope (v0.2 implementation)

```
bin/mr-profile.mjs                          (modify, +~120 LOC)
test/mr-profile.test.mjs                    (modify, +~150 LOC, ~10 new tests)
.claude-plugin/profile.schema.json          (create, ~50 LOC)
README.md                                   (modify, +1 section)
docs/superpowers/specs/2026-04-29-monorepo-profiles-v0.2-design.md  (this doc)
```

End state: 35 + 10 = 45 tests; `bin/mr-profile.mjs` ≈ 470 LOC; new commands wired into `main` and `commands/profile.md`.
