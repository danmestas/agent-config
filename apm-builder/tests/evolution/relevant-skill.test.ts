import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanSkillCatalog } from '../../lib/evolution/relevant-skill.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '../../..');

describe('scanSkillCatalog', () => {
  it('finds at least the apm-builder skill in the repo-local catalog', async () => {
    const entries = await scanSkillCatalog({
      repoLocal: path.join(REPO_ROOT, 'skills'),
      home: undefined,
      pluginsCache: undefined,
    });
    const apmBuilder = entries.find((e) => e.name === 'apm-builder');
    expect(apmBuilder).toBeDefined();
    expect(apmBuilder?.description).toContain('apm-builder');
  });

  it('dedupes by name with repo-local priority', async () => {
    const entries = await scanSkillCatalog({
      repoLocal: path.join(REPO_ROOT, 'skills'),
      home: path.join(REPO_ROOT, 'skills'), // same dir simulates a duplicate
      pluginsCache: undefined,
    });
    const counts = new Map<string, number>();
    for (const e of entries) counts.set(e.name, (counts.get(e.name) ?? 0) + 1);
    expect([...counts.values()].every((c) => c === 1)).toBe(true);
  });
});
