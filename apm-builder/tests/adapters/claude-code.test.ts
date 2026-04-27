import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import matter from 'gray-matter';
import { claudeCodeAdapter } from '../../adapters/claude-code.ts';
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

describe('claude-code adapter', () => {
  it('emits a basic skill correctly', async () => {
    const result = await runGolden(claudeCodeAdapter, path.join(HERE, 'claude-code/skill-basic'));
    expect(result.diff).toEqual([]);
    expect(result.matched).toBe(true);
  });

  it('emits an agent component', async () => {
    const result = await runGolden(claudeCodeAdapter, path.join(HERE, 'claude-code/agent-basic'));
    expect(result.diff).toEqual([]);
  });

  it('composes rules into one CLAUDE.md ordered by before/after', async () => {
    const root = path.join(HERE, 'claude-code/rules-compose');
    const baseStyle = await loadComponent(path.join(root, 'component'), root);
    const prPolicy = await loadComponent(path.join(root, 'extra/rules/pr-policy'), root);
    const all = [baseStyle, prPolicy];
    const results = await Promise.all(
      all.map((c) =>
        claudeCodeAdapter.emit(c, { config: {}, allComponents: all, repoRoot: root }),
      ),
    );
    const claudeMd = results.flat().find((f) => f.path === 'CLAUDE.md');
    const expected = await fs.readFile(path.join(root, 'expected/CLAUDE.md'), 'utf8');
    expect(claudeMd?.content.toString()).toBe(expected);
    const claudeMdCount = results.flat().filter((f) => f.path === 'CLAUDE.md').length;
    expect(claudeMdCount).toBe(1);
  });

  it('emits a hook component with settings fragment + script', async () => {
    const result = await runGolden(claudeCodeAdapter, path.join(HERE, 'claude-code/hook-basic'));
    expect(result.diff).toEqual([]);
  });

  it('emits an mcp component as .mcp.fragment.json', async () => {
    const result = await runGolden(claudeCodeAdapter, path.join(HERE, 'claude-code/mcp-basic'));
    expect(result.diff).toEqual([]);
  });

  it('emits a plugin component listing included skills', async () => {
    const root = path.join(HERE, 'claude-code/plugin-basic');
    const plugin = await loadComponent(path.join(root, 'component'), root);
    const skill = await loadComponent(path.join(root, 'sibling-skill'), root);
    const all = [plugin, skill];
    const emitted = await claudeCodeAdapter.emit(plugin, {
      config: {},
      allComponents: all,
      repoRoot: root,
    });
    const pluginJson = emitted.find((f) => f.path === '.claude-plugin/plugin.json');
    const expected = await fs.readFile(path.join(root, 'expected/.claude-plugin/plugin.json'), 'utf8');
    expect(pluginJson?.content.toString()).toBe(expected);
  });

  it('escapes YAML special chars in description and name', async () => {
    const result = await runGolden(claudeCodeAdapter, path.join(HERE, 'claude-code/skill-with-special-chars'));
    expect(result.diff).toEqual([]);
  });

  it('throws when hook references a missing script', async () => {
    // Reuse hook-basic fixture but mutate manifest in-memory to point at a non-existent script.
    const root = path.join(HERE, 'claude-code/hook-basic');
    const raw = await fs.readFile(path.join(root, 'component/SKILL.md'), 'utf8');
    const parsed = matter(raw);
    const manifest = ManifestSchema.parse({
      ...parsed.data,
      hooks: { Stop: { command: 'hooks/missing.sh' } },
    });
    const component: ComponentSource = {
      dir: path.join(root, 'component'),
      relativeDir: 'component',
      manifest,
      body: parsed.content,
    };
    await expect(
      claudeCodeAdapter.emit(component, { config: {}, allComponents: [component], repoRoot: root }),
    ).rejects.toThrow(/missing script/);
  });
});
