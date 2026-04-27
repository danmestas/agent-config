import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import matter from 'gray-matter';
import { codexAdapter } from '../../adapters/codex.ts';
import { ManifestSchema } from '../../lib/schema.ts';
import { runGolden } from './golden.ts';
import type { ComponentSource, AdapterContext } from '../../lib/types.ts';

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

describe('codex adapter', () => {
  it('emits a single skill into AGENTS.md', async () => {
    const result = await runGolden(codexAdapter, path.join(HERE, 'codex/skill-basic'));
    expect(result.diff).toEqual([]);
    expect(result.matched).toBe(true);
  });

  it('emits a single agent into AGENTS.md', async () => {
    const result = await runGolden(codexAdapter, path.join(HERE, 'codex/agent-basic'));
    expect(result.diff).toEqual([]);
  });

  it('emits a single rule into AGENTS.md', async () => {
    const result = await runGolden(codexAdapter, path.join(HERE, 'codex/rules-basic'));
    expect(result.diff).toEqual([]);
  });

  it('composes skill + agent + rules into one AGENTS.md (default order)', async () => {
    const root = path.join(HERE, 'codex/composition');
    const skill = await loadComponent(path.join(root, 'component'), root);
    const agent = await loadComponent(path.join(root, 'extra/agents/code-reviewer'), root);
    const rule = await loadComponent(path.join(root, 'extra/rules/pr-policy'), root);
    const all = [skill, agent, rule];
    // Invoke for every component — exactly one should emit AGENTS.md.
    const results = await Promise.all(
      all.map((c) =>
        codexAdapter.emit(c, { config: {}, allComponents: all, repoRoot: root }),
      ),
    );
    const agentsMd = results.flat().filter((f) => f.path === 'AGENTS.md');
    expect(agentsMd).toHaveLength(1); // idempotency: only one emission across N invocations
    const expected = await fs.readFile(path.join(root, 'expected/AGENTS.md'), 'utf8');
    expect(agentsMd[0]?.content.toString()).toBe(expected);
  });

  it('honors codex.agents_md_section_order from config', async () => {
    const root = path.join(HERE, 'codex/composition-custom-order');
    const skill = await loadComponent(path.join(root, 'component'), root);
    const all = [skill];
    const ctx: AdapterContext = {
      config: { agents_md_section_order: ['skills', 'rules', 'agents'] },
      allComponents: all,
      repoRoot: root,
    };
    const emitted = await codexAdapter.emit(skill, ctx);
    const agentsMd = emitted.find((f) => f.path === 'AGENTS.md');
    const expected = await fs.readFile(path.join(root, 'expected/AGENTS.md'), 'utf8');
    expect(agentsMd?.content.toString()).toBe(expected);
  });

  it('returns empty array when invoked on non-first content-bearing component', async () => {
    const root = path.join(HERE, 'codex/composition');
    const skill = await loadComponent(path.join(root, 'component'), root);
    const agent = await loadComponent(path.join(root, 'extra/agents/code-reviewer'), root);
    const rule = await loadComponent(path.join(root, 'extra/rules/pr-policy'), root);
    const all = [skill, agent, rule];
    // sample-skill is alphabetically last; pr-policy is middle; code-reviewer first.
    // So invoking on rule (pr-policy) should return [].
    const emitted = await codexAdapter.emit(rule, {
      config: {},
      allComponents: all,
      repoRoot: root,
    });
    expect(emitted).toEqual([]);
  });

  it('emits a hook component as hooks.json + bundled scripts', async () => {
    const result = await runGolden(codexAdapter, path.join(HERE, 'codex/hook-basic'));
    expect(result.diff).toEqual([]);
  });

  it('composes multiple mcp components into one codex.config.toml', async () => {
    const root = path.join(HERE, 'codex/mcp-basic');
    const a = await loadComponent(path.join(root, 'component'), root);
    const b = await loadComponent(path.join(root, 'extra/mcp/another-server'), root);
    const all = [a, b];
    const results = await Promise.all(
      all.map((c) =>
        codexAdapter.emit(c, { config: {}, allComponents: all, repoRoot: root }),
      ),
    );
    const tomlFiles = results.flat().filter((f) => f.path === 'codex.config.toml');
    expect(tomlFiles).toHaveLength(1); // idempotency
    const expected = await fs.readFile(path.join(root, 'expected/codex.config.toml'), 'utf8');
    expect(tomlFiles[0]?.content.toString().trim()).toBe(expected.trim());
  });
});
