import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { simpleGit } from 'simple-git';
import { runRelease } from '../../lib/release/release.ts';

describe('runRelease', () => {
  it('executes the full validate -> build -> tag -> publish -> changelog flow', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'rel-'));
    // Bare git so push doesn't error.
    const remote = await fs.mkdtemp(path.join(os.tmpdir(), 'rel-remote-'));
    await simpleGit(remote).init(['--bare']);
    const g = simpleGit(repo);
    await g.init();
    await g.addConfig('user.email', 't@e.com');
    await g.addConfig('user.name', 't');
    await fs.mkdir(path.join(repo, 'skills/foo'), { recursive: true });
    await fs.writeFile(
      path.join(repo, 'skills/foo/SKILL.md'),
      [
        '---',
        'name: foo',
        'version: 0.1.0',
        'description: Test skill',
        'type: skill',
        'targets:',
        '  - claude-code',
        '  - apm',
        '  - codex',
        '---',
        '',
        'Body.',
      ].join('\n'),
    );
    await fs.writeFile(
      path.join(repo, 'apm-builder.config.yaml'),
      'apm:\n  package_scope: "@test"\n  registry: ""\nclaude-code:\n  marketplace: claude-plugins-official\n',
    );
    await g.add('.').commit('init');
    await g.addRemote('origin', remote);
    await g.push('origin', 'HEAD:main');
    const ghCalls: string[][] = [];
    const apmCalls: string[][] = [];
    const result = await runRelease({
      repoRoot: repo,
      skill: 'foo',
      version: '0.1.0',
      summary: 'Initial release.',
      apmToken: 'fake-token',
      gitRepo: 'github.com/test/repo',
      runGh: async (args) => {
        ghCalls.push(args);
        return { stdout: '', exitCode: 0 };
      },
      runApm: async (args) => {
        apmCalls.push(args);
        return { stdout: '', exitCode: 0 };
      },
    });
    expect(result.tag).toBe('foo@v0.1.0');
    expect(result.published.claudeCode).toBe(true);
    expect(result.published.apm).toBe('git-url'); // registry=""
    expect(result.published.gitUrlTargets).toContain('codex');
    expect(ghCalls.some((a) => a[0] === 'release' && a.includes('foo@v0.1.0'))).toBe(true);
    expect(apmCalls.length).toBe(0); // empty registry skips apm publish
    const cl = await fs.readFile(path.join(repo, 'CHANGELOG.md'), 'utf8');
    expect(cl).toContain('foo@v0.1.0 — Initial release.');
  });

  it('aborts cleanly if validate fails — no tag, no publish', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'rel-'));
    const g = simpleGit(repo);
    await g.init();
    await g.addConfig('user.email', 't@e.com');
    await g.addConfig('user.name', 't');
    // Invalid: type "plugin" with target "codex" is rejected by the type x target matrix.
    await fs.mkdir(path.join(repo, 'plugins/bundle'), { recursive: true });
    await fs.writeFile(
      path.join(repo, 'plugins/bundle/SKILL.md'),
      [
        '---',
        'name: bundle',
        'version: 0.1.0',
        'description: Bad plugin',
        'type: plugin',
        'targets: [codex]',
        'includes: []',
        '---',
        '',
        'body',
      ].join('\n'),
    );
    await g.add('.').commit('init');
    await expect(
      runRelease({
        repoRoot: repo,
        skill: 'bundle',
        version: '0.1.0',
        summary: 'irrelevant',
        apmToken: undefined,
        gitRepo: 'github.com/x/y',
        pushTag: false,
        runGh: async () => ({ stdout: '', exitCode: 0 }),
        runApm: async () => ({ stdout: '', exitCode: 0 }),
      }),
    ).rejects.toThrow(/validation/i);
    const tags = await g.tags();
    expect(tags.all).toHaveLength(0);
  });

  it('generates a marketplace entry for plugin components', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'rel-mkt-'));
    const remote = await fs.mkdtemp(path.join(os.tmpdir(), 'rel-mkt-remote-'));
    await simpleGit(remote).init(['--bare']);
    const g = simpleGit(repo);
    await g.init();
    await g.addConfig('user.email', 't@e.com');
    await g.addConfig('user.name', 't');
    await fs.mkdir(path.join(repo, 'skills/foo'), { recursive: true });
    await fs.writeFile(
      path.join(repo, 'skills/foo/SKILL.md'),
      '---\nname: foo\nversion: 0.1.0\ndescription: f\ntype: skill\ntargets: [claude-code]\n---\n\nbody\n',
    );
    await fs.mkdir(path.join(repo, 'plugins/bundle'), { recursive: true });
    await fs.writeFile(
      path.join(repo, 'plugins/bundle/SKILL.md'),
      '---\nname: bundle\nversion: 0.2.0\ndescription: b\ntype: plugin\ntargets: [claude-code]\nincludes: [../../skills/foo]\n---\n\nbody\n',
    );
    await fs.writeFile(path.join(repo, 'apm-builder.config.yaml'), 'apm: {}\n');
    await g.add('.').commit('init');
    await g.addRemote('origin', remote);
    await g.push('origin', 'HEAD:main');
    await runRelease({
      repoRoot: repo,
      skill: 'bundle',
      version: '0.2.0',
      summary: 'plugin first release',
      apmToken: undefined,
      gitRepo: 'github.com/test/repo',
      runGh: async () => ({ stdout: '', exitCode: 0 }),
      runApm: async () => ({ stdout: '', exitCode: 0 }),
    });
    const json = JSON.parse(
      await fs.readFile(path.join(repo, 'marketplace/plugins/bundle.json'), 'utf8'),
    );
    expect(json.name).toBe('bundle');
    expect(json.version).toBe('0.2.0');
  });
});
