import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { publishClaudeCode } from '../../lib/release/publish.ts';

describe('publishClaudeCode', () => {
  it('zips dist/claude-code/skills/<name>/ and calls gh release create', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'pcc-'));
    const skillDir = path.join(repo, 'dist/claude-code/skills/foo');
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), '---\nname: foo\n---\n\nbody');
    const calls: string[][] = [];
    const fakeGh = vi.fn(async (args: string[]) => {
      calls.push(args);
      return { stdout: '', exitCode: 0 };
    });
    await publishClaudeCode({
      repoRoot: repo,
      tag: 'foo@v0.1.0',
      skill: 'foo',
      version: '0.1.0',
      releaseNotes: '# foo v0.1.0\n\nNotes.',
      runGh: fakeGh,
    });
    expect(calls.length).toBe(1);
    const args = calls[0]!;
    expect(args[0]).toBe('release');
    expect(args[1]).toBe('create');
    expect(args).toContain('foo@v0.1.0');
    expect(args.some((a) => a.endsWith('foo-v0.1.0.zip'))).toBe(true);
    expect(args).toContain('--notes-file');
    // Verify zip exists at the expected staged location.
    const zipPath = path.join(repo, 'release-artifacts/foo-v0.1.0.zip');
    const stat = await fs.stat(zipPath);
    expect(stat.isFile()).toBe(true);
  });

  it('throws if dist/claude-code/skills/<name>/ is missing', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'pcc-'));
    await expect(
      publishClaudeCode({
        repoRoot: repo,
        tag: 'missing@v0.1.0',
        skill: 'missing',
        version: '0.1.0',
        releaseNotes: '',
        runGh: async () => ({ stdout: '', exitCode: 0 }),
      }),
    ).rejects.toThrow(/dist\/claude-code\/skills\/missing/);
  });
});
