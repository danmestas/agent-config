import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { ModeSchema, type ModeManifest } from './schema.ts';
import type { DiscoveryDirs } from './persona.ts';

export interface FoundMode {
  manifest: ModeManifest;
  body: string;
  source: 'project' | 'user' | 'builtin';
  filepath: string;
}

const TIERS: Array<keyof DiscoveryDirs> = ['projectDir', 'userDir', 'builtinDir'];
const TIER_NAMES: Record<keyof DiscoveryDirs, FoundMode['source']> = {
  projectDir: 'project',
  userDir: 'user',
  builtinDir: 'builtin',
};

function resolveTierRoot(tier: keyof DiscoveryDirs, dirs: DiscoveryDirs): string {
  switch (tier) {
    case 'projectDir':
      return path.join(dirs.projectDir, '.agent-config', 'modes');
    case 'userDir':
      return path.join(dirs.userDir, 'modes');
    case 'builtinDir':
      return path.join(dirs.builtinDir, 'modes');
  }
}

async function listModeFilenames(dir: string): Promise<string[]> {
  const out: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith('.md')) out.push(path.join(dir, e.name));
      else if (e.isDirectory()) {
        const candidate = path.join(dir, e.name, 'mode.md');
        try {
          await fs.access(candidate);
          out.push(candidate);
        } catch {
          // not a mode dir
        }
      }
    }
  } catch {
    // dir doesn't exist
  }
  return out;
}

export async function findMode(name: string, dirs: DiscoveryDirs): Promise<FoundMode> {
  const seen: string[] = [];
  for (const tier of TIERS) {
    const root = resolveTierRoot(tier, dirs);
    const files = await listModeFilenames(root);
    for (const filepath of files) {
      const raw = await fs.readFile(filepath, 'utf8');
      const parsed = matter(raw);
      const result = ModeSchema.safeParse(parsed.data);
      if (!result.success) continue;
      seen.push(result.data.name);
      if (result.data.name === name) {
        return {
          manifest: result.data,
          body: parsed.content,
          source: TIER_NAMES[tier],
          filepath,
        };
      }
    }
  }
  throw new Error(
    `mode not found: "${name}". Available: ${seen.length === 0 ? '(none)' : seen.join(', ')}`,
  );
}

export async function listAllModes(dirs: DiscoveryDirs): Promise<FoundMode[]> {
  const found = new Map<string, FoundMode>();
  for (const tier of TIERS) {
    const root = resolveTierRoot(tier, dirs);
    const files = await listModeFilenames(root);
    for (const filepath of files) {
      const raw = await fs.readFile(filepath, 'utf8');
      const parsed = matter(raw);
      const result = ModeSchema.safeParse(parsed.data);
      if (!result.success) continue;
      if (!found.has(result.data.name)) {
        found.set(result.data.name, {
          manifest: result.data,
          body: parsed.content,
          source: TIER_NAMES[tier],
          filepath,
        });
      }
    }
  }
  return Array.from(found.values()).sort((a, b) =>
    a.manifest.name.localeCompare(b.manifest.name),
  );
}
