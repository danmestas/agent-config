import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { Target } from '../types.ts';

export interface ComposeOptions {
  target: Target;
  realHome: string;
  /** Skill names to KEEP (symlinked into tempdir/.<harness>/skills/). Others are dropped. */
  skillsKeep: string[];
}

export interface ComposeResult {
  tempHome: string;
  cleanup: () => Promise<void>;
}

const TARGET_SUBDIRS: Record<Target, string | null> = {
  'claude-code': '.claude',
  gemini: '.gemini',
  pi: '.pi',
  apm: null,
  codex: null,
  copilot: null,
};

const TARGET_SKILLS_SUBDIR: Record<Target, string | null> = {
  'claude-code': 'skills',
  gemini: 'skills',
  pi: 'skills',
  apm: null,
  codex: null,
  copilot: null,
};

export async function composeHarnessHome(opts: ComposeOptions): Promise<ComposeResult> {
  const subdir = TARGET_SUBDIRS[opts.target];
  const skillsSub = TARGET_SKILLS_SUBDIR[opts.target];
  if (!subdir || !skillsSub) {
    throw new Error(`composeHarnessHome: target ${opts.target} has no user-scope skills layout`);
  }

  const tempHome = await fs.mkdtemp(path.join(os.tmpdir(), 'ac-home-'));
  const tempHarnessDir = path.join(tempHome, subdir);
  await fs.mkdir(tempHarnessDir, { recursive: true });

  const realHarnessDir = path.join(opts.realHome, subdir);
  let entries: string[] = [];
  try {
    entries = await fs.readdir(realHarnessDir);
  } catch {
    // Real harness dir doesn't exist — leave tempdir mostly empty
  }

  // Symlink every entry except skills/
  for (const entry of entries) {
    if (entry === skillsSub) continue;
    const src = path.join(realHarnessDir, entry);
    const dest = path.join(tempHarnessDir, entry);
    await fs.symlink(src, dest);
  }

  // Symlink home-root files/dirs that start with the harness prefix (e.g. .claude.json for claude-code)
  // These are not inside ~/.<harness>/ but sit directly at home root and are required for auth.
  const harnessPrefix = subdir; // e.g. '.claude'
  let homeEntries: string[] = [];
  try {
    homeEntries = await fs.readdir(opts.realHome);
  } catch {
    // realHome unreadable — skip
  }
  for (const entry of homeEntries) {
    if (entry === harnessPrefix) continue; // already handled above
    if (!entry.startsWith(harnessPrefix)) continue;
    const src = path.join(opts.realHome, entry);
    const dest = path.join(tempHome, entry);
    try {
      await fs.symlink(src, dest);
    } catch {
      // symlink may already exist (race) or src missing — best-effort
    }
  }

  // Build filtered skills/ dir as a curated symlink subset
  const tempSkillsDir = path.join(tempHarnessDir, skillsSub);
  await fs.mkdir(tempSkillsDir);
  const realSkillsDir = path.join(realHarnessDir, skillsSub);
  for (const skillName of opts.skillsKeep) {
    const src = path.join(realSkillsDir, skillName);
    const dest = path.join(tempSkillsDir, skillName);
    try {
      await fs.access(src);
      await fs.symlink(src, dest);
    } catch {
      // Skill in keep list doesn't exist in user's home — skip silently
    }
  }

  return {
    tempHome,
    cleanup: async () => {
      try {
        await fs.rm(tempHome, { recursive: true, force: true });
      } catch {
        // best-effort
      }
    },
  };
}
