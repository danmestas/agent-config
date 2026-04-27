import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { piAdapter } from '../../adapters/pi.ts';
import { runGolden } from './golden.ts';

const HERE = path.resolve(fileURLToPath(import.meta.url), '..');

describe('pi adapter', () => {
  it('declares target = pi', () => {
    expect(piAdapter.target).toBe('pi');
  });

  it('supports() honors the targets list', () => {
    const ok = piAdapter.supports({
      dir: '/x',
      relativeDir: 'skills/x',
      body: '',
      manifest: {
        name: 'x',
        version: '1.0.0',
        description: 'd',
        type: 'skill',
        targets: ['pi'],
      } as never,
    });
    expect(ok).toBe(true);
  });

  it('emits a skill into .pi/skills/<name>/SKILL.md with stripped frontmatter', async () => {
    const result = await runGolden(piAdapter, path.join(HERE, 'pi/skill-basic'));
    expect(result.diff).toEqual([]);
    expect(result.matched).toBe(true);
  });
});
