import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { runBuild } from '../../../lib/build.ts';

describe('gemini end-to-end build', () => {
  it('builds skill + rules + hook + mcp into dist/gemini/', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'apm-builder-gemini-e2e-'));
    const files: Record<string, string> = {
      'apm-builder.config.yaml':
        'gemini:\n  user_settings_path: "~/.gemini/settings.json"\n',
      'skills/foo/SKILL.md':
        '---\nname: foo\nversion: 1.0.0\ndescription: a skill\ntype: skill\ntargets: [gemini]\n---\n\nFoo body.\n',
      'rules/style/SKILL.md':
        '---\nname: style\nversion: 1.0.0\ndescription: style rule\ntype: rules\ntargets: [gemini]\nscope: project\n---\n\nUse spaces.\n',
      'rules/pr-policy/SKILL.md':
        '---\nname: pr-policy\nversion: 1.0.0\ndescription: PR rule\ntype: rules\ntargets: [gemini]\nscope: project\nafter: [style]\n---\n\nOpen PRs.\n',
      'skills/mcp-server/SKILL.md':
        '---\nname: mcp-server\nversion: 1.0.0\ndescription: an mcp\ntype: mcp\ntargets: [gemini]\nmcp:\n  command: node\n  args: [server.js]\n---\n\nMCP body.\n',
    };
    for (const [rel, content] of Object.entries(files)) {
      const full = path.join(repo, rel);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, content);
    }
    const result = await runBuild({ repoRoot: repo, targets: ['gemini'], outDir: 'dist' });
    expect(result.errors.filter((e) => e.severity === 'error')).toEqual([]);

    // Skill emitted as metadata.json + skill.md.
    const metadata = JSON.parse(
      await fs.readFile(path.join(repo, 'dist/gemini/skills/foo/metadata.json'), 'utf8'),
    );
    expect(metadata.name).toBe('foo');
    expect(metadata.body_path).toBe('skill.md');
    const skillBody = await fs.readFile(path.join(repo, 'dist/gemini/skills/foo/skill.md'), 'utf8');
    expect(skillBody).toContain('Foo body.');

    // Rules composed in alphabetical-with-after order: style → pr-policy.
    const geminiMd = await fs.readFile(path.join(repo, 'dist/gemini/GEMINI.md'), 'utf8');
    expect(geminiMd.indexOf('## style')).toBeLessThan(geminiMd.indexOf('## pr-policy'));

    // MCP fragment present.
    const mcpFragment = JSON.parse(
      await fs.readFile(path.join(repo, 'dist/gemini/.gemini/settings.fragment.json'), 'utf8'),
    );
    expect(mcpFragment.mcpServers['mcp-server'].command).toBe('node');
  });
});
