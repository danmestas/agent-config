import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import matter from 'gray-matter';
import { copilotAdapter } from '../../adapters/copilot.ts';
import { ManifestSchema } from '../../lib/schema.ts';
import type { ComponentSource } from '../../lib/types.ts';
import { runBuild } from '../../lib/build.ts';

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

describe('copilot adapter — end-to-end via runBuild', () => {
  it('builds rules + skills + hook into dist/copilot/', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'apm-builder-copilot-e2e-'));
    const files: Record<string, string> = {
      'apm-builder.config.yaml': 'copilot:\n  hooks_dir: ".github/hooks"\n',
      'rules/style/SKILL.md':
        '---\nname: style\nversion: 1.0.0\ndescription: style\ntype: rules\ntargets: [copilot]\nscope: project\n---\n\nUse 2-space indent.\n',
      'skills/foo/SKILL.md':
        '---\nname: foo\nversion: 1.0.0\ndescription: foo\ntype: skill\ntargets: [copilot]\n---\n\nFoo body.\n',
      'skills/tts/SKILL.md':
        '---\nname: tts\nversion: 1.0.0\ndescription: tts\ntype: hook\ntargets: [copilot]\nhooks:\n  Stop:\n    command: hooks/announce.sh\n---\n\nHook body.\n',
    };
    for (const [rel, content] of Object.entries(files)) {
      const full = path.join(repo, rel);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, content);
    }
    const result = await runBuild({ repoRoot: repo, targets: ['copilot'], outDir: 'dist' });
    // The skill warning ("⚠️ best-effort") is expected; no errors.
    expect(result.errors.filter((e) => e.severity === 'error')).toEqual([]);
    expect(result.errors.some((e) => e.severity === 'warning')).toBe(true);

    const instructions = await fs.readFile(
      path.join(repo, 'dist/copilot/copilot-instructions.md'),
      'utf8',
    );
    expect(instructions).toContain('# Rules');
    expect(instructions).toContain('## style');
    expect(instructions).toContain('# Skills');
    expect(instructions).toContain('## foo');

    const hookFile = await fs.readFile(
      path.join(repo, 'dist/copilot/.github/hooks/Stop-tts.json'),
      'utf8',
    );
    expect(JSON.parse(hookFile)).toEqual({
      event: 'Stop',
      matcher: '*',
      command: 'hooks/announce.sh',
      type: 'command',
    });
  });

  it('runBuild rejects plugin/agent/mcp targeting copilot via validator', async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), 'apm-builder-copilot-rej-'));
    await fs.mkdir(path.join(repo, 'plugins/bad'), { recursive: true });
    await fs.writeFile(
      path.join(repo, 'plugins/bad/SKILL.md'),
      '---\nname: bad\nversion: 1.0.0\ndescription: d\ntype: plugin\ntargets: [copilot]\nincludes: []\n---\n\nx\n',
    );
    const result = await runBuild({ repoRoot: repo, targets: ['copilot'], outDir: 'dist' });
    expect(result.errors.some((e) => e.severity === 'error' && /plugin.*copilot/i.test(e.message))).toBe(true);
    const distExists = await fs
      .stat(path.join(repo, 'dist'))
      .then(() => true)
      .catch(() => false);
    expect(distExists).toBe(false);
  });
});
