import { describe, it, expect } from 'vitest';
import {
  topoSortRules,
  composeRulesSections,
  filterRulesForTarget,
  isPrimaryRuleForScope,
} from '../../lib/rules.ts';
import type { ComponentSource } from '../../lib/types.ts';

function rule(
  name: string,
  opts: { before?: string[]; after?: string[]; body?: string; targets?: string[]; scope?: 'project' | 'user' } = {},
): ComponentSource {
  return {
    dir: `/tmp/${name}`,
    relativeDir: `rules/${name}`,
    body: opts.body ?? `Body of ${name}.`,
    manifest: {
      name,
      version: '1.0.0',
      description: 'd',
      type: 'rules',
      targets: (opts.targets ?? ['claude-code']) as ComponentSource['manifest']['targets'],
      scope: opts.scope ?? 'project',
      before: opts.before,
      after: opts.after,
    },
  };
}

describe('topoSortRules', () => {
  it('orders alphabetically when no before/after declared', () => {
    const out = topoSortRules([rule('charlie'), rule('alpha'), rule('bravo')]);
    expect(out.map((r) => r.manifest.name)).toEqual(['alpha', 'bravo', 'charlie']);
  });

  it('honours after to push a rule later', () => {
    const out = topoSortRules([
      rule('pr-policy', { after: ['base-style'] }),
      rule('base-style'),
    ]);
    expect(out.map((r) => r.manifest.name)).toEqual(['base-style', 'pr-policy']);
  });

  it('honours before to push a rule earlier', () => {
    const out = topoSortRules([rule('zeta'), rule('alpha', { before: ['zeta'] })]);
    expect(out.map((r) => r.manifest.name)).toEqual(['alpha', 'zeta']);
  });

  it('alphabetical tiebreak among nodes with identical in-degree', () => {
    const out = topoSortRules([rule('charlie'), rule('alpha'), rule('bravo')]);
    expect(out.map((r) => r.manifest.name)).toEqual(['alpha', 'bravo', 'charlie']);
  });
});

describe('composeRulesSections', () => {
  it('emits ## <name>\\n\\n<body>\\n joined by blank lines', () => {
    const composed = composeRulesSections([
      rule('alpha', { body: 'A.' }),
      rule('bravo', { body: 'B.' }),
    ]);
    expect(composed).toBe('## alpha\n\nA.\n\n## bravo\n\nB.\n');
  });
});

describe('filterRulesForTarget', () => {
  it('filters by target and scope', () => {
    const all: ComponentSource[] = [
      rule('a', { targets: ['claude-code'], scope: 'project' }),
      rule('b', { targets: ['apm'], scope: 'project' }),
      rule('c', { targets: ['claude-code'], scope: 'user' }),
    ];
    const out = filterRulesForTarget(all, 'claude-code', 'project');
    expect(out.map((r) => r.manifest.name)).toEqual(['a']);
  });
});

describe('isPrimaryRuleForScope', () => {
  it('returns true only for the alphabetically-first sorted rule', () => {
    const sorted = [rule('alpha'), rule('bravo')];
    expect(isPrimaryRuleForScope(sorted[0]!, sorted)).toBe(true);
    expect(isPrimaryRuleForScope(sorted[1]!, sorted)).toBe(false);
  });
});
