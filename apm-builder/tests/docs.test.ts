import { describe, it, expect } from 'vitest';
import { renderReadme } from '../lib/docs.ts';
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

describe('renderReadme', () => {
  it('lists the component with name, description, and targets', () => {
    const md = renderReadme([sample]);
    expect(md).toContain('# agent-skills');
    expect(md).toContain('| foo |');
    expect(md).toContain('A foo skill');
    expect(md).toMatch(/claude-code.*apm|apm.*claude-code/);
  });
});
