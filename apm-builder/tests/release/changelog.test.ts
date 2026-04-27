import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendChangelogEntry } from '../../lib/release/changelog.ts';

const FIXTURES = path.resolve(fileURLToPath(import.meta.url), '../fixtures');

describe('appendChangelogEntry', () => {
  it('prepends a new release line under a new date heading when needed', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cl-'));
    const target = path.join(tmp, 'CHANGELOG.md');
    await fs.copyFile(path.join(FIXTURES, 'sample-changelog-before.md'), target);
    await appendChangelogEntry(target, {
      skill: 'pikchr-generator',
      version: '1.2.0',
      date: new Date('2026-04-26T00:00:00Z'),
      summary: 'Add Kroki fallback for offline rendering.',
    });
    const after = await fs.readFile(target, 'utf8');
    const expected = await fs.readFile(path.join(FIXTURES, 'sample-changelog-after.md'), 'utf8');
    expect(after).toBe(expected);
  });

  it('creates the file with the standard header when missing', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cl-'));
    const target = path.join(tmp, 'CHANGELOG.md');
    await appendChangelogEntry(target, {
      skill: 'foo',
      version: '0.1.0',
      date: new Date('2026-04-26T00:00:00Z'),
      summary: 'Initial release.',
    });
    const after = await fs.readFile(target, 'utf8');
    expect(after).toContain('# Changelog');
    expect(after).toContain('foo@v0.1.0 — Initial release.');
  });

  it('appends under an existing date heading without duplicating it', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cl-'));
    const target = path.join(tmp, 'CHANGELOG.md');
    await fs.writeFile(
      target,
      '# Changelog\n\n## 2026-04-26\n\n- foo@v0.1.0 — first.\n',
    );
    await appendChangelogEntry(target, {
      skill: 'bar',
      version: '0.2.0',
      date: new Date('2026-04-26T00:00:00Z'),
      summary: 'second.',
    });
    const after = await fs.readFile(target, 'utf8');
    const dateHeadings = after.match(/^## 2026-04-26$/gm) ?? [];
    expect(dateHeadings).toHaveLength(1);
    expect(after).toContain('- bar@v0.2.0 — second.');
    expect(after).toContain('- foo@v0.1.0 — first.');
  });
});
