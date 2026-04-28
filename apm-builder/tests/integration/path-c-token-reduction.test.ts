import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { prelaunchComposeClaudeCode } from '../../lib/ac/prelaunch.ts';

describe('Path C token reduction', () => {
  it('filters Claude skills based on persona — fewer entries in tempdir than real home', async () => {
    // Set up a real-home with 5 skills across 3 categories
    const realHome = await fs.mkdtemp(path.join(os.tmpdir(), 'big-home-'));
    const skills = [
      { name: 'tool-a', cat: 'tooling' },
      { name: 'tool-b', cat: 'tooling' },
      { name: 'flow-a', cat: 'workflow' },
      { name: 'flow-b', cat: 'workflow' },
      { name: 'phil-a', cat: 'philosophy' },
    ];
    for (const s of skills) {
      await fs.mkdir(path.join(realHome, '.claude', 'skills', s.name), { recursive: true });
      await fs.writeFile(
        path.join(realHome, '.claude', 'skills', s.name, 'SKILL.md'),
        `---
name: ${s.name}
description: x
category:
  primary: ${s.cat}
---
`,
      );
    }
    const realCount = (await fs.readdir(path.join(realHome, '.claude', 'skills'))).length;
    expect(realCount).toBe(5);

    // Run prelaunch with persona that allows ONLY 'tooling' category
    const persona = {
      name: 'p',
      type: 'persona',
      categories: ['tooling'],
      skill_include: [],
      skill_exclude: [],
    } as any;
    const result = await prelaunchComposeClaudeCode({ realHome, persona });

    // Filtered tempdir has fewer skills
    const filteredCount = (await fs.readdir(path.join(result.tempHome, '.claude', 'skills'))).length;
    expect(filteredCount).toBeLessThan(realCount);
    expect(filteredCount).toBe(2); // only tool-a and tool-b (tooling category)

    // Verify specifically which skills made it through
    const filteredNames = await fs.readdir(path.join(result.tempHome, '.claude', 'skills'));
    expect(filteredNames).toContain('tool-a');
    expect(filteredNames).toContain('tool-b');
    expect(filteredNames).not.toContain('flow-a');
    expect(filteredNames).not.toContain('phil-a');

    await result.cleanup();
  });

  it('with no persona, all skills pass through (baseline)', async () => {
    const realHome = await fs.mkdtemp(path.join(os.tmpdir(), 'baseline-home-'));
    for (const name of ['x', 'y', 'z']) {
      await fs.mkdir(path.join(realHome, '.claude', 'skills', name), { recursive: true });
      await fs.writeFile(
        path.join(realHome, '.claude', 'skills', name, 'SKILL.md'),
        `---
name: ${name}
description: x
---
`,
      );
    }
    const result = await prelaunchComposeClaudeCode({ realHome });
    const filtered = await fs.readdir(path.join(result.tempHome, '.claude', 'skills'));
    expect(filtered.sort()).toEqual(['x', 'y', 'z']);
    await result.cleanup();
  });
});
