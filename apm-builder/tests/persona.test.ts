import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { PersonaSchema } from '../lib/schema.ts';
import { findPersona } from '../lib/persona.ts';

describe('PersonaSchema', () => {
  it('accepts a minimal valid persona', () => {
    const result = PersonaSchema.safeParse({
      name: 'backend',
      version: '1.0.0',
      type: 'persona',
      description: 'Backend dev work',
      targets: ['claude-code'],
      categories: ['tooling'],
    });
    expect(result.success).toBe(true);
  });

  it('defaults skill_include and skill_exclude to empty arrays', () => {
    const result = PersonaSchema.parse({
      name: 'backend',
      version: '1.0.0',
      type: 'persona',
      description: 'Backend dev work',
      targets: ['claude-code'],
      categories: ['tooling'],
    });
    expect(result.skill_include).toEqual([]);
    expect(result.skill_exclude).toEqual([]);
  });

  it('rejects missing categories field', () => {
    const result = PersonaSchema.safeParse({
      name: 'backend',
      version: '1.0.0',
      type: 'persona',
      description: 'Backend dev work',
      targets: ['claude-code'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects type other than "persona"', () => {
    const result = PersonaSchema.safeParse({
      name: 'backend',
      version: '1.0.0',
      type: 'skill',
      description: 'x',
      targets: ['claude-code'],
      categories: ['tooling'],
    });
    expect(result.success).toBe(false);
  });
});

describe('findPersona (3-tier discovery)', () => {
  it('finds a persona in user-scope dir', async () => {
    const userDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ac-user-'));
    await fs.mkdir(path.join(userDir, 'personas'));
    await fs.writeFile(
      path.join(userDir, 'personas', 'mine.md'),
      `---
name: mine
version: 1.0.0
type: persona
description: t
targets: [claude-code]
categories: [tooling]
---
`,
    );
    const result = await findPersona('mine', {
      projectDir: '/nonexistent',
      userDir,
      builtinDir: '/nonexistent',
    });
    expect(result.manifest.name).toBe('mine');
    expect(result.source).toBe('user');
  });

  it('project-scope wins over user-scope', async () => {
    const projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ac-proj-'));
    const userDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ac-user-'));
    await fs.mkdir(path.join(projectDir, '.agent-config', 'personas'), { recursive: true });
    await fs.mkdir(path.join(userDir, 'personas'));
    await fs.writeFile(
      path.join(projectDir, '.agent-config', 'personas', 'mine.md'),
      `---
name: mine
version: 1.0.0
type: persona
description: project
targets: [claude-code]
categories: [tooling]
---
`,
    );
    await fs.writeFile(
      path.join(userDir, 'personas', 'mine.md'),
      `---
name: mine
version: 1.0.0
type: persona
description: user
targets: [claude-code]
categories: [tooling]
---
`,
    );
    const result = await findPersona('mine', {
      projectDir,
      userDir,
      builtinDir: '/nonexistent',
    });
    expect(result.manifest.description).toBe('project');
    expect(result.source).toBe('project');
  });

  it('throws with a list of available names when not found', async () => {
    const userDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ac-user-'));
    await fs.mkdir(path.join(userDir, 'personas'));
    await fs.writeFile(
      path.join(userDir, 'personas', 'one.md'),
      `---
name: one
version: 1.0.0
type: persona
description: t
targets: [claude-code]
categories: [tooling]
---
`,
    );
    await expect(
      findPersona('nope', { projectDir: '/nonexistent', userDir, builtinDir: '/nonexistent' }),
    ).rejects.toThrow(/one/);
  });
});
