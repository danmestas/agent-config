import { describe, it, expect } from 'vitest';
import { validateComponents } from '../lib/validate.ts';
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
    const errors = validateComponents([mk({})]);
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
