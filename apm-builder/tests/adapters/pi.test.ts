import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import matter from 'gray-matter';
import { piAdapter } from '../../adapters/pi.ts';
import { ManifestSchema } from '../../lib/schema.ts';
import type { ComponentSource } from '../../lib/types.ts';
import { runGolden } from './golden.ts';

const HERE = path.resolve(fileURLToPath(import.meta.url), '..');

async function loadComponent(dir: string, repoRoot: string): Promise<ComponentSource> {
  const raw = await fs.readFile(path.join(dir, 'SKILL.md'), 'utf8');
  const parsed = matter(raw);
  return {
    dir,
    relativeDir: path.relative(repoRoot, dir),
    manifest: ManifestSchema.parse(parsed.data),
    body: parsed.content,
  };
}

describe('pi adapter', () => {
  it('declares target = pi', () => {
    expect(piAdapter.target).toBe('pi');
  });

  it('supports() honors the targets list', () => {
    const ok = piAdapter.supports({
      dir: '/x',
      relativeDir: 'skills/x',
      body: '',
      manifest: {
        name: 'x',
        version: '1.0.0',
        description: 'd',
        type: 'skill',
        targets: ['pi'],
      } as never,
    });
    expect(ok).toBe(true);
  });

  it('emits a skill into .pi/skills/<name>/SKILL.md with stripped frontmatter', async () => {
    const result = await runGolden(piAdapter, path.join(HERE, 'pi/skill-basic'));
    expect(result.diff).toEqual([]);
    expect(result.matched).toBe(true);
  });

  it('emits a Pi-package directory for plugin components', async () => {
    const root = path.join(HERE, 'pi/plugin-package');
    const plugin = await loadComponent(path.join(root, 'component'), root);
    const skill = await loadComponent(path.join(root, 'sibling-skill'), root);
    const all = [plugin, skill];

    const emitted = await piAdapter.emit(plugin, {
      config: { package_keyword: 'pi-package' },
      allComponents: all,
      repoRoot: root,
    });
    const byPath = new Map(emitted.map((f) => [f.path, f.content.toString()]));

    // package.json
    const pkg = JSON.parse(byPath.get('superpowers-philosophy/package.json')!);
    expect(pkg.name).toBe('superpowers-philosophy');
    expect(pkg.keywords).toEqual(['pi', 'pi-package']);
    expect(pkg.main).toBe('src/index.ts');
    expect(pkg.peerDependencies['@mariozechner/pi-coding-agent']).toBe('*');

    // src/index.ts uses ExtensionAPI
    const idx = byPath.get('superpowers-philosophy/src/index.ts');
    expect(idx).toContain('@mariozechner/pi-coding-agent');
    expect(idx).toContain('pi.registerCommand("skill"');

    // included skill copied with stripped frontmatter
    const skillMd = byPath.get('superpowers-philosophy/skills/ousterhout/SKILL.md');
    expect(skillMd).toMatch(/^---\nname: ousterhout\ndescription: /);
    expect(skillMd).toContain('# Ousterhout');

    // README
    const readme = byPath.get('superpowers-philosophy/README.md');
    expect(readme).toContain('| ousterhout |');
  });

  it('emits a TS extension scaffold for hook components', async () => {
    const result = await runGolden(piAdapter, path.join(HERE, 'pi/hook-extension'));
    expect(result.diff).toEqual([]);
  });

  it('emits an experimental mcp stub with a pending-format note', async () => {
    const result = await runGolden(piAdapter, path.join(HERE, 'pi/mcp-stub'));
    expect(result.diff).toEqual([]);
  });

  it('plugin package.json matches pi-powers shape', async () => {
    const snapshotPkg = JSON.parse(
      await fs.readFile(path.join(HERE, 'pi/_pi-powers-snapshot/package.json'), 'utf8'),
    );
    for (const key of ['name', 'version', 'description', 'main', 'type', 'keywords', 'peerDependencies']) {
      expect(snapshotPkg).toHaveProperty(key);
    }
    expect(snapshotPkg.keywords).toContain('pi');
  });

  it('composes rules + agents + skills into .pi/AGENTS.md', async () => {
    const root = path.join(HERE, 'pi/agents-md-compose');
    const components = await Promise.all([
      loadComponent(path.join(root, 'components/r-base-style'), root),
      loadComponent(path.join(root, 'components/r-pr-policy'), root),
      loadComponent(path.join(root, 'components/a-code-reviewer'), root),
      loadComponent(path.join(root, 'components/s-tdd'), root),
    ]);

    const results = await Promise.all(
      components.map((c) =>
        piAdapter.emit(c, {
          config: { agents_md_section_order: ['rules', 'agents', 'skills'] },
          allComponents: components,
          repoRoot: root,
        }),
      ),
    );
    const flat = results.flat();
    const agentsMd = flat.find((f) => f.path === '.pi/AGENTS.md');
    const expected = await fs.readFile(path.join(root, 'expected/.pi/AGENTS.md'), 'utf8');
    expect(agentsMd?.content.toString()).toBe(expected);

    // Idempotent: only one .pi/AGENTS.md should be emitted across all calls.
    const count = flat.filter((f) => f.path === '.pi/AGENTS.md').length;
    expect(count).toBe(1);
  });
});
