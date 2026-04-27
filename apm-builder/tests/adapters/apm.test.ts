import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import matter from 'gray-matter';
import { apmAdapter } from '../../adapters/apm.ts';
import { ManifestSchema } from '../../lib/schema.ts';
import type { ComponentSource, AdapterContext } from '../../lib/types.ts';
import { runGolden } from './golden.ts';

const HERE = path.resolve(fileURLToPath(import.meta.url), '..');

const SCOPED_CONFIG = { package_scope: '@danmestas' };

async function loadComponent(dir: string, repoRoot: string): Promise<ComponentSource> {
  const raw = await fs.readFile(path.join(dir, 'SKILL.md'), 'utf8');
  const parsed = matter(raw);
  return {
    dir,
    relativeDir: path.relative(repoRoot, dir),
    manifest: ManifestSchema.parse(parsed.data),
    body: parsed.content,
  };
}

describe('apm adapter', () => {
  it('emits a skill as a one-skill apm package', async () => {
    const result = await runGolden(
      apmAdapter,
      path.join(HERE, 'apm/skill-basic'),
      SCOPED_CONFIG,
    );
    expect(result.diff).toEqual([]);
    expect(result.matched).toBe(true);
  });

  it('emits an agent component as <package>/.apm/agents/<name>.agent.md', async () => {
    const result = await runGolden(
      apmAdapter,
      path.join(HERE, 'apm/agent-basic'),
      SCOPED_CONFIG,
    );
    expect(result.diff).toEqual([]);
  });
});
