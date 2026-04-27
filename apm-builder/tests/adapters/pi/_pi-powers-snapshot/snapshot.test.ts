import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';

const HERE = path.resolve(fileURLToPath(import.meta.url), '..');

describe('pi-powers snapshot — Pi package format reference', () => {
  it('package.json declares the "pi" keyword and a "main" entry', async () => {
    const pkg = JSON.parse(await fs.readFile(path.join(HERE, 'package.json'), 'utf8'));
    expect(pkg.keywords).toContain('pi');
    expect(pkg.main).toBe('src/index.ts');
  });

  it('SKILL.md uses frontmatter with name + description (Claude Code-compatible)', async () => {
    const skill = await fs.readFile(
      path.join(HERE, 'skills/test-driven-development/SKILL.md'),
      'utf8',
    );
    expect(skill.startsWith('---\n')).toBe(true);
    expect(skill).toMatch(/^name:\s*test-driven-development/m);
    expect(skill).toMatch(/^description:\s*\S/m);
  });

  it('extension entrypoint imports ExtensionAPI from @mariozechner/pi-coding-agent', async () => {
    const idx = await fs.readFile(path.join(HERE, 'src/index.ts'), 'utf8');
    expect(idx).toContain('@mariozechner/pi-coding-agent');
    expect(idx).toMatch(/ExtensionAPI/);
  });

  it('skills directory lives at package root (not under .pi/)', async () => {
    const stat = await fs.stat(path.join(HERE, 'skills'));
    expect(stat.isDirectory()).toBe(true);
    const hasPiDir = await fs
      .stat(path.join(HERE, '.pi'))
      .then(() => true)
      .catch(() => false);
    expect(hasPiDir).toBe(false);
  });
});
