import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { prelaunchComposeClaudeCode } from '../../lib/ac/prelaunch.ts';

async function makeFakeUserHome(): Promise<string> {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), 'home-'));
  await fs.mkdir(path.join(home, '.claude', 'skills', 'tooling-skill'), { recursive: true });
  await fs.writeFile(
    path.join(home, '.claude', 'skills', 'tooling-skill', 'SKILL.md'),
    `---
name: tooling-skill
description: t
category:
  primary: tooling
---
`,
  );
  await fs.mkdir(path.join(home, '.claude', 'skills', 'workflow-skill'), { recursive: true });
  await fs.writeFile(
    path.join(home, '.claude', 'skills', 'workflow-skill', 'SKILL.md'),
    `---
name: workflow-skill
description: w
category:
  primary: workflow
---
`,
  );
  await fs.writeFile(path.join(home, '.claude', '.credentials.json'), '{"x":1}');
  return home;
}

describe('prelaunchComposeClaudeCode', () => {
  it('composes a HOME-override tempdir with filtered skills', async () => {
    const realHome = await makeFakeUserHome();
    const persona = {
      name: 'p',
      type: 'persona',
      categories: ['tooling'],
      skill_include: [],
      skill_exclude: [],
    } as any;
    const result = await prelaunchComposeClaudeCode({
      realHome,
      persona,
    });
    expect(result.tempHome).toMatch(/ac-home-/);
    const filteredSkills = await fs.readdir(path.join(result.tempHome, '.claude', 'skills'));
    expect(filteredSkills).toContain('tooling-skill');
    expect(filteredSkills).not.toContain('workflow-skill');
    // Credentials should be symlinked through
    const credStat = await fs.lstat(path.join(result.tempHome, '.claude', '.credentials.json'));
    expect(credStat.isSymbolicLink()).toBe(true);
  });

  it('returns a cleanup function that removes the tempdir', async () => {
    const realHome = await makeFakeUserHome();
    const result = await prelaunchComposeClaudeCode({ realHome });
    await result.cleanup();
    await expect(fs.access(result.tempHome)).rejects.toThrow();
  });

  it('with no persona/mode, all skills pass through', async () => {
    const realHome = await makeFakeUserHome();
    const result = await prelaunchComposeClaudeCode({ realHome });
    const filtered = await fs.readdir(path.join(result.tempHome, '.claude', 'skills'));
    expect(filtered).toContain('tooling-skill');
    expect(filtered).toContain('workflow-skill');
  });
});
