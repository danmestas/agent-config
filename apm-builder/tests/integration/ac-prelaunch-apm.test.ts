import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { prelaunchComposeApm } from '../../lib/ac/prelaunch.ts';
import { runAc } from '../../lib/ac/run.ts';

async function makeFakePackageDir(): Promise<string> {
  const pkg = await fs.mkdtemp(path.join(os.tmpdir(), 'apm-pkg-'));
  await fs.mkdir(path.join(pkg, '.apm', 'skills', 'tooling-skill'), { recursive: true });
  await fs.writeFile(
    path.join(pkg, '.apm', 'skills', 'tooling-skill', 'SKILL.md'),
    `---
name: tooling-skill
description: t
category:
  primary: tooling
---
`,
  );
  await fs.mkdir(path.join(pkg, '.apm', 'skills', 'workflow-skill'), { recursive: true });
  await fs.writeFile(
    path.join(pkg, '.apm', 'skills', 'workflow-skill', 'SKILL.md'),
    `---
name: workflow-skill
description: w
category:
  primary: workflow
---
`,
  );
  return pkg;
}

describe('prelaunchComposeApm', () => {
  it('composes a tempPackageDir with filtered .apm/skills/', async () => {
    const packageDir = await makeFakePackageDir();
    const persona = {
      name: 'p',
      type: 'persona',
      categories: ['tooling'],
      skill_include: [],
      skill_exclude: [],
    } as any;
    const result = await prelaunchComposeApm({
      packageDir,
      persona,
    });
    expect(result.tempPackageDir).toMatch(/ac-apm-/);
    const filteredSkills = await fs.readdir(
      path.join(result.tempPackageDir, '.apm', 'skills'),
    );
    expect(filteredSkills).toContain('tooling-skill');
    expect(filteredSkills).not.toContain('workflow-skill');
    await result.cleanup();
  });

  it('returns a cleanup function that removes the tempdir', async () => {
    const packageDir = await makeFakePackageDir();
    const result = await prelaunchComposeApm({ packageDir });
    await result.cleanup();
    await expect(fs.access(result.tempPackageDir)).rejects.toThrow();
  });

  it('with no persona/mode, all skills pass through', async () => {
    const packageDir = await makeFakePackageDir();
    const result = await prelaunchComposeApm({ packageDir });
    const filtered = await fs.readdir(
      path.join(result.tempPackageDir, '.apm', 'skills'),
    );
    expect(filtered).toContain('tooling-skill');
    expect(filtered).toContain('workflow-skill');
    await result.cleanup();
  });

  it('non-.apm top-level entries are symlinked through', async () => {
    const packageDir = await makeFakePackageDir();
    await fs.writeFile(path.join(packageDir, 'apm.yml'), 'name: test\n');
    const result = await prelaunchComposeApm({ packageDir });
    const topStat = await fs.lstat(path.join(result.tempPackageDir, 'apm.yml'));
    expect(topStat.isSymbolicLink()).toBe(true);
    await result.cleanup();
  });
});

describe('ac apm integration with prelaunch', () => {
  it('end-to-end: ac apm --persona X sets APM_PACKAGE_DIR (not HOME)', async () => {
    const packageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'apm-pkg-'));
    await fs.mkdir(path.join(packageDir, '.apm', 'skills', 'tooling-skill'), { recursive: true });
    await fs.writeFile(
      path.join(packageDir, '.apm', 'skills', 'tooling-skill', 'SKILL.md'),
      `---
name: tooling-skill
description: t
category:
  primary: tooling
---
`,
    );
    await fs.mkdir(path.join(packageDir, '.apm', 'skills', 'workflow-skill'), { recursive: true });
    await fs.writeFile(
      path.join(packageDir, '.apm', 'skills', 'workflow-skill', 'SKILL.md'),
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
targets: [apm]
categories: [tooling]
skill_include: []
skill_exclude: []
---
`,
    );

    const captured: { env: NodeJS.ProcessEnv } = { env: {} };

    await runAc(['apm', '--persona', 'backend'], {
      builtinDir,
      projectDir: '/nonexistent',
      userDir: '/nonexistent',
      homeDir: packageDir,
      resolveHarnessBin: () => '/bin/true',
      loadCatalog: async () => [],
      exec: async (_bin, _args, env) => {
        captured.env = env;
        return 0;
      },
    });

    // APM_PACKAGE_DIR must be set to a filtered tempdir
    expect(captured.env.APM_PACKAGE_DIR).toBeDefined();
    expect(captured.env.APM_PACKAGE_DIR).not.toBe(packageDir);
    expect(captured.env.APM_PACKAGE_DIR).toMatch(/ac-apm-/);

    // HOME must NOT be overridden (APM uses APM_PACKAGE_DIR, not HOME)
    expect(captured.env.HOME).not.toMatch(/ac-apm-/);

    const filteredSkills = await fs.readdir(
      path.join(captured.env.APM_PACKAGE_DIR!, '.apm', 'skills'),
    );
    expect(filteredSkills).toContain('tooling-skill');
    expect(filteredSkills).not.toContain('workflow-skill');
  });
});
