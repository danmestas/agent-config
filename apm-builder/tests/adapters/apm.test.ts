import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import matter from 'gray-matter';
import { apmAdapter } from '../../adapters/apm.ts';
import { ManifestSchema } from '../../lib/schema.ts';
import type { ComponentSource, AdapterContext } from '../../lib/types.ts';
import { runGolden } from './golden.ts';

const HERE = path.resolve(fileURLToPath(import.meta.url), '..');

const SCOPED_CONFIG = { package_scope: '@danmestas' };

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

describe('apm adapter', () => {
  it('emits a skill as a one-skill apm package', async () => {
    const result = await runGolden(
      apmAdapter,
      path.join(HERE, 'apm/skill-basic'),
      SCOPED_CONFIG,
    );
    expect(result.diff).toEqual([]);
    expect(result.matched).toBe(true);
  });

  it('emits an agent component as <package>/.apm/agents/<name>.agent.md', async () => {
    const result = await runGolden(
      apmAdapter,
      path.join(HERE, 'apm/agent-basic'),
      SCOPED_CONFIG,
    );
    expect(result.diff).toEqual([]);
  });

  it('emits a hook with bundled scripts and a scripts: entry per event', async () => {
    const result = await runGolden(
      apmAdapter,
      path.join(HERE, 'apm/hook-basic'),
      SCOPED_CONFIG,
    );
    expect(result.diff).toEqual([]);
  });

  it('emits an mcp component as a self-defined dependency in apm.yml', async () => {
    const result = await runGolden(
      apmAdapter,
      path.join(HERE, 'apm/mcp-basic'),
      SCOPED_CONFIG,
    );
    expect(result.diff).toEqual([]);
  });

  it('emits a plugin as a hybrid package with apm.yml + plugin.json', async () => {
    const root = path.join(HERE, 'apm/plugin-basic');
    const plugin = await loadComponent(path.join(root, 'component'), root);
    const skill = await loadComponent(path.join(root, 'sibling-skill'), root);
    const ctx: AdapterContext = {
      config: SCOPED_CONFIG,
      allComponents: [plugin, skill],
      repoRoot: root,
    };
    const emitted = await apmAdapter.emit(plugin, ctx);
    const apmYml = emitted.find((f) => f.path === 'superpowers-philosophy/apm.yml');
    const pluginJson = emitted.find((f) => f.path === 'superpowers-philosophy/plugin.json');
    const expectedYml = await fs.readFile(
      path.join(root, 'expected/superpowers-philosophy/apm.yml'),
      'utf8',
    );
    const expectedJson = await fs.readFile(
      path.join(root, 'expected/superpowers-philosophy/plugin.json'),
      'utf8',
    );
    expect(apmYml?.content.toString()).toBe(expectedYml);
    expect(pluginJson?.content.toString()).toBe(expectedJson);
  });

  it('respects overrides.apm.package_name', async () => {
    const result = await runGolden(
      apmAdapter,
      path.join(HERE, 'apm/override-name'),
      SCOPED_CONFIG,
    );
    expect(result.diff).toEqual([]);
  });

  it('composes project-scope rules into a single memory/constitution.md package', async () => {
    const root = path.join(HERE, 'apm/rules-compose');
    const baseStyle = await loadComponent(path.join(root, 'component'), root);
    const prPolicy = await loadComponent(path.join(root, 'extra/rules/pr-policy'), root);
    const all = [baseStyle, prPolicy];
    const ctx: AdapterContext = {
      config: SCOPED_CONFIG,
      allComponents: all,
      repoRoot: root,
    };
    const results = await Promise.all(all.map((c) => apmAdapter.emit(c, ctx)));
    const flat = results.flat();
    const constitution = flat.find((f) => f.path === 'rules-bundle/memory/constitution.md');
    const manifest = flat.find((f) => f.path === 'rules-bundle/apm.yml');
    const expectedConstitution = await fs.readFile(
      path.join(root, 'expected/rules-bundle/memory/constitution.md'),
      'utf8',
    );
    const expectedManifest = await fs.readFile(
      path.join(root, 'expected/rules-bundle/apm.yml'),
      'utf8',
    );
    expect(constitution?.content.toString()).toBe(expectedConstitution);
    expect(manifest?.content.toString()).toBe(expectedManifest);
    // Idempotence: the constitution.md must appear exactly once across all emit() calls.
    const constitutionCount = flat.filter((f) => f.path === 'rules-bundle/memory/constitution.md').length;
    expect(constitutionCount).toBe(1);
  });
});
