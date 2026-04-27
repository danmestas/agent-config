import { describe, it, expect } from 'vitest';
import { topoSortRules, composeRulesBody } from '../lib/rules.ts';
import type { ComponentSource } from '../lib/types.ts';

function rule(name: string, opts: { before?: string[]; after?: string[]; body?: string } = {}): ComponentSource {
  return {
    dir: `/x/${name}`,
    relativeDir: `rules/${name}`,
    body: opts.body ?? `Body of ${name}.`,
    manifest: {
      name,
      version: '1.0.0',
      description: `${name} rule`,
      type: 'rules',
      targets: ['claude-code', 'gemini'],
      scope: 'project',
      ...(opts.before ? { before: opts.before } : {}),
      ...(opts.after ? { after: opts.after } : {}),
    } as ComponentSource['manifest'],
  };
}

describe('topoSortRules', () => {
  it('orders alphabetically when no before/after', () => {
    const sorted = topoSortRules([rule('charlie'), rule('alpha'), rule('bravo')]);
    expect(sorted.map((r) => r.manifest.name)).toEqual(['alpha', 'bravo', 'charlie']);
  });

  it('honors before: relations', () => {
    const sorted = topoSortRules([
      rule('zulu', { before: ['alpha'] }),
      rule('alpha'),
    ]);
    expect(sorted.map((r) => r.manifest.name)).toEqual(['zulu', 'alpha']);
  });

  it('honors after: relations', () => {
    const sorted = topoSortRules([
      rule('alpha'),
      rule('zulu', { after: ['alpha'] }),
    ]);
    expect(sorted.map((r) => r.manifest.name)).toEqual(['alpha', 'zulu']);
  });

  it('falls back to alphabetical for tied nodes', () => {
    const sorted = topoSortRules([
      rule('charlie', { after: ['root'] }),
      rule('bravo', { after: ['root'] }),
      rule('root'),
    ]);
    expect(sorted.map((r) => r.manifest.name)).toEqual(['root', 'bravo', 'charlie']);
  });
});

describe('composeRulesBody', () => {
  it('joins sections with ## <name> headers', () => {
    const out = composeRulesBody([rule('alpha', { body: 'Use spaces.' }), rule('bravo', { body: 'Open PRs.' })]);
    expect(out).toContain('## alpha\n\nUse spaces.');
    expect(out).toContain('## bravo\n\nOpen PRs.');
  });
});
