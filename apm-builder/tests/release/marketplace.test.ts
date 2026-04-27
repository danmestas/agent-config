import { describe, it, expect } from 'vitest';
import { renderMarketplaceEntry, marketplaceFilePath } from '../../lib/release/marketplace.ts';
import type { ComponentSource } from '../../lib/types.ts';

describe('renderMarketplaceEntry', () => {
  it('emits a claude-plugins-official entry for a plugin component', () => {
    const plugin: ComponentSource = {
      dir: '/x',
      relativeDir: 'plugins/superpowers-philosophy',
      body: 'A plugin description body.',
      manifest: {
        name: 'superpowers-philosophy',
        version: '0.3.0',
        description: 'Software philosophy bundle',
        type: 'plugin',
        targets: ['claude-code', 'apm', 'pi'],
        includes: ['../../skills/ousterhout', '../../skills/norman'],
      } as ComponentSource['manifest'],
    };
    const entry = JSON.parse(
      renderMarketplaceEntry(plugin, { gitRepo: 'github.com/danmestas/agent-skills' }),
    );
    expect(entry.name).toBe('superpowers-philosophy');
    expect(entry.version).toBe('0.3.0');
    expect(entry.description).toBe('Software philosophy bundle');
    expect(entry.release).toContain('superpowers-philosophy@v0.3.0');
    expect(entry.includes).toEqual(['ousterhout', 'norman']);
  });

  it('refuses non-plugin components', () => {
    const skill: ComponentSource = {
      dir: '/x',
      relativeDir: 'skills/foo',
      body: '',
      manifest: {
        name: 'foo',
        version: '0.1.0',
        description: 'd',
        type: 'skill',
        targets: ['claude-code'],
      } as ComponentSource['manifest'],
    };
    expect(() => renderMarketplaceEntry(skill, { gitRepo: 'github.com/x/y' })).toThrow(
      /plugin component/i,
    );
  });

  it('marketplaceFilePath puts entries under marketplace/plugins/<name>.json', () => {
    expect(marketplaceFilePath('foo')).toBe('marketplace/plugins/foo.json');
  });
});
