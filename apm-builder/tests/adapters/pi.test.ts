import { describe, it, expect } from 'vitest';
import { piAdapter } from '../../adapters/pi.ts';

describe('pi adapter shell', () => {
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
});
