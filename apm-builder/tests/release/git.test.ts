import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { simpleGit } from 'simple-git';
import { tagRelease, computeTag } from '../../lib/release/git.ts';

describe('git release helpers', () => {
  it('computes a <skill>@v<version> tag', () => {
    expect(computeTag('pikchr-generator', '1.2.0')).toBe('pikchr-generator@v1.2.0');
  });

  it('tags HEAD and pushes the tag', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'git-'));
    const remote = await fs.mkdtemp(path.join(os.tmpdir(), 'git-remote-'));
    await simpleGit(remote).init(['--bare']);
    const g = simpleGit(repo);
    await g.init();
    await g.addConfig('user.email', 'test@example.com');
    await g.addConfig('user.name', 'Test');
    await fs.writeFile(path.join(repo, 'a'), 'a');
    await g.add('a').commit('init');
    await g.addRemote('origin', remote);
    await g.push('origin', 'HEAD:main');
    await tagRelease({ repoRoot: repo, skill: 'foo', version: '0.1.0' });
    const tags = await simpleGit(remote).raw(['tag']);
    expect(tags.trim()).toBe('foo@v0.1.0');
  });

  it('is idempotent when tag already exists at HEAD (workflow re-runs)', async () => {
    // The release workflow is triggered by the tag, so by the time it calls
    // tagRelease the tag already exists pointing at HEAD. That should be a no-op
    // rather than an error.
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'git-'));
    const g = simpleGit(repo);
    await g.init();
    await g.addConfig('user.email', 'test@example.com');
    await g.addConfig('user.name', 'Test');
    await fs.writeFile(path.join(repo, 'a'), 'a');
    await g.add('a').commit('init');
    await g.tag(['foo@v0.1.0']);
    const result = await tagRelease({
      repoRoot: repo,
      skill: 'foo',
      version: '0.1.0',
      push: false,
    });
    expect(result).toBe('foo@v0.1.0');
  });

  it('refuses to retag if existing tag points at a different commit', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'git-'));
    const g = simpleGit(repo);
    await g.init();
    await g.addConfig('user.email', 'test@example.com');
    await g.addConfig('user.name', 'Test');
    await fs.writeFile(path.join(repo, 'a'), 'a');
    await g.add('a').commit('init');
    await g.tag(['foo@v0.1.0']); // tag at first commit
    await fs.writeFile(path.join(repo, 'b'), 'b');
    await g.add('b').commit('second commit'); // HEAD now ahead of tag
    await expect(
      tagRelease({ repoRoot: repo, skill: 'foo', version: '0.1.0', push: false }),
    ).rejects.toThrow(/refusing to retag/i);
  });
});
