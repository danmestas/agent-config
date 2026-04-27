import { describe, it, expect } from 'vitest';
import {
  renderReadme,
  updateReadme,
  renderComponentsTable,
  COMPONENTS_BEGIN,
  COMPONENTS_END,
} from '../lib/docs.ts';
import type { ComponentSource } from '../lib/types.ts';

const sample: ComponentSource = {
  dir: '/x',
  relativeDir: 'skills/foo',
  body: 'body',
  manifest: {
    name: 'foo',
    version: '1.0.0',
    description: 'A foo skill',
    type: 'skill',
    targets: ['claude-code', 'apm'],
  } as ComponentSource['manifest'],
};

const second: ComponentSource = {
  dir: '/y',
  relativeDir: 'skills/bar',
  body: 'body',
  manifest: {
    name: 'bar',
    version: '0.2.0',
    description: 'A bar skill',
    type: 'skill',
    targets: ['claude-code'],
  } as ComponentSource['manifest'],
};

describe('renderReadme (deprecated default)', () => {
  it('lists the component with name, description, and targets', () => {
    const md = renderReadme([sample]);
    expect(md).toContain('# agent-skills');
    expect(md).toContain('| foo |');
    expect(md).toContain('A foo skill');
    expect(md).toMatch(/claude-code.*apm|apm.*claude-code/);
  });

  it('wraps the component table in AUTO-GENERATED markers', () => {
    const md = renderReadme([sample]);
    expect(md).toContain(COMPONENTS_BEGIN);
    expect(md).toContain(COMPONENTS_END);
    expect(md.indexOf(COMPONENTS_BEGIN)).toBeLessThan(md.indexOf(COMPONENTS_END));
  });
});

describe('renderComponentsTable', () => {
  it('sorts components alphabetically by name', () => {
    const table = renderComponentsTable([sample, second]);
    expect(table.indexOf('| bar |')).toBeLessThan(table.indexOf('| foo |'));
  });

  it('does not include the markers itself', () => {
    const table = renderComponentsTable([sample]);
    expect(table).not.toContain(COMPONENTS_BEGIN);
    expect(table).not.toContain(COMPONENTS_END);
  });
});

describe('updateReadme', () => {
  it('returns a fresh default README when existing is null', () => {
    const md = updateReadme(null, [sample]);
    expect(md).toContain('# agent-skills');
    expect(md).toContain(COMPONENTS_BEGIN);
    expect(md).toContain('| foo |');
  });

  it('returns a fresh default README when markers are absent', () => {
    const existing = '# my project\n\nNo markers here.\n';
    const md = updateReadme(existing, [sample]);
    expect(md).toContain('# agent-skills');
    expect(md).toContain(COMPONENTS_BEGIN);
    expect(md).toContain('| foo |');
    // Hand-written content with no markers is replaced (cannot preserve unanchored content)
    expect(md).not.toContain('No markers here.');
  });

  it('replaces ONLY the marked region and preserves intro/outro', () => {
    const existing = [
      '# Custom Title',
      '',
      'My hand-written intro paragraph.',
      '',
      '## Components',
      '',
      COMPONENTS_BEGIN,
      'old stale table contents',
      COMPONENTS_END,
      '',
      '## Hand-written outro',
      '',
      'Outro paragraph the author wants kept.',
      '',
    ].join('\n');
    const md = updateReadme(existing, [sample]);

    // intro preserved
    expect(md).toContain('# Custom Title');
    expect(md).toContain('My hand-written intro paragraph.');

    // outro preserved
    expect(md).toContain('## Hand-written outro');
    expect(md).toContain('Outro paragraph the author wants kept.');

    // markers preserved (so the next regeneration still finds them)
    expect(md).toContain(COMPONENTS_BEGIN);
    expect(md).toContain(COMPONENTS_END);

    // old table content is gone
    expect(md).not.toContain('old stale table contents');

    // new table is present
    expect(md).toContain('| foo |');
    expect(md).toContain('A foo skill');
  });

  it('handles multiple regenerations idempotently when components do not change', () => {
    const first = updateReadme(null, [sample]);
    const second = updateReadme(first, [sample]);
    expect(second).toBe(first);
  });

  it('updates the table content on regeneration when components change', () => {
    const first = updateReadme(null, [sample]);
    const next = updateReadme(first, [sample, second]);
    expect(next).toContain('| foo |');
    expect(next).toContain('| bar |');
    // intro frame from default render is unchanged
    expect(next).toContain('# agent-skills');
  });

  it('treats malformed markers (end before begin) as missing', () => {
    const broken = `${COMPONENTS_END}\nbody\n${COMPONENTS_BEGIN}\n`;
    const md = updateReadme(broken, [sample]);
    expect(md).toContain('# agent-skills');
    expect(md).toContain('| foo |');
  });
});

describe('renderComponentsTable category grouping', () => {
  const tooling: ComponentSource = {
    dir: '/t',
    relativeDir: 'skills/tooly',
    body: '',
    manifest: {
      name: 'tooly',
      version: '1.0.0',
      description: 'A tooling skill',
      type: 'skill',
      targets: ['claude-code'],
      category: { primary: 'tooling' },
    } as ComponentSource['manifest'],
  };
  const backpressure: ComponentSource = {
    dir: '/b',
    relativeDir: 'skills/backy',
    body: '',
    manifest: {
      name: 'backy',
      version: '1.0.0',
      description: 'A backpressure skill',
      type: 'skill',
      targets: ['claude-code'],
      category: { primary: 'backpressure' },
    } as ComponentSource['manifest'],
  };
  const uncategorized: ComponentSource = {
    dir: '/u',
    relativeDir: 'skills/uncatted',
    body: '',
    manifest: {
      name: 'uncatted',
      version: '1.0.0',
      description: 'No category',
      type: 'skill',
      targets: ['claude-code'],
    } as ComponentSource['manifest'],
  };

  it('renders a category heading for each primary group', () => {
    const md = renderComponentsTable([tooling, backpressure, uncategorized]);
    expect(md).toMatch(/backpressure/i);
    expect(md).toMatch(/tooling/i);
    // Skills without category go under an "Uncategorized" group.
    expect(md).toMatch(/Uncategorized/i);
  });

  it('groups primaries alphabetically and uncategorized last', () => {
    const md = renderComponentsTable([uncategorized, tooling, backpressure]);
    const idxBack = md.toLowerCase().indexOf('backpressure');
    const idxTool = md.toLowerCase().indexOf('tooling');
    const idxUncat = md.toLowerCase().indexOf('uncategorized');
    expect(idxBack).toBeGreaterThan(-1);
    expect(idxTool).toBeGreaterThan(idxBack);
    expect(idxUncat).toBeGreaterThan(idxTool);
  });

  it('puts each component row under its own primary heading', () => {
    const md = renderComponentsTable([tooling, backpressure]);
    const idxBackHeading = md.toLowerCase().indexOf('backpressure');
    const idxBackyRow = md.indexOf('| backy |');
    const idxToolHeading = md.toLowerCase().indexOf('tooling');
    const idxToolyRow = md.indexOf('| tooly |');
    expect(idxBackHeading).toBeLessThan(idxBackyRow);
    expect(idxBackyRow).toBeLessThan(idxToolHeading);
    expect(idxToolHeading).toBeLessThan(idxToolyRow);
  });
});
