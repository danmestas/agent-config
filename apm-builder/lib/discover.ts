import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { ManifestSchema } from './schema.ts';
import { TARGETS, type Target } from './types.ts';
import type { ComponentSource } from './types.ts';

const COMPONENT_DIRS = ['skills', 'plugins', 'rules', 'hooks', 'agents', 'mcp', 'personas', 'modes'] as const;

const DIR_FILENAME: Partial<Record<string, string>> = {
  personas: 'persona.md',
  modes: 'mode.md',
};

function getComponentFilename(dir: string): string {
  return DIR_FILENAME[dir] ?? 'SKILL.md';
}

export async function discoverComponents(repoRoot: string): Promise<ComponentSource[]> {
  const components: ComponentSource[] = [];
  for (const top of COMPONENT_DIRS) {
    const dir = path.join(repoRoot, top);
    const exists = await fs
      .stat(dir)
      .then((s) => s.isDirectory())
      .catch(() => false);
    if (!exists) continue;

    // Special-case: plugins/<name>/skills/<skill>/SKILL.md layout.
    // Plugins that bundle their own nested skills use this layout instead of
    // having a top-level SKILL.md directly under plugins/<name>/.
    if (top === 'plugins') {
      const pluginEntries = await fs.readdir(dir, { withFileTypes: true });
      for (const pluginEntry of pluginEntries) {
        if (!pluginEntry.isDirectory()) continue;
        const componentDir = path.join(dir, pluginEntry.name);
        const pluginSkillsDir = path.join(componentDir, 'skills');
        const hasNestedSkills = await fs
          .stat(pluginSkillsDir)
          .then((s) => s.isDirectory())
          .catch(() => false);

        if (hasNestedSkills) {
          // Read parent plugin.json for name + default-targets propagation.
          const pluginManifestPath = path.join(componentDir, '.claude-plugin', 'plugin.json');
          let pluginName: string | undefined;
          let pluginDefaultTargets: Target[] | undefined;
          try {
            const pluginManifestRaw = await fs.readFile(pluginManifestPath, 'utf8');
            const pluginManifest = JSON.parse(pluginManifestRaw) as Record<string, unknown>;
            if (typeof pluginManifest['name'] === 'string') {
              pluginName = pluginManifest['name'];
            }
            if (Array.isArray(pluginManifest['default-targets'])) {
              pluginDefaultTargets = (pluginManifest['default-targets'] as unknown[]).filter(
                (t): t is Target =>
                  typeof t === 'string' && (TARGETS as readonly string[]).includes(t),
              );
            }
          } catch {
            // No plugin.json or unreadable — skip default-targets, plugin name unknown.
          }

          const nestedSkills = await fs.readdir(pluginSkillsDir, { withFileTypes: true });
          for (const skillEntry of nestedSkills) {
            if (!skillEntry.isDirectory()) continue;
            const skillDir = path.join(pluginSkillsDir, skillEntry.name);
            const skillFile = path.join(skillDir, 'SKILL.md');
            const skillExists = await fs
              .stat(skillFile)
              .then(() => true)
              .catch(() => false);
            if (!skillExists) continue;
            const raw = await fs.readFile(skillFile, 'utf8');
            const parsed = matter(raw);
            // Plugin-bundled skills have minimal frontmatter (name + description only).
            // Construct manifest directly rather than running through ManifestSchema
            // (which requires version, type, and targets that are absent here).
            const fm = parsed.data as Record<string, unknown>;
            components.push({
              dir: skillDir,
              relativeDir: path.relative(repoRoot, skillDir),
              manifest: {
                name: String(fm['name'] ?? skillEntry.name),
                version: typeof fm['version'] === 'string' ? fm['version'] : '0.0.0',
                description: typeof fm['description'] === 'string' ? fm['description'] : '',
                type: 'skill',
                targets: [],
                plugin: pluginName,
                defaultTargets: pluginDefaultTargets,
              },
              body: parsed.content,
            });
          }
          continue; // Skip the generic top-level-SKILL.md handler for this plugin entry.
        }

        // No nested skills/ dir — fall through to the generic top-level-SKILL.md path.
        const skillPath = path.join(componentDir, getComponentFilename(top));
        const skillExists = await fs.stat(skillPath).then(() => true).catch(() => false);
        if (!skillExists) continue;
        const raw = await fs.readFile(skillPath, 'utf8');
        const parsed = matter(raw);
        let manifest;
        try {
          manifest = ManifestSchema.parse(parsed.data);
        } catch (err) {
          if (err instanceof Error) {
            const prefixed = new Error(
              `${path.relative(repoRoot, skillPath)}: ${err.message}`,
              { cause: err },
            );
            prefixed.stack = err.stack;
            throw prefixed;
          }
          throw err;
        }
        components.push({
          dir: componentDir,
          relativeDir: path.relative(repoRoot, componentDir),
          manifest,
          body: parsed.content,
        });
      }
      continue; // Done with `plugins` dir — skip the generic handler below.
    }

    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const componentDir = path.join(dir, entry.name);
      const skillPath = path.join(componentDir, getComponentFilename(top));
      const skillExists = await fs.stat(skillPath).then(() => true).catch(() => false);
      if (!skillExists) continue;
      const raw = await fs.readFile(skillPath, 'utf8');
      const parsed = matter(raw);
      let manifest;
      try {
        manifest = ManifestSchema.parse(parsed.data);
      } catch (err) {
        if (err instanceof Error) {
          const prefixed = new Error(
            `${path.relative(repoRoot, skillPath)}: ${err.message}`,
            { cause: err },
          );
          prefixed.stack = err.stack;
          throw prefixed;
        }
        throw err;
      }
      components.push({
        dir: componentDir,
        relativeDir: path.relative(repoRoot, componentDir),
        manifest,
        body: parsed.content,
      });
    }
  }
  return components;
}
