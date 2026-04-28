import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadHarnessCatalog } from '../lib/ac/harness-catalog.ts';

async function makeFixtureHome(): Promise<string> {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), 'fake-home-'));
  await fs.mkdir(path.join(home, '.claude', 'skills', 'tooling-skill'), { recursive: true });
  await fs.writeFile(
    path.join(home, '.claude', 'skills', 'tooling-skill', 'SKILL.md'),
    `---
name: tooling-skill
description: A tooling skill
category:
  primary: tooling
---
body
`,
  );
  await fs.mkdir(path.join(home, '.claude', 'skills', 'uncategorized-skill'), { recursive: true });
  await fs.writeFile(
    path.join(home, '.claude', 'skills', 'uncategorized-skill', 'SKILL.md'),
    `---
name: uncategorized-skill
description: A skill with no category
---
body
`,
  );
  return home;
}

describe('loadHarnessCatalog', () => {
  it('reads claude-code skills from ~/.claude/skills/', async () => {
    const home = await makeFixtureHome();
    const catalog = await loadHarnessCatalog('claude-code', home);
    expect(catalog).toHaveLength(2);
    const tooling = catalog.find((c) => c.manifest.name === 'tooling-skill');
    expect((tooling?.manifest as any).category?.primary).toBe('tooling');
    const uncat = catalog.find((c) => c.manifest.name === 'uncategorized-skill');
    expect(uncat).toBeDefined();
    expect((uncat?.manifest as any).category).toBeUndefined();
  });

  it('returns empty array if home dir has no skills', async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), 'empty-home-'));
    const catalog = await loadHarnessCatalog('claude-code', home);
    expect(catalog).toEqual([]);
  });

  it('skips files without valid frontmatter', async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), 'bad-home-'));
    await fs.mkdir(path.join(home, '.claude', 'skills', 'bad'), { recursive: true });
    await fs.writeFile(path.join(home, '.claude', 'skills', 'bad', 'SKILL.md'), 'no frontmatter here');
    const catalog = await loadHarnessCatalog('claude-code', home);
    expect(catalog).toEqual([]);
  });
});
