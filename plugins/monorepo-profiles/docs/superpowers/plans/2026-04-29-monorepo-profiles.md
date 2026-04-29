# monorepo-profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Claude Code plugin that lets a user define named profiles per monorepo and atomically swap MCP servers, permissions, plugins, skills, agents, and instruction-fragment context with a single `/profile switch <name>` command.

**Architecture:** A single Node ESM script (`bin/mr-profile.mjs`) does all the work. Three subcommands: `switch`, `status`, `session-start`. A Claude Code plugin shell wraps it with one slash command (`/profile`) and one SessionStart hook. Every managed file follows the same rule: the profile owns specific keys it lists; everything else is preserved. Tests use `node --test` against fixture monorepos copied to `mkdtemp` dirs.

**Tech Stack:** Node 20+ (ESM, `node:test`, `node:assert`, `node:fs/promises`, `node:crypto`, `node:os`, `node:path`), no third-party deps.

**Spec:** `docs/superpowers/specs/2026-04-29-monorepo-profiles-design.md`

---

## File Structure

Plugin source repository (`/Users/dmestas/projects/monorepo-profiles/`):

```
.claude-plugin/plugin.json          # plugin manifest
commands/profile.md                 # slash command body, dispatches to mr-profile
hooks/hooks.json                    # SessionStart -> mr-profile session-start
bin/mr-profile.mjs                  # all logic (~250 LOC); single ESM file
test/
  mr-profile.test.mjs               # all tests (~250 LOC)
  helpers.mjs                       # fixture/tmp-dir helpers used by tests
  fixtures/sample/                  # sample monorepo fixture
    .claude/profiles/frontend.json
    .claude/profiles/backend.json
    AGENTS.md
    services/api/AGENTS.md
    apps/web/.claude/skills/dummy-skill/SKILL.md
    services/api/.claude/skills/db-expert/SKILL.md
package.json                        # type:module + test script
.gitignore
README.md
docs/superpowers/specs/2026-04-29-monorepo-profiles-design.md   (already exists)
docs/superpowers/specs/hook-schema-verification.md              (created in Task 0.3)
docs/superpowers/plans/2026-04-29-monorepo-profiles.md          (this file)
```

Per-monorepo files the plugin manages at runtime (NOT in this repo):
- `<repo>/.mcp.json`
- `<repo>/.claude/settings.local.json`
- `~/.claude/settings.json` (`enabledPlugins` keys only)
- `~/.claude/skills/<profile-name>/` (symlink)
- `~/.claude/agents/<profile-name>/` (symlink)
- `<repo>/.claude/active-profile`

All file paths in `bin/mr-profile.mjs` are computed from two parameters: `repoRoot` (auto-detected by walking up from `process.cwd()` looking for `.claude/profiles/`) and `homeDir` (defaults to `os.homedir()`, but tests inject a tmp dir to avoid touching the real `~/.claude/`).

---

## Internal Function Inventory

All in `bin/mr-profile.mjs`. Each function is independently testable by passing explicit `repoRoot` and `homeDir`.

| Function | Inputs | Outputs / side effects |
|---|---|---|
| `findRepoRoot(cwd)` | string | string (repo root) or throws |
| `validateProfile(obj, expectedName)` | parsed JSON, profile name | array of error strings ([] if valid) |
| `loadProfile(repoRoot, name)` | strings | profile object or throws with actionable message |
| `readActiveProfileName(repoRoot)` | string | string \| null |
| `applyMcp(repoRoot, profile)` | strings, object | writes `<repo>/.mcp.json` |
| `applyPermissions(repoRoot, profile)` | strings, object | writes `<repo>/.claude/settings.local.json` |
| `applyPlugins(homeDir, prevProfile, newProfile)` | strings, objects | mutates `~/.claude/settings.json` `enabledPlugins` |
| `applySymlinks(homeDir, repoRoot, profile)` | strings, object | creates/replaces symlinks under `~/.claude/skills/` and `~/.claude/agents/` |
| `renderInstructions(repoRoot, profile)` | strings, object | string (concatenated fragments) |
| `writeActiveProfile(repoRoot, name)` | strings | writes `<repo>/.claude/active-profile` |
| `applyAll(opts)` | `{ repoRoot, homeDir, profile, prevProfile }` | orchestrates writes in fixed order |
| `cmdSwitch(opts)` | `{ repoRoot, homeDir, name }` | full switch flow, prints restart prompt |
| `cmdStatus(opts)` | `{ repoRoot, homeDir }` | prints active + per-file SHA check |
| `cmdSessionStart(opts)` | `{ repoRoot, homeDir }` | prints hook JSON to stdout |
| `main(argv, env)` | string[], object | dispatches subcommands; returns exit code |

The `bin/mr-profile.mjs` entry point at the bottom is just:
```js
const code = await main(process.argv.slice(2), process.env);
process.exit(code);
```

---

## Phase 0: Scaffolding

### Task 0.1: Initialize Node project

**Files:**
- Create: `/Users/dmestas/projects/monorepo-profiles/package.json`
- Create: `/Users/dmestas/projects/monorepo-profiles/.gitignore`
- Create: `/Users/dmestas/projects/monorepo-profiles/README.md`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "monorepo-profiles",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "engines": { "node": ">=20" },
  "scripts": {
    "test": "node --test --test-reporter=spec test/"
  }
}
```

- [ ] **Step 2: Write `.gitignore`**

```
node_modules/
.DS_Store
test/.tmp/
```

- [ ] **Step 3: Write minimal `README.md`**

```markdown
# monorepo-profiles

Atomic profile switching for Claude Code in monorepos. Define a profile per
sub-stack (frontend, backend), commit it, and `/profile switch <name>` swaps
MCP servers, permissions, plugins, skills, agents, and AGENTS.md fragments.

See `docs/superpowers/specs/2026-04-29-monorepo-profiles-design.md` for the
full design.
```

- [ ] **Step 4: Initialize git and commit**

```bash
cd /Users/dmestas/projects/monorepo-profiles
git init
git add package.json .gitignore README.md docs/
git commit -m "chore: scaffold monorepo-profiles plugin project"
```

Expected: clean commit on `main`.

---

### Task 0.2: Verify SessionStart hook output schema

**This task is required by the spec ("Implementation step 1 must verify this schema"). It produces a small artifact that locks in the schema before any code is written against it.**

**Files:**
- Create: `/Users/dmestas/projects/monorepo-profiles/docs/superpowers/specs/hook-schema-verification.md`

- [ ] **Step 1: Dispatch the claude-code-guide agent**

Use the `Agent` tool with `subagent_type: claude-code-guide`. Prompt:

> Confirm the exact JSON schema Claude Code expects on stdout from a SessionStart hook command in order to inject text into the model's session context. Specifically: what is the top-level key (`hookSpecificOutput`?), what fields are required inside it (`hookEventName`, `additionalContext`?), and what value of `hookEventName` does SessionStart use? Cite the official Claude Code hooks docs URL. If the hook can return additional fields (e.g., `decision`, `reason`, `suppressOutput`), list them. ≤200 words.

- [ ] **Step 2: Capture findings to disk**

Save the agent's report verbatim to `docs/superpowers/specs/hook-schema-verification.md` with a heading and the date.

- [ ] **Step 3: Update the spec only if findings differ**

If the verified schema does not match `{"hookSpecificOutput": {"hookEventName": "SessionStart", "additionalContext": "..."}}`, edit `docs/superpowers/specs/2026-04-29-monorepo-profiles-design.md` to use the corrected shape in the SessionStart section. Otherwise leave it alone.

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/hook-schema-verification.md docs/superpowers/specs/2026-04-29-monorepo-profiles-design.md
git commit -m "docs: verify SessionStart hook output schema"
```

---

### Task 0.3: Stub the entry-point files

**Files:**
- Create: `/Users/dmestas/projects/monorepo-profiles/bin/mr-profile.mjs`
- Create: `/Users/dmestas/projects/monorepo-profiles/test/mr-profile.test.mjs`
- Create: `/Users/dmestas/projects/monorepo-profiles/test/helpers.mjs`

- [ ] **Step 1: Stub `bin/mr-profile.mjs`**

```js
#!/usr/bin/env node
// monorepo-profiles CLI. Subcommands: switch, status, session-start.

export async function main(argv, env) {
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const code = await main(process.argv.slice(2), process.env);
  process.exit(code);
}
```

- [ ] **Step 2: Make it executable**

```bash
chmod +x /Users/dmestas/projects/monorepo-profiles/bin/mr-profile.mjs
```

- [ ] **Step 3: Stub `test/helpers.mjs`**

```js
import { mkdtemp, rm, mkdir, writeFile, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = join(__dirname, 'fixtures', 'sample');

export async function makeRepoFixture() {
  const dir = await mkdtemp(join(tmpdir(), 'mr-profile-repo-'));
  await cp(FIXTURE_ROOT, dir, { recursive: true });
  return dir;
}

export async function makeHomeFixture() {
  const dir = await mkdtemp(join(tmpdir(), 'mr-profile-home-'));
  await mkdir(join(dir, '.claude', 'skills'), { recursive: true });
  await mkdir(join(dir, '.claude', 'agents'), { recursive: true });
  await writeFile(join(dir, '.claude', 'settings.json'), '{}');
  return join(dir, '.claude');
}

export async function cleanup(...dirs) {
  for (const d of dirs) {
    if (d) await rm(d, { recursive: true, force: true });
  }
}
```

Note: `homeDir` returned by `makeHomeFixture` is the `.claude` dir directly, matching the convention used by `applyPlugins` and `applySymlinks` (they take `homeClaudeDir`, not `$HOME`). Adjust the function signatures to match: every function that touches user-global state takes `homeClaudeDir`, never raw `$HOME`.

- [ ] **Step 4: Stub `test/mr-profile.test.mjs`**

```js
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
```

(Empty body for now; tests get added in subsequent tasks.)

- [ ] **Step 5: Run tests to verify scaffolding**

```bash
cd /Users/dmestas/projects/monorepo-profiles
npm test
```

Expected: passes with 0 tests run (no failure).

- [ ] **Step 6: Commit**

```bash
git add bin/ test/ package.json
git commit -m "chore: stub mr-profile entry point and test scaffolding"
```

---

### Task 0.4: Build the sample fixture monorepo

**Files (all under `/Users/dmestas/projects/monorepo-profiles/test/fixtures/sample/`):**
- Create: `.claude/profiles/frontend.json`
- Create: `.claude/profiles/backend.json`
- Create: `AGENTS.md`
- Create: `services/api/AGENTS.md`
- Create: `apps/web/.claude/skills/dummy-skill/SKILL.md`
- Create: `services/api/.claude/skills/db-expert/SKILL.md`
- Create: `services/api/.claude/agents/migration-runner.md`

- [ ] **Step 1: Create `apps/web/.claude/skills/dummy-skill/SKILL.md`**

```markdown
---
name: dummy-skill
description: Used only as a fixture for monorepo-profiles tests.
---
This is a fixture skill. It does nothing.
```

- [ ] **Step 2: Create `services/api/.claude/skills/db-expert/SKILL.md`**

```markdown
---
name: db-expert
description: Used only as a fixture for monorepo-profiles tests.
---
This is a fixture skill. It does nothing.
```

- [ ] **Step 3: Create `services/api/.claude/agents/migration-runner.md`**

```markdown
---
name: migration-runner
description: Used only as a fixture for monorepo-profiles tests.
---
You are a fixture agent. Do nothing.
```

- [ ] **Step 4: Create `AGENTS.md` (repo-root preamble)**

```markdown
# Sample Monorepo

Fixture used by monorepo-profiles tests.
```

- [ ] **Step 5: Create `services/api/AGENTS.md`**

```markdown
# services/api

Backend service preamble fragment used by monorepo-profiles tests.
```

- [ ] **Step 6: Create `.claude/profiles/frontend.json`**

```json
{
  "name": "frontend",
  "description": "Web app stack",
  "mcp_servers": {
    "playwright": { "command": "npx", "args": ["@playwright/mcp"] }
  },
  "permissions": {
    "allow": ["Bash(npm *)", "Bash(pnpm *)"],
    "deny":  ["Bash(rm -rf *)"]
  },
  "plugins": [
    "frontend-design@claude-plugins-official",
    "agent-browser@claude-plugins-official"
  ],
  "local_skills": "apps/web/.claude/skills",
  "instruction_fragments": ["AGENTS.md"]
}
```

- [ ] **Step 7: Create `.claude/profiles/backend.json`**

```json
{
  "name": "backend",
  "description": "Go API services",
  "mcp_servers": {
    "github": { "command": "npx", "args": ["@modelcontextprotocol/server-github"] }
  },
  "permissions": {
    "allow": ["Bash(go *)", "Bash(docker *)"],
    "deny":  ["Bash(rm -rf *)", "Bash(kubectl delete *)"]
  },
  "plugins": [
    "gopls-lsp@claude-plugins-official",
    "code-review@claude-plugins-official"
  ],
  "local_skills": "services/api/.claude/skills",
  "local_agents": "services/api/.claude/agents",
  "instruction_fragments": ["AGENTS.md", "services/api/AGENTS.md"]
}
```

- [ ] **Step 8: Commit**

```bash
git add test/fixtures/
git commit -m "test: add sample monorepo fixture"
```

---

## Phase 1: Profile loader (AC-1)

### Task 1.1: Test — profile rejects missing required fields

**Files:**
- Modify: `test/mr-profile.test.mjs` (append)
- Modify: `bin/mr-profile.mjs`

- [ ] **Step 1: Add the failing test**

Append to `test/mr-profile.test.mjs`:

```js
import { validateProfile } from '../bin/mr-profile.mjs';

test('validateProfile: rejects missing name', () => {
  const errors = validateProfile({}, 'frontend');
  assert.ok(errors.some(e => e.includes("'name'")), `expected 'name' error, got: ${JSON.stringify(errors)}`);
});

test('validateProfile: rejects when name does not match filename', () => {
  const errors = validateProfile({ name: 'foo' }, 'frontend');
  assert.ok(errors.some(e => /name 'foo'.*does not match filename 'frontend'/.test(e)),
    `expected filename mismatch error, got: ${JSON.stringify(errors)}`);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/dmestas/projects/monorepo-profiles && npm test
```

Expected: failure mentioning that `validateProfile` is not exported.

- [ ] **Step 3: Implement `validateProfile`**

Add to `bin/mr-profile.mjs` (above `main`):

```js
export function validateProfile(obj, expectedName) {
  const errors = [];
  if (typeof obj !== 'object' || obj === null) {
    errors.push("profile must be a JSON object");
    return errors;
  }
  if (typeof obj.name !== 'string') {
    errors.push("missing or non-string 'name'");
  } else if (obj.name !== expectedName) {
    errors.push(`name '${obj.name}' does not match filename '${expectedName}'`);
  }
  return errors;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test
```

Expected: 2 passing tests.

- [ ] **Step 5: Commit**

```bash
git add bin/mr-profile.mjs test/mr-profile.test.mjs
git commit -m "feat(profile): validate required name field"
```

---

### Task 1.2: Test — profile loads a valid file

**Files:**
- Modify: `test/mr-profile.test.mjs`
- Modify: `bin/mr-profile.mjs`

- [ ] **Step 1: Add the failing test**

Append to `test/mr-profile.test.mjs`:

```js
import { loadProfile } from '../bin/mr-profile.mjs';
import { makeRepoFixture, cleanup } from './helpers.mjs';

test('loadProfile: loads a valid profile from fixture', async () => {
  const repo = await makeRepoFixture();
  try {
    const p = await loadProfile(repo, 'frontend');
    assert.equal(p.name, 'frontend');
    assert.equal(p.description, 'Web app stack');
    assert.equal(typeof p.mcp_servers.playwright.command, 'string');
    assert.deepEqual(p.permissions.allow, ['Bash(npm *)', 'Bash(pnpm *)']);
  } finally {
    await cleanup(repo);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: failure (`loadProfile` not exported).

- [ ] **Step 3: Implement `loadProfile`**

Add to `bin/mr-profile.mjs`:

```js
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function loadProfile(repoRoot, name) {
  const path = join(repoRoot, '.claude', 'profiles', `${name}.json`);
  let raw;
  try {
    raw = await readFile(path, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') {
      throw new Error(`profile '${name}' not found at ${path}`);
    }
    throw e;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`profile '${name}' has invalid JSON at ${path}: ${e.message}`);
  }
  const errors = validateProfile(parsed, name);
  if (errors.length > 0) {
    throw new Error(`profile '${name}' invalid: ${errors.join('; ')}`);
  }
  return parsed;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test
```

Expected: all tests passing (3 total now).

- [ ] **Step 5: Commit**

```bash
git add bin/mr-profile.mjs test/mr-profile.test.mjs
git commit -m "feat(profile): loadProfile reads and validates from disk"
```

---

### Task 1.3: Test — malformed JSON gives file path + parse position

**Files:**
- Modify: `test/mr-profile.test.mjs`
- Modify: `bin/mr-profile.mjs`

- [ ] **Step 1: Add the failing test**

Append:

```js
import { writeFile } from 'node:fs/promises';

test('loadProfile: malformed JSON error includes file path', async () => {
  const repo = await makeRepoFixture();
  try {
    const path = join(repo, '.claude', 'profiles', 'frontend.json');
    await writeFile(path, '{ "name": "frontend"  // not valid');
    await assert.rejects(
      loadProfile(repo, 'frontend'),
      err => err.message.includes(path) && /invalid JSON/i.test(err.message)
    );
  } finally {
    await cleanup(repo);
  }
});

test('loadProfile: missing profile lists path', async () => {
  const repo = await makeRepoFixture();
  try {
    await assert.rejects(
      loadProfile(repo, 'nonexistent'),
      err => err.message.includes('not found') && err.message.includes('nonexistent.json')
    );
  } finally {
    await cleanup(repo);
  }
});
```

- [ ] **Step 2: Run test to verify it passes already**

```bash
npm test
```

Expected: passes (the implementation in Task 1.2 already handles both cases). If a test fails, fix `loadProfile` until both pass.

- [ ] **Step 3: Commit**

```bash
git add test/mr-profile.test.mjs
git commit -m "test(profile): error paths for missing and malformed profiles"
```

Acceptance check: AC-1 covered by tests in Tasks 1.1–1.3.

---

## Phase 2: applyMcp (AC-2 part)

### Task 2.1: Test — apply writes `.mcp.json`

**Files:**
- Modify: `test/mr-profile.test.mjs`
- Modify: `bin/mr-profile.mjs`

- [ ] **Step 1: Add the failing test**

```js
import { applyMcp } from '../bin/mr-profile.mjs';
import { readFile } from 'node:fs/promises';

test('applyMcp: writes mcpServers and preserves other top-level keys', async () => {
  const repo = await makeRepoFixture();
  try {
    // pre-existing .mcp.json with a non-mcpServers key
    const existing = { mcpServers: { old: { command: 'old' } }, custom: { keep: true } };
    await writeFile(join(repo, '.mcp.json'), JSON.stringify(existing));

    const profile = await loadProfile(repo, 'frontend');
    await applyMcp(repo, profile);

    const after = JSON.parse(await readFile(join(repo, '.mcp.json'), 'utf8'));
    assert.deepEqual(after.mcpServers, profile.mcp_servers);
    assert.deepEqual(after.custom, { keep: true });
  } finally {
    await cleanup(repo);
  }
});

test('applyMcp: idempotent — second apply yields identical bytes', async () => {
  const repo = await makeRepoFixture();
  try {
    const profile = await loadProfile(repo, 'frontend');
    await applyMcp(repo, profile);
    const a = await readFile(join(repo, '.mcp.json'), 'utf8');
    await applyMcp(repo, profile);
    const b = await readFile(join(repo, '.mcp.json'), 'utf8');
    assert.equal(a, b);
  } finally {
    await cleanup(repo);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: failure (`applyMcp` not exported).

- [ ] **Step 3: Implement `applyMcp`**

Add to `bin/mr-profile.mjs`:

```js
import { writeFile } from 'node:fs/promises';

async function readJsonOrEmpty(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return {};
    throw e;
  }
}

export async function applyMcp(repoRoot, profile) {
  const path = join(repoRoot, '.mcp.json');
  const existing = await readJsonOrEmpty(path);
  const next = { ...existing, mcpServers: profile.mcp_servers ?? {} };
  await writeFile(path, JSON.stringify(next, null, 2) + '\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add bin/mr-profile.mjs test/mr-profile.test.mjs
git commit -m "feat(apply): applyMcp owns mcpServers, preserves other keys"
```

---

## Phase 3: applyPermissions (AC-2 part)

### Task 3.1: Test — apply writes settings.local.json, preserves env

**Files:**
- Modify: `test/mr-profile.test.mjs`
- Modify: `bin/mr-profile.mjs`

- [ ] **Step 1: Add the failing test**

```js
import { applyPermissions } from '../bin/mr-profile.mjs';
import { mkdir } from 'node:fs/promises';

test('applyPermissions: writes allow/deny, preserves env', async () => {
  const repo = await makeRepoFixture();
  try {
    const settingsPath = join(repo, '.claude', 'settings.local.json');
    await mkdir(join(repo, '.claude'), { recursive: true });
    await writeFile(settingsPath, JSON.stringify({
      env: { DEBUG: 'true' },
      permissions: { allow: ['stale'], deny: [] }
    }));

    const profile = await loadProfile(repo, 'backend');
    await applyPermissions(repo, profile);

    const after = JSON.parse(await readFile(settingsPath, 'utf8'));
    assert.deepEqual(after.env, { DEBUG: 'true' });
    assert.deepEqual(after.permissions.allow, profile.permissions.allow);
    assert.deepEqual(after.permissions.deny, profile.permissions.deny);
  } finally {
    await cleanup(repo);
  }
});

test('applyPermissions: idempotent', async () => {
  const repo = await makeRepoFixture();
  try {
    await mkdir(join(repo, '.claude'), { recursive: true });
    const profile = await loadProfile(repo, 'backend');
    await applyPermissions(repo, profile);
    const a = await readFile(join(repo, '.claude', 'settings.local.json'), 'utf8');
    await applyPermissions(repo, profile);
    const b = await readFile(join(repo, '.claude', 'settings.local.json'), 'utf8');
    assert.equal(a, b);
  } finally {
    await cleanup(repo);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: not exported.

- [ ] **Step 3: Implement `applyPermissions`**

```js
export async function applyPermissions(repoRoot, profile) {
  const path = join(repoRoot, '.claude', 'settings.local.json');
  const existing = await readJsonOrEmpty(path);
  const next = {
    ...existing,
    permissions: {
      ...(existing.permissions ?? {}),
      allow: profile.permissions?.allow ?? [],
      deny:  profile.permissions?.deny  ?? []
    }
  };
  await writeFile(path, JSON.stringify(next, null, 2) + '\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add bin/mr-profile.mjs test/mr-profile.test.mjs
git commit -m "feat(apply): applyPermissions owns allow/deny, preserves env/hooks"
```

---

## Phase 4: applyPlugins (AC-3)

### Task 4.1: Test — first switch enables, leaves unrelated alone

**Files:**
- Modify: `test/mr-profile.test.mjs`
- Modify: `bin/mr-profile.mjs`

- [ ] **Step 1: Add the failing test**

```js
import { applyPlugins } from '../bin/mr-profile.mjs';
import { makeHomeFixture } from './helpers.mjs';

test('applyPlugins: first switch enables new plugins, preserves unrelated', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    const settingsPath = join(homeClaude, 'settings.json');
    await writeFile(settingsPath, JSON.stringify({
      enabledPlugins: { 'unrelated@anyone': true }
    }));

    const profile = await loadProfile(repo, 'backend');
    await applyPlugins(homeClaude, /* prev */ null, profile);

    const after = JSON.parse(await readFile(settingsPath, 'utf8'));
    assert.equal(after.enabledPlugins['unrelated@anyone'], true);
    for (const key of profile.plugins) {
      assert.equal(after.enabledPlugins[key], true, `expected ${key} enabled`);
    }
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement `applyPlugins`**

```js
export async function applyPlugins(homeClaudeDir, prevProfile, newProfile) {
  const path = join(homeClaudeDir, 'settings.json');
  const settings = await readJsonOrEmpty(path);
  const enabled = { ...(settings.enabledPlugins ?? {}) };

  const toEnable  = newProfile.plugins ?? [];
  const prevPlugins = prevProfile?.plugins ?? [];
  const toDisable = prevPlugins.filter(p => !toEnable.includes(p));

  for (const k of toEnable) enabled[k] = true;
  for (const k of toDisable) delete enabled[k];

  const next = { ...settings, enabledPlugins: enabled };
  await writeFile(path, JSON.stringify(next, null, 2) + '\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git add bin/mr-profile.mjs test/mr-profile.test.mjs
git commit -m "feat(apply): applyPlugins enables new + preserves unrelated"
```

---

### Task 4.2: Test — switch removes prior-only plugins (the diff)

**Files:**
- Modify: `test/mr-profile.test.mjs`

- [ ] **Step 1: Add the failing test**

```js
test('applyPlugins: removes plugins from previous profile not in new profile', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    const settingsPath = join(homeClaude, 'settings.json');
    await writeFile(settingsPath, JSON.stringify({ enabledPlugins: { 'unrelated@x': true } }));

    const fe = await loadProfile(repo, 'frontend');
    const be = await loadProfile(repo, 'backend');

    // simulate: frontend was active first
    await applyPlugins(homeClaude, null, fe);
    let after = JSON.parse(await readFile(settingsPath, 'utf8'));
    for (const k of fe.plugins) assert.equal(after.enabledPlugins[k], true);

    // switch to backend
    await applyPlugins(homeClaude, fe, be);
    after = JSON.parse(await readFile(settingsPath, 'utf8'));

    for (const k of be.plugins) assert.equal(after.enabledPlugins[k], true, `expected ${k} on`);
    for (const k of fe.plugins) {
      if (!be.plugins.includes(k)) {
        assert.equal(after.enabledPlugins[k], undefined, `expected ${k} removed`);
      }
    }
    assert.equal(after.enabledPlugins['unrelated@x'], true);
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});
```

- [ ] **Step 2: Run test to verify it passes**

(Implementation in Task 4.1 already handles this. If not, fix.)

- [ ] **Step 3: Commit**

```bash
git add test/mr-profile.test.mjs
git commit -m "test(apply): plugin diff removes prior-only on switch"
```

---

### Task 4.3: Test — previous profile deleted: warn, do not orphan

**Files:**
- Modify: `test/mr-profile.test.mjs`
- Modify: `bin/mr-profile.mjs` (only if needed)

- [ ] **Step 1: Add the failing test**

This is tested at the `cmdSwitch` level (since the warning happens when *loading* the previous profile fails). Add a placeholder test now and revisit it in Phase 8 after `cmdSwitch` exists. For Phase 4, just verify the function tolerates a `null` prevProfile and a prevProfile object whose plugins are empty.

```js
test('applyPlugins: prevProfile null is treated as empty plugin list', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    const settingsPath = join(homeClaude, 'settings.json');
    await writeFile(settingsPath, JSON.stringify({ enabledPlugins: {} }));

    const be = await loadProfile(repo, 'backend');
    await applyPlugins(homeClaude, null, be);

    const after = JSON.parse(await readFile(settingsPath, 'utf8'));
    for (const k of be.plugins) assert.equal(after.enabledPlugins[k], true);
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});
```

- [ ] **Step 2: Run test, expect pass**

- [ ] **Step 3: Commit**

```bash
git add test/mr-profile.test.mjs
git commit -m "test(apply): null prev profile is treated as empty plugin list"
```

---

## Phase 5: applySymlinks (AC-2 part)

### Task 5.1: Test — apply creates skills/agents symlinks

**Files:**
- Modify: `test/mr-profile.test.mjs`
- Modify: `bin/mr-profile.mjs`

- [ ] **Step 1: Add the failing test**

```js
import { applySymlinks } from '../bin/mr-profile.mjs';
import { lstat, readlink } from 'node:fs/promises';

test('applySymlinks: creates skills and agents symlinks under home/.claude', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    const profile = await loadProfile(repo, 'backend');
    await applySymlinks(homeClaude, repo, profile);

    const skillLink = join(homeClaude, 'skills', 'backend');
    const agentLink = join(homeClaude, 'agents', 'backend');

    const skillStat = await lstat(skillLink);
    assert.ok(skillStat.isSymbolicLink());
    assert.equal(await readlink(skillLink), join(repo, 'services/api/.claude/skills'));

    const agentStat = await lstat(agentLink);
    assert.ok(agentStat.isSymbolicLink());
    assert.equal(await readlink(agentLink), join(repo, 'services/api/.claude/agents'));
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});
```

- [ ] **Step 2: Run test, expect failure**

- [ ] **Step 3: Implement `applySymlinks`**

```js
import { symlink, lstat, unlink } from 'node:fs/promises';

async function safeSymlink(target, linkPath) {
  try {
    const st = await lstat(linkPath);
    if (!st.isSymbolicLink()) {
      throw new Error(`refusing to replace non-symlink at ${linkPath}; remove manually`);
    }
    await unlink(linkPath);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
  await symlink(target, linkPath);
}

export async function applySymlinks(homeClaudeDir, repoRoot, profile) {
  if (profile.local_skills) {
    await safeSymlink(
      join(repoRoot, profile.local_skills),
      join(homeClaudeDir, 'skills', profile.name)
    );
  }
  if (profile.local_agents) {
    await safeSymlink(
      join(repoRoot, profile.local_agents),
      join(homeClaudeDir, 'agents', profile.name)
    );
  }
}
```

- [ ] **Step 4: Run test, expect pass**

- [ ] **Step 5: Commit**

```bash
git add bin/mr-profile.mjs test/mr-profile.test.mjs
git commit -m "feat(apply): applySymlinks creates skills/agents symlinks per profile"
```

---

### Task 5.2: Test — refuses to replace non-symlink

**Files:**
- Modify: `test/mr-profile.test.mjs`

- [ ] **Step 1: Add the failing test**

```js
test('applySymlinks: refuses to replace a real directory at the symlink path', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    // create a real dir where the symlink would go
    const block = join(homeClaude, 'skills', 'backend');
    await mkdir(block, { recursive: true });

    const profile = await loadProfile(repo, 'backend');
    await assert.rejects(
      applySymlinks(homeClaude, repo, profile),
      err => err.message.includes('refusing to replace non-symlink')
    );
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});
```

- [ ] **Step 2: Run test, expect pass** (impl in 5.1 covers this).

- [ ] **Step 3: Commit**

```bash
git add test/mr-profile.test.mjs
git commit -m "test(apply): refuse to clobber non-symlink directory"
```

---

## Phase 6: renderInstructions + cmdSessionStart (AC-6)

### Task 6.1: Test — renderInstructions concatenates fragments, skips missing

**Files:**
- Modify: `test/mr-profile.test.mjs`
- Modify: `bin/mr-profile.mjs`

- [ ] **Step 1: Add the failing test**

```js
import { renderInstructions } from '../bin/mr-profile.mjs';

test('renderInstructions: concatenates with separator, skips missing', async () => {
  const repo = await makeRepoFixture();
  try {
    const profile = await loadProfile(repo, 'backend');
    // expect AGENTS.md + services/api/AGENTS.md, separated
    const out = await renderInstructions(repo, profile);
    assert.match(out, /Sample Monorepo/);
    assert.match(out, /services\/api/);
    assert.ok(out.includes('\n\n---\n\n'));

    // Add a missing fragment, ensure it's skipped (warns to stderr, doesn't throw)
    const augmented = { ...profile, instruction_fragments: [...profile.instruction_fragments, 'does/not/exist.md'] };
    const out2 = await renderInstructions(repo, augmented);
    // Output should still contain the existing pieces
    assert.match(out2, /Sample Monorepo/);
  } finally {
    await cleanup(repo);
  }
});
```

- [ ] **Step 2: Run test, expect failure**

- [ ] **Step 3: Implement `renderInstructions`**

```js
export async function renderInstructions(repoRoot, profile) {
  const fragments = profile.instruction_fragments ?? [];
  const parts = [];
  for (const rel of fragments) {
    const full = join(repoRoot, rel);
    try {
      parts.push(await readFile(full, 'utf8'));
    } catch (e) {
      if (e.code === 'ENOENT') {
        process.stderr.write(`warning: instruction fragment not found, skipping: ${full}\n`);
        continue;
      }
      throw e;
    }
  }
  return parts.join('\n\n---\n\n');
}
```

- [ ] **Step 4: Run test, expect pass**

- [ ] **Step 5: Commit**

```bash
git add bin/mr-profile.mjs test/mr-profile.test.mjs
git commit -m "feat(instructions): concatenate fragments, skip-with-warn missing"
```

---

### Task 6.2: Test — cmdSessionStart emits the verified hook JSON

**Files:**
- Modify: `test/mr-profile.test.mjs`
- Modify: `bin/mr-profile.mjs`

- [ ] **Step 1: Add the failing test**

```js
import { cmdSessionStart } from '../bin/mr-profile.mjs';

test('cmdSessionStart: emits Claude Code SessionStart hook JSON when active-profile set', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    await writeFile(join(repo, '.claude', 'active-profile'), 'backend\n');

    const captured = [];
    const stdout = { write: chunk => captured.push(chunk) };
    const code = await cmdSessionStart({ repoRoot: repo, homeClaudeDir: homeClaude, stdout });
    assert.equal(code, 0);

    const out = JSON.parse(captured.join(''));
    assert.equal(out.hookSpecificOutput.hookEventName, 'SessionStart');
    assert.match(out.hookSpecificOutput.additionalContext, /Sample Monorepo/);
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});

test('cmdSessionStart: silent exit 0 when no active-profile', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    const captured = [];
    const stdout = { write: chunk => captured.push(chunk) };
    const code = await cmdSessionStart({ repoRoot: repo, homeClaudeDir: homeClaude, stdout });
    assert.equal(code, 0);
    assert.equal(captured.join(''), '');
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});
```

- [ ] **Step 2: Run test, expect failure**

- [ ] **Step 3: Implement `cmdSessionStart` and `readActiveProfileName`**

```js
export async function readActiveProfileName(repoRoot) {
  try {
    const txt = await readFile(join(repoRoot, '.claude', 'active-profile'), 'utf8');
    const name = txt.trim();
    return name || null;
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

export async function cmdSessionStart({ repoRoot, homeClaudeDir, stdout = process.stdout }) {
  const name = await readActiveProfileName(repoRoot);
  if (!name) return 0;
  let profile;
  try {
    profile = await loadProfile(repoRoot, name);
  } catch (e) {
    process.stderr.write(`session-start: ${e.message}\n`);
    return 0;
  }
  const text = await renderInstructions(repoRoot, profile);
  if (!text) return 0;
  const out = {
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: text }
  };
  stdout.write(JSON.stringify(out));
  return 0;
}
```

(Schema confirmed in Task 0.2; if Task 0.2 found a different schema, update this output here.)

- [ ] **Step 4: Run tests, expect pass**

- [ ] **Step 5: Commit**

```bash
git add bin/mr-profile.mjs test/mr-profile.test.mjs
git commit -m "feat(session-start): emit Claude Code hook JSON with concatenated fragments"
```

---

## Phase 7: cmdStatus with SHA fingerprint (AC-4)

### Task 7.1: Test — status reports ✓ when on-disk SHA matches profile-rendered SHA

**Files:**
- Modify: `test/mr-profile.test.mjs`
- Modify: `bin/mr-profile.mjs`

- [ ] **Step 1: Add the failing test**

```js
import { cmdStatus } from '../bin/mr-profile.mjs';

test('cmdStatus: ✓ for each managed file after a clean apply', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    const profile = await loadProfile(repo, 'backend');
    await applyMcp(repo, profile);
    await applyPermissions(repo, profile);
    await applyPlugins(homeClaude, null, profile);
    await applySymlinks(homeClaude, repo, profile);
    await writeFile(join(repo, '.claude', 'active-profile'), 'backend\n');

    const lines = [];
    const stdout = { write: c => lines.push(c) };
    const code = await cmdStatus({ repoRoot: repo, homeClaudeDir: homeClaude, stdout });
    const out = lines.join('');

    assert.equal(code, 0);
    assert.match(out, /active profile: backend/);
    assert.match(out, /\.mcp\.json: ✓/);
    assert.match(out, /settings\.local\.json: ✓/);
    assert.match(out, /enabledPlugins: ✓/);
    assert.match(out, /skills symlink: ✓/);
    assert.match(out, /agents symlink: ✓/);
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});
```

- [ ] **Step 2: Run test, expect failure**

- [ ] **Step 3: Implement helpers and `cmdStatus`**

```js
import { createHash } from 'node:crypto';

function sha(s) {
  return createHash('sha256').update(s).digest('hex');
}

async function readOrEmpty(path) {
  try { return await readFile(path, 'utf8'); }
  catch (e) { if (e.code === 'ENOENT') return ''; throw e; }
}

function renderMcpBytes(existing, profile) {
  const next = { ...existing, mcpServers: profile.mcp_servers ?? {} };
  return JSON.stringify(next, null, 2) + '\n';
}

function renderPermissionsBytes(existing, profile) {
  const next = {
    ...existing,
    permissions: {
      ...(existing.permissions ?? {}),
      allow: profile.permissions?.allow ?? [],
      deny:  profile.permissions?.deny  ?? []
    }
  };
  return JSON.stringify(next, null, 2) + '\n';
}

function renderPluginsBytes(existing, prevProfile, newProfile) {
  const enabled = { ...(existing.enabledPlugins ?? {}) };
  const toEnable = newProfile.plugins ?? [];
  const prevPlugins = prevProfile?.plugins ?? [];
  const toDisable = prevPlugins.filter(p => !toEnable.includes(p));
  for (const k of toEnable) enabled[k] = true;
  for (const k of toDisable) delete enabled[k];
  return JSON.stringify({ ...existing, enabledPlugins: enabled }, null, 2) + '\n';
}

export async function cmdStatus({ repoRoot, homeClaudeDir, stdout = process.stdout }) {
  const name = await readActiveProfileName(repoRoot);
  if (!name) {
    stdout.write('no active profile (run /profile switch <name>)\n');
    return 0;
  }
  const profile = await loadProfile(repoRoot, name);

  const lines = [`active profile: ${name}`];

  // .mcp.json
  const mcpPath = join(repoRoot, '.mcp.json');
  const mcpOnDisk = await readOrEmpty(mcpPath);
  const mcpExisting = await readJsonOrEmpty(mcpPath);
  const mcpExpected = renderMcpBytes(mcpExisting, profile);
  lines.push(`.mcp.json: ${sha(mcpOnDisk) === sha(mcpExpected) ? '✓' : '✗ drifted'}`);

  // settings.local.json
  const permsPath = join(repoRoot, '.claude', 'settings.local.json');
  const permsOnDisk = await readOrEmpty(permsPath);
  const permsExisting = await readJsonOrEmpty(permsPath);
  const permsExpected = renderPermissionsBytes(permsExisting, profile);
  lines.push(`settings.local.json: ${sha(permsOnDisk) === sha(permsExpected) ? '✓' : '✗ drifted'}`);

  // enabledPlugins (compare just the enabledPlugins subset, since other keys aren't owned)
  const settingsPath = join(homeClaudeDir, 'settings.json');
  const settingsExisting = await readJsonOrEmpty(settingsPath);
  // status compares "current state has all expected keys true and no prev-only keys present"
  const expectedKeys = profile.plugins ?? [];
  const enabledOk = expectedKeys.every(k => settingsExisting.enabledPlugins?.[k] === true);
  lines.push(`enabledPlugins: ${enabledOk ? '✓' : '✗ drifted'}`);

  // symlinks
  const skillLink = join(homeClaudeDir, 'skills', name);
  const agentLink = join(homeClaudeDir, 'agents', name);
  const checkSym = async (link, expectedTarget) => {
    if (!expectedTarget) return '— (not in profile)';
    try {
      const st = await lstat(link);
      if (!st.isSymbolicLink()) return '✗ not a symlink';
      const t = await readlink(link);
      return t === expectedTarget ? '✓' : '✗ wrong target';
    } catch (e) {
      if (e.code === 'ENOENT') return '✗ missing';
      throw e;
    }
  };
  lines.push(`skills symlink: ${await checkSym(skillLink, profile.local_skills && join(repoRoot, profile.local_skills))}`);
  lines.push(`agents symlink: ${await checkSym(agentLink, profile.local_agents && join(repoRoot, profile.local_agents))}`);

  stdout.write(lines.join('\n') + '\n');
  return 0;
}
```

- [ ] **Step 4: Run tests, expect pass**

- [ ] **Step 5: Commit**

```bash
git add bin/mr-profile.mjs test/mr-profile.test.mjs
git commit -m "feat(status): SHA fingerprint check for each managed file"
```

---

### Task 7.2: Test — status reports ✗ drifted when file edited

**Files:**
- Modify: `test/mr-profile.test.mjs`

- [ ] **Step 1: Add the failing test**

```js
test('cmdStatus: ✗ drifted when .mcp.json was edited after switch', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    const profile = await loadProfile(repo, 'backend');
    await applyMcp(repo, profile);
    await writeFile(join(repo, '.claude', 'active-profile'), 'backend\n');

    // user edits the file
    const mcpPath = join(repo, '.mcp.json');
    const data = JSON.parse(await readFile(mcpPath, 'utf8'));
    data.mcpServers.added = { command: 'rogue' };
    await writeFile(mcpPath, JSON.stringify(data, null, 2) + '\n');

    const lines = [];
    const stdout = { write: c => lines.push(c) };
    await cmdStatus({ repoRoot: repo, homeClaudeDir: homeClaude, stdout });
    assert.match(lines.join(''), /\.mcp\.json: ✗ drifted/);
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});
```

- [ ] **Step 2: Run test, expect pass** (impl in 7.1 covers it)

- [ ] **Step 3: Commit**

```bash
git add test/mr-profile.test.mjs
git commit -m "test(status): drift detection on hand-edited managed file"
```

---

### Task 7.3: Test — partial-state detection when active-profile is missing

**Files:**
- Modify: `test/mr-profile.test.mjs`

- [ ] **Step 1: Add the failing test**

```js
test('cmdStatus: reports no active profile when active-profile file is absent', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    const lines = [];
    const stdout = { write: c => lines.push(c) };
    const code = await cmdStatus({ repoRoot: repo, homeClaudeDir: homeClaude, stdout });
    assert.equal(code, 0);
    assert.match(lines.join(''), /no active profile/);
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});
```

- [ ] **Step 2: Run test, expect pass**

- [ ] **Step 3: Commit**

```bash
git add test/mr-profile.test.mjs
git commit -m "test(status): no-active-profile message"
```

Acceptance check: AC-4 covered by Tasks 7.1–7.3.

---

## Phase 8: applyAll + cmdSwitch (AC-5)

### Task 8.1: Test — applyAll writes in the spec-defined order; active-profile last

**Files:**
- Modify: `test/mr-profile.test.mjs`
- Modify: `bin/mr-profile.mjs`

- [ ] **Step 1: Add the failing test**

```js
import { applyAll } from '../bin/mr-profile.mjs';

test('applyAll: writes managed files; active-profile written last', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    const profile = await loadProfile(repo, 'backend');
    const code = await applyAll({
      repoRoot: repo, homeClaudeDir: homeClaude, profile, prevProfile: null
    });
    assert.equal(code, 0);

    // every managed file is present
    await readFile(join(repo, '.mcp.json'));
    await readFile(join(repo, '.claude', 'settings.local.json'));
    await readFile(join(homeClaude, 'settings.json'));
    await lstat(join(homeClaude, 'skills', 'backend'));
    await lstat(join(homeClaude, 'agents', 'backend'));

    const active = (await readFile(join(repo, '.claude', 'active-profile'), 'utf8')).trim();
    assert.equal(active, 'backend');
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});
```

- [ ] **Step 2: Run test, expect failure**

- [ ] **Step 3: Implement `applyAll` and `writeActiveProfile`**

```js
export async function writeActiveProfile(repoRoot, name) {
  await writeFile(join(repoRoot, '.claude', 'active-profile'), name + '\n');
}

export async function applyAll({ repoRoot, homeClaudeDir, profile, prevProfile }) {
  await applyMcp(repoRoot, profile);
  await applySymlinks(homeClaudeDir, repoRoot, profile);
  await applyPermissions(repoRoot, profile);
  await applyPlugins(homeClaudeDir, prevProfile, profile);
  await writeActiveProfile(repoRoot, profile.name);
  return 0;
}
```

- [ ] **Step 4: Run test, expect pass**

- [ ] **Step 5: Commit**

```bash
git add bin/mr-profile.mjs test/mr-profile.test.mjs
git commit -m "feat(switch): applyAll orchestrates writes; active-profile last"
```

---

### Task 8.2: Test — cmdSwitch loads previous profile and computes diff

**Files:**
- Modify: `test/mr-profile.test.mjs`
- Modify: `bin/mr-profile.mjs`

- [ ] **Step 1: Add the failing test**

```js
import { cmdSwitch } from '../bin/mr-profile.mjs';

test('cmdSwitch: switching frontend -> backend removes frontend-only plugins', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    let lines = [];
    const stdout = { write: c => lines.push(c) };

    let code = await cmdSwitch({ repoRoot: repo, homeClaudeDir: homeClaude, name: 'frontend', stdout });
    assert.equal(code, 0);
    assert.match(lines.join(''), /Profile 'frontend' applied/);
    assert.match(lines.join(''), /Restart Claude Code/);

    lines = [];
    code = await cmdSwitch({ repoRoot: repo, homeClaudeDir: homeClaude, name: 'backend', stdout });
    assert.equal(code, 0);

    const settings = JSON.parse(await readFile(join(homeClaude, 'settings.json'), 'utf8'));
    // Frontend-only plugins should be gone
    assert.equal(settings.enabledPlugins['frontend-design@claude-plugins-official'], undefined);
    // Backend-only plugins should be present
    assert.equal(settings.enabledPlugins['gopls-lsp@claude-plugins-official'], true);
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});

test('cmdSwitch: missing profile returns non-zero with actionable message', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    const errs = [];
    const stderr = { write: c => errs.push(c) };
    const stdout = { write: () => {} };
    const code = await cmdSwitch({
      repoRoot: repo, homeClaudeDir: homeClaude, name: 'missing', stdout, stderr
    });
    assert.notEqual(code, 0);
    assert.match(errs.join(''), /missing/);
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});
```

- [ ] **Step 2: Run test, expect failure**

- [ ] **Step 3: Implement `cmdSwitch`**

```js
export async function cmdSwitch({
  repoRoot, homeClaudeDir, name,
  stdout = process.stdout, stderr = process.stderr
}) {
  let profile;
  try {
    profile = await loadProfile(repoRoot, name);
  } catch (e) {
    stderr.write(`error: ${e.message}\n`);
    return 1;
  }

  const prevName = await readActiveProfileName(repoRoot);
  let prevProfile = null;
  if (prevName && prevName !== name) {
    try {
      prevProfile = await loadProfile(repoRoot, prevName);
    } catch (e) {
      stderr.write(`warning: previous profile '${prevName}' could not be loaded (${e.message}); plugin removals skipped\n`);
    }
  }

  await applyAll({ repoRoot, homeClaudeDir, profile, prevProfile });
  stdout.write(
    `Profile '${name}' applied. Restart Claude Code (Ctrl-D, then \`claude\`) to load plugins/MCP.\n`
  );
  return 0;
}
```

- [ ] **Step 4: Run tests, expect pass**

- [ ] **Step 5: Commit**

```bash
git add bin/mr-profile.mjs test/mr-profile.test.mjs
git commit -m "feat(switch): cmdSwitch loads prev profile, applies diff, prints restart"
```

Acceptance check: AC-3 plus AC-5 covered by Tasks 4 and 8.

---

## Phase 9: CLI dispatch + repo-root resolution

### Task 9.1: Test — findRepoRoot walks up from cwd

**Files:**
- Modify: `test/mr-profile.test.mjs`
- Modify: `bin/mr-profile.mjs`

- [ ] **Step 1: Add the failing test**

```js
import { findRepoRoot } from '../bin/mr-profile.mjs';

test('findRepoRoot: walks up to a directory containing .claude/profiles', async () => {
  const repo = await makeRepoFixture();
  try {
    const deep = join(repo, 'services', 'api');
    const found = await findRepoRoot(deep);
    assert.equal(found, repo);
  } finally {
    await cleanup(repo);
  }
});

test('findRepoRoot: throws actionable error when none found', async () => {
  await assert.rejects(
    findRepoRoot('/'),
    err => /no .claude\/profiles\//.test(err.message)
  );
});
```

- [ ] **Step 2: Run test, expect failure**

- [ ] **Step 3: Implement `findRepoRoot`**

```js
import { stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

export async function findRepoRoot(start) {
  let dir = resolve(start);
  while (true) {
    try {
      const st = await stat(join(dir, '.claude', 'profiles'));
      if (st.isDirectory()) return dir;
    } catch {}
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error(`no .claude/profiles/ found in any parent of ${start}`);
    }
    dir = parent;
  }
}
```

- [ ] **Step 4: Run tests, expect pass**

- [ ] **Step 5: Commit**

```bash
git add bin/mr-profile.mjs test/mr-profile.test.mjs
git commit -m "feat(cli): findRepoRoot walks up to .claude/profiles"
```

---

### Task 9.2: Test — main dispatches subcommands

**Files:**
- Modify: `test/mr-profile.test.mjs`
- Modify: `bin/mr-profile.mjs`

- [ ] **Step 1: Add the failing test**

```js
import { main } from '../bin/mr-profile.mjs';

test('main: dispatches "switch <name>" using cwd-derived repo root', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  const origCwd = process.cwd();
  try {
    process.chdir(repo);
    const lines = [];
    const stdout = { write: c => lines.push(c) };
    const env = { HOME: join(homeClaude, '..') };
    const code = await main(['switch', 'frontend'], env, { stdout });
    assert.equal(code, 0);
    assert.match(lines.join(''), /Profile 'frontend' applied/);
  } finally {
    process.chdir(origCwd);
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});

test('main: prints usage and returns 2 on unknown subcommand', async () => {
  const repo = await makeRepoFixture();
  const origCwd = process.cwd();
  try {
    process.chdir(repo);
    const errs = [];
    const stderr = { write: c => errs.push(c) };
    const code = await main(['nonsense'], {}, { stderr });
    assert.equal(code, 2);
    assert.match(errs.join(''), /usage:/);
  } finally {
    process.chdir(origCwd);
    await cleanup(repo);
  }
});
```

- [ ] **Step 2: Run test, expect failure**

- [ ] **Step 3: Implement `main`**

Replace the stub `main` in `bin/mr-profile.mjs`:

```js
import { homedir } from 'node:os';

const USAGE = `usage:
  mr-profile switch <name>
  mr-profile status
  mr-profile session-start
`;

export async function main(argv, env, io = {}) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const [sub, ...rest] = argv;

  let repoRoot;
  try {
    repoRoot = await findRepoRoot(process.cwd());
  } catch (e) {
    stderr.write(`error: ${e.message}\n`);
    return 1;
  }
  const home = (env && env.HOME) || homedir();
  const homeClaudeDir = join(home, '.claude');

  switch (sub) {
    case 'switch': {
      const [name] = rest;
      if (!name) { stderr.write(USAGE); return 2; }
      return await cmdSwitch({ repoRoot, homeClaudeDir, name, stdout, stderr });
    }
    case 'status':
      return await cmdStatus({ repoRoot, homeClaudeDir, stdout });
    case 'session-start':
      return await cmdSessionStart({ repoRoot, homeClaudeDir, stdout });
    default:
      stderr.write(USAGE);
      return 2;
  }
}
```

- [ ] **Step 4: Run tests, expect pass**

- [ ] **Step 5: Commit**

```bash
git add bin/mr-profile.mjs test/mr-profile.test.mjs
git commit -m "feat(cli): main dispatches switch/status/session-start"
```

---

## Phase 10: Plugin packaging

### Task 10.1: Plugin manifest

**Files:**
- Create: `/Users/dmestas/projects/monorepo-profiles/.claude-plugin/plugin.json`

- [ ] **Step 1: Write the manifest**

```json
{
  "name": "monorepo-profiles",
  "version": "0.1.0",
  "description": "Atomic per-monorepo profile switching: MCP servers, permissions, plugins, skills, agents, AGENTS.md fragments.",
  "author": { "name": "dmestas" }
}
```

- [ ] **Step 2: Commit**

```bash
git add .claude-plugin/plugin.json
git commit -m "chore: add plugin manifest"
```

---

### Task 10.2: Slash command

**Files:**
- Create: `/Users/dmestas/projects/monorepo-profiles/commands/profile.md`

- [ ] **Step 1: Write the slash command**

```markdown
---
description: Manage monorepo profiles (switch, status). Run `/profile switch <name>` or `/profile status`.
argument-hint: switch <name> | status
---

You are dispatching the `/profile` slash command.

The user invoked: `/profile $ARGUMENTS`

Run the following bash command, then paste its full stdout/stderr to the user verbatim. Do not interpret or rewrite the output.

```
node "${CLAUDE_PLUGIN_ROOT}/bin/mr-profile.mjs" $ARGUMENTS
```

If the command exits non-zero, surface the error message exactly as printed.
After a successful `switch`, the script prints a restart instruction — show it to the user prominently.
```

- [ ] **Step 2: Commit**

```bash
git add commands/profile.md
git commit -m "feat(plugin): /profile slash command dispatches to mr-profile"
```

---

### Task 10.3: SessionStart hook

**Files:**
- Create: `/Users/dmestas/projects/monorepo-profiles/hooks/hooks.json`

- [ ] **Step 1: Write the hook config**

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/bin/mr-profile.mjs\" session-start",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add hooks/hooks.json
git commit -m "feat(plugin): SessionStart hook injects active profile fragments"
```

---

## Phase 11: Manual verification (AC-7)

### Task 11.1: Install plugin locally and run the manual checklist

This is a one-time manual verification that real Claude Code accepts the plugin and applies state correctly post-restart.

- [ ] **Step 1: Add plugin to Claude Code**

Use Claude Code's `/plugin` command (in a different session) to install from `file:///Users/dmestas/projects/monorepo-profiles`.

Alternative: symlink into the cache:
```bash
ln -sf /Users/dmestas/projects/monorepo-profiles \
       ~/.claude/plugins/cache/local-dev/monorepo-profiles/0.1.0
```
…and edit `~/.claude/settings.json` to mark it enabled.

- [ ] **Step 2: Pick a real monorepo for the test**

Use a scratch monorepo (or a copy of the fixture) somewhere outside the plugin source. Place `frontend.json` and `backend.json` profiles in `<repo>/.claude/profiles/`. Add `active-profile` to `.gitignore`.

- [ ] **Step 3: Open Claude Code in the repo**

```bash
cd <repo> && claude
```

- [ ] **Step 4: Run `/profile switch frontend`**

Expected: stdout includes "Profile 'frontend' applied. Restart Claude Code…".

- [ ] **Step 5: Restart Claude Code; verify state**

Exit, then `claude` again. Run `/profile status`. Confirm:
- `active profile: frontend`
- All managed files report ✓
- The frontend MCP servers appear in this session
- Frontend-listed plugins are enabled (use Claude Code's `/plugin` listing)

- [ ] **Step 6: Switch to backend**

`/profile switch backend` → restart → `/profile status`. Confirm backend MCP, permissions, plugins. Confirm frontend-only plugins are gone.

- [ ] **Step 7: Confirm drift detection**

Hand-edit `.mcp.json` (add a server). Run `/profile status`. Expected: `.mcp.json: ✗ drifted`.

- [ ] **Step 8: Document outcome**

Append a note to `README.md` under a "Verified" section: date + Claude Code version + result. Commit.

```bash
git add README.md
git commit -m "docs: record manual end-to-end verification result"
```

---

## Final acceptance check

| AC | Verified by |
|---|---|
| AC-1 (profile loads or rejects with actionable error) | Tasks 1.1–1.3 |
| AC-2 (per-key ownership across managed files) | Tasks 2.1, 3.1, 4.1, 5.1, 5.2 |
| AC-3 (plugin diff with no spooky action) | Tasks 4.1–4.3 |
| AC-4 (status SHA fingerprint check) | Tasks 7.1–7.3 |
| AC-5 (idempotent atomic switch via applyAll/cmdSwitch) | Tasks 2.1, 3.1, 4.1, 8.1, 8.2 (each runs apply twice) |
| AC-6 (SessionStart hook emits verified Claude Code schema) | Tasks 0.2 + 6.1–6.2 |
| AC-7 (manual: real Claude Code session loads new state) | Task 11.1 |

Total ≈ 28 tasks, ≈ 140 step checkboxes. Each green commit lands a verifiable behavior.
