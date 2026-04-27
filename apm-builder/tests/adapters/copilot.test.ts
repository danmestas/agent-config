import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import matter from 'gray-matter';
import { copilotAdapter } from '../../adapters/copilot.ts';
import { ManifestSchema } from '../../lib/schema.ts';
import type { ComponentSource } from '../../lib/types.ts';

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

describe('copilot adapter', () => {
  it('composes project rules into copilot-instructions.md ordered by before/after', async () => {
    const root = path.join(HERE, 'copilot/rules-compose');
    const baseStyle = await loadComponent(path.join(root, 'component'), root);
    const prPolicy = await loadComponent(path.join(root, 'extra/rules/pr-policy'), root);
    const all = [baseStyle, prPolicy];
    const results = await Promise.all(
      all.map((c) =>
        copilotAdapter.emit(c, { config: {}, allComponents: all, repoRoot: root }),
      ),
    );
    const flat = results.flat();
    const file = flat.find((f) => f.path === 'copilot-instructions.md');
    const expected = await fs.readFile(path.join(root, 'expected/copilot-instructions.md'), 'utf8');
    expect(file?.content.toString()).toBe(expected);
    // Idempotency: the composed file should be emitted exactly once across all rules.
    expect(flat.filter((f) => f.path === 'copilot-instructions.md').length).toBe(1);
  });
});
