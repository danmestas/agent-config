import fs from 'node:fs/promises';
import path from 'node:path';
import pLimit from 'p-limit';
import { discoverComponents } from './discover.ts';
import { validateComponents, type ValidationError } from './validate.ts';
import { loadRepoConfig } from './config.ts';
import { matchesGlob } from './glob.ts';
import { getAdapter } from '../adapters/index.ts';
import type { Target } from './types.ts';

export interface BuildOptions {
  repoRoot: string;
  targets: Target[];
  outDir: string;
  filter?: string;
  dryRun?: boolean;
}

export interface BuildResult {
  errors: ValidationError[];
  written: string[];
}

export async function runBuild(opts: BuildOptions): Promise<BuildResult> {
  const components = await discoverComponents(opts.repoRoot);
  const filtered = opts.filter
    ? components.filter((c) => matchesGlob(c.manifest.name, opts.filter!))
    : components;
  const errors = validateComponents(filtered);
  const fatal = errors.filter((e) => e.severity === 'error');
  if (fatal.length > 0) return { errors, written: [] };

  const config = await loadRepoConfig(opts.repoRoot);
  const written: string[] = [];
  const limit = pLimit(8);
  const tasks: Promise<void>[] = [];

  for (const target of opts.targets) {
    const adapter = getAdapter(target);
    if (!adapter) {
      errors.push({
        severity: 'error',
        componentName: '<adapter>',
        message: `no adapter registered for target "${target}"`,
      });
      continue;
    }
    const targetConfig = (config[target] ?? {}) as Record<string, unknown>;
    const ctx = { config: targetConfig, allComponents: filtered, repoRoot: opts.repoRoot };
    for (const c of filtered) {
      if (!c.manifest.targets.includes(target)) continue;
      if (!adapter.supports(c)) continue;
      tasks.push(
        limit(async () => {
          const emitted = await adapter.emit(c, ctx);
          for (const file of emitted) {
            const dest = path.join(opts.repoRoot, opts.outDir, target, file.path);
            if (!opts.dryRun) {
              await fs.mkdir(path.dirname(dest), { recursive: true });
              await fs.writeFile(dest, file.content, { mode: file.mode ?? 0o644 });
            }
            written.push(dest);
          }
        }),
      );
    }
  }
  await Promise.all(tasks);
  return { errors, written };
}

export { matchesGlob } from './glob.ts';
