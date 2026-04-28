import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { prelaunchComposeCodex } from '../lib/ac/prelaunch.ts';

describe('prelaunchComposeCodex', () => {
  it('writes AGENTS.md to a tempdir and returns it as new cwd', async () => {
    const resPath = path.join(os.tmpdir(), `ac-test-res-${Date.now()}.json`);
    await fs.writeFile(resPath, JSON.stringify({
      schemaVersion: 1,
      harness: 'codex',
      skillsDrop: [],
      skillsKeep: null,
      modePrompt: '',
      metadata: { persona: null, mode: null, categories: [] },
    }));

    const result = await prelaunchComposeCodex({
      resolutionPath: resPath,
      originalCwd: process.cwd(),
    });

    expect(result.tempdir).toMatch(/ac-prelaunch-/);
    const agentsMd = path.join(result.tempdir, 'AGENTS.md');
    const stat = await fs.stat(agentsMd);
    expect(stat.isFile()).toBe(true);
  });
});
