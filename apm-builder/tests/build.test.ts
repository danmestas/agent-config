import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { runBuild } from '../lib/build.ts';

async function setupRepo(structure: Record<string, string>): Promise<string> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'apm-builder-build-'));
  for (const [rel, content] of Object.entries(structure)) {
    const full = path.join(tmp, rel);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, content);
  }
  return tmp;
}

describe('runBuild', () => {
  it('emits one skill to dist/claude-code/skills/<name>/SKILL.md', async () => {
    const repo = await setupRepo({
      'skills/sample/SKILL.md':
        '---\nname: sample\nversion: 1.0.0\ndescription: d\ntype: skill\ntargets: [claude-code]\n---\n\nBody.\n',
    });
    const result = await runBuild({ repoRoot: repo, targets: ['claude-code'], outDir: 'dist' });
    expect(result.errors.filter((e) => e.severity === 'error')).toEqual([]);
    const out = await fs.readFile(
      path.join(repo, 'dist/claude-code/skills/sample/SKILL.md'),
      'utf8',
    );
    expect(out).toContain('name: sample');
    expect(out).toContain('Body.');
  });

  it('returns validation errors and skips emission', async () => {
    const repo = await setupRepo({
      'skills/sample/SKILL.md':
        '---\nname: sample\nversion: 1.0.0\ndescription: d\ntype: plugin\ntargets: [codex]\nincludes: []\n---\n\nBody.\n',
    });
    const result = await runBuild({ repoRoot: repo, targets: ['codex'], outDir: 'dist' });
    expect(result.errors.some((e) => e.severity === 'error')).toBe(true);
    const distExists = await fs
      .stat(path.join(repo, 'dist'))
      .then(() => true)
      .catch(() => false);
    expect(distExists).toBe(false);
  });
});
