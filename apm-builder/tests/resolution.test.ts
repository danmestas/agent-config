import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { resolve, writeResolutionArtifact, resolveAndPersist, resolveAgainstHarness, skillsKeepFromResolution } from '../lib/resolution.ts';
import type { ComponentSource } from '../lib/types.ts';

const skill = (name: string, category: string | undefined): ComponentSource => ({
  relativeDir: `skills/${name}`,
  dir: `/tmp/skills/${name}`,
  body: '',
  manifest: {
    name,
    version: '1.0.0',
    type: 'skill',
    description: '',
    targets: ['claude-code'],
    ...(category ? { category: { primary: category } } : {}),
  } as any,
});

describe('resolve', () => {
  it('returns full catalog when no persona or mode is given', () => {
    const catalog = [skill('a', 'tooling'), skill('b', 'workflow')];
    const r = resolve({ catalog, harness: 'claude-code' });
    expect(r.skillsKeep).toBeNull();
    expect(r.skillsDrop).toEqual([]);
    expect(r.modePrompt).toBe('');
  });

  it('drops skills outside persona categories', () => {
    const catalog = [skill('a', 'tooling'), skill('b', 'workflow')];
    const persona = {
      name: 'p',
      type: 'persona',
      categories: ['tooling'],
      skill_include: [],
      skill_exclude: [],
    } as any;
    const r = resolve({ catalog, persona, harness: 'claude-code' });
    expect(r.skillsDrop).toContain('b');
    expect(r.skillsDrop).not.toContain('a');
  });

  it('keeps uncategorized skills (universal default)', () => {
    const catalog = [skill('a', 'tooling'), skill('b', undefined)];
    const persona = {
      name: 'p',
      type: 'persona',
      categories: ['tooling'],
      skill_include: [],
      skill_exclude: [],
    } as any;
    const r = resolve({ catalog, persona, harness: 'claude-code' });
    expect(r.skillsDrop).not.toContain('b');
  });

  it('skill_include forces inclusion across categories', () => {
    const catalog = [skill('a', 'tooling'), skill('b', 'workflow')];
    const persona = {
      name: 'p',
      type: 'persona',
      categories: ['tooling'],
      skill_include: ['b'],
      skill_exclude: [],
    } as any;
    const r = resolve({ catalog, persona, harness: 'claude-code' });
    expect(r.skillsDrop).not.toContain('b');
  });

  it('skill_exclude wins over category match', () => {
    const catalog = [skill('a', 'tooling')];
    const persona = {
      name: 'p',
      type: 'persona',
      categories: ['tooling'],
      skill_include: [],
      skill_exclude: ['a'],
    } as any;
    const r = resolve({ catalog, persona, harness: 'claude-code' });
    expect(r.skillsDrop).toContain('a');
  });

  it('persona ∩ mode categories', () => {
    const catalog = [skill('a', 'tooling'), skill('b', 'workflow'), skill('c', 'philosophy')];
    const persona = {
      name: 'p',
      type: 'persona',
      categories: ['tooling', 'workflow'],
      skill_include: [],
      skill_exclude: [],
    } as any;
    const mode = {
      name: 'm',
      type: 'mode',
      categories: ['tooling'],
      skill_include: [],
      skill_exclude: [],
    } as any;
    const r = resolve({ catalog, persona, mode, harness: 'claude-code' });
    expect(r.skillsDrop).toContain('b'); // in persona but not in mode
    expect(r.skillsDrop).toContain('c'); // in neither
    expect(r.skillsDrop).not.toContain('a'); // in both
  });

  it('mode body becomes mode_prompt', () => {
    const catalog = [skill('a', 'tooling')];
    const mode = {
      name: 'm',
      type: 'mode',
      categories: ['tooling'],
      skill_include: [],
      skill_exclude: [],
    } as any;
    const r = resolve({
      catalog,
      mode,
      modeBody: 'You are in focused mode.\n',
      harness: 'claude-code',
    });
    expect(r.modePrompt).toBe('You are in focused mode.\n');
  });

  it('emits resolved metadata', () => {
    const catalog = [skill('a', 'tooling')];
    const persona = {
      name: 'p',
      type: 'persona',
      categories: ['tooling'],
      skill_include: [],
      skill_exclude: [],
    } as any;
    const r = resolve({ catalog, persona, harness: 'claude-code' });
    expect(r.metadata.persona).toBe('p');
    expect(r.metadata.categories).toContain('tooling');
  });
});

describe('writeResolutionArtifact', () => {
  it('writes JSON to a tempfile and returns the path', async () => {
    const r: any = {
      schemaVersion: 1,
      harness: 'claude-code',
      skillsDrop: ['a'],
      skillsKeep: null,
      modePrompt: '',
      metadata: { persona: null, mode: null, categories: [] },
    };
    const filepath = await writeResolutionArtifact(r);
    expect(filepath).toMatch(/resolution\.json$/);
    const content = await fs.readFile(filepath, 'utf8');
    const parsed = JSON.parse(content);
    expect(parsed.harness).toBe('claude-code');
    expect(parsed.skillsDrop).toEqual(['a']);
  });

  it('uses a session-scoped tempdir under os.tmpdir', async () => {
    const r: any = {
      schemaVersion: 1,
      harness: 'claude-code',
      skillsDrop: [],
      skillsKeep: null,
      modePrompt: '',
      metadata: { persona: null, mode: null, categories: [] },
    };
    const filepath = await writeResolutionArtifact(r);
    expect(filepath.startsWith(os.tmpdir())).toBe(true);
    expect(path.basename(path.dirname(filepath))).toMatch(/^ac-sess-/);
  });
});

describe('resolveAndPersist', () => {
  it('returns both the in-memory resolution and a path to its on-disk artifact', async () => {
    const catalog = [skill('a', 'tooling'), skill('b', 'workflow')];
    const persona = {
      name: 'p',
      type: 'persona',
      categories: ['tooling'],
      skill_include: [],
      skill_exclude: [],
    } as any;
    const { resolution, artifactPath } = await resolveAndPersist({
      catalog,
      persona,
      harness: 'claude-code',
    });
    expect(resolution.skillsDrop).toContain('b');
    expect(artifactPath).toMatch(/resolution\.json$/);
    const parsed = JSON.parse(await fs.readFile(artifactPath, 'utf8'));
    expect(parsed.skillsDrop).toEqual(resolution.skillsDrop);
  });
});

describe('resolveAgainstHarness', () => {
  it('reads claude-code catalog from fake home and applies filter', async () => {
    const home = await fs.mkdtemp(path.join(os.tmpdir(), 'rh-'));
    await fs.mkdir(path.join(home, '.claude', 'skills', 'a'), { recursive: true });
    await fs.writeFile(
      path.join(home, '.claude', 'skills', 'a', 'SKILL.md'),
      `---
name: a
description: a
category:
  primary: tooling
---
`,
    );
    await fs.mkdir(path.join(home, '.claude', 'skills', 'b'), { recursive: true });
    await fs.writeFile(
      path.join(home, '.claude', 'skills', 'b', 'SKILL.md'),
      `---
name: b
description: b
category:
  primary: workflow
---
`,
    );
    const persona = {
      name: 'p',
      type: 'persona',
      categories: ['tooling'],
      skill_include: [],
      skill_exclude: [],
    } as any;
    const r = await resolveAgainstHarness({
      target: 'claude-code',
      harnessHome: home,
      persona,
    });
    expect(r.skillsDrop).toContain('b');
    expect(r.skillsDrop).not.toContain('a');
  });
});

describe('skillsKeepFromResolution', () => {
  it('returns catalog skill names that are NOT in drop list', () => {
    const catalog = [
      { manifest: { type: 'skill', name: 'a' } } as any,
      { manifest: { type: 'skill', name: 'b' } } as any,
      { manifest: { type: 'skill', name: 'c' } } as any,
      { manifest: { type: 'rules', name: 'r' } } as any, // ignored — not a skill
    ];
    const keep = skillsKeepFromResolution(catalog, ['b']);
    expect(keep).toEqual(['a', 'c']);
  });
});
