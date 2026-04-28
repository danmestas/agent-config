import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { composeHarnessHome } from '../lib/ac/symlink-farm.ts';

async function makeFakeUserHome(): Promise<string> {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), 'real-home-'));
  await fs.mkdir(path.join(home, '.claude', 'skills', 'a'), { recursive: true });
  await fs.mkdir(path.join(home, '.claude', 'skills', 'b'), { recursive: true });
  await fs.writeFile(path.join(home, '.claude', 'skills', 'a', 'SKILL.md'), '---\nname: a\n---\n');
  await fs.writeFile(path.join(home, '.claude', 'skills', 'b', 'SKILL.md'), '---\nname: b\n---\n');
  await fs.writeFile(path.join(home, '.claude', '.credentials.json'), '{"oauth":"fake"}');
  await fs.writeFile(path.join(home, '.claude', 'settings.json'), '{}');
  return home;
}

describe('composeHarnessHome', () => {
  it('mirrors home via symlinks, replaces skills/ with filtered subset', async () => {
    const realHome = await makeFakeUserHome();
    const result = await composeHarnessHome({
      target: 'claude-code',
      realHome,
      skillsKeep: ['a'], // keep a, drop b
    });

    // tempdir/.claude/.credentials.json should be a symlink to realHome's credentials
    const credLink = path.join(result.tempHome, '.claude', '.credentials.json');
    const credStat = await fs.lstat(credLink);
    expect(credStat.isSymbolicLink()).toBe(true);

    // tempdir/.claude/skills should contain only 'a'
    const skillsDir = path.join(result.tempHome, '.claude', 'skills');
    const filtered = await fs.readdir(skillsDir);
    expect(filtered).toContain('a');
    expect(filtered).not.toContain('b');
  });

  it('returns a cleanup function that removes the tempdir', async () => {
    const realHome = await makeFakeUserHome();
    const result = await composeHarnessHome({
      target: 'claude-code',
      realHome,
      skillsKeep: [],
    });
    await result.cleanup();
    await expect(fs.access(result.tempHome)).rejects.toThrow();
  });

  it('throws for targets without user-scope skills layout', async () => {
    const realHome = await fs.mkdtemp(path.join(os.tmpdir(), 'real-home-'));
    await expect(
      composeHarnessHome({ target: 'codex', realHome, skillsKeep: [] }),
    ).rejects.toThrow(/codex.*no user-scope/i);
  });

  it('symlinks home-root files matching the harness prefix', async () => {
    const realHome = await fs.mkdtemp(path.join(os.tmpdir(), 'real-home-'));
    await fs.mkdir(path.join(realHome, '.claude'), { recursive: true });
    await fs.writeFile(path.join(realHome, '.claude', '.credentials.json'), '{}');
    await fs.writeFile(path.join(realHome, '.claude.json'), '{"x":1}');
    await fs.writeFile(path.join(realHome, '.claude-extra.txt'), 'extra');
    await fs.writeFile(path.join(realHome, '.bashrc'), 'unrelated');

    const result = await composeHarnessHome({
      target: 'claude-code',
      realHome,
      skillsKeep: [],
    });

    // .claude.json should be symlinked at home root
    const stat = await fs.lstat(path.join(result.tempHome, '.claude.json'));
    expect(stat.isSymbolicLink()).toBe(true);
    // .claude-extra.txt should also be symlinked (matches prefix)
    expect((await fs.lstat(path.join(result.tempHome, '.claude-extra.txt'))).isSymbolicLink()).toBe(true);
    // .bashrc should NOT be symlinked
    await expect(fs.access(path.join(result.tempHome, '.bashrc'))).rejects.toThrow();
  });
});
