import { test } from 'node:test';
import { strict as assert } from 'node:assert';

import { readFile, writeFile, mkdir, lstat, readlink, mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { validateProfile, loadProfile, applyMcp, applyPermissions, applyPlugins, applySymlinks, renderInstructions, cmdSessionStart, cmdStatus, applyAll, cmdSwitch, findRepoRoot, main, cmdDiff } from '../bin/mr-profile.mjs';
import { makeRepoFixture, makeHomeFixture, cleanup } from './helpers.mjs';

test('validateProfile: rejects missing name', () => {
  const errors = validateProfile({}, 'frontend');
  assert.ok(errors.some(e => e.includes("'name'")), `expected 'name' error, got: ${JSON.stringify(errors)}`);
});

test('validateProfile: rejects when name does not match filename', () => {
  const errors = validateProfile({ name: 'foo' }, 'frontend');
  assert.ok(errors.some(e => /name 'foo'.*does not match filename 'frontend'/.test(e)),
    `expected filename mismatch error, got: ${JSON.stringify(errors)}`);
});

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

test('applyPlugins: plugins shared between prev and new survive the switch', async () => {
  const homeClaude = await makeHomeFixture();
  try {
    const settingsPath = join(homeClaude, 'settings.json');
    await writeFile(settingsPath, JSON.stringify({ enabledPlugins: {} }));

    const prev = { name: 'a', plugins: ['shared@m', 'a-only@m'] };
    const next = { name: 'b', plugins: ['shared@m', 'b-only@m'] };

    await applyPlugins(homeClaude, null, prev);
    await applyPlugins(homeClaude, prev, next);

    const after = JSON.parse(await readFile(settingsPath, 'utf8'));
    assert.equal(after.enabledPlugins['shared@m'], true, 'shared plugin must remain enabled');
    assert.equal(after.enabledPlugins['b-only@m'], true, 'new-only plugin must be enabled');
    assert.equal(after.enabledPlugins['a-only@m'], undefined, 'prev-only plugin must be removed');
  } finally {
    await cleanup(join(homeClaude, '..'));
  }
});

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

test('applySymlinks: re-applying replaces an existing symlink (idempotent)', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    const profile = await loadProfile(repo, 'backend');
    await applySymlinks(homeClaude, repo, profile);
    await applySymlinks(homeClaude, repo, profile);

    const skillLink = join(homeClaude, 'skills', 'backend');
    const agentLink = join(homeClaude, 'agents', 'backend');
    assert.ok((await lstat(skillLink)).isSymbolicLink());
    assert.equal(await readlink(skillLink), join(repo, 'services/api/.claude/skills'));
    assert.ok((await lstat(agentLink)).isSymbolicLink());
    assert.equal(await readlink(agentLink), join(repo, 'services/api/.claude/agents'));
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});

test('renderInstructions: concatenates fragments with separator, skips missing', async () => {
  const repo = await makeRepoFixture();
  try {
    const profile = await loadProfile(repo, 'backend');
    const out = await renderInstructions(repo, profile);
    assert.match(out, /Backend profile preamble/);

    // Ad-hoc profile with two fragments to exercise the separator
    const twoFrag = {
      ...profile,
      instruction_fragments: ['CLAUDE.md', 'services/api/CLAUDE.md']
    };
    const both = await renderInstructions(repo, twoFrag);
    assert.match(both, /Sample Monorepo/);
    assert.match(both, /services\/api/);
    assert.ok(both.includes('\n\n---\n\n'));

    // Missing fragment is skipped (warns to stderr, doesn't throw)
    const augmented = {
      ...profile,
      instruction_fragments: [...profile.instruction_fragments, 'does/not/exist.md']
    };
    const out2 = await renderInstructions(repo, augmented);
    assert.match(out2, /Backend profile preamble/);
  } finally {
    await cleanup(repo);
  }
});

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
    assert.match(out.hookSpecificOutput.additionalContext, /Backend profile preamble/);
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

test('cmdSessionStart: returns 0 even when a fragment is unreadable (e.g. is a directory)', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    // craft an ad-hoc profile pointing instruction_fragments at a directory
    // (readFile will throw EISDIR — non-ENOENT)
    const adhocPath = join(repo, '.claude', 'profiles', 'adhoc.json');
    await writeFile(adhocPath, JSON.stringify({
      name: 'adhoc',
      instruction_fragments: ['services/api/.claude/skills']
    }));
    await writeFile(join(repo, '.claude', 'active-profile'), 'adhoc\n');

    const captured = [];
    const stdout = { write: c => captured.push(c) };
    const code = await cmdSessionStart({ repoRoot: repo, homeClaudeDir: homeClaude, stdout });
    assert.equal(code, 0);
    // No stdout output: the hook must never block startup with bad output
    assert.equal(captured.join(''), '');
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});

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

test('cmdStatus: enabledPlugins ✗ missing required when a required plugin is not enabled', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    const profile = await loadProfile(repo, 'backend');
    // Enable only one of the two required plugins
    const settingsPath = join(homeClaude, 'settings.json');
    await writeFile(settingsPath, JSON.stringify({
      enabledPlugins: { [profile.plugins[0]]: true }
    }));
    await writeFile(join(repo, '.claude', 'active-profile'), 'backend\n');

    const lines = [];
    const stdout = { write: c => lines.push(c) };
    await cmdStatus({ repoRoot: repo, homeClaudeDir: homeClaude, stdout });
    assert.match(lines.join(''), /enabledPlugins: ✗ missing required/);
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});

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

test('applyAll: with non-null prevProfile, removes prev-only plugins', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    const fe = await loadProfile(repo, 'frontend');
    const be = await loadProfile(repo, 'backend');

    // First apply with frontend as new and no prev
    await applyAll({ repoRoot: repo, homeClaudeDir: homeClaude, profile: fe, prevProfile: null });
    let settings = JSON.parse(await readFile(join(homeClaude, 'settings.json'), 'utf8'));
    for (const k of fe.plugins) assert.equal(settings.enabledPlugins[k], true);

    // Now apply backend with frontend as prev — fe-only plugins must go
    await applyAll({ repoRoot: repo, homeClaudeDir: homeClaude, profile: be, prevProfile: fe });
    settings = JSON.parse(await readFile(join(homeClaude, 'settings.json'), 'utf8'));
    for (const k of be.plugins) assert.equal(settings.enabledPlugins[k], true);
    for (const k of fe.plugins) {
      if (!be.plugins.includes(k)) {
        assert.equal(settings.enabledPlugins[k], undefined);
      }
    }
    // active-profile points to backend (completion flag)
    const active = (await readFile(join(repo, '.claude', 'active-profile'), 'utf8')).trim();
    assert.equal(active, 'backend');
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});

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

test('cmdSwitch: warns and continues when previous profile fails to load', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    // Active-profile points to a profile that does not exist on disk
    await writeFile(join(repo, '.claude', 'active-profile'), 'ghost\n');

    const errs = [];
    const stderr = { write: c => errs.push(c) };
    const stdout = { write: () => {} };

    const code = await cmdSwitch({
      repoRoot: repo, homeClaudeDir: homeClaude, name: 'backend', stdout, stderr
    });
    assert.equal(code, 0);
    assert.match(errs.join(''), /warning: previous profile 'ghost'/);
    assert.match(errs.join(''), /plugin removals skipped/);

    // The switch still succeeded — backend plugins enabled
    const settings = JSON.parse(await readFile(join(homeClaude, 'settings.json'), 'utf8'));
    const be = await loadProfile(repo, 'backend');
    for (const k of be.plugins) assert.equal(settings.enabledPlugins[k], true);
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});

test('main: unknown subcommand from outside a repo prints USAGE (exit 2), not the no-repo error (exit 1)', async () => {
  // tmp dir without .claude/profiles
  const elsewhere = await mkdtemp(join(tmpdir(), 'mr-profile-elsewhere-'));
  const origCwd = process.cwd();
  try {
    process.chdir(elsewhere);
    const errs = [];
    const stderr = { write: c => errs.push(c) };
    const code = await main(['nonsense'], {}, { stderr });
    assert.equal(code, 2);
    assert.match(errs.join(''), /usage:/);
  } finally {
    process.chdir(origCwd);
    await cleanup(elsewhere);
  }
});

test('main: switch with no name returns 2 and prints USAGE', async () => {
  const repo = await makeRepoFixture();
  const origCwd = process.cwd();
  try {
    process.chdir(repo);
    const errs = [];
    const stderr = { write: c => errs.push(c) };
    const code = await main(['switch'], {}, { stderr });
    assert.equal(code, 2);
    assert.match(errs.join(''), /usage:/);
  } finally {
    process.chdir(origCwd);
    await cleanup(repo);
  }
});

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

test('diffPluginKeys: explicit false in enabledPlugins is treated as not-enabled (transitions to true → added)', () => {
  const current = { 'a@m': false };
  const newP = { plugins: ['a@m'] };
  const d = diffPluginKeys({ enabledPlugins: current }, null, newP);
  assert.deepEqual(d.added, ['a@m']);
  assert.deepEqual(d.removed, []);
});

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

test('cmdValidate: missing instruction_fragments WARN; missing local_skills/agents source dirs ERROR', async () => {
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
    assert.equal(code, 1); // any error → exit 1
    const out = lines.join('');
    assert.match(out, /2 errors, 1 warning/);
    assert.match(out, /WARN\s+instruction_fragments\[0\]: 'nope\/never\.md' does not exist/);
    assert.match(out, /ERROR\s+local_skills: 'nonexistent\/skills' does not exist \(apply would create a dangling symlink\)/);
    assert.match(out, /ERROR\s+local_agents: 'nonexistent\/agents' does not exist \(apply would create a dangling symlink\)/);
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});

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

test('cmdDiff: symlink slot occupied by real directory shows "is not a symlink" with corrected wording', async () => {
  const repo = await makeRepoFixture();
  const homeClaude = await makeHomeFixture();
  try {
    // Place a real directory where the skills symlink would go
    await mkdir(join(homeClaude, 'skills', 'backend'), { recursive: true });
    await writeFile(join(repo, '.claude', 'active-profile'), 'backend\n');

    const lines = [];
    const stdout = { write: c => lines.push(c) };
    await cmdDiff({ repoRoot: repo, homeClaudeDir: homeClaude, name: 'backend', stdout });
    const out = lines.join('');
    assert.match(out, /✗ is not a symlink \(cannot replace non-symlink at this path; remove manually\)/);
  } finally {
    await cleanup(repo);
    await cleanup(join(homeClaude, '..'));
  }
});

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
