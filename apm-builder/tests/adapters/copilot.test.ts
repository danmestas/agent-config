import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import matter from 'gray-matter';
import { copilotAdapter } from '../../adapters/copilot.ts';
import { ManifestSchema } from '../../lib/schema.ts';
import type { ComponentSource } from '../../lib/types.ts';

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

describe('copilot adapter', () => {
  it('composes project rules into copilot-instructions.md ordered by before/after', async () => {
    const root = path.join(HERE, 'copilot/rules-compose');
    const baseStyle = await loadComponent(path.join(root, 'component'), root);
    const prPolicy = await loadComponent(path.join(root, 'extra/rules/pr-policy'), root);
    const all = [baseStyle, prPolicy];
    const results = await Promise.all(
      all.map((c) =>
        copilotAdapter.emit(c, { config: {}, allComponents: all, repoRoot: root }),
      ),
    );
    const flat = results.flat();
    const file = flat.find((f) => f.path === 'copilot-instructions.md');
    const expected = await fs.readFile(path.join(root, 'expected/copilot-instructions.md'), 'utf8');
    expect(file?.content.toString()).toBe(expected);
    // Idempotency: the composed file should be emitted exactly once across all rules.
    expect(flat.filter((f) => f.path === 'copilot-instructions.md').length).toBe(1);
  });

  it('appends skills as ## sections under # Skills, alphabetical', async () => {
    const root = path.join(HERE, 'copilot/skill-as-instructions');
    const alpha = await loadComponent(path.join(root, 'component'), root);
    const beta = await loadComponent(path.join(root, 'extra/skills/another'), root);
    const all = [alpha, beta];
    const results = await Promise.all(
      all.map((c) =>
        copilotAdapter.emit(c, { config: {}, allComponents: all, repoRoot: root }),
      ),
    );
    const flat = results.flat();
    const file = flat.find((f) => f.path === 'copilot-instructions.md');
    const expected = await fs.readFile(path.join(root, 'expected/copilot-instructions.md'), 'utf8');
    expect(file?.content.toString()).toBe(expected);
    // Idempotency: emitted exactly once.
    expect(flat.filter((f) => f.path === 'copilot-instructions.md').length).toBe(1);
  });

  it('emits rules first, then skills, in a single copilot-instructions.md', async () => {
    const root = path.join(HERE, 'copilot/rules-and-skills');
    const style = await loadComponent(path.join(root, 'rules/style'), root);
    const foo = await loadComponent(path.join(root, 'skills/foo'), root);
    const all = [style, foo];
    const results = await Promise.all(
      all.map((c) =>
        copilotAdapter.emit(c, { config: {}, allComponents: all, repoRoot: root }),
      ),
    );
    const flat = results.flat();
    const file = flat.find((f) => f.path === 'copilot-instructions.md');
    const expected = await fs.readFile(path.join(root, 'expected/copilot-instructions.md'), 'utf8');
    expect(file?.content.toString()).toBe(expected);
    // Owner is the rule (alphabetically-first rule beats alphabetically-first skill).
    expect(flat.filter((f) => f.path === 'copilot-instructions.md').length).toBe(1);
  });

  it('emits one JSON file per hook event under .github/hooks/', async () => {
    const root = path.join(HERE, 'copilot/hook-basic');
    const hook = await loadComponent(path.join(root, 'component'), root);
    const emitted = await copilotAdapter.emit(hook, {
      config: {},
      allComponents: [hook],
      repoRoot: root,
    });
    const file = emitted.find((f) => f.path === '.github/hooks/Stop-tts-announcer.json');
    expect(file).toBeDefined();
    const expected = await fs.readFile(
      path.join(root, 'expected/.github/hooks/Stop-tts-announcer.json'),
      'utf8',
    );
    expect(file!.content.toString()).toBe(expected);
  });

  it('honors hooks_dir override from repo config and preserves matcher', async () => {
    const root = path.join(HERE, 'copilot/hook-custom-dir');
    const hook = await loadComponent(path.join(root, 'component'), root);
    const emitted = await copilotAdapter.emit(hook, {
      config: { hooks_dir: '.copilot/hooks' },
      allComponents: [hook],
      repoRoot: root,
    });
    const file = emitted.find((f) => f.path === '.copilot/hooks/PreToolUse-guard.json');
    expect(file).toBeDefined();
    const expected = await fs.readFile(
      path.join(root, 'expected/.copilot/hooks/PreToolUse-guard.json'),
      'utf8',
    );
    expect(file!.content.toString()).toBe(expected);
  });

  it.each(['plugin', 'agent', 'mcp'] as const)(
    'throws a clear error when asked to emit unsupported type %s',
    async (type) => {
      const stub: ComponentSource = {
        dir: '/tmp/x',
        relativeDir: 'x',
        body: '',
        manifest: {
          name: 'x',
          version: '1.0.0',
          description: 'd',
          type,
          targets: ['copilot'],
          // Minimal type-specific fields so the schema-bypassed manifest is structurally complete:
          ...(type === 'plugin' ? { includes: [] } : {}),
          ...(type === 'mcp' ? { mcp: { command: 'noop' } } : {}),
        } as ComponentSource['manifest'],
      };
      await expect(
        copilotAdapter.emit(stub, { config: {}, allComponents: [stub], repoRoot: '/tmp' }),
      ).rejects.toThrow(/copilot.*not supported/i);
    },
  );
});
