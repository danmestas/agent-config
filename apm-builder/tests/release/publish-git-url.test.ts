import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { simpleGit } from 'simple-git';
import { publishGitUrl } from '../../lib/release/publish.ts';

describe('publishGitUrl', () => {
  it('returns a target -> install-URL map for each git-URL target', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'gu-'));
    const g = simpleGit(repo);
    await g.init();
    await g.addConfig('user.email', 't@e.com');
    await g.addConfig('user.name', 't');
    await fs.writeFile(path.join(repo, 'a'), 'a');
    await g.add('a').commit('init');
    await g.tag(['foo@v0.1.0']);
    const result = await publishGitUrl({
      repoRoot: repo,
      tag: 'foo@v0.1.0',
      skill: 'foo',
      version: '0.1.0',
      gitRepo: 'github.com/danmestas/agent-skills',
      targets: ['codex', 'gemini', 'copilot', 'pi'],
    });
    expect(Object.keys(result.installUrls).sort()).toEqual(['codex', 'copilot', 'gemini', 'pi']);
    expect(result.installUrls['codex']).toContain('github.com/danmestas/agent-skills');
    expect(result.installUrls['codex']).toContain('foo@v0.1.0');
  });

  it('refuses to publish when the tag is not present', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'gu-'));
    const g = simpleGit(repo);
    await g.init();
    await g.addConfig('user.email', 't@e.com');
    await g.addConfig('user.name', 't');
    await fs.writeFile(path.join(repo, 'a'), 'a');
    await g.add('a').commit('init');
    await expect(
      publishGitUrl({
        repoRoot: repo,
        tag: 'nope@v0.1.0',
        skill: 'nope',
        version: '0.1.0',
        gitRepo: 'github.com/x/y',
        targets: ['codex'],
      }),
    ).rejects.toThrow(/tag.*nope/i);
  });
});
