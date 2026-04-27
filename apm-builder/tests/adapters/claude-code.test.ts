import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { claudeCodeAdapter } from '../../adapters/claude-code.ts';
import { runGolden } from './golden.ts';

const HERE = path.resolve(fileURLToPath(import.meta.url), '..');

describe('claude-code adapter', () => {
  it('emits a basic skill correctly', async () => {
    const result = await runGolden(claudeCodeAdapter, path.join(HERE, 'claude-code/skill-basic'));
    expect(result.diff).toEqual([]);
    expect(result.matched).toBe(true);
  });
});
