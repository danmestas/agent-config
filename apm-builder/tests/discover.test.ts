import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { discoverComponents } from '../lib/discover.ts';

const FIXTURES_ROOT = path.resolve(
  fileURLToPath(import.meta.url),
  '../fixtures/discover',
);

describe('discoverComponents', () => {
  it('finds SKILL.md under skills/, plugins/, rules/', async () => {
    const components = await discoverComponents(FIXTURES_ROOT);
    const names = components.map((c) => c.manifest.name).sort();
    expect(names).toEqual(['sample-rule', 'sample-skill']);
  });

  it('parses frontmatter into manifest', async () => {
    const components = await discoverComponents(FIXTURES_ROOT);
    const skill = components.find((c) => c.manifest.name === 'sample-skill');
    expect(skill?.manifest.type).toBe('skill');
    expect(skill?.manifest.targets).toEqual(['claude-code', 'apm']);
    expect(skill?.body.trim().startsWith('# Sample Skill')).toBe(true);
  });

  it('records relativeDir from repo root', async () => {
    const components = await discoverComponents(FIXTURES_ROOT);
    const skill = components.find((c) => c.manifest.name === 'sample-skill');
    expect(skill?.relativeDir).toBe('skills/sample-skill');
  });

  it('surfaces the offending file path when frontmatter is invalid', async () => {
    const BAD_ROOT = path.resolve(fileURLToPath(import.meta.url), '../fixtures/discover-invalid');
    await expect(discoverComponents(BAD_ROOT)).rejects.toThrow(/skills\/bad\/SKILL\.md/);
  });
});
