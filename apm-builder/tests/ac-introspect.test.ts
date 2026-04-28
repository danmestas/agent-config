import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { listCommand } from '../lib/ac/introspect.ts';

describe('ac list', () => {
  it('lists all personas', async () => {
    const builtinDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ac-builtin-'));
    await fs.mkdir(path.join(builtinDir, 'personas', 'one'), { recursive: true });
    await fs.writeFile(
      path.join(builtinDir, 'personas', 'one', 'persona.md'),
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
    const out: string[] = [];
    await listCommand('personas', {
      projectDir: '/nonexistent',
      userDir: '/nonexistent',
      builtinDir,
      print: (line) => out.push(line),
    });
    expect(out.some((l) => l.includes('one'))).toBe(true);
    expect(out.some((l) => l.includes('builtin'))).toBe(true);
  });
});
