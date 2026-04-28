import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export interface PrelaunchOptions {
  resolutionPath: string;
  originalCwd: string;
}

export interface PrelaunchResult {
  tempdir: string;
  /** Cleanup function — call on session end. Best-effort. */
  cleanup: () => Promise<void>;
}

async function runApmBuilderDocs(
  target: 'codex' | 'copilot',
  resolutionPath: string,
  outFile: string,
  originalCwd: string,
): Promise<void> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const cli = path.resolve(here, '..', '..', 'cli.ts');
  const tsx = path.resolve(here, '..', '..', '..', 'node_modules', '.bin', 'tsx');
  await new Promise<void>((resolveCb, reject) => {
    const child = spawn(
      process.execPath,
      [tsx, cli, 'docs', '--target', target, '--resolution', resolutionPath, '--out', outFile, '--repo', originalCwd],
      { stdio: 'inherit' },
    );
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolveCb() : reject(new Error(`apm-builder docs exited ${code}`))));
  });
}

async function symlinkProjectFiles(originalCwd: string, tempdir: string): Promise<void> {
  // Symlink common project files so the harness can still read them.
  const toLink = ['.git', 'package.json', 'tsconfig.json', '.env'];
  for (const name of toLink) {
    const src = path.join(originalCwd, name);
    try {
      await fs.access(src);
      await fs.symlink(src, path.join(tempdir, name));
    } catch {
      // skip missing
    }
  }
}

export async function prelaunchComposeCodex(opts: PrelaunchOptions): Promise<PrelaunchResult> {
  const tempdir = await fs.mkdtemp(path.join(os.tmpdir(), 'ac-prelaunch-'));
  await runApmBuilderDocs('codex', opts.resolutionPath, path.join(tempdir, 'AGENTS.md'), opts.originalCwd);
  await symlinkProjectFiles(opts.originalCwd, tempdir);
  return {
    tempdir,
    cleanup: async () => {
      try {
        await fs.rm(tempdir, { recursive: true, force: true });
      } catch {
        // best-effort
      }
    },
  };
}

export async function prelaunchComposeCopilot(opts: PrelaunchOptions): Promise<PrelaunchResult> {
  const tempdir = await fs.mkdtemp(path.join(os.tmpdir(), 'ac-prelaunch-'));
  await runApmBuilderDocs('copilot', opts.resolutionPath, path.join(tempdir, 'copilot-instructions.md'), opts.originalCwd);
  await symlinkProjectFiles(opts.originalCwd, tempdir);
  return {
    tempdir,
    cleanup: async () => {
      try {
        await fs.rm(tempdir, { recursive: true, force: true });
      } catch {
        // best-effort
      }
    },
  };
}

import { resolveAgainstHarness, skillsKeepFromResolution } from '../resolution.ts';
import { composeHarnessHome } from './symlink-farm.ts';
import { loadHarnessCatalog } from './harness-catalog.ts';
import type { PersonaManifest, ModeManifest } from '../schema.ts';

export interface HomeOverridePrelaunchOptions {
  realHome: string;
  persona?: PersonaManifest;
  mode?: ModeManifest;
  modeBody?: string;
}

/** @deprecated Use HomeOverridePrelaunchOptions */
export type ClaudePrelaunchOptions = HomeOverridePrelaunchOptions;

async function composeWithHomeOverride(
  target: 'claude-code' | 'gemini' | 'pi',
  opts: HomeOverridePrelaunchOptions,
): Promise<{ tempHome: string; cleanup: () => Promise<void> }> {
  const catalog = await loadHarnessCatalog(target, opts.realHome);
  const resolution = await resolveAgainstHarness({
    target,
    harnessHome: opts.realHome,
    persona: opts.persona,
    mode: opts.mode,
    modeBody: opts.modeBody,
  });
  const skillsKeep = opts.persona || opts.mode
    ? skillsKeepFromResolution(catalog, resolution.skillsDrop)
    : catalog.filter((c) => c.manifest.type === 'skill').map((c) => c.manifest.name); // no filter → keep all
  return composeHarnessHome({ target, realHome: opts.realHome, skillsKeep });
}

export async function prelaunchComposeClaudeCode(
  opts: HomeOverridePrelaunchOptions,
): Promise<{ tempHome: string; cleanup: () => Promise<void> }> {
  return composeWithHomeOverride('claude-code', opts);
}

export async function prelaunchComposeGemini(
  opts: HomeOverridePrelaunchOptions,
): Promise<{ tempHome: string; cleanup: () => Promise<void> }> {
  return composeWithHomeOverride('gemini', opts);
}

export async function prelaunchComposePi(
  opts: HomeOverridePrelaunchOptions,
): Promise<{ tempHome: string; cleanup: () => Promise<void> }> {
  return composeWithHomeOverride('pi', opts);
}

export interface ApmPrelaunchOptions {
  /** APM package root, typically process.cwd() of the user's invocation. */
  packageDir: string;
  persona?: PersonaManifest;
  mode?: ModeManifest;
  modeBody?: string;
}

/**
 * Build a filtered tempdir mirroring the APM package at `packageDir`.
 * All files/dirs except `.apm/skills/` are symlinked through.
 * Only persona-allowed skills are symlinked into `.apm/skills/`.
 * Returns `tempPackageDir` — set `APM_PACKAGE_DIR=tempPackageDir` before launching apm.
 */
export async function prelaunchComposeApm(opts: ApmPrelaunchOptions): Promise<{
  tempPackageDir: string;
  cleanup: () => Promise<void>;
}> {
  const catalog = await loadHarnessCatalog('apm', opts.packageDir);
  const resolution = await resolveAgainstHarness({
    target: 'apm',
    harnessHome: opts.packageDir,
    persona: opts.persona,
    mode: opts.mode,
    modeBody: opts.modeBody,
  });
  const skillsKeep = opts.persona || opts.mode
    ? skillsKeepFromResolution(catalog, resolution.skillsDrop)
    : catalog.filter((c) => c.manifest.type === 'skill').map((c) => c.manifest.name);

  // Build a tempdir that mirrors packageDir but with a curated .apm/skills/
  const tempPackageDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ac-apm-'));
  const apmSubdir = '.apm';
  const skillsSubdir = 'skills';

  // Symlink all top-level entries except .apm/
  let topEntries: string[] = [];
  try {
    topEntries = await fs.readdir(opts.packageDir);
  } catch {
    // packageDir unreadable — proceed with empty tempdir
  }
  for (const entry of topEntries) {
    if (entry === apmSubdir) continue;
    const src = path.join(opts.packageDir, entry);
    const dest = path.join(tempPackageDir, entry);
    await fs.symlink(src, dest);
  }

  // Build .apm/ mirroring all entries except skills/
  const realApmDir = path.join(opts.packageDir, apmSubdir);
  const tempApmDir = path.join(tempPackageDir, apmSubdir);
  await fs.mkdir(tempApmDir, { recursive: true });
  let apmEntries: string[] = [];
  try {
    apmEntries = await fs.readdir(realApmDir);
  } catch {
    // No .apm dir — leave tempApmDir mostly empty
  }
  for (const entry of apmEntries) {
    if (entry === skillsSubdir) continue;
    const src = path.join(realApmDir, entry);
    const dest = path.join(tempApmDir, entry);
    await fs.symlink(src, dest);
  }

  // Build curated .apm/skills/ with only allowed skills
  const tempSkillsDir = path.join(tempApmDir, skillsSubdir);
  await fs.mkdir(tempSkillsDir);
  const realSkillsDir = path.join(realApmDir, skillsSubdir);
  for (const skillName of skillsKeep) {
    const src = path.join(realSkillsDir, skillName);
    const dest = path.join(tempSkillsDir, skillName);
    try {
      await fs.access(src);
      await fs.symlink(src, dest);
    } catch {
      // Skill in keep list doesn't exist — skip silently
    }
  }

  return {
    tempPackageDir,
    cleanup: async () => {
      try {
        await fs.rm(tempPackageDir, { recursive: true, force: true });
      } catch {
        // best-effort
      }
    },
  };
}
