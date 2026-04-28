import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { prelaunchComposePi } from '../../lib/ac/prelaunch.ts';
import { runAc } from '../../lib/ac/run.ts';

async function makeFakeUserHome(): Promise<string> {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), 'home-'));
  await fs.mkdir(path.join(home, '.pi', 'skills', 'tooling-skill'), { recursive: true });
  await fs.writeFile(
    path.join(home, '.pi', 'skills', 'tooling-skill', 'SKILL.md'),
    `---
name: tooling-skill
description: t
category:
  primary: tooling
---
`,
  );
  await fs.mkdir(path.join(home, '.pi', 'skills', 'workflow-skill'), { recursive: true });
  await fs.writeFile(
    path.join(home, '.pi', 'skills', 'workflow-skill', 'SKILL.md'),
    `---
name: workflow-skill
description: w
category:
  primary: workflow
---
`,
  );
  return home;
}

describe('prelaunchComposePi', () => {
  it('composes a HOME-override tempdir with filtered skills', async () => {
    const realHome = await makeFakeUserHome();
    const persona = {
      name: 'p',
      type: 'persona',
      categories: ['tooling'],
      skill_include: [],
      skill_exclude: [],
    } as any;
    const result = await prelaunchComposePi({
      realHome,
      persona,
    });
    expect(result.tempHome).toMatch(/ac-home-/);
    const filteredSkills = await fs.readdir(path.join(result.tempHome, '.pi', 'skills'));
    expect(filteredSkills).toContain('tooling-skill');
    expect(filteredSkills).not.toContain('workflow-skill');
  });

  it('returns a cleanup function that removes the tempdir', async () => {
    const realHome = await makeFakeUserHome();
    const result = await prelaunchComposePi({ realHome });
    await result.cleanup();
    await expect(fs.access(result.tempHome)).rejects.toThrow();
  });

  it('with no persona/mode, all skills pass through', async () => {
    const realHome = await makeFakeUserHome();
    const result = await prelaunchComposePi({ realHome });
    const filtered = await fs.readdir(path.join(result.tempHome, '.pi', 'skills'));
    expect(filtered).toContain('tooling-skill');
    expect(filtered).toContain('workflow-skill');
  });
});

describe('ac pi integration with prelaunch', () => {
  it('end-to-end: ac pi --persona X writes filtered HOME tempdir and sets env.HOME', async () => {
    const realHome = await fs.mkdtemp(path.join(os.tmpdir(), 'real-home-'));
    await fs.mkdir(path.join(realHome, '.pi', 'skills', 'tooling-skill'), { recursive: true });
    await fs.writeFile(
      path.join(realHome, '.pi', 'skills', 'tooling-skill', 'SKILL.md'),
      `---
name: tooling-skill
description: t
category:
  primary: tooling
---
`,
    );
    await fs.mkdir(path.join(realHome, '.pi', 'skills', 'workflow-skill'), { recursive: true });
    await fs.writeFile(
      path.join(realHome, '.pi', 'skills', 'workflow-skill', 'SKILL.md'),
      `---
name: workflow-skill
description: w
category:
  primary: workflow
---
`,
    );

    const builtinDir = await fs.mkdtemp(path.join(os.tmpdir(), 'builtin-'));
    await fs.mkdir(path.join(builtinDir, 'personas', 'backend'), { recursive: true });
    await fs.writeFile(
      path.join(builtinDir, 'personas', 'backend', 'persona.md'),
      `---
name: backend
version: 1.0.0
type: persona
description: backend dev
targets: [pi]
categories: [tooling]
skill_include: []
skill_exclude: []
---
`,
    );

    const captured: { env: NodeJS.ProcessEnv } = { env: {} };

    await runAc(['pi', '--persona', 'backend'], {
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

    expect(captured.env.HOME).toBeDefined();
    expect(captured.env.HOME).not.toBe(realHome);
    expect(captured.env.HOME).toMatch(/ac-home-/);

    const filteredSkills = await fs.readdir(
      path.join(captured.env.HOME!, '.pi', 'skills'),
    );
    expect(filteredSkills).toContain('tooling-skill');
    expect(filteredSkills).not.toContain('workflow-skill');
  });
});
