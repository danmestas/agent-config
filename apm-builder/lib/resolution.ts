import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { ComponentSource, Target } from './types.ts';
import type { PersonaManifest, ModeManifest } from './schema.ts';
import { loadHarnessCatalog } from './ac/harness-catalog.ts';

export interface Resolution {
  schemaVersion: 1;
  harness: Target;
  skillsDrop: string[];
  skillsKeep: string[] | null;
  modePrompt: string;
  metadata: {
    persona: string | null;
    mode: string | null;
    categories: string[];
  };
}

export interface ResolveOptions {
  catalog: ComponentSource[];
  persona?: PersonaManifest;
  mode?: ModeManifest;
  /** Mode body string (the markdown body of the mode component, used as prompt scaffolding). */
  modeBody?: string;
  harness: Target;
}

export function resolve(opts: ResolveOptions): Resolution {
  const { catalog, persona, mode, modeBody, harness } = opts;

  // No persona, no mode → identity (no filter).
  if (!persona && !mode) {
    return {
      schemaVersion: 1,
      harness,
      skillsDrop: [],
      skillsKeep: null,
      modePrompt: '',
      metadata: { persona: null, mode: null, categories: [] },
    };
  }

  // Effective categories: intersection if both, single if one.
  let effectiveCategories: Set<string> | null = null;
  if (persona && mode) {
    const p = new Set(persona.categories);
    effectiveCategories = new Set(mode.categories.filter((c) => p.has(c)));
  } else if (persona) {
    effectiveCategories = new Set(persona.categories);
  } else if (mode) {
    effectiveCategories = new Set(mode.categories);
  }

  const includeNames = new Set([
    ...(persona?.skill_include ?? []),
    ...(mode?.skill_include ?? []),
  ]);
  const excludeNames = new Set([
    ...(persona?.skill_exclude ?? []),
    ...(mode?.skill_exclude ?? []),
  ]);

  const skillsDrop: string[] = [];
  for (const c of catalog) {
    if (c.manifest.type !== 'skill') continue;
    const skillCategory = (c.manifest as any).category?.primary as string | undefined;

    // Forced exclude wins.
    if (excludeNames.has(c.manifest.name)) {
      skillsDrop.push(c.manifest.name);
      continue;
    }
    // Forced include wins over category mismatch.
    if (includeNames.has(c.manifest.name)) continue;
    // Universal default — uncategorized skills always load.
    if (skillCategory === undefined) continue;
    // Category match.
    if (effectiveCategories && effectiveCategories.has(skillCategory)) continue;
    // Otherwise: drop.
    skillsDrop.push(c.manifest.name);
  }

  return {
    schemaVersion: 1,
    harness,
    skillsDrop,
    skillsKeep: null,
    modePrompt: modeBody ?? '',
    metadata: {
      persona: persona?.name ?? null,
      mode: mode?.name ?? null,
      categories: effectiveCategories ? Array.from(effectiveCategories) : [],
    },
  };
}

export async function writeResolutionArtifact(r: Resolution): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ac-sess-'));
  const filepath = path.join(dir, 'resolution.json');
  await fs.writeFile(filepath, JSON.stringify(r, null, 2) + '\n');
  return filepath;
}

/**
 * Resolve and persist in one call. Use this when a caller needs both the
 * in-memory resolution and an on-disk artifact path (e.g. AC harness flows
 * that hand the path to a child process via env). Pure callers — including
 * `resolveAgainstHarness` and the prelaunch composition path — keep using
 * `resolve()` directly to avoid the unnecessary tmpdir write.
 */
export async function resolveAndPersist(
  opts: ResolveOptions,
): Promise<{ resolution: Resolution; artifactPath: string }> {
  const resolution = resolve(opts);
  const artifactPath = await writeResolutionArtifact(resolution);
  return { resolution, artifactPath };
}

export interface ResolveAgainstHarnessOptions {
  target: Target;
  harnessHome: string;
  persona?: PersonaManifest;
  mode?: ModeManifest;
  modeBody?: string;
}

export async function resolveAgainstHarness(
  opts: ResolveAgainstHarnessOptions,
): Promise<Resolution> {
  const catalog = await loadHarnessCatalog(opts.target, opts.harnessHome);
  return resolve({
    catalog,
    persona: opts.persona,
    mode: opts.mode,
    modeBody: opts.modeBody,
    harness: opts.target,
  });
}

export function skillsKeepFromResolution(
  catalog: ComponentSource[],
  drop: string[],
): string[] {
  const dropSet = new Set(drop);
  return catalog
    .filter((c) => c.manifest.type === 'skill')
    .map((c) => c.manifest.name)
    .filter((n) => !dropSet.has(n));
}
