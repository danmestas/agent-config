// Per-project tracking gate. Skills and hooks that record per-session data
// (trace logs, evolution sessions, recall context) consult this gate before
// writing anything. Lets a user opt out of tracking for sensitive directories
// (~/.config, ~/Downloads, system tmp, etc.) without disabling tracking globally.
//
// Resolution order:
//   1. Per-project: <cwd>/.agent-config/exclude.json
//   2. Global:      ~/.config/agent-config/exclude.json
//   3. Hardcoded defaults (system + sensitive dirs).
//
// The exclude file shape is:
//   { "exclude": ["/absolute/path/prefix", "~/relative/prefix"] }
// Any cwd that starts with one of the listed prefixes is excluded.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface ExcludeConfig {
  exclude: string[];
}

const DEFAULT_EXCLUDES: string[] = [
  '/tmp',
  '/var',
  '/private/tmp',
  '/private/var',
  path.join(os.homedir(), '.config'),
  path.join(os.homedir(), 'Downloads'),
  path.join(os.homedir(), 'Desktop'),
  path.join(os.homedir(), 'Library', 'Caches'),
];

function expandTilde(p: string): string {
  if (p === '~') return os.homedir();
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return p;
}

function readExclude(file: string): string[] {
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw) as Partial<ExcludeConfig>;
    if (!parsed || !Array.isArray(parsed.exclude)) return [];
    return parsed.exclude.map(expandTilde);
  } catch {
    return [];
  }
}

function projectExclude(cwd: string): string[] {
  return readExclude(path.join(cwd, '.agent-config', 'exclude.json'));
}

function globalExclude(): string[] {
  return readExclude(path.join(os.homedir(), '.config', 'agent-config', 'exclude.json'));
}

/**
 * Decide whether to track a session in `cwd`. Returns true unless `cwd` lives
 * under any excluded prefix (built-in defaults, the global exclude file, or
 * the per-project exclude file).
 */
export function shouldTrackProject(cwd: string): boolean {
  const normalized = path.resolve(cwd);
  const excludes = [...DEFAULT_EXCLUDES, ...globalExclude(), ...projectExclude(cwd)];
  for (const prefix of excludes) {
    const resolvedPrefix = path.resolve(prefix);
    if (normalized === resolvedPrefix) return false;
    if (normalized.startsWith(resolvedPrefix + path.sep)) return false;
  }
  return true;
}
