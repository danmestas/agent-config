import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import matter from 'gray-matter';
import { claudeCodeAdapter } from '../../adapters/claude-code.ts';
import { ManifestSchema } from '../../lib/schema.ts';
import type { ComponentSource } from '../../lib/types.ts';
import { runGolden } from './golden.ts';

const HERE = path.resolve(fileURLToPath(import.meta.url), '..');

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

describe('claude-code adapter', () => {
  it('emits a basic skill correctly', async () => {
    const result = await runGolden(claudeCodeAdapter, path.join(HERE, 'claude-code/skill-basic'));
    expect(result.diff).toEqual([]);
    expect(result.matched).toBe(true);
  });

  it('emits an agent component', async () => {
    const result = await runGolden(claudeCodeAdapter, path.join(HERE, 'claude-code/agent-basic'));
    expect(result.diff).toEqual([]);
  });
});
