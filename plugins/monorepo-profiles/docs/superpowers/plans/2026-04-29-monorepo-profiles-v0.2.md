# monorepo-profiles v0.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `/profile validate`, `/profile diff`, drift-count detail in `/profile status`, and a JSON Schema for profile authoring.

**Architecture:** Three private key-diff helpers (mcp, permissions, plugins via state-projection) become the shared computation engine for the new `cmdValidate`, the new `cmdDiff`, and the existing `cmdStatus`'s drift count. Same single-file Node ESM script (`bin/mr-profile.mjs`); no new modules, no deps. JSON Schema ships in `.claude-plugin/` and is wired in via README guidance — no `$schema` field added to user profiles.

**Tech Stack:** Node 20+ ESM, `node:test`, `node:assert`, `node:fs/promises`, `node:crypto`. Same as v0.1.

**Spec:** `docs/superpowers/specs/2026-04-29-monorepo-profiles-v0.2-design.md`
**Predecessor plan:** `docs/superpowers/plans/2026-04-29-monorepo-profiles.md` (v0.1)

---

## File Structure

```
bin/mr-profile.mjs                          # +~120 LOC (helpers + cmdValidate + cmdDiff + status updates + main dispatch)
test/mr-profile.test.mjs                    # +~150 LOC (10 new tests)
.claude-plugin/profile.schema.json          # NEW (~50 LOC)
README.md                                   # +1 section (Editor schema setup)
commands/profile.md                         # tweak: argument-hint frontmatter mentions validate/diff
```

## Internal Function Inventory (additions)

| Function | Inputs | Output / side effects | Visibility |
|---|---|---|---|
| `diffMcpKeys(existing, profile)` | parsed `.mcp.json` object, profile | `{added: string[], removed: string[], changed: string[]}` | private |
| `diffPermissionKeys(existing, profile)` | parsed settings.local.json, profile | `{allowAdded, allowRemoved, denyAdded, denyRemoved}` | private |
| `diffPluginKeys(currentSettings, prevProfile, newProfile)` | parsed ~/.claude/settings.json, profile-or-null, profile | `{added: string[], removed: string[]}` (state-projection) | private |
| `validateProfileExtended(repoRoot, profile)` | repo path, loaded profile | `{level: 'error'|'warn', message: string}[]` | private |
| `cmdValidate({repoRoot, homeClaudeDir, name, stdout, stderr})` | options | exit 0 / 1 / 2; report on stdout | exported |
| `cmdDiff({repoRoot, homeClaudeDir, name, stdout, stderr})` | options | exit 0 / 1 / 2; report on stdout | exported |

Shared utility (already exists, no change): `loadProfile`, `readActiveProfileName`, `readJsonOrEmpty`, `readOrEmpty`, `sha`, `renderMcpBytes`, `renderPermissionsBytes`.

---

## Phase A: Key-diff helpers (foundation)

These three private helpers are reused by `cmdStatus` (count only), `cmdDiff` (full key list), and `cmdValidate` (none directly, but it uses the same data shapes for output). Building them first means later phases just call them.

### Task A.1: `diffMcpKeys(existing, profile)`

**Files:**
- Modify: `bin/mr-profile.mjs`
- Modify: `test/mr-profile.test.mjs`

- [ ] **Step 1: Write the failing tests (append to test file)**

```js
import { diffMcpKeys } from '../bin/mr-profile.mjs';

test('diffMcpKeys: detects added, removed, changed', () => {
  const existing = { mcpServers: { signoz: { command: 'old' }, github: { command: 'gh' } } };
  const profile = { mcp_servers: { signoz: { command: 'new' }, playwright: { command: 'pw' } } };
  const d = diffMcpKeys(existing, profile);
  assert.deepEqual(d.added, ['playwright']);
  assert.deepEqual(d.removed, ['github']);
  assert.deepEqual(d.changed, ['signoz']);
});

test('diffMcpKeys: empty existing yields all profile keys as added', () => {
  const d = diffMcpKeys({}, { mcp_servers: { signoz: { command: 'x' } } });
  assert.deepEqual(d.added, ['signoz']);
  assert.deepEqual(d.removed, []);
  assert.deepEqual(d.changed, []);
});

test('diffMcpKeys: identical existing and profile yields all empty', () => {
  const same = { mcpServers: { signoz: { command: 'x' } } };
  const profile = { mcp_servers: { signoz: { command: 'x' } } };
  const d = diffMcpKeys(same, profile);
  assert.deepEqual(d.added, []);
  assert.deepEqual(d.removed, []);
  assert.deepEqual(d.changed, []);
});
```

- [ ] **Step 2: Run tests, verify red**

Run: `cd /Users/dmestas/projects/monorepo-profiles && npm test`
Expected: failure mentioning `diffMcpKeys` not exported.

- [ ] **Step 3: Implement helper in `bin/mr-profile.mjs`** (place near other render helpers)

```js
export function diffMcpKeys(existing, profile) {
  const have = existing.mcpServers ?? {};
  const want = profile.mcp_servers ?? {};
  const haveKeys = Object.keys(have);
  const wantKeys = Object.keys(want);
  const added = wantKeys.filter(k => !(k in have));
  const removed = haveKeys.filter(k => !(k in want));
  const changed = wantKeys
    .filter(k => k in have)
    .filter(k => JSON.stringify(have[k]) !== JSON.stringify(want[k]));
  return { added, removed, changed };
}
```

The function is `export`ed (not private) so tests can import it. It's exported but not part of the user-facing CLI surface — that's fine for our single-file convention.

- [ ] **Step 4: Run tests, verify green**

Expected: 38 tests passing (35 prior + 3 new).

- [ ] **Step 5: Commit**

```bash
git add bin/mr-profile.mjs test/mr-profile.test.mjs
git commit -m "feat(diff): diffMcpKeys helper for added/removed/changed servers"
```

---

### Task A.2: `diffPermissionKeys(existing, profile)`

**Files:**
- Modify: `bin/mr-profile.mjs`
- Modify: `test/mr-profile.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
import { diffPermissionKeys } from '../bin/mr-profile.mjs';

test('diffPermissionKeys: returns set diffs over allow and deny arrays', () => {
  const existing = { permissions: { allow: ['Bash(npm *)', 'Bash(go *)'], deny: ['Bash(rm -rf *)'] } };
  const profile  = { permissions: { allow: ['Bash(go *)', 'Bash(docker *)'], deny: ['Bash(rm -rf *)', 'Bash(kubectl delete *)'] } };
  const d = diffPermissionKeys(existing, profile);
  assert.deepEqual(d.allowAdded.sort(), ['Bash(docker *)']);
  assert.deepEqual(d.allowRemoved.sort(), ['Bash(npm *)']);
  assert.deepEqual(d.denyAdded.sort(), ['Bash(kubectl delete *)']);
  assert.deepEqual(d.denyRemoved, []);
});

test('diffPermissionKeys: tolerates missing fields', () => {
  const d = diffPermissionKeys({}, { permissions: { allow: ['x'] } });
  assert.deepEqual(d.allowAdded, ['x']);
  assert.deepEqual(d.allowRemoved, []);
  assert.deepEqual(d.denyAdded, []);
  assert.deepEqual(d.denyRemoved, []);
});
```

- [ ] **Step 2: Run tests, verify red**

- [ ] **Step 3: Implement helper**

```js
export function diffPermissionKeys(existing, profile) {
  const have = existing.permissions ?? {};
  const want = profile.permissions ?? {};
  const haveAllow = have.allow ?? [];
  const wantAllow = want.allow ?? [];
  const haveDeny = have.deny ?? [];
  const wantDeny = want.deny ?? [];
  return {
    allowAdded:   wantAllow.filter(x => !haveAllow.includes(x)),
    allowRemoved: haveAllow.filter(x => !wantAllow.includes(x)),
    denyAdded:    wantDeny.filter(x => !haveDeny.includes(x)),
    denyRemoved:  haveDeny.filter(x => !wantDeny.includes(x))
  };
}
```

- [ ] **Step 4: Run tests, verify green** (40 tests passing)

- [ ] **Step 5: Commit**

```bash
git add bin/mr-profile.mjs test/mr-profile.test.mjs
git commit -m "feat(diff): diffPermissionKeys helper over allow/deny arrays"
```

---

### Task A.3: `diffPluginKeys(currentSettings, prevProfile, newProfile)` via state projection

**Files:**
- Modify: `bin/mr-profile.mjs`
- Modify: `test/mr-profile.test.mjs`

This is the Ousterhout-fixed projection approach. Rather than profile-vs-profile diff, we project current `enabledPlugins` forward through apply and diff current vs projected. Re-applying the active profile correctly produces an empty diff.

- [ ] **Step 1: Write the failing tests**

```js
import { diffPluginKeys } from '../bin/mr-profile.mjs';

test('diffPluginKeys: first switch — current empty, prev null, new has 3', () => {
  const current = {};
  const newP = { plugins: ['a@m', 'b@m', 'c@m'] };
  const d = diffPluginKeys({ enabledPlugins: current }, null, newP);
  assert.deepEqual(d.added.sort(), ['a@m', 'b@m', 'c@m']);
  assert.deepEqual(d.removed, []);
});

test('diffPluginKeys: switch fe -> be with overlap', () => {
  // current already reflects fe state, plus an unrelated plugin
  const current = { 'fe-only@m': true, 'shared@m': true, 'unrelated@m': true };
  const fe = { plugins: ['fe-only@m', 'shared@m'] };
  const be = { plugins: ['shared@m', 'be-only@m'] };
  const d = diffPluginKeys({ enabledPlugins: current }, fe, be);
  assert.deepEqual(d.added, ['be-only@m']);
  assert.deepEqual(d.removed, ['fe-only@m']);
  // 'shared@m' and 'unrelated@m' should not appear
});

test('diffPluginKeys: re-applying active profile yields empty diff', () => {
  const current = { 'a@m': true, 'b@m': true };
  const same = { plugins: ['a@m', 'b@m'] };
  const d = diffPluginKeys({ enabledPlugins: current }, same, same);
  assert.deepEqual(d.added, []);
  assert.deepEqual(d.removed, []);
});

test('diffPluginKeys: unrelated user-enabled plugin is preserved (not in diff)', () => {
  const current = { 'unrelated@m': true };
  const newP = { plugins: ['target@m'] };
  const d = diffPluginKeys({ enabledPlugins: current }, null, newP);
  assert.deepEqual(d.added, ['target@m']);
  assert.deepEqual(d.removed, []);
});
```

- [ ] **Step 2: Run tests, verify red**

- [ ] **Step 3: Implement helper**

```js
export function diffPluginKeys(currentSettings, prevProfile, newProfile) {
  const current = { ...(currentSettings.enabledPlugins ?? {}) };
  const projected = { ...current };
  const newPlugins = newProfile.plugins ?? [];
  const prevPlugins = prevProfile?.plugins ?? [];
  for (const k of newPlugins) projected[k] = true;
  for (const k of prevPlugins.filter(p => !newPlugins.includes(p))) delete projected[k];

  const added = [];
  const removed = [];
  const allKeys = new Set([...Object.keys(current), ...Object.keys(projected)]);
  for (const k of allKeys) {
    const wasEnabled = current[k] === true;
    const willBeEnabled = projected[k] === true;
    if (wasEnabled && !willBeEnabled) removed.push(k);
    else if (!wasEnabled && willBeEnabled) added.push(k);
    // both true → no change; both falsy → no change
  }
  return { added, removed };
}
```

- [ ] **Step 4: Run tests, verify green** (44 tests passing)

- [ ] **Step 5: Commit**

```bash
git add bin/mr-profile.mjs test/mr-profile.test.mjs
git commit -m "feat(diff): diffPluginKeys via state projection (current vs post-apply)"
```

---

## Phase B: `cmdValidate`

### Task B.1: `cmdValidate` with valid summary output

**Files:**
- Modify: `bin/mr-profile.mjs`
- Modify: `test/mr-profile.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import { cmdValidate } from '../bin/mr-profile.mjs';

test('cmdValidate: valid backend profile prints summary and exits 0', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    const lines = [];
    const stdout = { write: c => lines.push(c) };
    const code = await cmdValidate({ repoRoot: repo, homeClaudeDir: homeClaude, name: 'backend', stdout });
    assert.equal(code, 0);
    const out = lines.join('');
    assert.match(out, /Profile 'backend': ✓ valid/);
    assert.match(out, /2 plugins/);
    assert.match(out, /1 mcp server/);
    assert.match(out, /1 fragment/);
    assert.match(out, /skills/);
    assert.match(out, /agents/);
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});
```

(Note: backend fixture has 2 plugins, 1 mcp server, 1 fragment, local_skills + local_agents.)

- [ ] **Step 2: Run test, verify red**

- [ ] **Step 3: Implement `validateProfileExtended` helper and `cmdValidate`**

Add to `bin/mr-profile.mjs`. The helper produces an issue list; `cmdValidate` formats it. Place above `cmdValidate`.

```js
import { access } from 'node:fs/promises';

async function pathExists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function validateProfileExtended(repoRoot, profile) {
  const issues = [];
  // mcp servers must have command or url
  for (const [name, entry] of Object.entries(profile.mcp_servers ?? {})) {
    const hasCommand = typeof entry?.command === 'string' && entry.command.length > 0;
    const hasUrl = typeof entry?.url === 'string' && entry.url.length > 0;
    if (!hasCommand && !hasUrl) {
      issues.push({ level: 'error', message: `mcp_servers.${name}: missing 'command' or 'url'` });
    }
  }
  // plugin id pattern
  const pluginRe = /^[\w-]+@[\w-]+$/;
  for (const [i, p] of (profile.plugins ?? []).entries()) {
    if (typeof p !== 'string' || !pluginRe.test(p)) {
      issues.push({ level: 'warn', message: `plugins[${i}]: '${p}' does not match 'name@marketplace' pattern` });
    }
  }
  // fragment paths exist
  for (const [i, frag] of (profile.instruction_fragments ?? []).entries()) {
    if (!await pathExists(join(repoRoot, frag))) {
      issues.push({ level: 'warn', message: `instruction_fragments[${i}]: '${frag}' does not exist` });
    }
  }
  // local_skills / local_agents source dirs exist
  for (const field of ['local_skills', 'local_agents']) {
    const path = profile[field];
    if (path && !await pathExists(join(repoRoot, path))) {
      issues.push({ level: 'warn', message: `${field}: '${path}' does not exist` });
    }
  }
  return issues;
}

function summarizeProfile(profile) {
  const parts = [];
  const numPlugins = (profile.plugins ?? []).length;
  if (numPlugins) parts.push(`${numPlugins} plugin${numPlugins === 1 ? '' : 's'}`);
  const numMcp = Object.keys(profile.mcp_servers ?? {}).length;
  if (numMcp) parts.push(`${numMcp} mcp server${numMcp === 1 ? '' : 's'}`);
  const numFrag = (profile.instruction_fragments ?? []).length;
  if (numFrag) parts.push(`${numFrag} fragment${numFrag === 1 ? '' : 's'}`);
  if (profile.local_skills) parts.push('skills');
  if (profile.local_agents) parts.push('agents');
  return parts.length ? `(${parts.join(', ')})` : '';
}

export async function cmdValidate({
  repoRoot, homeClaudeDir, name,
  stdout = process.stdout, stderr = process.stderr
}) {
  const explicit = !!name;
  if (!name) name = await readActiveProfileName(repoRoot);
  if (!name) {
    stderr.write(USAGE);
    return 2;
  }

  let profile;
  try {
    profile = await loadProfile(repoRoot, name);
  } catch (e) {
    stderr.write(`error: ${e.message}\n`);
    return 1;
  }

  if (!explicit) stdout.write(`Using active profile '${name}'.\n`);

  const issues = await validateProfileExtended(repoRoot, profile);
  const errors = issues.filter(i => i.level === 'error');
  const warnings = issues.filter(i => i.level === 'warn');

  if (errors.length === 0 && warnings.length === 0) {
    const summary = summarizeProfile(profile);
    stdout.write(`Profile '${name}': ✓ valid${summary ? ' ' + summary : ''}\n`);
    return 0;
  }

  const e = errors.length, w = warnings.length;
  stdout.write(`Profile '${name}': ✗ ${e} error${e === 1 ? '' : 's'}, ${w} warning${w === 1 ? '' : 's'}\n`);
  for (const issue of issues) {
    const tag = issue.level === 'error' ? 'ERROR' : 'WARN ';
    stdout.write(`  ${tag}  ${issue.message}\n`);
  }
  return errors.length > 0 ? 1 : 0;
}
```

`USAGE` already exists in the file (defined for `main` in v0.1). It will need to be updated in Phase E.1 to mention validate/diff but for now `USAGE` is whatever it currently says.

- [ ] **Step 4: Run test, verify green** (45 tests passing)

- [ ] **Step 5: Commit**

```bash
git add bin/mr-profile.mjs test/mr-profile.test.mjs
git commit -m "feat(validate): cmdValidate with valid-summary output"
```

---

### Task B.2: `cmdValidate` reports errors (mcp missing command/url)

**Files:**
- Modify: `test/mr-profile.test.mjs`

- [ ] **Step 1: Add the failing test**

```js
test('cmdValidate: mcp server entry missing command and url is an ERROR (exit 1)', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    // Create an ad-hoc profile with a broken mcp_servers entry
    await writeFile(join(repo, '.claude', 'profiles', 'broken.json'), JSON.stringify({
      name: 'broken',
      mcp_servers: { dud: { args: ['nope'] } }
    }));

    const lines = [];
    const stdout = { write: c => lines.push(c) };
    const code = await cmdValidate({ repoRoot: repo, homeClaudeDir: homeClaude, name: 'broken', stdout });
    assert.equal(code, 1);
    const out = lines.join('');
    assert.match(out, /Profile 'broken': ✗ 1 error/);
    assert.match(out, /ERROR\s+mcp_servers\.dud: missing 'command' or 'url'/);
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});
```

- [ ] **Step 2: Run test, expect green**

Implementation in B.1 already covers this. If a test fails, fix in `validateProfileExtended`.

- [ ] **Step 3: Commit**

```bash
git add test/mr-profile.test.mjs
git commit -m "test(validate): mcp missing command/url reports ERROR"
```

---

### Task B.3: `cmdValidate` reports warnings (bad plugin id, missing fragment, missing dirs)

**Files:**
- Modify: `test/mr-profile.test.mjs`

- [ ] **Step 1: Add the failing tests**

```js
test('cmdValidate: invalid plugin id is a WARN (exit 0)', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    await writeFile(join(repo, '.claude', 'profiles', 'wonky.json'), JSON.stringify({
      name: 'wonky',
      plugins: ['gopls-lsp', 'good@m'] // first lacks @marketplace
    }));

    const lines = [];
    const stdout = { write: c => lines.push(c) };
    const code = await cmdValidate({ repoRoot: repo, homeClaudeDir: homeClaude, name: 'wonky', stdout });
    assert.equal(code, 0);
    const out = lines.join('');
    assert.match(out, /Profile 'wonky': ✗ 0 errors, 1 warning/);
    assert.match(out, /WARN\s+plugins\[0\]: 'gopls-lsp' does not match/);
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});

test('cmdValidate: missing instruction_fragments and local_skills/agents dirs each WARN', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    await writeFile(join(repo, '.claude', 'profiles', 'paths.json'), JSON.stringify({
      name: 'paths',
      instruction_fragments: ['nope/never.md'],
      local_skills: 'nonexistent/skills',
      local_agents: 'nonexistent/agents'
    }));

    const lines = [];
    const stdout = { write: c => lines.push(c) };
    const code = await cmdValidate({ repoRoot: repo, homeClaudeDir: homeClaude, name: 'paths', stdout });
    assert.equal(code, 0);
    const out = lines.join('');
    assert.match(out, /3 warnings/);
    assert.match(out, /WARN\s+instruction_fragments\[0\]: 'nope\/never\.md' does not exist/);
    assert.match(out, /WARN\s+local_skills: 'nonexistent\/skills' does not exist/);
    assert.match(out, /WARN\s+local_agents: 'nonexistent\/agents' does not exist/);
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});
```

- [ ] **Step 2: Run tests, expect green** (B.1's implementation covers all warnings)

- [ ] **Step 3: Commit**

```bash
git add test/mr-profile.test.mjs
git commit -m "test(validate): bad plugin id and missing paths report WARN"
```

---

### Task B.4: `cmdValidate` name resolution + USAGE fallback

**Files:**
- Modify: `test/mr-profile.test.mjs`

- [ ] **Step 1: Add the failing tests**

```js
test('cmdValidate: defaults to active profile when name omitted', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    await writeFile(join(repo, '.claude', 'active-profile'), 'backend\n');

    const lines = [];
    const stdout = { write: c => lines.push(c) };
    const code = await cmdValidate({ repoRoot: repo, homeClaudeDir: homeClaude, stdout });
    assert.equal(code, 0);
    const out = lines.join('');
    assert.match(out, /Using active profile 'backend'\./);
    assert.match(out, /Profile 'backend': ✓ valid/);
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});

test('cmdValidate: no name and no active-profile returns 2 with USAGE', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    const errs = [];
    const stderr = { write: c => errs.push(c) };
    const code = await cmdValidate({ repoRoot: repo, homeClaudeDir: homeClaude, stderr });
    assert.equal(code, 2);
    assert.match(errs.join(''), /usage:/);
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});
```

- [ ] **Step 2: Run tests, expect green** (B.1's implementation already handles both)

- [ ] **Step 3: Commit**

```bash
git add test/mr-profile.test.mjs
git commit -m "test(validate): active-profile fallback and USAGE on missing name"
```

Acceptance check: v0.2-AC-1, v0.2-AC-2 covered by Tasks B.1–B.4.

---

## Phase C: `cmdDiff`

### Task C.1: `cmdDiff` all-match output

**Files:**
- Modify: `bin/mr-profile.mjs`
- Modify: `test/mr-profile.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import { cmdDiff } from '../bin/mr-profile.mjs';

test('cmdDiff: after a clean apply, every managed file shows ✓ matches and footer says No changes', async () => {
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
    const code = await cmdDiff({ repoRoot: repo, homeClaudeDir: homeClaude, name: 'backend', stdout });
    assert.equal(code, 0);

    const out = lines.join('');
    assert.match(out, /Diff for profile 'backend' \(vs current state\):/);
    assert.match(out, /\.mcp\.json:\s*\n\s*✓ matches/);
    assert.match(out, /settings\.local\.json:\s*\n\s*✓ matches/);
    assert.match(out, /enabledPlugins\):\s*\n\s*✓ matches/);
    assert.match(out, /skills\/backend:\s*\n\s*✓ matches/);
    assert.match(out, /agents\/backend:\s*\n\s*✓ matches/);
    assert.match(out, /active-profile:\s*\n\s*✓ matches/);
    assert.match(out, /No changes\./);
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});
```

- [ ] **Step 2: Run test, verify red** (`cmdDiff` not exported)

- [ ] **Step 3: Implement `cmdDiff`**

Add to `bin/mr-profile.mjs`. Place after `cmdValidate`.

```js
export async function cmdDiff({
  repoRoot, homeClaudeDir, name,
  stdout = process.stdout, stderr = process.stderr
}) {
  const explicit = !!name;
  if (!name) name = await readActiveProfileName(repoRoot);
  if (!name) {
    stderr.write(USAGE);
    return 2;
  }

  let profile;
  try {
    profile = await loadProfile(repoRoot, name);
  } catch (e) {
    stderr.write(`error: ${e.message}\n`);
    return 1;
  }

  // prev profile for plugin projection
  const activeName = await readActiveProfileName(repoRoot);
  let prevProfile = null;
  if (activeName && activeName !== name) {
    try { prevProfile = await loadProfile(repoRoot, activeName); } catch { /* ignore — treat as null */ }
  } else if (activeName === name) {
    prevProfile = profile;
  }

  if (!explicit) stdout.write(`Using active profile '${name}'.\n`);
  stdout.write(`\nDiff for profile '${name}' (vs current state):\n\n`);

  let anyChange = false;

  // .mcp.json
  const mcpPath = join(repoRoot, '.mcp.json');
  const mcpExisting = await readJsonOrEmpty(mcpPath);
  const mcpDiff = diffMcpKeys(mcpExisting, profile);
  stdout.write('.mcp.json:\n');
  if (mcpDiff.added.length + mcpDiff.removed.length + mcpDiff.changed.length === 0) {
    stdout.write('  ✓ matches\n');
  } else {
    anyChange = true;
    for (const k of mcpDiff.added)   stdout.write(`  + mcpServers.${k}\n`);
    for (const k of mcpDiff.removed) stdout.write(`  - mcpServers.${k}\n`);
    for (const k of mcpDiff.changed) stdout.write(`  ~ mcpServers.${k}   (content differs)\n`);
  }
  stdout.write('\n');

  // settings.local.json
  const permsPath = join(repoRoot, '.claude', 'settings.local.json');
  const permsExisting = await readJsonOrEmpty(permsPath);
  const permsDiff = diffPermissionKeys(permsExisting, profile);
  stdout.write('.claude/settings.local.json:\n');
  const permsTotal = permsDiff.allowAdded.length + permsDiff.allowRemoved.length
                   + permsDiff.denyAdded.length + permsDiff.denyRemoved.length;
  if (permsTotal === 0) {
    stdout.write('  ✓ matches\n');
  } else {
    anyChange = true;
    for (const x of permsDiff.allowAdded)   stdout.write(`  + permissions.allow: '${x}'\n`);
    for (const x of permsDiff.allowRemoved) stdout.write(`  - permissions.allow: '${x}'\n`);
    for (const x of permsDiff.denyAdded)    stdout.write(`  + permissions.deny: '${x}'\n`);
    for (const x of permsDiff.denyRemoved)  stdout.write(`  - permissions.deny: '${x}'\n`);
  }
  stdout.write('\n');

  // enabledPlugins
  const settingsPath = join(homeClaudeDir, 'settings.json');
  const settings = await readJsonOrEmpty(settingsPath);
  const pluginDiff = diffPluginKeys(settings, prevProfile, profile);
  stdout.write('~/.claude/settings.json (enabledPlugins):\n');
  if (pluginDiff.added.length + pluginDiff.removed.length === 0) {
    stdout.write('  ✓ matches\n');
  } else {
    anyChange = true;
    for (const k of pluginDiff.added)   stdout.write(`  + ${k}\n`);
    for (const k of pluginDiff.removed) stdout.write(`  - ${k}\n`);
  }
  stdout.write('\n');

  // symlinks
  const reportSymlink = async (label, link, expectedTarget) => {
    stdout.write(`${label}:\n`);
    if (!expectedTarget) { stdout.write('  — (not in profile)\n\n'); return; }
    try {
      const st = await lstat(link);
      if (!st.isSymbolicLink()) {
        anyChange = true;
        stdout.write(`  ✗ is not a symlink (would replace would fail; remove manually)\n\n`);
        return;
      }
      const t = await readlink(link);
      if (t === expectedTarget) {
        stdout.write('  ✓ matches\n\n');
      } else {
        anyChange = true;
        stdout.write(`  ~ wrong target: was '${t}', expected '${expectedTarget}'\n\n`);
      }
    } catch (e) {
      if (e.code === 'ENOENT') {
        anyChange = true;
        stdout.write(`  + would create symlink → ${expectedTarget}\n\n`);
        return;
      }
      throw e;
    }
  };
  await reportSymlink(
    `~/.claude/skills/${name}`,
    join(homeClaudeDir, 'skills', name),
    profile.local_skills && join(repoRoot, profile.local_skills)
  );
  await reportSymlink(
    `~/.claude/agents/${name}`,
    join(homeClaudeDir, 'agents', name),
    profile.local_agents && join(repoRoot, profile.local_agents)
  );

  // active-profile
  const currActive = await readActiveProfileName(repoRoot);
  stdout.write('.claude/active-profile:\n');
  if (currActive === name) {
    stdout.write('  ✓ matches\n');
  } else {
    anyChange = true;
    stdout.write(`  ~ was '${currActive ?? '(none)'}', expected '${name}'\n`);
  }
  stdout.write('\n');

  if (anyChange) {
    stdout.write(`Run /profile switch ${name} to apply.\n`);
  } else {
    stdout.write('No changes.\n');
  }
  return 0;
}
```

- [ ] **Step 4: Run test, verify green** (46 tests passing)

- [ ] **Step 5: Commit**

```bash
git add bin/mr-profile.mjs test/mr-profile.test.mjs
git commit -m "feat(diff): cmdDiff with all-match output"
```

---

### Task C.2: `cmdDiff` partial-diff output (state projection in action)

**Files:**
- Modify: `test/mr-profile.test.mjs`

- [ ] **Step 1: Add the failing tests**

```js
test('cmdDiff: from active=frontend, diffing backend shows expected +/-/~ entries', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    // Apply frontend first, mark active
    const fe = await loadProfile(repo, 'frontend');
    await applyMcp(repo, fe);
    await applyPermissions(repo, fe);
    await applyPlugins(homeClaude, null, fe);
    await applySymlinks(homeClaude, repo, fe);
    await writeFile(join(repo, '.claude', 'active-profile'), 'frontend\n');

    const lines = [];
    const stdout = { write: c => lines.push(c) };
    const code = await cmdDiff({ repoRoot: repo, homeClaudeDir: homeClaude, name: 'backend', stdout });
    assert.equal(code, 0);
    const out = lines.join('');

    // mcp: backend has 'github', frontend has 'playwright'
    assert.match(out, /\+ mcpServers\.github/);
    assert.match(out, /- mcpServers\.playwright/);

    // perms: backend has go/docker, frontend has npm/pnpm
    assert.match(out, /\+ permissions\.allow: 'Bash\(go \*\)'/);
    assert.match(out, /- permissions\.allow: 'Bash\(npm \*\)'/);

    // plugins: state-projection should show fe-only removed, be-only added
    assert.match(out, /\+ gopls-lsp@claude-plugins-official/);
    assert.match(out, /- frontend-design@claude-plugins-official/);

    // symlinks: backend has both local_skills and local_agents (frontend skill link must change target)
    // skills link target points to apps/web (frontend), needs to point at services/api (backend)
    assert.match(out, /skills\/backend:/);
    assert.match(out, /agents\/backend:/);

    // active-profile
    assert.match(out, /~ was 'frontend', expected 'backend'/);

    assert.match(out, /Run \/profile switch backend to apply\./);
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});

test('cmdDiff: re-diffing the active profile shows No changes', async () => {
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
    await cmdDiff({ repoRoot: repo, homeClaudeDir: homeClaude, name: 'backend', stdout });
    const out = lines.join('');
    assert.match(out, /No changes\./);
    // Critical: state projection means re-diff doesn't show phantom plugin additions
    assert.doesNotMatch(out, /\+ gopls-lsp@/);
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});
```

- [ ] **Step 2: Run tests, expect green** (Task C.1's implementation handles both cases)

- [ ] **Step 3: Commit**

```bash
git add test/mr-profile.test.mjs
git commit -m "test(diff): partial-diff and re-apply-no-phantom-additions"
```

Acceptance check: v0.2-AC-3 covered by Tasks C.1, C.2.

---

## Phase D: drift count + footer in `cmdStatus`

### Task D.1: `cmdStatus` uses key-diff helpers for count, adds footer

**Files:**
- Modify: `bin/mr-profile.mjs`
- Modify: `test/mr-profile.test.mjs`

- [ ] **Step 1: Add failing tests**

```js
test('cmdStatus: drifted .mcp.json line shows "(N keys differ)" when keys actually differ', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    const profile = await loadProfile(repo, 'backend');
    await applyMcp(repo, profile);
    await writeFile(join(repo, '.claude', 'active-profile'), 'backend\n');

    // Add a rogue server (1 added key)
    const data = JSON.parse(await readFile(join(repo, '.mcp.json'), 'utf8'));
    data.mcpServers.rogue = { command: 'x' };
    await writeFile(join(repo, '.mcp.json'), JSON.stringify(data, null, 2) + '\n');

    const lines = [];
    const stdout = { write: c => lines.push(c) };
    await cmdStatus({ repoRoot: repo, homeClaudeDir: homeClaude, stdout });
    assert.match(lines.join(''), /\.mcp\.json: ✗ drifted \(1 key differs\)/);
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});

test('cmdStatus: drifted .mcp.json line shows "(formatting only)" when bytes differ but keys match', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    const profile = await loadProfile(repo, 'backend');
    await applyMcp(repo, profile);
    await writeFile(join(repo, '.claude', 'active-profile'), 'backend\n');

    // Re-serialize with non-canonical formatting (e.g. tabs) — same keys, different bytes
    const data = JSON.parse(await readFile(join(repo, '.mcp.json'), 'utf8'));
    await writeFile(join(repo, '.mcp.json'), JSON.stringify(data) /* no indent, no trailing newline */);

    const lines = [];
    const stdout = { write: c => lines.push(c) };
    await cmdStatus({ repoRoot: repo, homeClaudeDir: homeClaude, stdout });
    assert.match(lines.join(''), /\.mcp\.json: ✗ drifted \(formatting only\)/);
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});

test('cmdStatus: footer "Run /profile diff for details." appears only when drifted', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    const profile = await loadProfile(repo, 'backend');
    await applyMcp(repo, profile);
    await applyPermissions(repo, profile);
    await applyPlugins(homeClaude, null, profile);
    await applySymlinks(homeClaude, repo, profile);
    await writeFile(join(repo, '.claude', 'active-profile'), 'backend\n');

    // Clean state — no footer expected
    let lines = [];
    let stdout = { write: c => lines.push(c) };
    await cmdStatus({ repoRoot: repo, homeClaudeDir: homeClaude, stdout });
    assert.doesNotMatch(lines.join(''), /Run \/profile diff/);

    // Drift one file — footer expected
    await writeFile(join(repo, '.mcp.json'), '{"mcpServers":{"x":{"command":"y"}}}\n');
    lines = [];
    stdout = { write: c => lines.push(c) };
    await cmdStatus({ repoRoot: repo, homeClaudeDir: homeClaude, stdout });
    assert.match(lines.join(''), /Run \/profile diff for details\./);
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});
```

- [ ] **Step 2: Run tests, verify red**

- [ ] **Step 3: Update `cmdStatus` to use key-diff helpers and emit count + footer**

Replace the body of `cmdStatus`. The structure is similar to before but uses the helpers for drift detail.

```js
export async function cmdStatus({ repoRoot, homeClaudeDir, stdout = process.stdout }) {
  const name = await readActiveProfileName(repoRoot);
  if (!name) {
    stdout.write('no active profile (run /profile switch <name>)\n');
    return 0;
  }
  const profile = await loadProfile(repoRoot, name);

  const lines = [`active profile: ${name}`];
  let anyDrift = false;

  const driftLabel = (sha1, sha2, keyCount) => {
    if (sha1 === sha2) return '✓';
    anyDrift = true;
    if (keyCount === 0) return '✗ drifted (formatting only)';
    return `✗ drifted (${keyCount} key${keyCount === 1 ? ' differs' : 's differ'})`;
  };

  // .mcp.json
  const mcpPath = join(repoRoot, '.mcp.json');
  const mcpOnDisk = await readOrEmpty(mcpPath);
  const mcpExisting = await readJsonOrEmpty(mcpPath);
  const mcpExpected = renderMcpBytes(mcpExisting, profile);
  const mcpDiff = diffMcpKeys(mcpExisting, profile);
  const mcpKeyCount = mcpDiff.added.length + mcpDiff.removed.length + mcpDiff.changed.length;
  lines.push(`.mcp.json: ${driftLabel(sha(mcpOnDisk), sha(mcpExpected), mcpKeyCount)}`);

  // settings.local.json
  const permsPath = join(repoRoot, '.claude', 'settings.local.json');
  const permsOnDisk = await readOrEmpty(permsPath);
  const permsExisting = await readJsonOrEmpty(permsPath);
  const permsExpected = renderPermissionsBytes(permsExisting, profile);
  const permsDiff = diffPermissionKeys(permsExisting, profile);
  const permsKeyCount = permsDiff.allowAdded.length + permsDiff.allowRemoved.length
                      + permsDiff.denyAdded.length + permsDiff.denyRemoved.length;
  lines.push(`settings.local.json: ${driftLabel(sha(permsOnDisk), sha(permsExpected), permsKeyCount)}`);

  // enabledPlugins (presence-only check, unchanged label semantics from v0.1)
  const settingsPath = join(homeClaudeDir, 'settings.json');
  const settingsExisting = await readJsonOrEmpty(settingsPath);
  const expectedKeys = profile.plugins ?? [];
  const enabledOk = expectedKeys.every(k => settingsExisting.enabledPlugins?.[k] === true);
  if (!enabledOk) anyDrift = true;
  lines.push(`enabledPlugins: ${enabledOk ? '✓ all required present' : '✗ missing required'}`);

  // symlinks
  const checkSym = async (link, expectedTarget) => {
    if (!expectedTarget) return '— (not in profile)';
    try {
      const st = await lstat(link);
      if (!st.isSymbolicLink()) { anyDrift = true; return '✗ not a symlink'; }
      const t = await readlink(link);
      if (t === expectedTarget) return '✓';
      anyDrift = true;
      return '✗ wrong target';
    } catch (e) {
      if (e.code === 'ENOENT') { anyDrift = true; return '✗ missing'; }
      throw e;
    }
  };
  const skillLink = join(homeClaudeDir, 'skills', name);
  const agentLink = join(homeClaudeDir, 'agents', name);
  lines.push(`skills symlink: ${await checkSym(skillLink, profile.local_skills && join(repoRoot, profile.local_skills))}`);
  lines.push(`agents symlink: ${await checkSym(agentLink, profile.local_agents && join(repoRoot, profile.local_agents))}`);

  stdout.write(lines.join('\n') + '\n');
  if (anyDrift) stdout.write('\nRun /profile diff for details.\n');
  return 0;
}
```

- [ ] **Step 4: Run tests, verify green** (49 tests passing)

The existing v0.1 status test (`cmdStatus: ✓ for each managed file after a clean apply`) should still pass — its assertions use `/.mcp\.json: ✓/` which matches `✓` whether or not the new tail is appended.

- [ ] **Step 5: Commit**

```bash
git add bin/mr-profile.mjs test/mr-profile.test.mjs
git commit -m "feat(status): drift count + formatting-only label + diff-pointer footer"
```

Acceptance check: v0.2-AC-4 covered by Task D.1.

---

## Phase E: CLI dispatch

### Task E.1: `main` dispatches `validate` and `diff`

**Files:**
- Modify: `bin/mr-profile.mjs`
- Modify: `test/mr-profile.test.mjs`

- [ ] **Step 1: Add the failing tests**

```js
test('main: dispatches "validate <name>"', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  const origCwd = process.cwd();
  try {
    process.chdir(repo);
    const lines = [];
    const stdout = { write: c => lines.push(c) };
    const env = { HOME: join(homeClaude, '..') };
    const code = await main(['validate', 'backend'], env, { stdout });
    assert.equal(code, 0);
    assert.match(lines.join(''), /Profile 'backend': ✓ valid/);
  } finally {
    process.chdir(origCwd);
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});

test('main: dispatches "diff <name>"', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  const origCwd = process.cwd();
  try {
    process.chdir(repo);
    const lines = [];
    const stdout = { write: c => lines.push(c) };
    const env = { HOME: join(homeClaude, '..') };
    const code = await main(['diff', 'backend'], env, { stdout });
    assert.equal(code, 0);
    assert.match(lines.join(''), /Diff for profile 'backend'/);
  } finally {
    process.chdir(origCwd);
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});

test('main: validate and diff appear in USAGE on unknown subcommand', async () => {
  const elsewhere = await mkdtemp(join(tmpdir(), 'mr-profile-elsewhere-'));
  const origCwd = process.cwd();
  try {
    process.chdir(elsewhere);
    const errs = [];
    const stderr = { write: c => errs.push(c) };
    const code = await main(['nope'], {}, { stderr });
    assert.equal(code, 2);
    const out = errs.join('');
    assert.match(out, /validate/);
    assert.match(out, /diff/);
  } finally {
    process.chdir(origCwd);
    await cleanup(elsewhere);
  }
});
```

- [ ] **Step 2: Run tests, verify red** (main doesn't dispatch new subcommands)

- [ ] **Step 3: Update `main` and `USAGE`**

Locate the `USAGE` constant and the validation list in `main`. Update both:

```js
const USAGE = `usage:
  mr-profile switch <name>
  mr-profile status
  mr-profile validate [name]
  mr-profile diff [name]
  mr-profile session-start
`;
```

In `main`, add `validate` and `diff` to the valid subcommand check, then add the dispatch cases:

```js
export async function main(argv, env, io = {}) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const [sub, ...rest] = argv;

  const knownSubs = new Set(['switch', 'status', 'validate', 'diff', 'session-start']);
  if (!knownSubs.has(sub)) {
    stderr.write(USAGE);
    return 2;
  }
  if (sub === 'switch' && !rest[0]) {
    stderr.write(USAGE);
    return 2;
  }

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
    case 'switch':
      return await cmdSwitch({ repoRoot, homeClaudeDir, name: rest[0], stdout, stderr });
    case 'status':
      return await cmdStatus({ repoRoot, homeClaudeDir, stdout });
    case 'validate':
      return await cmdValidate({ repoRoot, homeClaudeDir, name: rest[0], stdout, stderr });
    case 'diff':
      return await cmdDiff({ repoRoot, homeClaudeDir, name: rest[0], stdout, stderr });
    case 'session-start':
      return await cmdSessionStart({ repoRoot, homeClaudeDir, stdout });
  }
}
```

- [ ] **Step 4: Run tests, verify green** (52 tests passing)

- [ ] **Step 5: Commit**

```bash
git add bin/mr-profile.mjs test/mr-profile.test.mjs
git commit -m "feat(cli): dispatch validate and diff; update USAGE"
```

---

### Task E.2: Update `commands/profile.md` argument hint

**Files:**
- Modify: `commands/profile.md`

- [ ] **Step 1: Update the frontmatter**

Open `commands/profile.md`. Locate the frontmatter:

```yaml
---
description: Manage monorepo profiles (switch, status). Run `/profile switch <name>` or `/profile status`.
argument-hint: switch <name> | status
---
```

Replace with:

```yaml
---
description: Manage monorepo profiles. Subcommands: switch, status, validate, diff.
argument-hint: switch <name> | status | validate [name] | diff [name]
---
```

The body of the file (the bash invocation that dispatches `$ARGUMENTS`) is unchanged.

- [ ] **Step 2: Commit**

```bash
git add commands/profile.md
git commit -m "docs(plugin): update /profile argument hint with validate and diff"
```

---

## Phase F: JSON Schema + README

### Task F.1: `profile.schema.json`

**Files:**
- Create: `.claude-plugin/profile.schema.json`

- [ ] **Step 1: Write the schema**

```json
{
  "$schema": "https://json-schema.org/draft-07/schema#",
  "$id": "https://example.invalid/monorepo-profiles/profile.schema.json",
  "title": "monorepo-profiles profile",
  "type": "object",
  "additionalProperties": false,
  "required": ["name"],
  "properties": {
    "name": {
      "type": "string",
      "pattern": "^[a-zA-Z0-9_-]+$",
      "description": "Must equal the JSON filename stem."
    },
    "description": { "type": "string" },
    "mcp_servers": {
      "type": "object",
      "description": "Same shape as .mcp.json's mcpServers. Profile fully owns this key.",
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
      "items": {
        "type": "string",
        "pattern": "^[\\w-]+@[\\w-]+$",
        "description": "Plugin id in the form 'name@marketplace'."
      }
    },
    "local_skills": {
      "type": "string",
      "description": "Path relative to repo root pointing to a directory of skills."
    },
    "local_agents": {
      "type": "string",
      "description": "Path relative to repo root pointing to a directory of agents."
    },
    "instruction_fragments": {
      "type": "array",
      "description": "Supplementary fragments not on the CLAUDE.md cwd cascade.",
      "items": { "type": "string" }
    }
  }
}
```

- [ ] **Step 2: Verify the schema is valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('/Users/dmestas/projects/monorepo-profiles/.claude-plugin/profile.schema.json'))"`
Expected: no output (success).

- [ ] **Step 3: Commit**

```bash
git add .claude-plugin/profile.schema.json
git commit -m "feat(schema): JSON Schema Draft-07 for profile files"
```

---

### Task F.2: README "Editor schema setup" section

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Append the new section**

Read the current `README.md`, then append the following at the bottom:

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

The plugin's install path is shown by `/plugin` in Claude Code. For team-shareable
editor config, copy the schema into your repo (e.g. to `.claude/profile.schema.json`)
and commit it.
```

(In the actual file, the inner triple-backtick fences should be regular triple backticks, not escaped.)

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs(readme): editor schema setup instructions"
```

---

## Phase G: Manual verification (v0.2-AC-5)

### Task G.1: Verify schema produces editor autocomplete

**Files:** none — manual verification only.

This is a one-time manual check that the JSON Schema produces useful behavior in at least one editor (VS Code or Cursor).

- [ ] **Step 1: Configure editor**

In any monorepo with `.claude/profiles/*.json` (the `/tmp/mr-profile-test` from v0.1's manual verification works fine), create `.vscode/settings.json`:

```json
{
  "json.schemas": [
    {
      "fileMatch": ["**/.claude/profiles/*.json"],
      "url": "/Users/dmestas/projects/monorepo-profiles/.claude-plugin/profile.schema.json"
    }
  ]
}
```

- [ ] **Step 2: Open a profile in the editor**

Open `.claude/profiles/backend.json` in VS Code or Cursor with the JSON LSP enabled.

- [ ] **Step 3: Test typo detection**

Change `mcp_servers` to `mcp_serverz`. The editor should mark the field as unrecognized (red squiggle on the property name, or info diagnostic).

- [ ] **Step 4: Test autocomplete**

Add a new server entry: `"foo": { "" — autocomplete should offer `command`, `args`, `env`, `url`.

- [ ] **Step 5: Test required-anyOf**

Add `"foo": {}` (empty object). The schema should report the entry violates `anyOf` (missing both `command` and `url`).

- [ ] **Step 6: Document outcome**

Append to `README.md` under a "Verified" section: date + editor + result. Commit.

```bash
git add README.md
git commit -m "docs: record schema editor verification"
```

If any step fails (the schema doesn't load, autocomplete doesn't fire), file as a v0.2 follow-up — don't block.

---

## Final acceptance check

| AC | Verified by |
|---|---|
| v0.2-AC-1 (`cmdValidate` reports actionable errors and warnings without writing any file) | Tasks B.1–B.3 |
| v0.2-AC-2 (`cmdValidate` defaults to active profile and exits 2 with USAGE) | Task B.4 |
| v0.2-AC-3 (`cmdDiff` output matches spec'd format for all-match and partial-diff) | Tasks C.1, C.2 |
| v0.2-AC-4 (`/profile status` includes `(N keys differ)` count and footer) | Task D.1 |
| v0.2-AC-5 (Schema produces editor autocomplete in at least one editor) | Task G.1 (manual) |
| v0.2-AC-6 (All v0.1 tests continue to pass) | every phase runs `npm test` and asserts the cumulative count |

Total ≈ 13 tasks (12 code + 1 manual), 59 tests at end (35 v0.1 + 24 v0.2). `bin/mr-profile.mjs` ends at ~470 LOC.
