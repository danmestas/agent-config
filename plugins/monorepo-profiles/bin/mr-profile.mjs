#!/usr/bin/env node
// monorepo-profiles CLI. Subcommands: switch, status, validate, diff, session-start.

import { readFile, writeFile, symlink, lstat, unlink, readlink, stat, access } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';

async function readJsonOrEmpty(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return {};
    throw e;
  }
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

export function diffMcpKeys(existing, profile) {
  const have = existing.mcpServers ?? {};
  const want = profile.mcp_servers ?? {};
  const haveKeys = Object.keys(have);
  const wantKeys = Object.keys(want);
  const added = wantKeys.filter(k => !(k in have));
  const removed = haveKeys.filter(k => !(k in want));
  // JSON.stringify is order-sensitive: hand-edited .mcp.json with reordered keys
  // will read as "changed" even when the value semantics match.
  const changed = wantKeys
    .filter(k => k in have)
    .filter(k => JSON.stringify(have[k]) !== JSON.stringify(want[k]));
  return { added, removed, changed };
}

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

export async function applyMcp(repoRoot, profile) {
  const path = join(repoRoot, '.mcp.json');
  const existing = await readJsonOrEmpty(path);
  await writeFile(path, renderMcpBytes(existing, profile));
}

export async function applyPermissions(repoRoot, profile) {
  const path = join(repoRoot, '.claude', 'settings.local.json');
  const existing = await readJsonOrEmpty(path);
  await writeFile(path, renderPermissionsBytes(existing, profile));
}

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
  let text;
  try {
    text = await renderInstructions(repoRoot, profile);
  } catch (e) {
    process.stderr.write(`session-start: failed to render instruction fragments: ${e.message}\n`);
    return 0;
  }
  if (!text) return 0;
  const out = {
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: text }
  };
  stdout.write(JSON.stringify(out));
  return 0;
}

function sha(s) {
  return createHash('sha256').update(s).digest('hex');
}

async function readOrEmpty(path) {
  try { return await readFile(path, 'utf8'); }
  catch (e) { if (e.code === 'ENOENT') return ''; throw e; }
}

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

async function pathExists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function validateProfileExtended(repoRoot, profile) {
  const issues = [];
  // mcp servers must have command or url
  // Mirror of profile.schema.json — keep in sync.
  for (const [name, entry] of Object.entries(profile.mcp_servers ?? {})) {
    const hasCommand = typeof entry?.command === 'string' && entry.command.length > 0;
    const hasUrl = typeof entry?.url === 'string' && entry.url.length > 0;
    if (!hasCommand && !hasUrl) {
      issues.push({ level: 'error', message: `mcp_servers.${name}: missing 'command' or 'url'` });
    }
  }
  // plugin id pattern
  // Mirror of profile.schema.json — keep in sync.
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
      issues.push({ level: 'error', message: `${field}: '${path}' does not exist (apply would create a dangling symlink)` });
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
        stdout.write(`  ✗ is not a symlink (cannot replace non-symlink at this path; remove manually)\n\n`);
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

const USAGE = `usage:
  mr-profile switch <name>
  mr-profile status
  mr-profile validate [name]
  mr-profile diff [name]
  mr-profile session-start
`;

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

if (import.meta.url === `file://${process.argv[1]}`) {
  const code = await main(process.argv.slice(2), process.env);
  process.exit(code);
}
