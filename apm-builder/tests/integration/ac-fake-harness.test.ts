import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAc } from '../../lib/ac/run.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FAKE = path.resolve(__dirname, '..', 'fixtures', 'fake-harness.sh');

describe('ac integration with stub harness', () => {
  it('exec passes through harness args and sets AC_WRAPPED', async () => {
    const captured: { bin: string; args: string[]; env: NodeJS.ProcessEnv } = {
      bin: '',
      args: [],
      env: {},
    };
    await runAc(['claude', '--', 'foo', 'bar'], {
      resolveHarnessBin: () => FAKE,
      exec: async (bin, args, env) => {
        captured.bin = bin;
        captured.args = args;
        captured.env = env;
        return 0;
      },
    });
    expect(captured.bin).toBe(FAKE);
    expect(captured.args).toEqual(['foo', 'bar']);
    expect(captured.env.AC_WRAPPED).toBe('1');
    expect(captured.env.AC_HARNESS).toBe('claude-code');
    expect(captured.env.AC_RESOLUTION_PATH).toBeUndefined(); // no persona/mode
  });

  it('with --persona, sets AC_RESOLUTION_PATH to a readable JSON file', async () => {
    const captured: { env: NodeJS.ProcessEnv } = { env: {} };
    // Provide a built-in dir with a fake persona & catalog.
    const tmp = path.join('/tmp', `ac-builtin-${Date.now()}`);
    const fs = await import('node:fs/promises');
    await fs.mkdir(path.join(tmp, 'personas', 'tester'), { recursive: true });
    await fs.writeFile(
      path.join(tmp, 'personas', 'tester', 'persona.md'),
      `---
name: tester
version: 1.0.0
type: persona
description: t
targets: [claude-code]
categories: [tooling]
---
`,
    );
    await runAc(['claude', '--persona', 'tester'], {
      builtinDir: tmp,
      projectDir: '/nonexistent',
      userDir: '/nonexistent',
      resolveHarnessBin: () => FAKE,
      exec: async (_bin, _args, env) => {
        captured.env = env;
        return 0;
      },
      loadCatalog: async () => [],
    });
    expect(captured.env.AC_RESOLUTION_PATH).toBeDefined();
    const content = await fs.readFile(captured.env.AC_RESOLUTION_PATH!, 'utf8');
    const parsed = JSON.parse(content);
    expect(parsed.metadata.persona).toBe('tester');
  });
});
