import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { runBuild } from '../lib/build.ts';

describe('end-to-end build', () => {
  it('builds a mixed-component repo to dist/claude-code/', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'apm-builder-e2e-'));
    const files: Record<string, string> = {
      'apm-builder.config.yaml': 'claude-code:\n  marketplace: claude-plugins-official\n',
      'skills/foo/SKILL.md':
        '---\nname: foo\nversion: 1.0.0\ndescription: a skill\ntype: skill\ntargets: [claude-code]\n---\n\nFoo body.\n',
      'rules/style/SKILL.md':
        '---\nname: style\nversion: 1.0.0\ndescription: style rule\ntype: rules\ntargets: [claude-code]\nscope: project\n---\n\nUse spaces.\n',
      'plugins/bundle/SKILL.md':
        '---\nname: bundle\nversion: 1.0.0\ndescription: bundle\ntype: plugin\ntargets: [claude-code]\nincludes: [../../skills/foo]\n---\n\nBundle body.\n',
    };
    for (const [rel, content] of Object.entries(files)) {
      const full = path.join(repo, rel);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, content);
    }
    const result = await runBuild({ repoRoot: repo, targets: ['claude-code'], outDir: 'dist' });
    expect(result.errors.filter((e) => e.severity === 'error')).toEqual([]);
    const skillOut = await fs.readFile(path.join(repo, 'dist/claude-code/skills/foo/SKILL.md'), 'utf8');
    expect(skillOut).toContain('Foo body.');
    const claudeMd = await fs.readFile(path.join(repo, 'dist/claude-code/CLAUDE.md'), 'utf8');
    expect(claudeMd).toContain('## style');
    expect(claudeMd).toContain('Use spaces.');
    const pluginJson = await fs.readFile(
      path.join(repo, 'dist/claude-code/.claude-plugin/plugin.json'),
      'utf8',
    );
    expect(JSON.parse(pluginJson).skills).toEqual(['foo']);
  });
});
