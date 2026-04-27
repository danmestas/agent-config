import { describe, it, expect } from 'vitest';
import { ManifestSchema } from '../lib/schema.ts';

describe('ManifestSchema', () => {
  it('accepts a minimal valid skill manifest', () => {
    const result = ManifestSchema.safeParse({
      name: 'my-skill',
      version: '1.0.0',
      description: 'Does a thing',
      type: 'skill',
      targets: ['claude-code'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown component type', () => {
    const result = ManifestSchema.safeParse({
      name: 'x',
      version: '1.0.0',
      description: 'd',
      type: 'unknown',
      targets: ['claude-code'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid semver', () => {
    const result = ManifestSchema.safeParse({
      name: 'x',
      version: 'not-semver',
      description: 'd',
      type: 'skill',
      targets: ['claude-code'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects names with invalid characters', () => {
    const result = ManifestSchema.safeParse({
      name: 'My Skill',
      version: '1.0.0',
      description: 'd',
      type: 'skill',
      targets: ['claude-code'],
    });
    expect(result.success).toBe(false);
  });

  it('accepts hook manifest with hooks block', () => {
    const result = ManifestSchema.safeParse({
      name: 'tts',
      version: '1.0.0',
      description: 'd',
      type: 'hook',
      targets: ['claude-code'],
      hooks: { Stop: { command: 'hooks/announce.sh' } },
    });
    expect(result.success).toBe(true);
  });
});
