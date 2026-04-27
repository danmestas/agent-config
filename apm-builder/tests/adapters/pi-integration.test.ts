import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { runBuild } from '../../lib/build.ts';

async function setupRepo(structure: Record<string, string>): Promise<string> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'pi-e2e-'));
  for (const [rel, content] of Object.entries(structure)) {
    const full = path.join(tmp, rel);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, content);
  }
  return tmp;
}

describe('pi adapter end-to-end via runBuild', () => {
  it('emits a mixed-component repo to dist/pi/', async () => {
    const repo = await setupRepo({
      'apm-builder.config.yaml':
        'pi:\n  package_keyword: pi-package\n  agents_md_section_order: [rules, agents, skills]\n',
      'skills/foo/SKILL.md':
        '---\nname: foo\nversion: 1.0.0\ndescription: a skill\ntype: skill\ntargets: [pi]\n---\n\nFoo body.\n',
      'rules/style/SKILL.md':
        '---\nname: style\nversion: 1.0.0\ndescription: style rule\ntype: rules\ntargets: [pi]\nscope: project\n---\n\nUse spaces.\n',
    });

    const result = await runBuild({
      repoRoot: repo,
      targets: ['pi'],
      outDir: 'dist',
    });
    expect(result.errors.filter((e) => e.severity === 'error')).toEqual([]);

    const skillOut = await fs.readFile(
      path.join(repo, 'dist/pi/.pi/skills/foo/SKILL.md'),
      'utf8',
    );
    expect(skillOut).toContain('name: foo');
    expect(skillOut).toContain('Foo body.');

    const agentsMd = await fs.readFile(path.join(repo, 'dist/pi/.pi/AGENTS.md'), 'utf8');
    expect(agentsMd).toContain('# Rules');
    expect(agentsMd).toContain('## style');
    expect(agentsMd).toContain('# Skills');
    expect(agentsMd).toContain('## foo');
  });
});
