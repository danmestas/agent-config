import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { PersonaSchema, type PersonaManifest } from './schema.ts';

export interface DiscoveryDirs {
  /** Project-scoped: <cwd>/.agent-config/personas/ (or modes/). */
  projectDir: string;
  /** User-scoped: ~/.config/agent-config/. */
  userDir: string;
  /** Built-in: agent-config/. */
  builtinDir: string;
}

export interface FoundPersona {
  manifest: PersonaManifest;
  body: string;
  source: 'project' | 'user' | 'builtin';
  filepath: string;
}

const TIERS: Array<keyof DiscoveryDirs> = ['projectDir', 'userDir', 'builtinDir'];
const TIER_NAMES: Record<keyof DiscoveryDirs, FoundPersona['source']> = {
  projectDir: 'project',
  userDir: 'user',
  builtinDir: 'builtin',
};

async function listPersonaFilenames(dir: string): Promise<string[]> {
  // The 3 tiers each store personas slightly differently:
  //   projectDir: <projectDir>/.agent-config/personas/<name>.md
  //   userDir:    <userDir>/personas/<name>.md
  //   builtinDir: <builtinDir>/personas/<name>/persona.md
  // The caller ensures each `dir` is rooted appropriately before invoking.
  // For listing, we just glob *.md and *.{persona,mode}.md and dirs containing persona.md.
  // This helper is shared with mode.ts in pattern.
  const out: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith('.md')) out.push(path.join(dir, e.name));
      else if (e.isDirectory()) {
        const candidate = path.join(dir, e.name, 'persona.md');
        try {
          await fs.access(candidate);
          out.push(candidate);
        } catch {
          // not a persona dir
        }
      }
    }
  } catch {
    // dir doesn't exist
  }
  return out;
}

function resolveTierRoot(tier: keyof DiscoveryDirs, dirs: DiscoveryDirs): string {
  switch (tier) {
    case 'projectDir':
      return path.join(dirs.projectDir, '.agent-config', 'personas');
    case 'userDir':
      return path.join(dirs.userDir, 'personas');
    case 'builtinDir':
      return path.join(dirs.builtinDir, 'personas');
  }
}

export async function findPersona(
  name: string,
  dirs: DiscoveryDirs,
): Promise<FoundPersona> {
  const seen: string[] = [];
  for (const tier of TIERS) {
    const root = resolveTierRoot(tier, dirs);
    const files = await listPersonaFilenames(root);
    for (const filepath of files) {
      const raw = await fs.readFile(filepath, 'utf8');
      const parsed = matter(raw);
      const result = PersonaSchema.safeParse(parsed.data);
      if (!result.success) continue; // skip invalid; validate.ts catches them at build
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
    `persona not found: "${name}". Available: ${seen.length === 0 ? '(none)' : seen.join(', ')}`,
  );
}

export async function listAllPersonas(dirs: DiscoveryDirs): Promise<FoundPersona[]> {
  const found = new Map<string, FoundPersona>();
  for (const tier of TIERS) {
    const root = resolveTierRoot(tier, dirs);
    const files = await listPersonaFilenames(root);
    for (const filepath of files) {
      const raw = await fs.readFile(filepath, 'utf8');
      const parsed = matter(raw);
      const result = PersonaSchema.safeParse(parsed.data);
      if (!result.success) continue;
      // Higher-priority tier already won; don't overwrite.
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
