import { describe, it, expect } from 'vitest';
import { validateComponents, validateAll } from '../lib/validate.ts';
import type { ComponentSource } from '../lib/types.ts';

function mk(overrides: Partial<ComponentSource['manifest']>): ComponentSource {
  return {
    dir: '/tmp/x',
    relativeDir: 'skills/x',
    body: '',
    manifest: {
      name: 'x',
      version: '1.0.0',
      description: 'd',
      type: 'skill',
      targets: ['claude-code'],
      ...overrides,
    } as ComponentSource['manifest'],
  };
}

describe('validateComponents', () => {
  it('passes for a single valid skill', () => {
    const errors = validateComponents([mk({ category: { primary: 'tooling' } })]);
    expect(errors).toEqual([]);
  });

  it('rejects plugin targeting non-bundling harness (codex)', () => {
    const errors = validateComponents([
      mk({ name: 'p', type: 'plugin', targets: ['codex'], includes: [] }),
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toMatch(/plugin.*codex/i);
  });

  it('compatibility-matrix error includes remediation hints (alternative types and targets)', () => {
    const errors = validateComponents([
      mk({ name: 'p', type: 'plugin', targets: ['codex'], includes: [] }),
    ]);
    const matrixErr = errors.find((e) => /cannot target/i.test(e.message));
    expect(matrixErr).toBeDefined();
    // Names valid types for the target ("codex"): everything except plugin.
    expect(matrixErr!.message).toMatch(/skill/);
    expect(matrixErr!.message).toMatch(/hook/);
    // Names valid targets for the type ("plugin"): claude-code, apm, pi.
    expect(matrixErr!.message).toMatch(/claude-code/);
    expect(matrixErr!.message).toMatch(/apm/);
    expect(matrixErr!.message).toMatch(/pi/);
  });

  it('warns on hook for Pi (best-effort, not error)', () => {
    const errors = validateComponents([
      mk({ name: 'h', type: 'hook', targets: ['pi'], hooks: { Stop: { command: 's' } } }),
    ]);
    expect(errors.filter((e) => e.severity === 'error')).toEqual([]);
  });

  it('rejects duplicate component names', () => {
    const errors = validateComponents([mk({ name: 'dup' }), mk({ name: 'dup' })]);
    expect(errors.some((e) => e.message.includes('duplicate'))).toBe(true);
  });

  it('rejects rules.before referencing missing rule', () => {
    const errors = validateComponents([
      mk({ name: 'r1', type: 'rules', scope: 'project', before: ['missing-rule'] }),
    ]);
    expect(errors.some((e) => e.message.includes('missing-rule'))).toBe(true);
  });

  it('detects rules.before/after cycles', () => {
    const errors = validateComponents([
      mk({ name: 'a', type: 'rules', scope: 'project', before: ['b'] }),
      mk({ name: 'b', type: 'rules', scope: 'project', before: ['a'] }),
    ]);
    expect(errors.some((e) => /cycle/i.test(e.message))).toBe(true);
  });

  it('rejects plugin.includes pointing at non-existent component', () => {
    const errors = validateComponents([
      mk({ name: 'pl', type: 'plugin', targets: ['claude-code'], includes: ['../skills/missing'] }),
    ]);
    expect(errors.some((e) => e.message.includes('missing'))).toBe(true);
  });

  it('rejects plugin.includes path that escapes the repo root', () => {
    const errors = validateComponents([
      mk({ name: 'evil', type: 'plugin', targets: ['claude-code'], includes: ['../../../etc/passwd'] }),
    ]);
    expect(errors.some((e) => e.severity === 'error' && /escapes repo root/i.test(e.message))).toBe(true);
  });

  it('warns on Claude Code plugin with empty includes', () => {
    const errors = validateComponents([
      mk({ name: 'pl', type: 'plugin', targets: ['claude-code'], includes: [] }),
    ]);
    expect(errors.some((e) => e.severity === 'warning' && /empty includes/i.test(e.message))).toBe(true);
  });
});

describe('validateComponents category warnings', () => {
  it('warns when a skill has no category field', () => {
    const errors = validateComponents([mk({ name: 'untagged', type: 'skill' })]);
    const warn = errors.find(
      (e) => e.severity === 'warning' && /category/i.test(e.message),
    );
    expect(warn).toBeDefined();
    expect(warn!.componentName).toBe('untagged');
  });

  it('does not warn when a skill has a category', () => {
    const errors = validateComponents([
      mk({
        name: 'tagged',
        type: 'skill',
        category: { primary: 'tooling' },
      }),
    ]);
    expect(errors.filter((e) => /category/i.test(e.message))).toEqual([]);
  });
});

describe('validateComponents — Gemini-specific rejections', () => {
  it('rejects agent type targeting gemini', () => {
    const errors = validateComponents([
      mk({
        name: 'rev',
        type: 'agent',
        targets: ['gemini'],
        agent: { tools: ['Read'], model: 'gemini-2.0-flash' },
      }),
    ]);
    expect(errors.some((e) => e.severity === 'error' && /agent.*gemini/i.test(e.message))).toBe(true);
  });

  it('rejects plugin type targeting gemini', () => {
    const errors = validateComponents([
      mk({ name: 'pl', type: 'plugin', targets: ['gemini'], includes: [] }),
    ]);
    expect(errors.some((e) => e.severity === 'error' && /plugin.*gemini/i.test(e.message))).toBe(true);
  });
});

describe('persona/mode validation', () => {
  // repoRoot points at the actual TAXONOMY.md in the worktree
  const REPO_ROOT = new URL('../..', import.meta.url).pathname;

  it('rejects persona with category not in TAXONOMY', async () => {
    const errors = await validateAll(
      [
        {
          relativeDir: 'personas/bad',
          manifest: {
            name: 'bad',
            version: '1.0.0',
            type: 'persona',
            description: 'bad',
            targets: ['claude-code'],
            categories: ['notARealCategory'],
            skill_include: [],
            skill_exclude: [],
          },
          body: '',
          dir: '/tmp/bad',
        } as any,
      ],
      REPO_ROOT,
    );
    expect(errors.some((e) => e.message.includes('notARealCategory'))).toBe(true);
  });

  it('rejects persona referencing nonexistent skill in skill_include', async () => {
    const errors = await validateAll(
      [
        {
          relativeDir: 'personas/bad',
          manifest: {
            name: 'bad',
            version: '1.0.0',
            type: 'persona',
            description: 'bad',
            targets: ['claude-code'],
            categories: ['tooling'],
            skill_include: ['definitelyNotARealSkill'],
            skill_exclude: [],
          },
          body: '',
          dir: '/tmp/bad',
        } as any,
      ],
      REPO_ROOT,
    );
    expect(errors.some((e) => e.message.includes('definitelyNotARealSkill'))).toBe(true);
  });

  it('rejects mode body > 4096 bytes', async () => {
    const longBody = 'x'.repeat(4097);
    const errors = await validateAll(
      [
        {
          relativeDir: 'modes/long',
          manifest: {
            name: 'long',
            version: '1.0.0',
            type: 'mode',
            description: 't',
            targets: ['claude-code'],
            categories: ['tooling'],
            skill_include: [],
            skill_exclude: [],
          },
          body: longBody,
          dir: '/tmp/long',
        } as any,
      ],
      REPO_ROOT,
    );
    expect(
      errors.some((e) => e.message.toLowerCase().includes('too long') || e.message.includes('4096')),
    ).toBe(true);
  });
});
