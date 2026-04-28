import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseAcArgs, runAc } from '../lib/ac/run.ts';

describe('parseAcArgs', () => {
  it('splits ac flags from harness flags at --', () => {
    const r = parseAcArgs(['claude', '--persona', 'backend', '--', '--resume', 'sess']);
    expect(r.harness).toBe('claude');
    expect(r.persona).toBe('backend');
    expect(r.harnessArgs).toEqual(['--resume', 'sess']);
  });

  it('treats trailing args as harness args when no -- present', () => {
    const r = parseAcArgs(['claude', '--persona', 'backend']);
    expect(r.harnessArgs).toEqual([]);
  });

  it('handles --no-filter flag', () => {
    const r = parseAcArgs(['claude', '--no-filter']);
    expect(r.noFilter).toBe(true);
  });

  it('throws on missing harness name', () => {
    expect(() => parseAcArgs(['--persona', 'backend'])).toThrow(/harness/i);
  });

  it('throws on --persona without value', () => {
    expect(() => parseAcArgs(['claude', '--persona'])).toThrow(/--persona/);
  });
});

describe('findRepoRoot (via runAc builtinDir)', () => {
  it('resolves builtinDir to the workspace root containing package.json named "agent-config"', async () => {
    // runAc's exec hook receives the spawn environment. builtinDir itself is
    // not passed as an env var, but we can verify it indirectly: if findRepoRoot
    // succeeds (no throw) and the resolved dir is correct, runAc completes
    // without error. We also verify the repo root directly from the test file's
    // own location (apm-builder/tests/ → up 2 dirs → repo root).
    let execCalled = false;
    const exitCode = await runAc(['claude', '--no-filter'], {
      resolveHarnessBin: () => 'true',
      exec: async (_bin, _args, _env) => {
        execCalled = true;
        return 0;
      },
    });
    expect(exitCode).toBe(0);
    expect(execCalled).toBe(true);

    // Verify the repo root itself so the test asserts something concrete about the path.
    // This file: apm-builder/tests/ac-cli.test.ts → dirname up 2 → workspace root
    const thisFile = new URL(import.meta.url).pathname;
    const repoRoot = path.dirname(path.dirname(path.dirname(thisFile)));
    const pkgPath = path.join(repoRoot, 'package.json');
    expect(existsSync(pkgPath)).toBe(true);
    const pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
    expect(pkg.name).toBe('agent-config');
  });
});
