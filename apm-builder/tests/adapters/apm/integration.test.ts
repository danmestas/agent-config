import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { runBuild } from '../../../lib/build.ts';

describe('apm adapter end-to-end', () => {
  it('builds a mixed-component repo to dist/apm/', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'apm-builder-apm-e2e-'));
    const files: Record<string, string> = {
      'apm-builder.config.yaml': 'apm:\n  package_scope: "@danmestas"\n',
      'skills/foo/SKILL.md':
        '---\nname: foo\nversion: 1.0.0\ndescription: a skill\ntype: skill\ntargets: [apm]\n---\n\nFoo body.\n',
      'rules/style/SKILL.md':
        '---\nname: style\nversion: 1.0.0\ndescription: style rule\ntype: rules\ntargets: [apm]\nscope: project\n---\n\nUse spaces.\n',
      'plugins/bundle/SKILL.md':
        '---\nname: bundle\nversion: 1.0.0\ndescription: bundle\ntype: plugin\ntargets: [apm]\nincludes: [../../skills/foo]\n---\n\nBundle body.\n',
    };
    for (const [rel, content] of Object.entries(files)) {
      const full = path.join(repo, rel);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, content);
    }
    const result = await runBuild({
      repoRoot: repo,
      targets: ['apm'],
      outDir: 'dist',
    });
    expect(result.errors.filter((e) => e.severity === 'error')).toEqual([]);

    const skillManifest = await fs.readFile(
      path.join(repo, 'dist/apm/foo/apm.yml'),
      'utf8',
    );
    expect(skillManifest).toContain('"@danmestas/foo"');

    const skillBody = await fs.readFile(
      path.join(repo, 'dist/apm/foo/.apm/skills/foo/SKILL.md'),
      'utf8',
    );
    expect(skillBody).toContain('Foo body.');

    const constitution = await fs.readFile(
      path.join(repo, 'dist/apm/rules-bundle/memory/constitution.md'),
      'utf8',
    );
    expect(constitution).toContain('## style');
    expect(constitution).toContain('Use spaces.');

    const pluginJson = JSON.parse(
      await fs.readFile(path.join(repo, 'dist/apm/bundle/plugin.json'), 'utf8'),
    );
    expect(pluginJson.skills).toEqual(['foo']);
  });
});
