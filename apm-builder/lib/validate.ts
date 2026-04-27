import path from 'node:path';
import type { ComponentSource, ComponentType, Target } from './types.ts';

export interface ValidationError {
  severity: 'error' | 'warning';
  componentName: string;
  message: string;
}

type Cell = 'ok' | 'warn' | 'error';
const MATRIX: Record<ComponentType, Record<Target, Cell>> = {
  skill:  { 'claude-code': 'ok',    apm: 'ok', codex: 'ok',    gemini: 'ok',    copilot: 'warn',  pi: 'ok' },
  plugin: { 'claude-code': 'ok',    apm: 'ok', codex: 'error', gemini: 'error', copilot: 'error', pi: 'ok' },
  hook:   { 'claude-code': 'ok',    apm: 'ok', codex: 'ok',    gemini: 'ok',    copilot: 'ok',    pi: 'warn' },
  agent:  { 'claude-code': 'ok',    apm: 'ok', codex: 'ok',    gemini: 'error', copilot: 'error', pi: 'ok' },
  rules:  { 'claude-code': 'ok',    apm: 'ok', codex: 'ok',    gemini: 'ok',    copilot: 'ok',    pi: 'ok' },
  mcp:    { 'claude-code': 'ok',    apm: 'ok', codex: 'ok',    gemini: 'ok',    copilot: 'error', pi: 'warn' },
};

function validTypesForTarget(target: Target): ComponentType[] {
  return (Object.keys(MATRIX) as ComponentType[]).filter((tt) => MATRIX[tt][target] !== 'error');
}
function validTargetsForType(type: ComponentType): Target[] {
  return (Object.keys(MATRIX[type]) as Target[]).filter((t) => MATRIX[type][t] !== 'error');
}

export function validateComponents(components: ComponentSource[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const byName = new Map<string, ComponentSource>();

  for (const c of components) {
    if (byName.has(c.manifest.name)) {
      errors.push({
        severity: 'error',
        componentName: c.manifest.name,
        message: `duplicate component name "${c.manifest.name}"`,
      });
    } else {
      byName.set(c.manifest.name, c);
    }
  }

  for (const c of components) {
    for (const t of c.manifest.targets) {
      const cell = MATRIX[c.manifest.type][t];
      if (cell === 'error') {
        const altTypes = validTypesForTarget(t).join(', ');
        const altTargets = validTargetsForType(c.manifest.type).join(', ');
        errors.push({
          severity: 'error',
          componentName: c.manifest.name,
          message: `type "${c.manifest.type}" cannot target "${t}". Either remove "${t}" from targets (valid for this type: ${altTargets}), or change type to one of: ${altTypes}.`,
        });
      } else if (cell === 'warn') {
        errors.push({
          severity: 'warning',
          componentName: c.manifest.name,
          message: `type "${c.manifest.type}" on target "${t}" emits with caveats`,
        });
      }
    }
  }

  const byRelativeDir = new Set(components.map((c) => c.relativeDir));
  for (const c of components) {
    if (c.manifest.type !== 'plugin' || !c.manifest.includes) continue;
    for (const inc of c.manifest.includes) {
      const resolved = path.normalize(path.join(c.relativeDir, inc));
      // Reject any path that escapes the repo root via .. traversal.
      if (resolved.startsWith('..') || path.isAbsolute(resolved)) {
        errors.push({
          severity: 'error',
          componentName: c.manifest.name,
          message: `plugin.includes path "${inc}" escapes repo root (resolved to ${resolved})`,
        });
        continue;
      }
      const found = byRelativeDir.has(resolved);
      if (!found) {
        errors.push({
          severity: 'error',
          componentName: c.manifest.name,
          message: `plugin.includes path "${inc}" does not resolve to any component (looked for ${resolved})`,
        });
      }
    }
  }

  const rulesByName = new Map(
    components.filter((c) => c.manifest.type === 'rules').map((c) => [c.manifest.name, c]),
  );
  for (const c of components) {
    if (c.manifest.type !== 'rules') continue;
    for (const ref of [...(c.manifest.before ?? []), ...(c.manifest.after ?? [])]) {
      if (!rulesByName.has(ref)) {
        errors.push({
          severity: 'error',
          componentName: c.manifest.name,
          message: `rules.before/after references unknown rule "${ref}"`,
        });
      }
    }
  }

  const adj = new Map<string, Set<string>>();
  for (const c of rulesByName.values()) {
    adj.set(c.manifest.name, new Set([...(c.manifest.before ?? [])]));
    for (const after of c.manifest.after ?? []) {
      const set = adj.get(after) ?? new Set();
      set.add(c.manifest.name);
      adj.set(after, set);
    }
  }
  if (hasCycle(adj)) {
    errors.push({
      severity: 'error',
      componentName: '<rules>',
      message: 'cycle detected in rules before/after ordering',
    });
  }

  // Marketplace schema check for Claude Code plugins.
  for (const c of components) {
    if (c.manifest.type !== 'plugin' || !c.manifest.targets.includes('claude-code')) continue;
    if (!c.manifest.includes || c.manifest.includes.length === 0) {
      errors.push({
        severity: 'warning',
        componentName: c.manifest.name,
        message: 'Claude Code plugin has empty includes — marketplace listings expect at least one skill',
      });
    }
  }

  return errors;
}

function hasCycle(adj: Map<string, Set<string>>): boolean {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>();
  for (const node of adj.keys()) color.set(node, WHITE);
  function dfs(node: string): boolean {
    color.set(node, GRAY);
    for (const nb of adj.get(node) ?? []) {
      const c = color.get(nb) ?? WHITE;
      if (c === GRAY) return true;
      if (c === WHITE && dfs(nb)) return true;
    }
    color.set(node, BLACK);
    return false;
  }
  for (const node of adj.keys()) {
    if (color.get(node) === WHITE && dfs(node)) return true;
  }
  return false;
}
