import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { prelaunchComposeClaudeCode } from '../../lib/ac/prelaunch.ts';
import { runAc } from '../../lib/ac/run.ts';

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

describe('ac claude integration with prelaunch', () => {
  it('end-to-end: ac claude --persona X writes filtered HOME tempdir and sets env.HOME', async () => {
    // Set up fake user home with two skills (different categories)
    const realHome = await fs.mkdtemp(path.join(os.tmpdir(), 'real-home-'));
    await fs.mkdir(path.join(realHome, '.claude', 'skills', 'tooling-skill'), { recursive: true });
    await fs.writeFile(
      path.join(realHome, '.claude', 'skills', 'tooling-skill', 'SKILL.md'),
      `---
name: tooling-skill
description: t
category:
  primary: tooling
---
`,
    );
    await fs.mkdir(path.join(realHome, '.claude', 'skills', 'workflow-skill'), { recursive: true });
    await fs.writeFile(
      path.join(realHome, '.claude', 'skills', 'workflow-skill', 'SKILL.md'),
      `---
name: workflow-skill
description: w
category:
  primary: workflow
---
`,
    );

    // Set up a fake builtinDir with a persona definition
    const builtinDir = await fs.mkdtemp(path.join(os.tmpdir(), 'builtin-'));
    await fs.mkdir(path.join(builtinDir, 'personas', 'backend'), { recursive: true });
    await fs.writeFile(
      path.join(builtinDir, 'personas', 'backend', 'persona.md'),
      `---
name: backend
version: 1.0.0
type: persona
description: backend dev
targets: [claude-code]
categories: [tooling]
skill_include: []
skill_exclude: []
---
`,
    );

    // Capture env passed to exec
    const captured: { env: NodeJS.ProcessEnv } = { env: {} };

    await runAc(['claude', '--persona', 'backend'], {
      builtinDir,
      projectDir: '/nonexistent',
      userDir: '/nonexistent',
      homeDir: realHome,
      resolveHarnessBin: () => '/bin/true',
      loadCatalog: async () => [],
      exec: async (_bin, _args, env) => {
        captured.env = env;
        return 0;
      },
    });

    // Assert env.HOME was overridden to a tempdir (not the real home)
    expect(captured.env.HOME).toBeDefined();
    expect(captured.env.HOME).not.toBe(realHome);
    expect(captured.env.HOME).toMatch(/ac-home-/);

    // Assert the filtered tempdir on disk has only the tooling skill
    const filteredSkills = await fs.readdir(
      path.join(captured.env.HOME!, '.claude', 'skills'),
    );
    expect(filteredSkills).toContain('tooling-skill');
    expect(filteredSkills).not.toContain('workflow-skill');
  });
});
