import { describe, it, expect } from 'vitest';
import { composeAgentsMd, DEFAULT_SECTION_ORDER, type AgentsMdSection } from '../lib/agents-md.ts';
import type { ComponentSource, Target } from '../lib/types.ts';

function mk(
  name: string,
  type: 'skill' | 'agent' | 'rules',
  body: string,
  opts: Partial<ComponentSource['manifest']> = {},
): ComponentSource {
  return {
    dir: `/x/${name}`,
    relativeDir: `${type === 'rules' ? 'rules' : type === 'agent' ? 'skills' : 'skills'}/${name}`,
    body,
    manifest: {
      name,
      version: '1.0.0',
      description: `desc ${name}`,
      type,
      targets: ['codex', 'pi'] as Target[],
      ...(type === 'rules' ? { scope: 'project' as const } : {}),
      ...opts,
    } as ComponentSource['manifest'],
  };
}

describe('composeAgentsMd', () => {
  it('uses default section order: rules, agents, skills', () => {
    expect(DEFAULT_SECTION_ORDER).toEqual<AgentsMdSection[]>(['rules', 'agents', 'skills']);
  });

  it('emits one H1 per non-empty section + H2 per component', () => {
    const out = composeAgentsMd({
      target: 'codex',
      components: [
        mk('alpha-skill', 'skill', 'Alpha body'),
        mk('beta-agent', 'agent', 'Beta body'),
        mk('gamma-rule', 'rules', 'Gamma body'),
      ],
      sectionOrder: DEFAULT_SECTION_ORDER,
    });
    // Rules first
    expect(out.indexOf('# Rules')).toBeLessThan(out.indexOf('# Agents'));
    expect(out.indexOf('# Agents')).toBeLessThan(out.indexOf('# Skills'));
    // Sub-sections present
    expect(out).toContain('## gamma-rule');
    expect(out).toContain('## beta-agent');
    expect(out).toContain('## alpha-skill');
    // Bodies preserved
    expect(out).toContain('Gamma body');
  });

  it('respects custom section order from config', () => {
    const out = composeAgentsMd({
      target: 'codex',
      components: [
        mk('alpha-skill', 'skill', 'A'),
        mk('beta-agent', 'agent', 'B'),
        mk('gamma-rule', 'rules', 'C'),
      ],
      sectionOrder: ['skills', 'rules', 'agents'],
    });
    expect(out.indexOf('# Skills')).toBeLessThan(out.indexOf('# Rules'));
    expect(out.indexOf('# Rules')).toBeLessThan(out.indexOf('# Agents'));
  });

  it('omits empty sections entirely (no H1 with no children)', () => {
    const out = composeAgentsMd({
      target: 'codex',
      components: [mk('only-skill', 'skill', 'Body')],
      sectionOrder: DEFAULT_SECTION_ORDER,
    });
    expect(out).not.toContain('# Rules');
    expect(out).not.toContain('# Agents');
    expect(out).toContain('# Skills');
    expect(out).toContain('## only-skill');
  });

  it('orders agents and skills alphabetically by name', () => {
    const out = composeAgentsMd({
      target: 'codex',
      components: [
        mk('zebra', 'skill', 'Z'),
        mk('alpha', 'skill', 'A'),
        mk('mango', 'skill', 'M'),
      ],
      sectionOrder: DEFAULT_SECTION_ORDER,
    });
    expect(out.indexOf('## alpha')).toBeLessThan(out.indexOf('## mango'));
    expect(out.indexOf('## mango')).toBeLessThan(out.indexOf('## zebra'));
  });

  it('orders rules via topo-sort (before/after)', () => {
    const out = composeAgentsMd({
      target: 'codex',
      components: [
        mk('z-rule', 'rules', 'Z body', { before: ['a-rule'] }),
        mk('a-rule', 'rules', 'A body'),
      ],
      sectionOrder: DEFAULT_SECTION_ORDER,
    });
    expect(out.indexOf('## z-rule')).toBeLessThan(out.indexOf('## a-rule'));
  });

  it('filters by target — components not targeting "codex" excluded', () => {
    const skipped = mk('not-codex', 'skill', 'Body', { targets: ['gemini'] });
    const out = composeAgentsMd({
      target: 'codex',
      components: [mk('included', 'skill', 'A'), skipped],
      sectionOrder: DEFAULT_SECTION_ORDER,
    });
    expect(out).toContain('## included');
    expect(out).not.toContain('## not-codex');
  });

  it('separates sections with a blank line and trims trailing whitespace', () => {
    const out = composeAgentsMd({
      target: 'codex',
      components: [
        mk('s', 'skill', 'Skill body'),
        mk('a', 'agent', 'Agent body'),
      ],
      sectionOrder: DEFAULT_SECTION_ORDER,
    });
    expect(out.endsWith('\n')).toBe(true);
    expect(out.includes('\n\n\n\n')).toBe(false);
  });
});
